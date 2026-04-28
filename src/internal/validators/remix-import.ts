import {readFile} from 'node:fs/promises';
import {relative} from 'node:path';

import {extractImportSpecifiers} from '../parse-imports.js';
import type {Violation} from '../types.js';

const FORBIDDEN_PREFIXES: readonly string[] = ['@remix-run/'];
const FORBIDDEN_EXACT: ReadonlySet<string> = new Set(['react-router-dom']);

export async function checkRemixImports(files: string[], root: string): Promise<Violation[]> {
  const violations: Violation[] = [];

  for (const file of files) {
    const source = await readFile(file, 'utf8').catch(() => null);
    if (source == null) continue;

    const specifiers = extractImportSpecifiers(source);
    for (const spec of specifiers) {
      const isForbiddenPrefix = FORBIDDEN_PREFIXES.some((p) => spec.startsWith(p));
      const isForbiddenExact = FORBIDDEN_EXACT.has(spec);
      if (isForbiddenPrefix || isForbiddenExact) {
        violations.push({
          code: 'REMIX_IMPORT',
          severity: 'error',
          message: `Forbidden import: '${spec}'. This project uses react-router, not Remix or react-router-dom.`,
          file: relative(root, file),
          specifier: spec,
          remedy: 'Translate to the equivalent react-router import.',
        });
      }
    }
  }

  return violations;
}
