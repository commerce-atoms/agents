import {readFile} from 'node:fs/promises';

const IMPORT_PATTERNS: readonly RegExp[] = [
  /import\s+(?:[^'"\n]*?\s+from\s+)?['"]([^'"]+)['"]/g,
  /export\s+(?:[^'"\n]*?\s+from\s+)?['"]([^'"]+)['"]/g,
  /(?:require|import)\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
];

const COMMENT_LINE = /\/\/.*$/gm;
const COMMENT_BLOCK = /\/\*[\s\S]*?\*\//g;

export function extractImportSpecifiers(source: string): string[] {
  const stripped = source.replace(COMMENT_BLOCK, '').replace(COMMENT_LINE, '');
  const found = new Set<string>();
  for (const pattern of IMPORT_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(stripped)) !== null) {
      const specifier = match[1];
      if (specifier) found.add(specifier);
    }
  }
  return [...found];
}

export async function importsOf(path: string): Promise<string[]> {
  const source = await readFile(path, 'utf8');
  return extractImportSpecifiers(source);
}
