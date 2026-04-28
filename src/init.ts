import {spawn} from 'node:child_process';
import {readFile, writeFile, mkdir, rm, stat} from 'node:fs/promises';
import {join, resolve, basename} from 'node:path';

import {sync} from './sync.js';

const VALID_NAME = /^[a-z][a-z0-9-]{1,49}$/;

const DEFAULT_STARTER_REPO = 'https://github.com/commerce-atoms/hydrogen-storefront-starter.git';
const DEFAULT_STARTER_REF = 'main';

export interface CloneStarterParams {
  repo: string;
  ref: string;
  dest: string;
}

export type CloneStarter = (params: CloneStarterParams) => Promise<void>;

export interface InitParams {
  name: string;
  outDir?: string | undefined;
  starterRepo?: string | undefined;
  starterRef?: string | undefined;
  packageRoot: string;
  packageVersion: string;
  dryRun?: boolean | undefined;
  skipGitInit?: boolean | undefined;
  cloneStarter?: CloneStarter | undefined;
}

export interface InitResult {
  exitCode: number;
  summary: string;
  dir: string;
}

export async function init(params: InitParams): Promise<InitResult> {
  const {
    name,
    outDir = process.cwd(),
    starterRepo = DEFAULT_STARTER_REPO,
    starterRef = DEFAULT_STARTER_REF,
    packageRoot,
    packageVersion,
    dryRun = false,
    skipGitInit = false,
    cloneStarter = gitCloneStarter,
  } = params;

  if (!name) {
    throw new Error('Store name is required. Usage: commerce-atoms-agents init <store-name>');
  }
  if (!VALID_NAME.test(name)) {
    throw new Error(
      `Invalid store name '${name}'. Must be lowercase letters, digits, or hyphens; start with a letter; 2–50 chars.`,
    );
  }

  const dir = resolve(outDir, name);
  if (await pathExists(dir)) {
    throw new Error(`Refusing to overwrite existing directory: ${dir}`);
  }

  if (dryRun) {
    return {
      exitCode: 0,
      dir,
      summary: dryRunSummary({name, dir, starterRepo, starterRef, packageVersion}),
    };
  }

  await cloneStarter({repo: starterRepo, ref: starterRef, dest: dir});

  await rm(join(dir, '.git'), {recursive: true, force: true});

  await renamePackage({dir, storeName: name});
  await writeStoreReadme({dir, storeName: name, packageVersion});
  await ensureBrandPlaceholders({dir, storeName: name});

  await sync({
    packageRoot,
    outDir: dir,
    version: packageVersion,
  });

  if (!skipGitInit) {
    await gitInit({dir, storeName: name});
  }

  return {
    exitCode: 0,
    dir,
    summary: doneSummary({name, dir, packageVersion}),
  };
}

interface DryRunSummaryParams {
  name: string;
  dir: string;
  starterRepo: string;
  starterRef: string;
  packageVersion: string;
}

function dryRunSummary({name, dir, starterRepo, starterRef, packageVersion}: DryRunSummaryParams): string {
  return [
    `commerce-atoms-agents init ${name} (dry-run)`,
    `  would clone:        ${starterRepo} @ ${starterRef}`,
    `  would write to:     ${dir}`,
    `  would pin agents:   ${packageVersion}`,
    `  would seed brand:   app/config/brand.ts + app/assets/brand/`,
    `  would git init:     yes`,
  ].join('\n');
}

interface DoneSummaryParams {
  name: string;
  dir: string;
  packageVersion: string;
}

function doneSummary({name, dir, packageVersion}: DoneSummaryParams): string {
  return [
    `commerce-atoms-agents init ${name} — done`,
    `  ${dir}`,
    '',
    'Next steps:',
    '  1. cd ' + basename(dir),
    '  2. Edit app/config/brand.ts (name, locales, colours, fonts).',
    '  3. Replace app/assets/brand/* with your real assets.',
    '  4. Set up Shopify Admin (storefront token, products, theme).',
    '  5. Wire CI: npx @commerce-atoms/agents -- /deploy-setup',
    '  6. First deploy: git push origin main',
    '',
    `(@commerce-atoms/agents@${packageVersion} pinned in agents.config.json)`,
  ].join('\n');
}

async function gitCloneStarter({repo, ref, dest}: CloneStarterParams): Promise<void> {
  await runCommand('git', ['clone', '--depth=1', '--branch', ref, repo, dest]);
}

interface GitInitParams {
  dir: string;
  storeName: string;
}

async function gitInit({dir, storeName}: GitInitParams): Promise<void> {
  await runCommand('git', ['init', '--initial-branch=main'], {cwd: dir});
  await runCommand('git', ['add', '.'], {cwd: dir});
  await runCommand(
    'git',
    [
      'commit',
      '-m',
      `chore: init ${storeName} from @commerce-atoms/hydrogen-storefront-starter`,
    ],
    {cwd: dir, allowFailure: true},
  );
}

interface RenamePackageParams {
  dir: string;
  storeName: string;
}

