import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';

import {validateSyncCoverage} from './sync-coverage.js';

const __filename = fileURLToPath(import.meta.url);
const packageRoot = resolve(dirname(__filename), '..', '..');

void test('validateSyncCoverage passes for the real agents package', async () => {
  const issues = await validateSyncCoverage(packageRoot);
  assert.deepEqual(issues, [], issues.join('\n'));
});
