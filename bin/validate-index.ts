#!/usr/bin/env node
import {readFile, stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';

import {validateSyncCoverage} from '../src/internal/sync-coverage.js';

interface IndexEntry {
  id: string;
  path?: string;
  status?: 'planned-mvp' | 'backlog' | 'stable' | 'experimental' | string;
}

interface IndexManifest {
  agentsMd?: string;
  claudeOverlay?: string;
  copilotOverlay?: string;
  cursorOverlayDir?: string;
  quickstart?: string;
}

interface IndexFile {
  name: string;
  version: string;
  manifest?: IndexManifest;
  rules?: IndexEntry[];
  skills?: IndexEntry[];
  commands?: IndexEntry[];
  prompts?: IndexEntry[];
  personas?: IndexEntry[];
  reference?: IndexEntry[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function resolvePackageRoot(start: string): Promise<string> {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    try {
      const pkgPath = resolve(dir, 'package.json');
      await stat(pkgPath);
      const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as {name?: string};
      if (pkg.name === '@commerce-atoms/agents') return dir;
    } catch {
      // keep walking
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`Could not locate @commerce-atoms/agents package root from ${start}`);
}

async function main(): Promise<void> {
  const packageRoot = await resolvePackageRoot(__dirname);
  const kitRoot = resolve(packageRoot, 'kit');
  const indexPath = resolve(kitRoot, 'INDEX.json');
  const index = JSON.parse(await readFile(indexPath, 'utf8')) as IndexFile;

  const issues: string[] = [];

  // INDEX.json paths are kit-relative.
  const checkPath = async (label: string, p: string | undefined): Promise<void> => {
    if (!p) return;
    const abs = resolve(kitRoot, p);
    try {
      await stat(abs);
    } catch {
      issues.push(`${label}: missing path -> ${p}`);
    }
  };

  await checkPath('manifest.agentsMd', index.manifest?.agentsMd);
  await checkPath('manifest.claudeOverlay', index.manifest?.claudeOverlay);
  await checkPath('manifest.copilotOverlay', index.manifest?.copilotOverlay);
  await checkPath('manifest.cursorOverlayDir', index.manifest?.cursorOverlayDir);
  await checkPath('manifest.quickstart', index.manifest?.quickstart);

  for (const r of index.rules ?? []) {
    await checkPath(`rules[${r.id}]`, r.path);
  }
  for (const s of index.skills ?? []) {
    if (s.status === 'planned-mvp' || s.status === 'backlog') continue;
    await checkPath(`skills[${s.id}]`, s.path);
  }
  for (const c of index.commands ?? []) {
    if (c.status === 'planned-mvp' || c.status === 'backlog') continue;
    await checkPath(`commands[${c.id}]`, c.path);
  }
  for (const p of index.prompts ?? []) {
    await checkPath(`prompts[${p.id}]`, p.path);
  }
  for (const p of index.personas ?? []) {
    await checkPath(`personas[${p.id}]`, p.path);
  }
  for (const r of index.reference ?? []) {
    await checkPath(`reference[${r.id}]`, r.path);
  }

  if (issues.length > 0) {
    process.stderr.write(`INDEX.json validation failed:\n  - ${issues.join('\n  - ')}\n`);
    process.exit(1);
  }

  const coverageIssues = await validateSyncCoverage(packageRoot);
  if (coverageIssues.length > 0) {
    process.stderr.write(`Sync coverage validation failed:\n  - ${coverageIssues.join('\n  - ')}\n`);
    process.exit(1);
  }

  process.stdout.write(`INDEX.json + sync coverage: ok (${index.name}@${index.version})\n`);
}

await main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
});
