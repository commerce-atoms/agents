import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {mkdtemp, readFile, writeFile, mkdir, rm, stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

import {sync} from './sync.js';
import type {AgentsConfig} from './config.js';

const __filename = fileURLToPath(import.meta.url);
const packageRoot = resolve(dirname(__filename), '..');

async function tempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'commerce-atoms-test-'));
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

void test('sync into empty consumer copies AGENTS.md, CLAUDE.md, copilot, cursor rules', async () => {
  const outDir = await tempDir();
  try {
    const result = await sync({packageRoot, outDir, version: '0.1.0'});
    assert.equal(result.exitCode, 0);

    assert.ok(await pathExists(join(outDir, 'AGENTS.md')), 'AGENTS.md exists');
    assert.ok(await pathExists(join(outDir, 'CLAUDE.md')), 'CLAUDE.md exists');
    assert.ok(
      await pathExists(join(outDir, '.github', 'copilot-instructions.md')),
      '.github/copilot-instructions.md exists',
    );
    assert.ok(
      await pathExists(join(outDir, '.cursor', 'rules', '00-agents-md.mdc')),
      '.cursor/rules/00-agents-md.mdc exists',
    );

    const cfg = JSON.parse(await readFile(join(outDir, 'agents.config.json'), 'utf8')) as AgentsConfig;
    assert.equal(cfg.agentsVersion, '0.1.0');
    assert.equal(cfg.tools.cursor, true);
  } finally {
    await rm(outDir, {recursive: true, force: true});
  }
});

void test('sync rewrites repo-relative links in AGENTS.md to absolute GitHub URLs', async () => {
  const outDir = await tempDir();
  try {
    await sync({packageRoot, outDir, version: '0.1.0'});

    const consumerAgentsMd = await readFile(join(outDir, 'AGENTS.md'), 'utf8');

    // Should NOT contain repo-relative ADR links any more
    assert.doesNotMatch(
      consumerAgentsMd,
      /\]\(docs\/decisions\/[^)]+\)/,
      'consumer AGENTS.md must not contain raw repo-relative ADR links',
    );
    // SHOULD contain absolute GitHub blob URLs to the canonical sources under kit/
    assert.match(
      consumerAgentsMd,
      /https:\/\/github\.com\/commerce-atoms\/agents\/blob\/main\/kit\/docs\/decisions\//,
      'consumer AGENTS.md should contain absolute ADR URLs (under kit/)',
    );
    assert.match(
      consumerAgentsMd,
      /https:\/\/github\.com\/commerce-atoms\/agents\/blob\/main\/kit\/rules\/core\//,
      'consumer AGENTS.md should contain absolute kit/rules/core URLs',
    );
  } finally {
    await rm(outDir, {recursive: true, force: true});
  }
});

void test('sync rewrites links in nested .cursor/rules/*.mdc relative to their location', async () => {
  const outDir = await tempDir();
  try {
    await sync({packageRoot, outDir, version: '0.1.0'});

    const cursorRule = await readFile(
      join(outDir, '.cursor', 'rules', '10-imports.mdc'),
      'utf8',
    );

    // Original `../../rules/core/imports.md` should resolve to absolute repo URL
    assert.doesNotMatch(
      cursorRule,
      /\]\(\.\.\/\.\.\/rules\/core\//,
      'cursor mdc must not contain raw `../../rules/core/` paths',
    );
    assert.match(
      cursorRule,
      /https:\/\/github\.com\/commerce-atoms\/agents\/blob\/main\/kit\/rules\/core\/imports\.md/,
      'cursor mdc should rewrite to absolute repo URL (under kit/)',
    );
  } finally {
    await rm(outDir, {recursive: true, force: true});
  }
});

void test('sync uses custom repoUrlBase when provided', async () => {
  const outDir = await tempDir();
  try {
    await sync({
      packageRoot,
      outDir,
      version: '0.1.0',
      repoUrlBase: 'https://example.com/my-org/agents/blob/v0.1.0',
    });

    const consumerAgentsMd = await readFile(join(outDir, 'AGENTS.md'), 'utf8');
    assert.match(
      consumerAgentsMd,
      /https:\/\/example\.com\/my-org\/agents\/blob\/v0\.1\.0\/kit\/docs\/decisions\//,
    );
  } finally {
    await rm(outDir, {recursive: true, force: true});
  }
});

