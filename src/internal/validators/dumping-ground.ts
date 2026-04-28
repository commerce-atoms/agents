import {join, relative} from 'node:path';

import {pathExists} from '../walk.js';
import type {Violation} from '../types.js';

const FORBIDDEN_DIRS: readonly string[] = ['app/lib', 'app/common', 'app/shared', 'app/ui'];

export async function checkDumpingGroundFolders(root: string): Promise<Violation[]> {
  const violations: Violation[] = [];

  for (const dir of FORBIDDEN_DIRS) {
    const abs = join(root, dir);
    if (await pathExists(abs)) {
      violations.push({
        code: 'DUMPING_GROUND_FOLDER',
        severity: 'error',
        message: `Forbidden folder '${dir}' exists. Use the cross-module reuse ladder instead.`,
        file: relative(root, abs),
        remedy:
          'Move contents into modules, components/, hooks/, utils/, platform/, or extract pure logic to @commerce-atoms/*.',
      });
    }
  }

  return violations;
}
