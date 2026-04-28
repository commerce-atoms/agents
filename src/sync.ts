import {readFile, writeFile, mkdir, stat, readdir, copyFile} from 'node:fs/promises';
import {dirname, join, resolve, relative} from 'node:path';
import {createHash} from 'node:crypto';

import {loadConfig, defaults} from './config.js';
import type {AgentsConfig, OutPaths, ToolFlags} from './config.js';

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
}

export async function sync({
  packageRoot,
  configPath,
  outDir = process.cwd(),
  dryRun = false,
  force = false,
  version,
}: SyncParams): Promise<SyncResult> {
  const config = await loadConfig({configPath, outDir});

  const tools: ToolFlags = {...defaults().tools, ...config.tools};
  const out: OutPaths = {...defaults().out, ...config.out};

  const writes: WriteRecord[] = [];

  writes.push(
    await prepareCopy({
      from: join(packageRoot, 'AGENTS.md'),
      to: join(outDir, out.agentsMd),
      force,
    }),
  );

  if (tools.claude) {
    writes.push(
      await prepareCopy({
        from: join(packageRoot, 'CLAUDE.md'),
        to: join(outDir, out.claudeMd),
        force,
      }),
    );
  }
  if (tools.copilot) {
    writes.push(
      await prepareCopy({
        from: join(packageRoot, 'copilot-instructions.md'),
        to: join(outDir, out.copilotInstructions),
        force,
      }),
    );
  }
  if (tools.cursor) {
    const cursorSrc = join(packageRoot, '.cursor', 'rules');
    if (await pathExists(cursorSrc)) {
      const cursorOut = join(outDir, out.cursorRulesDir);
      const entries = await readdir(cursorSrc, {withFileTypes: true});
      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.mdc')) continue;
        writes.push(
          await prepareCopy({
            from: join(cursorSrc, entry.name),
            to: join(cursorOut, entry.name),
            force,
          }),
        );
      }
    }
  }

  if (!dryRun) {
    for (const w of writes) {
      if (w.status === 'unchanged' || w.status === 'skipped-conflict') continue;
      await mkdir(dirname(w.to), {recursive: true});
      await copyFile(w.from, w.to);
    }
  }

  if (!dryRun) {
    await writeBackConfig({outDir, configPath, config, version, tools, out});
  }

  const counts = countByStatus(writes);
  const lines = [
    `commerce-atoms-agents@${version} -> ${relative(process.cwd(), outDir) || '.'}`,
    `  written:   ${counts.written}`,
    `  unchanged: ${counts.unchanged}`,
    `  conflicts: ${counts['skipped-conflict']} (use --force to overwrite)`,
    `  dry-run:   ${dryRun}`,
  ];
  const exitCode = counts['skipped-conflict'] > 0 && !force ? 1 : 0;

  return {exitCode, summary: lines.join('\n'), writes};
}

interface PrepareCopyParams {
  from: string;
  to: string;
  force: boolean;
}

async function prepareCopy({from, to, force}: PrepareCopyParams): Promise<WriteRecord> {
  const fromExists = await pathExists(from);
  if (!fromExists) {
    return {from, to, status: 'missing-source'};
  }
  const toExists = await pathExists(to);
  if (!toExists) {
    return {from, to, status: 'written'};
  }

  const [fromHash, toHash] = await Promise.all([fileHash(from), fileHash(to)]);
  if (fromHash === toHash) {
    return {from, to, status: 'unchanged'};
  }
  if (force) {
    return {from, to, status: 'written'};
  }
  return {from, to, status: 'skipped-conflict'};
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

async function fileHash(path: string): Promise<string> {
  const buf = await readFile(path);
  return createHash('sha256').update(buf).digest('hex');
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