void test('re-running sync is idempotent (all unchanged)', async () => {
  const outDir = await tempDir();
  try {
    await sync({packageRoot, outDir, version: '0.1.0'});
    const second = await sync({packageRoot, outDir, version: '0.1.0'});
    assert.equal(second.exitCode, 0);

    const writes = second.writes;
    const written = writes.filter((w) => w.status === 'written');
    const unchanged = writes.filter((w) => w.status === 'unchanged');
    assert.equal(written.length, 0, 'no new writes on second sync');
    assert.ok(unchanged.length > 0, 'all files unchanged');
  } finally {
    await rm(outDir, {recursive: true, force: true});
  }
});

void test('local divergence is preserved without --force (conflict skipped)', async () => {
  const outDir = await tempDir();
  try {
    await sync({packageRoot, outDir, version: '0.1.0'});

    const customised = '# Local override\n\nDifferent content.\n';
    await writeFile(join(outDir, 'AGENTS.md'), customised, 'utf8');

    const result = await sync({packageRoot, outDir, version: '0.1.0'});
    assert.equal(result.exitCode, 1, 'non-zero exit because of conflict');
    const conflicts = result.writes.filter((w) => w.status === 'skipped-conflict');
    assert.ok(conflicts.length >= 1, 'AGENTS.md is reported as conflict');

    const stillCustom = await readFile(join(outDir, 'AGENTS.md'), 'utf8');
    assert.equal(stillCustom, customised, 'consumer override preserved');
  } finally {
    await rm(outDir, {recursive: true, force: true});
  }
});

void test('--force overwrites consumer divergence', async () => {
  const outDir = await tempDir();
  try {
    await sync({packageRoot, outDir, version: '0.1.0'});
    await writeFile(join(outDir, 'AGENTS.md'), '# overridden\n', 'utf8');

    const result = await sync({packageRoot, outDir, version: '0.1.0', force: true});
    assert.equal(result.exitCode, 0);

    const restored = await readFile(join(outDir, 'AGENTS.md'), 'utf8');
    assert.notEqual(restored, '# overridden\n', 'force overwrote consumer file');
    assert.match(restored, /Universal AI manifest/i);
  } finally {
    await rm(outDir, {recursive: true, force: true});
  }
});

void test('--dry-run does not write any files', async () => {
  const outDir = await tempDir();
  try {
    const result = await sync({packageRoot, outDir, version: '0.1.0', dryRun: true});
    assert.equal(result.exitCode, 0);
    assert.equal(await pathExists(join(outDir, 'AGENTS.md')), false);
    assert.equal(await pathExists(join(outDir, 'agents.config.json')), false);
  } finally {
    await rm(outDir, {recursive: true, force: true});
  }
});

void test('agents.config.json with disabled tools skips per-tool overlays', async () => {
  const outDir = await tempDir();
  try {
    await mkdir(outDir, {recursive: true});
    await writeFile(
      join(outDir, 'agents.config.json'),
      JSON.stringify({
        audience: 'store-fork',
        tools: {cursor: false, copilot: false, claude: true, codex: true},
      }),
      'utf8',
    );

    const result = await sync({packageRoot, outDir, version: '0.1.0'});
    assert.equal(result.exitCode, 0);

    assert.ok(await pathExists(join(outDir, 'AGENTS.md')), 'universal AGENTS.md still emitted');
    assert.ok(await pathExists(join(outDir, 'CLAUDE.md')), 'CLAUDE.md emitted');
    assert.equal(
      await pathExists(join(outDir, '.github', 'copilot-instructions.md')),
      false,
      'copilot disabled',
    );
    assert.equal(
      await pathExists(join(outDir, '.cursor', 'rules', '00-agents-md.mdc')),
      false,
      'cursor disabled',
    );
  } finally {
    await rm(outDir, {recursive: true, force: true});
  }
});

void test('invalid JSON in agents.config.json fails fast', async () => {
  const outDir = await tempDir();
  try {
    await mkdir(outDir, {recursive: true});
    await writeFile(join(outDir, 'agents.config.json'), '{not json', 'utf8');

    await assert.rejects(
      () => sync({packageRoot, outDir, version: '0.1.0'}),
      /Invalid JSON/,
    );
  } finally {
    await rm(outDir, {recursive: true, force: true});
  }
});

void test('invalid audience in agents.config.json fails fast', async () => {
  const outDir = await tempDir();
  try {
    await mkdir(outDir, {recursive: true});
    await writeFile(
      join(outDir, 'agents.config.json'),
      JSON.stringify({audience: 'not-a-real-audience'}),
      'utf8',
    );

    await assert.rejects(
      () => sync({packageRoot, outDir, version: '0.1.0'}),
      /audience must be one of/,
    );
  } finally {
    await rm(outDir, {recursive: true, force: true});
  }
});
