import {readFile, writeFile, mkdir, stat, readdir} from 'node:fs/promises';
import {dirname, join, resolve, relative, sep} from 'node:path';

import {loadConfig, defaults} from './config.js';
import type {AgentsConfig, OutPaths, ToolFlags} from './config.js';
import {rewriteRelativeLinks} from './internal/rewrite-links.js';

export type WriteStatus = 'written' | 'unchanged' | 'skipped-conflict' | 'missing-source';

export interface WriteRecord {
  from: string;
  to: string;
  status: WriteStatus;
}

export interface SyncResult {
  exitCode: number;
  summary: string;
  writes: WriteRecord[];
}

export interface SyncParams {
  packageRoot: string;
  configPath?: string | undefined;
  outDir?: string | undefined;
  dryRun?: boolean | undefined;
  force?: boolean | undefined;
  version: string;
  /**
   * Absolute base URL pointing at the agents repo's blob root, e.g.
   * `https://github.com/commerce-atoms/agents/blob/main`. Used to rewrite
   * repo-relative links in synced markdown so they remain valid in the
   * consumer repo. Defaults to the canonical `main` branch.
   */
  repoUrlBase?: string | undefined;
}

const DEFAULT_REPO_URL_BASE = 'https://github.com/commerce-atoms/agents/blob/main';

/**
 * Subdirectory under the package root where shipped product content lives.
 * The root of the agents repo holds npm package metadata, source, and
 * kit-authoring docs; everything that gets synced to consumer repos lives
 * under `kit/`. See `CONTRIBUTING.md` for the rationale.
 */
const KIT_DIR = 'kit';

interface SyncSourceSpec {
  /** Absolute path to the source file. */
  from: string;
  /** Absolute path to write to in the consumer repo. */
  to: string;
  /** Path of the source file relative to the package root, posix-style. */
  sourceFileInRepo: string;
}

export async function sync({
  packageRoot,
  configPath,
  outDir = process.cwd(),
  dryRun = false,
  force = false,
  version,
  repoUrlBase = DEFAULT_REPO_URL_BASE,
}: SyncParams): Promise<SyncResult> {
  const config = await loadConfig({configPath, outDir});

  const tools: ToolFlags = {...defaults().tools, ...config.tools};
  const out: OutPaths = {...defaults().out, ...config.out};

  const sources: SyncSourceSpec[] = [];

  sources.push({
    from: join(packageRoot, KIT_DIR, 'AGENTS.md'),
    to: join(outDir, out.agentsMd),
    sourceFileInRepo: `${KIT_DIR}/AGENTS.md`,
  });

  if (tools.claude) {
    sources.push({
      from: join(packageRoot, KIT_DIR, 'CLAUDE.md'),
      to: join(outDir, out.claudeMd),
      sourceFileInRepo: `${KIT_DIR}/CLAUDE.md`,
    });
  }
  if (tools.copilot) {
    sources.push({
      from: join(packageRoot, KIT_DIR, 'copilot-instructions.md'),
      to: join(outDir, out.copilotInstructions),
      sourceFileInRepo: `${KIT_DIR}/copilot-instructions.md`,
    });
  }
  if (tools.cursor) {
    const cursorSrc = join(packageRoot, KIT_DIR, '.cursor', 'rules');
    if (await pathExists(cursorSrc)) {
      const cursorOut = join(outDir, out.cursorRulesDir);
      const entries = await readdir(cursorSrc, {withFileTypes: true});
      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.mdc')) continue;
        sources.push({
          from: join(cursorSrc, entry.name),
          to: join(cursorOut, entry.name),
          sourceFileInRepo: [KIT_DIR, '.cursor', 'rules', entry.name].join('/'),
        });
      }
    }
  }

  const writes: PreparedWrite[] = [];
  for (const spec of sources) {
    writes.push(await prepareWrite({spec, force, repoUrlBase}));
  }

  if (!dryRun) {
    for (const w of writes) {
      if (w.record.status === 'unchanged' || w.record.status === 'skipped-conflict') continue;
      if (w.record.status === 'missing-source') continue;
      await mkdir(dirname(w.record.to), {recursive: true});
      await writeFile(w.record.to, w.transformedContent ?? '', 'utf8');
    }
  }

  if (!dryRun) {
    await writeBackConfig({outDir, configPath, config, version, tools, out});
  }

  const records = writes.map((w) => w.record);
  const counts = countByStatus(records);
  const lines = [
    `commerce-atoms-agents@${version} -> ${relativeOrDot(outDir)}`,
    `  written:   ${counts.written}`,
    `  unchanged: ${counts.unchanged}`,
    `  conflicts: ${counts['skipped-conflict']} (use --force to overwrite)`,
    `  dry-run:   ${dryRun}`,
  ];
  const exitCode = counts['skipped-conflict'] > 0 && !force ? 1 : 0;

  return {exitCode, summary: lines.join('\n'), writes: records};
}

interface PreparedWrite {
  record: WriteRecord;
  /** Final content to write to disk (already link-rewritten where applicable). */
  transformedContent: string | undefined;
}

interface PrepareWriteParams {
  spec: SyncSourceSpec;
  force: boolean;
  repoUrlBase: string;
}

async function prepareWrite({spec, force, repoUrlBase}: PrepareWriteParams): Promise<PreparedWrite> {
  const {from, to, sourceFileInRepo} = spec;

  if (!(await pathExists(from))) {
    return {record: {from, to, status: 'missing-source'}, transformedContent: undefined};
  }

  const sourceContent = await readFile(from, 'utf8');
  const transformed = shouldRewrite(sourceFileInRepo)
    ? rewriteRelativeLinks({content: sourceContent, sourceFileInRepo, repoUrlBase})
    : sourceContent;

  if (!(await pathExists(to))) {
    return {record: {from, to, status: 'written'}, transformedContent: transformed};
  }

  const destContent = await readFile(to, 'utf8');
  if (destContent === transformed) {
    return {record: {from, to, status: 'unchanged'}, transformedContent: transformed};
  }

  if (force) {
    return {record: {from, to, status: 'written'}, transformedContent: transformed};
  }

  return {record: {from, to, status: 'skipped-conflict'}, transformedContent: transformed};
}

function shouldRewrite(sourceFileInRepo: string): boolean {
  return /\.(md|mdc)$/i.test(sourceFileInRepo);
}

interface WriteBackConfigParams {
  outDir: string;
  configPath: string | undefined;
  config: AgentsConfig;
  version: string;
  tools: ToolFlags;
  out: OutPaths;
}

async function writeBackConfig({
  outDir,
  configPath,
  config,
  version,
  tools,
  out,
}: WriteBackConfigParams): Promise<void> {
  const targetPath = configPath ? resolve(configPath) : join(outDir, 'agents.config.json');
  const next: AgentsConfig = {
    ...config,
    agentsVersion: version,
    tools,
    out,
  };
  await writeFile(targetPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

type StatusTally = Record<WriteStatus, number>;

function countByStatus(writes: WriteRecord[]): StatusTally {
  const tally: StatusTally = {
    written: 0,
    unchanged: 0,
    'skipped-conflict': 0,
    'missing-source': 0,
  };
  for (const w of writes) {
    tally[w.status] += 1;
  }
  return tally;
}

function relativeOrDot(outDir: string): string {
  const rel = relative(process.cwd(), outDir);
  if (!rel) return '.';
  return rel.split(sep).join('/');
}
