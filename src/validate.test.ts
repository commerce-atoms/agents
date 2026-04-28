import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {validate} from './validate.js';

async function tempProject(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'validate-arch-'));
}

async function writeFileEnsureDir(path: string, contents: string): Promise<void> {
  await mkdir(join(path, '..'), {recursive: true});
  await writeFile(path, contents, 'utf8');
}

async function bootstrapValidProject(root: string): Promise<void> {
  await writeFileEnsureDir(join(root, 'app', 'routes.ts'), '// manifest\n');
  await writeFileEnsureDir(
    join(root, 'app', 'modules', 'products', 'products.route.tsx'),
    `import {Storefront} from '@platform/shopify/context';
import './products.view';
export async function loader() {}
`,
  );
  await writeFileEnsureDir(
    join(root, 'app', 'modules', 'products', 'products.view.tsx'),
    `export function ProductsView() { return null; }\n`,
  );
  await writeFileEnsureDir(
    join(root, 'app', 'platform', 'shopify', 'context.ts'),
    `export class Storefront {}\n`,
  );
}

void test('valid project passes with no violations', async () => {
  const root = await tempProject();
  try {
    await bootstrapValidProject(root);
    const {report, exitCode} = await validate({root});
    assert.equal(exitCode, 0);
    assert.equal(report.violations.length, 0);
    assert.equal(report.counts.errors, 0);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

void test('cross-module import is detected', async () => {
  const root = await tempProject();
  try {
    await bootstrapValidProject(root);
    await writeFileEnsureDir(
      join(root, 'app', 'modules', 'cart', 'cart.route.tsx'),
      `import {something} from '@modules/products/queries';\n`,
    );
    const {report, exitCode} = await validate({root});
    assert.equal(exitCode, 1);
    const codes = report.violations.map((v) => v.code);
    assert.ok(codes.includes('CROSS_MODULE_IMPORT'), `expected CROSS_MODULE_IMPORT; got ${codes.join(', ')}`);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

void test('platform importing module is detected', async () => {
  const root = await tempProject();
  try {
    await bootstrapValidProject(root);
    await writeFileEnsureDir(
      join(root, 'app', 'platform', 'oops', 'leak.ts'),
      `import {something} from '@modules/products/queries';\n`,
    );
    const {report, exitCode} = await validate({root});
    assert.equal(exitCode, 1);
    const codes = report.violations.map((v) => v.code);
    assert.ok(codes.includes('REVERSE_IMPORT'));
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

void test('dumping-ground folder is detected', async () => {
  const root = await tempProject();
  try {
    await bootstrapValidProject(root);
    await writeFileEnsureDir(join(root, 'app', 'lib', 'helper.ts'), `export const x = 1;\n`);
    const {report, exitCode} = await validate({root});
    assert.equal(exitCode, 1);
    const v = report.violations.find((violation) => violation.code === 'DUMPING_GROUND_FOLDER');
    assert.ok(v, 'DUMPING_GROUND_FOLDER reported');
    assert.match(v.message, /app\/lib/);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

void test('barrel file is detected', async () => {
  const root = await tempProject();
  try {
    await bootstrapValidProject(root);
    await writeFileEnsureDir(
      join(root, 'app', 'components', 'primitives', 'index.ts'),
      `export {Button} from './Button';\n`,
    );
    const {report, exitCode} = await validate({root});
    assert.equal(exitCode, 1);
    assert.ok(report.violations.some((v) => v.code === 'BARREL_FILE'));
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

void test('Remix imports are detected', async () => {
  const root = await tempProject();
  try {
    await bootstrapValidProject(root);
    await writeFileEnsureDir(
      join(root, 'app', 'modules', 'cart', 'cart.route.tsx'),
      `import {Form} from '@remix-run/react';
import {Link} from 'react-router-dom';
`,
    );
    const {report, exitCode} = await validate({root});
    assert.equal(exitCode, 1);
    const remixViolations = report.violations.filter((v) => v.code === 'REMIX_IMPORT');
    assert.equal(remixViolations.length, 2);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

void test('missing app/routes.ts is detected', async () => {
  const root = await tempProject();
  try {
    await bootstrapValidProject(root);
    await rm(join(root, 'app', 'routes.ts'));
    const {report, exitCode} = await validate({root});
    assert.equal(exitCode, 1);
    assert.ok(report.violations.some((v) => v.code === 'MISSING_ROUTES_MANIFEST'));
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

void test('missing app/ directory is detected', async () => {
  const root = await tempProject();
  try {
    const {report, exitCode} = await validate({root});
    assert.equal(exitCode, 1);
    assert.equal(report.violations.length, 1);
    assert.equal(report.violations[0]?.code, 'MISSING_APP_DIR');
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

void test('strict mode escalates warnings to failures', async () => {
  const root = await tempProject();
  try {
    await mkdir(join(root, 'app', 'routes'), {recursive: true});
    await writeFileEnsureDir(join(root, 'app', 'routes', 'index.ts'), '// not the manifest\n');
    const {report, exitCode} = await validate({root, strict: true});
    assert.ok(report.counts.warnings >= 1 || report.counts.errors >= 1);
    assert.equal(exitCode, 1);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

void test('layout MAY import modules (no violation)', async () => {
  const root = await tempProject();
  try {
    await bootstrapValidProject(root);
    await writeFileEnsureDir(
      join(root, 'app', 'layout', 'components', 'SearchAside.tsx'),
      `import {SearchInput} from '@modules/search/components/SearchInput';
export {};
`,
    );
    const {report, exitCode} = await validate({root});
    const violations = report.violations.filter((v) => v.code === 'REVERSE_IMPORT');
    assert.equal(violations.length, 0, 'layout is allowed to import modules');
    assert.equal(exitCode, 0);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
