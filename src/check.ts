import {readFile, stat} from 'node:fs/promises';
import {join, resolve} from 'node:path';

import {loadConfig} from './config.js';
import {validate} from './validate.js';

export type CheckStatus = 'pass' | 'warn' | 'fail';
export type CheckId = 'architecture' | 'version' | 'config';

export interface CheckSection {
  id: CheckId;
  status: CheckStatus;
  summary: string;
  details: string[];
}

export interface CheckResult {
  sections: CheckSection[];
  exitCode: number;
}

export interface CheckParams {
  /** Consumer repo root (where `agents.config.json` and `app/` live). */
  root: string;
  /**
   * `@commerce-atoms/agents` package's installed version (from its
   * `package.json#version`). Compared against the pinned version in
   * `agents.config.json`.
   */
  installedAgentsVersion: string;
  /**
   * If true, warnings count as exit-failing (sections with status `warn`
   * push the exit code to 1).
   */
  strict?: boolean | undefined;
}

/**
 * Run three sanity checks against a consumer repo:
 *
 * 1. **Architecture** — invokes `validate` (the architecture validators).
 * 2. **Version freshness** — compares `agents.config.json#agentsVersion`
 *    against the locally installed `@commerce-atoms/agents` package version.
 * 3. **Config sanity** — re-loads `agents.config.json` through the strict
 *    parser to surface invalid audience values, malformed JSON, etc.
 */
export async function check({
  root,
  installedAgentsVersion,
  strict = false,
}: CheckParams): Promise<CheckResult> {
  const sections: CheckSection[] = [];

  sections.push(await checkConfig(root));
  sections.push(await checkVersion(root, installedAgentsVersion));
  sections.push(await checkArchitecture(root, strict));

  const failed = sections.some((s) => s.status === 'fail');
  const warned = sections.some((s) => s.status === 'warn');
  const exitCode = failed || (strict && warned) ? 1 : 0;

  return {sections, exitCode};
}

async function checkConfig(root: string): Promise<CheckSection> {
  const path = join(root, 'agents.config.json');
  if (!(await pathExists(path))) {
    return {
      id: 'config',
      status: 'warn',
      summary: 'agents.config.json not found',
      details: [
        `expected at: ${path}`,
        'run `npx commerce-atoms-agents sync` to generate it on first sync.',
      ],
    };
  }

  try {
    const config = await loadConfig({outDir: root});
    const tools = config.tools ?? {};
    const enabled = Object.entries(tools)
      .filter(([, on]) => on)
      .map(([t]) => t);
    return {
      id: 'config',
      status: 'pass',
      summary: 'agents.config.json valid',
      details: [
        `audience: ${config.audience ?? '(default: store-fork)'}`,
        `pinned agentsVersion: ${config.agentsVersion ?? '(unset)'}`,
        `tools enabled: ${enabled.length > 0 ? enabled.join(', ') : '(none)'}`,
      ],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      id: 'config',
      status: 'fail',
      summary: 'agents.config.json invalid',
      details: [message],
    };
  }
}

async function checkVersion(
  root: string,
  installedAgentsVersion: string,
): Promise<CheckSection> {
  const path = join(root, 'agents.config.json');
  if (!(await pathExists(path))) {
    return {
      id: 'version',
      status: 'warn',
      summary: 'no pinned agentsVersion to compare',
      details: ['agents.config.json missing — sync once to generate it.'],
    };
  }

  let pinned: string | undefined;
  try {
    const raw = await readFile(path, 'utf8');
    const parsed = JSON.parse(raw) as {agentsVersion?: unknown};
    if (typeof parsed.agentsVersion === 'string') {
      pinned = parsed.agentsVersion;
    }
  } catch {
    return {
      id: 'version',
      status: 'fail',
      summary: 'could not read pinned agentsVersion',
      details: ['agents.config.json failed to parse — see config check.'],
    };
  }

  if (!pinned) {
    return {
      id: 'version',
      status: 'warn',
      summary: 'agentsVersion not pinned',
      details: [
        `add a pinned version to ${path} or run \`npx commerce-atoms-agents sync\` to write one.`,
      ],
    };
  }

  if (pinned === installedAgentsVersion) {
    return {
      id: 'version',
      status: 'pass',
      summary: `pinned and installed match (${pinned})`,
      details: [],
    };
  }

  return {
    id: 'version',
    status: 'warn',
    summary: 'pinned and installed differ',
    details: [
      `agents.config.json pinned: ${pinned}`,
      `installed locally:         ${installedAgentsVersion}`,
      'run `npx commerce-atoms-agents sync` to update the pin and re-materialise overlays.',
    ],
  };
}

async function checkArchitecture(root: string, strict: boolean): Promise<CheckSection> {
  const {report} = await validate({root, strict});
  const errorCount = report.counts.errors;
  const warningCount = report.counts.warnings;

  if (errorCount === 0 && warningCount === 0) {
    return {
      id: 'architecture',
      status: 'pass',
      summary: 'no architecture violations',
      details: [],
    };
  }

  if (errorCount > 0) {
    return {
      id: 'architecture',
      status: 'fail',
      summary: `${errorCount} architecture error(s), ${warningCount} warning(s)`,
      details: ['run `npx commerce-atoms-agents validate-architecture` for the full report.'],
    };
  }

  return {
    id: 'architecture',
    status: 'warn',
    summary: `${warningCount} architecture warning(s)`,
    details: ['run `npx commerce-atoms-agents validate-architecture` for the full report.'],
  };
}

export function formatCheckResult(result: CheckResult): string {
  const lines: string[] = ['commerce-atoms-agents check', ''];
  for (const section of result.sections) {
    const tag = badge(section.status);
    lines.push(`${tag} ${section.id}: ${section.summary}`);
    for (const detail of section.details) {
      lines.push(`         ${detail}`);
    }
    lines.push('');
  }
  lines.push(result.exitCode === 0 ? 'OK' : 'FAILED');
  return lines.join('\n');
}

function badge(status: CheckStatus): string {
  switch (status) {
    case 'pass':
      return '[PASS]';
    case 'warn':
      return '[WARN]';
    case 'fail':
      return '[FAIL]';
  }
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(resolve(p));
    return true;
  } catch {
    return false;
  }
}
