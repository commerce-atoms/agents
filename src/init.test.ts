import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {mkdtemp, mkdir, writeFile, readFile, rm, stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

import {init} from './init.js';
import type {CloneStarterParams} from './init.js';

const __filename = fileURLToPath(import.meta.url);
const packageRoot = resolve(dirname(__filename), '..');

async function tempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'init-test-'));
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function fakeStarter({dest}: CloneStarterParams): Promise<void> {
  await mkdir(dest, {recursive: true});
  await mkdir(join(dest, 'app', 'platform'), {recursive: true});
  await mkdir(join(dest, '.git'), {recursive: true});
  await writeFile(join(dest, '.git', 'HEAD'), 'ref: refs/heads/main\n');
  await writeFile(
    join(dest, 'package.json'),
    JSON.stringify({name: 'hydrogen-storefront-starter', version: '0.0.0', private: true}, null, 2),
    'utf8',
  );
  await writeFile(join(dest, 'app', 'routes.ts'), '// manifest\n', 'utf8');
  await writeFile(join(dest, 'README.md'), '# starter\n', 'utf8');
}

void test('init validates the store name', async () => {
  const outDir = await tempDir();
  try {
    await assert.rejects(
      () => init({name: '', outDir, packageRoot, packageVersion: '0.1.0'}),
      /Store name is required/,
    );
    await assert.rejects(
      () => init({name: 'INVALID', outDir, packageRoot, packageVersion: '0.1.0'}),
      /Invalid store name/,
    );
    await assert.rejects(
      () => init({name: 'a', outDir, packageRoot, packageVersion: '0.1.0'}),
      /Invalid store name/,
    );
    await assert.rejects(
      () => init({name: 'has spaces', outDir, packageRoot, packageVersion: '0.1.0'}),
      /Invalid store name/,
    );
  } finally {
    await rm(outDir, {recursive: true, force: true});
  }
});

void test('init refuses to overwrite an existing directory', async () => {
  const outDir = await tempDir();
  try {
    await mkdir(join(outDir, 'merch'), {recursive: true});
    await assert.rejects(
      () => init({name: 'merch', outDir, packageRoot, packageVersion: '0.1.0', cloneStarter: fakeStarter}),
      /Refusing to overwrite/,
    );
  } finally {
    await rm(outDir, {recursive: true, force: true});
  }
});

void test('init dry-run reports plan but writes nothing', async () => {
  const outDir = await tempDir();
  try {
    const result = await init({
      name: 'merch',
      outDir,
      packageRoot,
      packageVersion: '0.1.0',
      dryRun: true,
      cloneStarter: fakeStarter,
    });
    assert.equal(result.exitCode, 0);
    assert.match(result.summary, /dry-run/);
    assert.equal(await pathExists(join(outDir, 'merch')), false);
  } finally {
    await rm(outDir, {recursive: true, force: true});
  }
});

void test('init produces a branded, agent-pinned project tree', async () => {
  const outDir = await tempDir();
  try {
    const result = await init({
      name: 'merch-shop',
      outDir,
      packageRoot,
      packageVersion: '0.1.0',
      cloneStarter: fakeStarter,
      skipGitInit: true,
    });
    assert.equal(result.exitCode, 0);

    const dir = result.dir;
    assert.ok(await pathExists(dir), 'project directory exists');
    assert.equal(await pathExists(join(dir, '.git')), false, 'inherited .git removed');

    const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8')) as {
      name: string;
      private: boolean;
    };
    assert.equal(pkg.name, 'merch-shop');
    assert.equal(pkg.private, true);

    const readme = await readFile(join(dir, 'README.md'), 'utf8');
    assert.match(readme, /^# merch-shop/m);
    assert.match(readme, /@commerce-atoms\/agents@0\.1\.0/);

    assert.ok(await pathExists(join(dir, 'app', 'config', 'brand.ts')));
    assert.ok(await pathExists(join(dir, 'app', 'assets', 'brand', 'README.md')));

    const brand = await readFile(join(dir, 'app', 'config', 'brand.ts'), 'utf8');
    assert.match(brand, /name: 'Merch Shop'/);

    assert.ok(await pathExists(join(dir, 'AGENTS.md')));
    assert.ok(await pathExists(join(dir, 'CLAUDE.md')));
    assert.ok(await pathExists(join(dir, '.github', 'copilot-instructions.md')));
    assert.ok(await pathExists(join(dir, '.cursor', 'rules', '00-agents-md.mdc')));

    const cfg = JSON.parse(await readFile(join(dir, 'agents.config.json'), 'utf8')) as {
      agentsVersion: string;
    };
    assert.equal(cfg.agentsVersion, '0.1.0');
  } finally {
    await rm(outDir, {recursive: true, force: true});
  }
});

void test('init preserves existing brand.ts if the starter already provides one', async () => {
  const outDir = await tempDir();
  try {
    const customStarter = async ({dest}: CloneStarterParams): Promise<void> => {
      await fakeStarter({repo: '', ref: '', dest});
      await mkdir(join(dest, 'app', 'config'), {recursive: true});
      await writeFile(
        join(dest, 'app', 'config', 'brand.ts'),
        `// custom from starter\nexport const brand = {name: 'preset'};\n`,
        'utf8',
      );
    };

    const result = await init({
      name: 'preset-shop',
      outDir,
      packageRoot,
      packageVersion: '0.1.0',
      cloneStarter: customStarter,
      skipGitInit: true,
    });

    const brand = await readFile(join(result.dir, 'app', 'config', 'brand.ts'), 'utf8');
    assert.match(brand, /custom from starter/, 'starter-provided brand preserved');
  } finally {
    await rm(outDir, {recursive: true, force: true});
  }
});
