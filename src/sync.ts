import {readFile, writeFile, mkdir, stat, readdir, unlink} from 'node:fs/promises';
import {dirname, join, resolve, relative, sep, basename, extname} from 'node:path';

import {loadConfig, defaults} from './config.js';
import type {AgentsConfig, OutPaths, ToolFlags} from './config.js';
import {collectFullKitSyncSpecs} from './internal/full-kit-sync.js';
import {rewriteRelativeLinks} from './internal/rewrite-links.js';

export type WriteStatus =
  | 'written'
  | 'unchanged'
  | 'divergent'
  | 'sidecar-cleaned'
  | 'missing-source';

export interface WriteRecord {
  from: string;
  to: string;
  status: WriteStatus;
  /**
   * Set on `divergent` records — the consumer-side file we left untouched.
   * `to` for those records points at the `<file>.kit-incoming.<ext>` sidecar.
   */
  consumerPath?: string;
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
  /**
   * Overwrite consumer divergence in place. Skips sidecar generation.
   */
  force?: boolean | undefined;
  /**
   * Treat divergent files as failures (exit 1). Default behaviour is to
   * write a `<file>.kit-incoming.<ext>` sidecar, leave the consumer file
   * untouched, and exit 0 so unrelated updates still land. CI gates can
   * opt into strict to fail PRs on divergence.
   */
  strict?: boolean | undefined;
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

const SIDECAR_INFIX = '.kit-incoming';

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
  strict = false,
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

  const kitProjection = await collectFullKitSyncSpecs({packageRoot, outDir, tools});
  for (const spec of kitProjection) {
    sources.push(spec);
  }

  const writes: PreparedWrite[] = [];
  for (const spec of sources) {
    writes.push(await prepareWrite({spec, force, repoUrlBase}));
  }

  if (!dryRun) {
    for (const w of writes) {
      const status = w.record.status;
      if (status === 'unchanged' || status === 'missing-source') continue;
      if (status === 'sidecar-cleaned') {
        await tryUnlink(w.record.to);
        continue;
      }
      await mkdir(dirname(w.record.to), {recursive: true});
      if (w.binaryPayload) {
        await writeFile(w.record.to, w.binaryPayload);
      } else {
        await writeFile(w.record.to, w.transformedContent ?? '', 'utf8');
      }
    }
  }

  if (!dryRun) {
    await writeBackConfig({outDir, configPath, config, version, tools, out});
  }

  const records = writes.map((w) => w.record);
  const counts = countByStatus(records);
  const lines = [
    `commerce-atoms-agents@${version} -> ${relativeOrDot(outDir)}`,
    `  written:    ${counts.written}`,
    `  unchanged:  ${counts.unchanged}`,
    `  divergent:  ${counts.divergent} (consumer edits preserved; canonical written to *${SIDECAR_INFIX}* sidecars)`,
  ];
  if (counts['sidecar-cleaned'] > 0) {
    lines.push(`  cleaned:    ${counts['sidecar-cleaned']} stale sidecar(s) removed`);
  }
  lines.push(`  dry-run:    ${dryRun}`);

  if (counts.divergent > 0) {
    lines.push('');
    lines.push('Divergent files (review and merge manually, or re-run with --force to overwrite):');
    for (const r of records) {
      if (r.status !== 'divergent') continue;
      lines.push(`  ${relativeOrDot(r.consumerPath ?? r.to)}  <-  ${relativeOrDot(r.to)}`);
    }
  }

  const exitCode = strict && counts.divergent > 0 ? 1 : 0;

  return {exitCode, summary: lines.join('\n'), writes: records};
}

interface PreparedWrite {
  record: WriteRecord;
  /** Final UTF-8 text (already link-rewritten for markdown where applicable). */
  transformedContent: string | undefined;
  /** Non-markdown payloads copied byte-for-byte (e.g. future skill assets). */
  binaryPayload: Buffer | undefined;
}

interface PrepareWriteParams {
  spec: SyncSourceSpec;
  force: boolean;
  repoUrlBase: string;
}

async function prepareWrite({spec, force, repoUrlBase}: PrepareWriteParams): Promise<PreparedWrite> {
  const {from, to, sourceFileInRepo} = spec;
  const sidecar = sidecarPathFor(to);

  if (!(await pathExists(from))) {
    return {
      record: {from, to, status: 'missing-source'},
      transformedContent: undefined,
      binaryPayload: undefined,
    };
  }

  if (shouldRewriteMarkdown(sourceFileInRepo)) {
    const sourceContent = await readFile(from, 'utf8');
    const transformed = rewriteRelativeLinks({content: sourceContent, sourceFileInRepo, repoUrlBase});

    if (!(await pathExists(to))) {
      return {
        record: {from, to, status: 'written'},
        transformedContent: transformed,
        binaryPayload: undefined,
      };
    }

    const destContent = await readFile(to, 'utf8');
    if (destContent === transformed) {
      if (await pathExists(sidecar)) {
        return {
          record: {from, to: sidecar, status: 'sidecar-cleaned', consumerPath: to},
          transformedContent: undefined,
          binaryPayload: undefined,
        };
      }
      return {
        record: {from, to, status: 'unchanged'},
        transformedContent: transformed,
        binaryPayload: undefined,
      };
    }

    if (force) {
      return {
        record: {from, to, status: 'written'},
        transformedContent: transformed,
        binaryPayload: undefined,
      };
    }

    return {
      record: {from, to: sidecar, status: 'divergent', consumerPath: to},
      transformedContent: transformed,
      binaryPayload: undefined,
    };
  }

  const payload = await readFile(from);
  if (!(await pathExists(to))) {
    return {
      record: {from, to, status: 'written'},
      transformedContent: undefined,
      binaryPayload: payload,
    };
  }

  const destPayload = await readFile(to);
  if (Buffer.compare(payload, destPayload) === 0) {
    if (await pathExists(sidecar)) {
      return {
        record: {from, to: sidecar, status: 'sidecar-cleaned', consumerPath: to},
        transformedContent: undefined,
        binaryPayload: undefined,
      };
    }
    return {
      record: {from, to, status: 'unchanged'},
      transformedContent: undefined,
      binaryPayload: payload,
    };
  }

  if (force) {
    return {
      record: {from, to, status: 'written'},
      transformedContent: undefined,
      binaryPayload: payload,
    };
  }

  return {
    record: {from, to: sidecar, status: 'divergent', consumerPath: to},
    transformedContent: undefined,
    binaryPayload: payload,
  };
}

/**
 * `AGENTS.md` -> `AGENTS.kit-incoming.md`
 * `30-imports.mdc` -> `30-imports.kit-incoming.mdc`
 * `INDEX.json` -> `INDEX.kit-incoming.json`
 *
 * Extension is preserved on the sidecar so editors keep syntax highlighting.
 */
function sidecarPathFor(absPath: string): string {
  const dir = dirname(absPath);
  const name = basename(absPath);
  const ext = extname(name);
  const stem = ext ? name.slice(0, -ext.length) : name;
  return join(dir, `${stem}${SIDECAR_INFIX}${ext}`);
}

function shouldRewriteMarkdown(sourceFileInRepo: string): boolean {
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

async function tryUnlink(p: string): Promise<void> {
  try {
    await unlink(p);
  } catch {
    // best-effort cleanup
  }
}

type StatusTally = Record<WriteStatus, number>;

function countByStatus(writes: WriteRecord[]): StatusTally {
  const tally: StatusTally = {
    written: 0,
    unchanged: 0,
    divergent: 0,
    'sidecar-cleaned': 0,
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
