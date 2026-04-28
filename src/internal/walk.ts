import {readdir, stat} from 'node:fs/promises';
import {join} from 'node:path';

const DEFAULT_IGNORE: ReadonlySet<string> = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.cache',
  '.turbo',
  '.vite',
  'coverage',
]);

export interface WalkOptions {
  shouldSkip?: (name: string) => boolean;
}

export async function* walkFiles(root: string, options: WalkOptions = {}): AsyncGenerator<string> {
  const shouldSkip = options.shouldSkip ?? ((name: string) => DEFAULT_IGNORE.has(name));

  let entries;
  try {
    entries = await readdir(root, {withFileTypes: true});
  } catch {
    return;
  }

  for (const entry of entries) {
    const full = join(root, entry.name);
    if (entry.isDirectory()) {
      if (shouldSkip(entry.name)) continue;
      yield* walkFiles(full, options);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

export async function* withExtensions(
  stream: AsyncIterable<string>,
  extensions: readonly string[],
): AsyncGenerator<string> {
  for await (const path of stream) {
    if (extensions.some((ext) => path.endsWith(ext))) yield path;
  }
}

export async function collect<T>(stream: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const item of stream) out.push(item);
  return out;
}

export async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}