async function renamePackage({dir, storeName}: RenamePackageParams): Promise<void> {
  const pkgPath = join(dir, 'package.json');
  if (!(await pathExists(pkgPath))) return;
  const raw = await readFile(pkgPath, 'utf8');
  const pkg = JSON.parse(raw) as Record<string, unknown>;
  pkg['name'] = storeName;
  pkg['version'] = '0.1.0';
  pkg['private'] = true;
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
}

interface WriteStoreReadmeParams {
  dir: string;
  storeName: string;
  packageVersion: string;
}

async function writeStoreReadme({dir, storeName, packageVersion}: WriteStoreReadmeParams): Promise<void> {
  const readme = [
    `# ${storeName}`,
    '',
    '> Shopify Hydrogen storefront initialised from `@commerce-atoms/hydrogen-storefront-starter`.',
    '',
    '## Layout',
    '',
    'Architecture rules and AI manifest live in `AGENTS.md` (synced from `@commerce-atoms/agents`).',
    'Brand-specific config lives in `app/config/brand.ts` and `app/assets/brand/`.',
    '',
    '## Pinned versions',
    '',
    `- \`@commerce-atoms/agents@${packageVersion}\` — see \`agents.config.json\`.`,
    '',
    '## Common workflows',
    '',
    '```bash',
    'npm install',
    'npm run dev',
    'npm run codegen',
    'npm test',
    '',
    '# Re-sync agent rules after upgrading @commerce-atoms/agents',
    'npx @commerce-atoms/agents sync',
    '',
    '# Validate architecture before pushing',
    'npx @commerce-atoms/agents validate-architecture',
    '```',
    '',
    '## Deploy',
    '',
    'Per the `commerce-atoms` deploy doctrine, GitHub Actions deploys on `push to main`.',
    'See `.github/workflows/deploy.yml` and `docs/deploy.md`.',
    '',
  ].join('\n');
  await writeFile(join(dir, 'README.md'), readme, 'utf8');
}

interface EnsureBrandParams {
  dir: string;
  storeName: string;
}

async function ensureBrandPlaceholders({dir, storeName}: EnsureBrandParams): Promise<void> {
  const brandTsPath = join(dir, 'app', 'config', 'brand.ts');
  if (!(await pathExists(brandTsPath))) {
    const content = brandPlaceholder(storeName);
    await mkdir(join(dir, 'app', 'config'), {recursive: true});
    await writeFile(brandTsPath, content, 'utf8');
  }
  const brandAssets = join(dir, 'app', 'assets', 'brand');
  if (!(await pathExists(brandAssets))) {
    await mkdir(brandAssets, {recursive: true});
    await writeFile(
      join(brandAssets, 'README.md'),
      [
        '# Brand assets',
        '',
        'Replace these placeholders with the real assets for your store:',
        '',
        '- `logo.svg` — primary logo.',
        '- `favicon.svg` — browser favicon.',
        '- `og-default.png` — default OpenGraph image (1200×630).',
        '- `tokens.css` — colour / spacing CSS variables consumed by `app/styles/`.',
        '',
      ].join('\n'),
      'utf8',
    );
  }
}

function brandPlaceholder(storeName: string): string {
  return `// Per-store brand config. Edit this file to rebrand the storefront.
// All scattered brand strings should read from here.

export interface BrandConfig {
  name: string;
  slogan: string;
  contactEmail: string;
  defaultLocale: string;
  supportedLocales: string[];
  colours: {primary: string; accent: string; background: string; foreground: string};
  fonts: {heading: string; body: string};
  social: {twitter?: string; instagram?: string; tiktok?: string};
}

export const brand: BrandConfig = {
  name: '${humanise(storeName)}',
  slogan: 'TODO: write a slogan',
  contactEmail: 'hello@example.com',
  defaultLocale: 'en-US',
  supportedLocales: ['en-US'],
  colours: {
    primary: '#000000',
    accent: '#ff3366',
    background: '#ffffff',
    foreground: '#0a0a0a',
  },
  fonts: {
    heading: 'system-ui, -apple-system, sans-serif',
    body: 'system-ui, -apple-system, sans-serif',
  },
  social: {},
};
`;
}

function humanise(slug: string): string {
  return slug
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

interface RunCommandOptions {
  cwd?: string | undefined;
  allowFailure?: boolean | undefined;
}

function runCommand(cmd: string, args: string[], options: RunCommandOptions = {}): Promise<void> {
  const {cwd, allowFailure = false} = options;
  return new Promise<void>((resolveP, rejectP) => {
    const child = spawn(cmd, args, {cwd, stdio: 'pipe'});
    let stderr = '';
    child.stderr?.on('data', (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });
    child.on('close', (code) => {
      if (code !== 0 && !allowFailure) {
        rejectP(new Error(`${cmd} ${args.join(' ')} exited ${code}: ${stderr.trim()}`));
        return;
      }
      resolveP();
    });
    child.on('error', rejectP);
  });
}
