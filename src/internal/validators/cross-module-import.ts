import {readFile} from 'node:fs/promises';
import {relative} from 'node:path';

import {inferOwner, ownerOfImport} from '../path-to-owner.js';
import {extractImportSpecifiers} from '../parse-imports.js';
import type {Violation} from '../types.js';

export async function checkCrossModuleImports(files: string[], root: string): Promise<Violation[]> {
  const violations: Violation[] = [];

  for (const file of files) {
    const owner = inferOwner(file);
    if (owner.kind !== 'module') continue;

    const source = await readFile(file, 'utf8').catch(() => null);
    if (source == null) continue;

    const specifiers = extractImportSpecifiers(source);
    for (const spec of specifiers) {
      const target = ownerOfImport(spec, file);
      if (target?.kind === 'module' && target.name !== owner.name) {
        violations.push({
          code: 'CROSS_MODULE_IMPORT',
          severity: 'error',
          message: `Module '${owner.name}' imports from module '${target.name}'. Modules must not import from other modules.`,
          file: relative(root, file),
          specifier: spec,
          remedy: 'Promote the shared logic per the cross-module reuse ladder (AGENTS.md §4) or duplicate intentionally.',
        });
      }
    }
  }

  return violations;
}
