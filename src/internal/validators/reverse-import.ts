import {readFile} from 'node:fs/promises';
import {relative} from 'node:path';

import {inferOwner, ownerOfImport} from '../path-to-owner.js';
import {extractImportSpecifiers} from '../parse-imports.js';
import type {OwnerKind, Violation} from '../types.js';

const FORBIDDEN_FROM: ReadonlySet<OwnerKind> = new Set<OwnerKind>([
  'platform',
  'components',
  'hooks',
  'utils',
]);

export async function checkReverseImports(files: string[], root: string): Promise<Violation[]> {
  const violations: Violation[] = [];

  for (const file of files) {
    const owner = inferOwner(file);
    if (owner.kind === 'module') continue;
    if (!FORBIDDEN_FROM.has(owner.kind)) continue;

    const source = await readFile(file, 'utf8').catch(() => null);
    if (source == null) continue;

    const specifiers = extractImportSpecifiers(source);
    for (const spec of specifiers) {
      const target = ownerOfImport(spec, file);
      if (target?.kind === 'module') {
        violations.push({
          code: 'REVERSE_IMPORT',
          severity: 'error',
          message: `${owner.kind}-layer file imports from module '${target.name}'. Shared layers must remain domain-agnostic.`,
          file: relative(root, file),
          specifier: spec,
          remedy: 'Move the imported code into the consuming layer, or pass the dependency in from a route.',
        });
      }
    }
  }

  return violations;
}
