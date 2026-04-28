import {readFile, readdir, stat} from 'node:fs/promises';
import {join} from 'node:path';

import type {ToolFlags} from '../config.js';

export interface KitSyncSourceSpec {
  from: string;
  to: string;
  sourceFileInRepo: string;
}

interface IndexManifest {
  quickstart?: string;
}

interface IndexEntry {
  id: string;
  path?: string;
  status?: string;
}

interface IndexFile {
  manifest?: IndexManifest;
  rules?: IndexEntry[];
  skills?: IndexEntry[];
  commands?: IndexEntry[];
  prompts?: IndexEntry[];
  personas?: IndexEntry[];
  reference?: IndexEntry[];
}

function kitPosix(...parts: string[]): string {
  return parts.filter(Boolean).join('/').replace(/\\/g, '/');
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function skillTreeSpecs(
  kitSkillDirAbs: string,
  kitRelDir: string,
  destClaude: string | undefined,
  destGithub: string | undefined,
): Promise<KitSyncSourceSpec[]> {
  const specs: KitSyncSourceSpec[] = [];

  async function walk(relInside: string): Promise<void> {
    const absDir = relInside ? join(kitSkillDirAbs, relInside) : kitSkillDirAbs;
    const entries = await readdir(absDir, {withFileTypes: true});
    for (const ent of entries) {
      const rel = relInside ? `${relInside}/${ent.name}` : ent.name;
      if (ent.isDirectory()) {
        await walk(rel);
        continue;
      }
      const from = join(kitSkillDirAbs, rel);
      const sf = `kit/${kitRelDir}/${rel.replace(/\\/g, '/')}`;
      if (destClaude) {
        specs.push({from, to: join(destClaude, rel), sourceFileInRepo: sf});
      }
      if (destGithub) {
        specs.push({from, to: join(destGithub, rel), sourceFileInRepo: sf});
      }
    }
  }

  await walk('');
  return specs;
}

async function walkKitMarkdownTree(
  kitRoot: string,
  kitSubdir: string,
  destClaudeRoot: string | undefined,
  destGithubRoot: string | undefined,
): Promise<KitSyncSourceSpec[]> {
  const specs: KitSyncSourceSpec[] = [];
  const base = join(kitRoot, kitSubdir);

  if (!(await pathExists(base))) return specs;

  async function walk(relInside: string): Promise<void> {
    const absDir = relInside ? join(base, relInside) : base;
    const entries = await readdir(absDir, {withFileTypes: true});
    for (const ent of entries) {
      const rel = relInside ? `${relInside}/${ent.name}` : ent.name;
      const full = join(base, rel);
      if (ent.isDirectory()) {
        await walk(rel);
        continue;
      }
      const lower = ent.name.toLowerCase();
      if (!(lower.endsWith('.md') || lower.endsWith('.mdc'))) continue;
      const kitRel = kitPosix(kitSubdir, rel.replace(/\\/g, '/'));
      const sf = `kit/${kitRel}`;
      if (destClaudeRoot) {
        specs.push({from: full, to: join(destClaudeRoot, rel), sourceFileInRepo: sf});
      }
      if (destGithubRoot) {
        specs.push({from: full, to: join(destGithubRoot, rel), sourceFileInRepo: sf});
      }
    }
  }

  await walk('');
  return specs;
}

async function flatCommands(
  kitRoot: string,
  destClaude: string | undefined,
  destGithub: string | undefined,
): Promise<KitSyncSourceSpec[]> {
  const dir = join(kitRoot, 'commands');
  const specs: KitSyncSourceSpec[] = [];
  if (!(await pathExists(dir))) return specs;

  for (const ent of await readdir(dir, {withFileTypes: true})) {
    if (!ent.isFile() || !ent.name.endsWith('.md') || ent.name === 'README.md') continue;
    const from = join(dir, ent.name);
    const kitRel = kitPosix('commands', ent.name);
    const sf = `kit/${kitRel}`;
    if (destClaude) {
      specs.push({from, to: join(destClaude, ent.name), sourceFileInRepo: sf});
    }
    if (destGithub) {
      specs.push({from, to: join(destGithub, ent.name), sourceFileInRepo: sf});
    }
  }
  return specs;
}

async function flatPrompts(
  kitRoot: string,
  destClaude: string | undefined,
  destGithub: string | undefined,
): Promise<KitSyncSourceSpec[]> {
  const dir = join(kitRoot, 'prompts');
  const specs: KitSyncSourceSpec[] = [];
  if (!(await pathExists(dir))) return specs;

  for (const ent of await readdir(dir, {withFileTypes: true})) {
    if (!ent.isFile() || ent.name === 'README.md') continue;
    if (!ent.name.endsWith('.prompt.md') && !ent.name.endsWith('.md')) continue;
    const from = join(dir, ent.name);
    const kitRel = kitPosix('prompts', ent.name);
    const sf = `kit/${kitRel}`;
    if (destClaude) {
      specs.push({from, to: join(destClaude, ent.name), sourceFileInRepo: sf});
    }
    if (destGithub) {
      specs.push({from, to: join(destGithub, ent.name), sourceFileInRepo: sf});
    }
  }
  return specs;
}

async function singleFileSpec(
  kitRoot: string,
  kitRelFile: string,
  destClaude: string | undefined,
  destGithub: string | undefined,
): Promise<KitSyncSourceSpec[]> {
  const from = join(kitRoot, kitRelFile);
  if (!(await pathExists(from))) return [];
  const sf = `kit/${kitRelFile.replace(/\\/g, '/')}`;
  const specs: KitSyncSourceSpec[] = [];
  const name = kitRelFile.includes('/') ? kitRelFile.split(/[/\\]/).pop()! : kitRelFile;
  if (destClaude) specs.push({from, to: join(destClaude, name), sourceFileInRepo: sf});
  if (destGithub) specs.push({from, to: join(destGithub, name), sourceFileInRepo: sf});
  return specs;
}

function skipIndexEntry(s: IndexEntry): boolean {
  return s.status === 'planned-mvp' || s.status === 'backlog';
}

/**
 * Projects canonical `kit/` content into tool-native directories:
 * - Claude Code: `.claude/commands`, `.claude/skills`, `.claude/prompts`, `.claude/personas`,
 *   `.claude/rules`, `.claude/docs/*` (see Anthropic docs).
 * - GitHub Copilot: `.github/skills/*` plus `.github/commerce-atoms/**` mirror for prompts, personas,
 *   rules, reference, decisions, and root kit docs (see GitHub agent skills docs).
 */
export async function collectFullKitSyncSpecs(params: {
  packageRoot: string;
  outDir: string;
  tools: ToolFlags;
}): Promise<KitSyncSourceSpec[]> {
  const {packageRoot, outDir, tools} = params;
  const kitRoot = join(packageRoot, 'kit');

  const emitClaude = tools.claude === true;
  const emitGithub = tools.copilot === true;
  if (!emitClaude && !emitGithub) return [];

  const claudeBase = join(outDir, '.claude');
  const ghKitBase = join(outDir, '.github', 'commerce-atoms');
  const claudeCommands = emitClaude ? join(claudeBase, 'commands') : undefined;
  const claudeSkills = emitClaude ? join(claudeBase, 'skills') : undefined;
  const claudePrompts = emitClaude ? join(claudeBase, 'prompts') : undefined;
  const claudePersonas = emitClaude ? join(claudeBase, 'personas') : undefined;
  const claudeRules = emitClaude ? join(claudeBase, 'rules', 'commerce-atoms') : undefined;
  const claudeDocs = emitClaude ? join(claudeBase, 'docs') : undefined;

  const ghCommands = emitGithub ? join(ghKitBase, 'commands') : undefined;
  const ghPrompts = emitGithub ? join(ghKitBase, 'prompts') : undefined;
  const ghPersonas = emitGithub ? join(ghKitBase, 'personas') : undefined;
  const ghRules = emitGithub ? join(ghKitBase, 'rules', 'commerce-atoms') : undefined;
  const ghReference = emitGithub ? join(ghKitBase, 'reference') : undefined;
  const ghDecisions = emitGithub ? join(ghKitBase, 'docs', 'decisions') : undefined;
  const ghKitDocsRoot = emitGithub ? ghKitBase : undefined;

  let index: IndexFile;
  try {
    index = JSON.parse(await readFile(join(kitRoot, 'INDEX.json'), 'utf8')) as IndexFile;
  } catch {
    return [];
  }

  const specs: KitSyncSourceSpec[] = [];

  specs.push(...(await flatCommands(kitRoot, claudeCommands, ghCommands)));
  specs.push(...(await flatPrompts(kitRoot, claudePrompts, ghPrompts)));

  for (const s of index.skills ?? []) {
    if (skipIndexEntry(s)) continue;
    const skillDir = join(kitRoot, 'skills', s.id);
    if (!(await pathExists(skillDir))) continue;
    const kitRelDir = kitPosix('skills', s.id);
    specs.push(
      ...(await skillTreeSpecs(
        skillDir,
        kitRelDir,
        claudeSkills ? join(claudeSkills, s.id) : undefined,
        emitGithub ? join(outDir, '.github', 'skills', s.id) : undefined,
      )),
    );
  }

  specs.push(
    ...(await walkKitMarkdownTree(
      kitRoot,
      'personas',
      claudePersonas,
      emitGithub ? join(ghKitBase, 'personas') : undefined,
    )),
  );

  specs.push(
    ...(await walkKitMarkdownTree(kitRoot, 'rules', claudeRules, ghRules)),
  );

  const claudeRef = claudeDocs ? join(claudeDocs, 'reference') : undefined;
  const ghRef = ghReference;
  specs.push(...(await walkKitMarkdownTree(kitRoot, 'reference', claudeRef, ghRef)));

  const claudeDec = claudeDocs ? join(claudeDocs, 'decisions') : undefined;
  specs.push(
    ...(await walkKitMarkdownTree(kitRoot, 'docs/decisions', claudeDec, ghDecisions)),
  );

  const quickstartName = index.manifest?.quickstart ?? 'QUICKSTART.md';
  specs.push(
    ...(await singleFileSpec(kitRoot, quickstartName, claudeDocs, ghKitDocsRoot)),
  );
  specs.push(...(await singleFileSpec(kitRoot, 'RUN_PROTOCOL.md', claudeDocs, ghKitDocsRoot)));

  const indexFrom = join(kitRoot, 'INDEX.json');
  if (await pathExists(indexFrom)) {
    const sf = 'kit/INDEX.json';
    if (claudeDocs) {
      specs.push({from: indexFrom, to: join(claudeDocs, 'INDEX.json'), sourceFileInRepo: sf});
    }
    if (ghKitDocsRoot) {
      specs.push({from: indexFrom, to: join(ghKitDocsRoot, 'INDEX.json'), sourceFileInRepo: sf});
    }
  }

  return specs;
}
