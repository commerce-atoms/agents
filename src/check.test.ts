import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {check, formatCheckResult} from './check.js';

async function tempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'check-test-'));
}

async function writeRoutesManifest(root: string): Promise<void> {
  await mkdir(join(root, 'app'), {recursive: true});
  await writeFile(
    join(root, 'app', 'routes.ts'),
    'export default [] as const;\n',
    'utf8',
  );
}

void test('check passes on a clean consumer with valid config and matching pin', async () => {
  const root = await tempDir();
  try {
    await writeRoutesManifest(root);
    await writeFile(
      join(root, 'agents.config.json'),
      JSON.stringify({
        agentsVersion: '0.1.1',
        audience: 'store-fork',
        tools: {cursor: true, copilot: true, claude: true, codex: true},
      }),
      'utf8',
    );

    const result = await check({root, installedAgentsVersion: '0.1.1'});
    assert.equal(result.exitCode, 0);

    const ids = result.sections.map((s) => s.id);
    assert.deepEqual(ids, ['config', 'version', 'architecture']);
    for (const section of result.sections) {
      assert.equal(section.status, 'pass', `${section.id} should pass`);
    }
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

void test('check warns when pinned and installed versions differ', async () => {
  const root = await tempDir();
  try {
    await writeRoutesManifest(root);
    await writeFile(
      join(root, 'agents.config.json'),
      JSON.stringify({agentsVersion: '0.1.0', audience: 'store-fork'}),
      'utf8',
    );

    const result = await check({root, installedAgentsVersion: '0.1.1'});
    assert.equal(result.exitCode, 0, 'warnings do not fail by default');

    const versionSection = result.sections.find((s) => s.id === 'version');
    assert.ok(versionSection);
    assert.equal(versionSection.status, 'warn');
    assert.match(versionSection.summary, /differ/);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

void test('check --strict fails when warnings are present', async () => {
  const root = await tempDir();
  try {
    await writeRoutesManifest(root);
    await writeFile(
      join(root, 'agents.config.json'),
      JSON.stringify({agentsVersion: '0.1.0', audience: 'store-fork'}),
      'utf8',
    );

    const result = await check({root, installedAgentsVersion: '0.1.1', strict: true});
    assert.equal(result.exitCode, 1);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

void test('check fails when agents.config.json is invalid JSON', async () => {
  const root = await tempDir();
  try {
    await writeRoutesManifest(root);
    await writeFile(join(root, 'agents.config.json'), '{not json', 'utf8');

    const result = await check({root, installedAgentsVersion: '0.1.1'});
    assert.equal(result.exitCode, 1);

    const config = result.sections.find((s) => s.id === 'config');
    assert.ok(config);
    assert.equal(config.status, 'fail');
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

void test('check warns when agents.config.json is absent', async () => {
  const root = await tempDir();
  try {
    await writeRoutesManifest(root);

    const result = await check({root, installedAgentsVersion: '0.1.1'});
    // No config => config WARN, version WARN, architecture PASS. Default strict=false => exit 0.
    assert.equal(result.exitCode, 0);
    const config = result.sections.find((s) => s.id === 'config');
    assert.equal(config?.status, 'warn');
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

void test('check fails when architecture has errors', async () => {
  const root = await tempDir();
  try {
    // Trigger MISSING_APP_DIR: no app/ at all
    await writeFile(
      join(root, 'agents.config.json'),
      JSON.stringify({agentsVersion: '0.1.1'}),
      'utf8',
    );

    const result = await check({root, installedAgentsVersion: '0.1.1'});
    assert.equal(result.exitCode, 1);

    const arch = result.sections.find((s) => s.id === 'architecture');
    assert.equal(arch?.status, 'fail');
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

void test('formatCheckResult produces a human-readable summary', () => {
  const formatted = formatCheckResult({
    exitCode: 0,
    sections: [
      {id: 'config', status: 'pass', summary: 'agents.config.json valid', details: ['audience: store-fork']},
      {id: 'version', status: 'pass', summary: 'pinned and installed match (0.1.1)', details: []},
      {id: 'architecture', status: 'pass', summary: 'no architecture violations', details: []},
    ],
  });
  assert.match(formatted, /\[PASS\] config: agents\.config\.json valid/);
  assert.match(formatted, /\[PASS\] version:/);
  assert.match(formatted, /\[PASS\] architecture:/);
  assert.match(formatted, /\nOK$/);
});
