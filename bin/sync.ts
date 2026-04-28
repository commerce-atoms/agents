#!/usr/bin/env node
import {parseArgs} from 'node:util';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';
import {readFile, stat} from 'node:fs/promises';

import {sync} from '../src/sync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = await resolvePackageRoot(__dirname);

interface PackageJson {
  version: string;
}

async function resolvePackageRoot(start: string): Promise<string> {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    try {
      const pkgPath = resolve(dir, 'package.json');
      await stat(pkgPath);
      const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as {name?: string};
      if (pkg.name === '@commerce-atoms/agents') return dir;
    } catch {
      // keep walking
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`Could not locate @commerce-atoms/agents package root from ${start}`);
}

async function readPackageVersion(): Promise<string> {
  const raw = await readFile(resolve(packageRoot, 'package.json'), 'utf8');
  const pkg = JSON.parse(raw) as PackageJson;
  return pkg.version;
}

function help(): string {
  return `commerce-atoms-agents — sync canonical AI manifest into a consumer repo

USAGE
  commerce-atoms-agents <command> [options]

COMMANDS
  sync       Copy canonical content from this package into the consumer repo.
  version    Print the package version.
  help       Show this help.

OPTIONS (sync)
  --config <path>   Consumer config file (default: agents.config.json in cwd).
  --out <dir>       Output directory (default: cwd).
  --dry-run         Show what would be written, but do not write.
  --force           Overwrite files that differ from canonical.

DEFAULTS (when agents.config.json is absent)
  Audience:           store-fork
  Tools enabled:      cursor, copilot, claude, codex
  Output paths:
    AGENTS.md                       -> ./AGENTS.md
    CLAUDE.md                       -> ./CLAUDE.md
    copilot-instructions.md         -> ./.github/copilot-instructions.md
    .cursor/rules/*.mdc             -> ./.cursor/rules/

DOCS
  https://github.com/commerce-atoms/agents
`;
}

async function main(argv: string[]): Promise<number> {
  const command = argv[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    process.stdout.write(help());
    return 0;
  }

  if (command === 'version' || command === '--version' || command === '-v') {
    process.stdout.write(`${await readPackageVersion()}\n`);
    return 0;
  }

  if (command === 'sync') {
    const {values} = parseArgs({
      args: argv.slice(1),
      options: {
        config: {type: 'string'},
        out: {type: 'string'},
        'dry-run': {type: 'boolean', default: false},
        force: {type: 'boolean', default: false},
      },
      strict: true,
      allowPositionals: false,
    });

    const result = await sync({
      packageRoot,
      configPath: values.config,
      outDir: values.out,
      dryRun: values['dry-run'],
      force: values.force,
      version: await readPackageVersion(),
    });

    process.stdout.write(`${result.summary}\n`);
    return result.exitCode;
  }

  process.stderr.write(`Unknown command: ${command}\n\n${help()}`);
  return 2;
}

const exitCode = await main(process.argv.slice(2)).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Error: ${message}\n`);
  if (process.env['DEBUG'] && err instanceof Error && err.stack) {
    process.stderr.write(`${err.stack}\n`);
  }
  return 1;
});

process.exit(exitCode);
