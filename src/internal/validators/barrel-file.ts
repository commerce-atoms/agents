import {relative} from 'node:path';

import type {Violation} from '../types.js';

const BARREL_PATTERN = /\/index\.(ts|tsx|js|mjs)$/;

export function checkBarrelFiles(files: string[], root: string): Violation[] {
  const violations: Violation[] = [];
  for (const file of files) {
    if (BARREL_PATTERN.test(file)) {
      violations.push({
        code: 'BARREL_FILE',
        severity: 'error',
        message: 'Barrel files are forbidden — use explicit imports.',
        file: relative(root, file),
        remedy:
          "Replace barrel re-exports with direct imports of the underlying file: import {Foo} from '@components/Foo' instead of '@components'.",
      });
    }
  }
  return violations;
}
