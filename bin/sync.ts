#!/usr/bin/env node
import {parseArgs} from 'node:util';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';
import {readFile, stat} from 'node:fs/promises';

import {sync} from '../src/sync.js';
import {validate, formatReport, formatReportJson} from '../src/validate.js';
import {init} from '../src/init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = await resolvePackageRoot(__dirname);

interface PackageJson {
  version: string;
  repository?: {url?: string} | string;
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

async function readPackageJson(): Promise<PackageJson> {
  const raw = await readFile(resolve(packageRoot, 'package.json'), 'utf8');
  return JSON.parse(raw) as PackageJson;
}

async function readPackageVersion(): Promise<string> {
  return (await readPackageJson()).version;
}

async function resolveRepoUrlBase(): Promise<string | undefined> {
  const pkg = await readPackageJson();
  const raw =
    typeof pkg.repository === 'string'
      ? pkg.repository
      : pkg.repository?.url;
  if (!raw) return undefined;
  // Normalise `git+https://github.com/owner/repo.git` -> `https://github.com/owner/repo`
  const cleaned = raw.replace(/^git\+/, '').replace(/\.git$/, '');
  if (!/^https?:\/\/github\.com\//.test(cleaned)) return undefined;
  return `${cleaned.replace(/\/+$/, '')}/blob/main`;
}

function help(): string {
  return `commerce-atoms-agents — AI manifest sync + architecture validation + storefront init

USAGE
  commerce-atoms-agents <command> [options]

COMMANDS
  init <name>              Clone the starter, brand it, pin agents, first commit.
  sync                     Copy canonical content from this package into the consumer repo.
  validate-architecture    Run architecture boundary validators against a project.
  version                  Print the package version.
  help                     Show this help.

OPTIONS (init)
  --out <dir>            Parent directory (default: cwd).
  --starter-repo <url>   Override the starter repo.
  --starter-ref <ref>    Override the starter branch / tag.
  --dry-run              Print plan but do not write.

OPTIONS (sync)
  --config <path>   Consumer config file (default: agents.config.json in cwd).
  --out <dir>       Output directory (default: cwd).
  --dry-run         Show what would be written, but do not write.
  --force           Overwrite files that differ from canonical.

OPTIONS (validate-architecture)
  --out <dir>       Project root to validate (default: cwd).
  --strict          Treat warnings as exit-failing.
  --json            Emit JSON report instead of human-readable.

DEFAULTS (sync, when agents.config.json is absent)
  Audience:           store-fork
  Tools enabled:      cursor, copilot, claude, codex
  Output paths:
    AGENTS.md                       -> ./AGENTS.md
    CLAUDE.md                       -> ./CLAUDE.md
    copilot-instructions.md         -> ./.github/copilot-instructions.md
    .cursor/rules/*.mdc             -> ./.cursor/rules/

DOCS
  https://github.com/commerce-atoms/agents
  See QUICKSTART.md for a guided walkthrough from install to first deploy.
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
      repoUrlBase: await resolveRepoUrlBase(),
    });

    process.stdout.write(`${result.summary}\n`);
    return result.exitCode;
  }

  if (command === 'init') {
    const {values, positionals} = parseArgs({
      args: argv.slice(1),
      options: {
        out: {type: 'string'},
        'starter-repo': {type: 'string'},
        'starter-ref': {type: 'string'},
        'dry-run': {type: 'boolean', default: false},
      },
      strict: true,
      allowPositionals: true,
    });

    const name = positionals[0];
    if (!name) {
      process.stderr.write('Error: store name is required.\n\nUsage: commerce-atoms-agents init <store-name>\n');
      return 2;
    }

    const result = await init({
      name,
      outDir: values.out,
      starterRepo: values['starter-repo'],
      starterRef: values['starter-ref'],
      packageRoot,
      packageVersion: await readPackageVersion(),
      dryRun: values['dry-run'],
    });

    process.stdout.write(`${result.summary}\n`);
    return result.exitCode;
  }

  if (command === 'validate-architecture') {
    const {values} = parseArgs({
      args: argv.slice(1),
      options: {
        out: {type: 'string'},
        strict: {type: 'boolean', default: false},
        json: {type: 'boolean', default: false},
      },
      strict: true,
      allowPositionals: false,
    });

    const root = resolve(values.out ?? process.cwd());
    const {report, exitCode} = await validate({root, strict: values.strict});
    process.stdout.write(`${values.json ? formatReportJson(report) : formatReport(report)}\n`);
    return exitCode;
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
