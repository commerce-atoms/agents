import {readFile, readdir, stat} from 'node:fs/promises';
import {join, resolve} from 'node:path';

import {defaults} from '../config.js';
import {collectFullKitSyncSpecs} from './full-kit-sync.js';

interface IndexEntry {
  id: string;
  path?: string;
  status?: string;
  generates?: string[];
}

interface IndexManifest {
  agentsMd?: string;
  claudeOverlay?: string;
  copilotOverlay?: string;
  cursorOverlayDir?: string;
  quickstart?: string;
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

function posix(p: string): string {
  return p.replace(/\\/g, '/');
}

function skipBacklog(entry: IndexEntry): boolean {
  return entry.status === 'planned-mvp' || entry.status === 'backlog';
}

async function statExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensures `sync` reads every INDEX-listed artefact, every Cursor overlay under `kit/`,
 * and that kit files under commands/prompts/personas/skills/rules/reference match INDEX
 * (no orphans). Also checks `rules[].generates` paths exist and are read by sync.
 */
export async function validateSyncCoverage(packageRoot: string): Promise<string[]> {
  const issues: string[] = [];
  const kitRoot = resolve(packageRoot, 'kit');
  const indexPath = join(kitRoot, 'INDEX.json');
  if (!(await statExists(indexPath))) {
    return [`sync-coverage: missing ${indexPath}`];
  }

  const index = JSON.parse(await readFile(indexPath, 'utf8')) as IndexFile;

  const tools = {...defaults().tools, cursor: true, copilot: true, claude: true, codex: true};
  const dummyOut = join(packageRoot, '.sync-coverage-out');
  const fullKitSpecs = await collectFullKitSyncSpecs({packageRoot, outDir: dummyOut, tools});

  const syncFrom = new Set<string>();
  for (const s of fullKitSpecs) {
    syncFrom.add(resolve(s.from));
  }

  const man = index.manifest ?? {};
  const manifestAgents = man.agentsMd ?? 'AGENTS.md';
  const manifestClaude = man.claudeOverlay ?? 'CLAUDE.md';
  const manifestCopilot = man.copilotOverlay ?? 'copilot-instructions.md';
  const cursorRel = man.cursorOverlayDir ?? '.cursor/rules';

  for (const rel of [manifestAgents, manifestClaude, manifestCopilot]) {
    syncFrom.add(resolve(kitRoot, rel));
  }

  const cursorAbs = resolve(kitRoot, cursorRel);
  if (await statExists(cursorAbs)) {
    for (const ent of await readdir(cursorAbs, {withFileTypes: true})) {
      if (ent.isFile() && ent.name.endsWith('.mdc')) {
        syncFrom.add(resolve(cursorAbs, ent.name));
      }
    }
  } else {
    issues.push(`sync-coverage: manifest cursorOverlayDir missing on disk -> ${cursorRel}`);
  }

  const mustCover = (label: string, kitRelative: string | undefined) => {
    if (!kitRelative) return;
    const abs = resolve(kitRoot, kitRelative);
    if (!syncFrom.has(abs)) {
      issues.push(`sync-coverage: ${label} not emitted by full-kit sync (claude+copilot on) -> ${kitRelative}`);
    }
  };

  mustCover('manifest.agentsMd', manifestAgents);
  mustCover('manifest.claudeOverlay', manifestClaude);
  mustCover('manifest.copilotOverlay', manifestCopilot);

  const quickstartName = man.quickstart ?? 'QUICKSTART.md';
  mustCover('manifest.quickstart', quickstartName);
  mustCover('RUN_PROTOCOL.md', 'RUN_PROTOCOL.md');
  mustCover('INDEX.json', 'INDEX.json');

  for (const r of index.rules ?? []) {
    mustCover(`rules[${r.id}]`, r.path);
    for (const g of r.generates ?? []) {
      const gNorm = g.replace(/^\//, '');
      const abs = resolve(kitRoot, gNorm);
      if (!(await statExists(abs))) {
        issues.push(`sync-coverage: rules[${r.id}] generates missing file -> ${gNorm}`);
        continue;
      }
      if (!syncFrom.has(abs)) {
        issues.push(`sync-coverage: rules[${r.id}] generates path not read by sync -> ${gNorm}`);
      }
    }
  }

  for (const s of index.skills ?? []) {
    if (skipBacklog(s)) continue;
    mustCover(`skills[${s.id}]`, s.path);
  }

  for (const c of index.commands ?? []) {
    if (skipBacklog(c)) continue;
    mustCover(`commands[${c.id}]`, c.path);
  }

  for (const p of index.prompts ?? []) {
    mustCover(`prompts[${p.id}]`, p.path);
  }

  for (const p of index.personas ?? []) {
    mustCover(`personas[${p.id}]`, p.path);
  }

  for (const r of index.reference ?? []) {
    mustCover(`reference[${r.id}]`, r.path);
  }

  const indexCommandPaths = new Set(
    (index.commands ?? []).filter((c) => !skipBacklog(c)).map((c) => posix(c.path ?? '')),
  );
  const cmdDir = join(kitRoot, 'commands');
  if (await statExists(cmdDir)) {
    for (const ent of await readdir(cmdDir, {withFileTypes: true})) {
      if (!ent.isFile() || ent.name === 'README.md' || !ent.name.endsWith('.md')) continue;
      const rel = posix(`commands/${ent.name}`);
      if (!indexCommandPaths.has(rel)) {
        issues.push(`sync-coverage: orphan kit file (add to INDEX commands[]) -> ${rel}`);
      }
    }
  }

  const indexPromptPaths = new Set((index.prompts ?? []).map((p) => posix(p.path ?? '')));
  const promptDir = join(kitRoot, 'prompts');
  if (await statExists(promptDir)) {
    for (const ent of await readdir(promptDir, {withFileTypes: true})) {
      if (!ent.isFile() || ent.name === 'README.md') continue;
      if (!ent.name.endsWith('.prompt.md') && !ent.name.endsWith('.md')) continue;
      const rel = posix(`prompts/${ent.name}`);
      if (!indexPromptPaths.has(rel)) {
        issues.push(`sync-coverage: orphan kit file (add to INDEX prompts[]) -> ${rel}`);
      }
    }
  }

  const indexPersonaPaths = new Set((index.personas ?? []).map((p) => posix(p.path ?? '')));
  async function walkPersonas(sub: string): Promise<void> {
    const abs = sub ? join(kitRoot, 'personas', sub) : join(kitRoot, 'personas');
    for (const ent of await readdir(abs, {withFileTypes: true})) {
      const rel = sub ? `${sub}/${ent.name}` : ent.name;
      if (ent.isDirectory()) {
        await walkPersonas(rel);
        continue;
      }
      if (!ent.name.endsWith('.md')) continue;
      const kitRel = posix(`personas/${rel}`);
      if (!indexPersonaPaths.has(kitRel)) {
        issues.push(`sync-coverage: orphan kit file (add to INDEX personas[]) -> ${kitRel}`);
      }
    }
  }
  if (await statExists(join(kitRoot, 'personas'))) {
    await walkPersonas('');
  }

  const indexSkillIds = new Set(
    (index.skills ?? []).filter((s) => !skipBacklog(s)).map((s) => s.id),
  );
  const skillsRoot = join(kitRoot, 'skills');
  if (await statExists(skillsRoot)) {
    for (const ent of await readdir(skillsRoot, {withFileTypes: true})) {
      if (!ent.isDirectory()) {
        if (ent.isFile() && ent.name !== 'README.md' && ent.name.endsWith('.md')) {
          issues.push(
            `sync-coverage: unexpected markdown at kit/skills root (use skill subfolder) -> skills/${ent.name}`,
          );
        }
        continue;
      }
      if (!indexSkillIds.has(ent.name)) {
        issues.push(
          `sync-coverage: orphan skill directory (add to INDEX skills[]) -> skills/${ent.name}/`,
        );
      }
    }
  }

  const indexRulePaths = new Set((index.rules ?? []).map((r) => posix(r.path ?? '')));
  async function walkRules(sub: string): Promise<void> {
    const abs = sub ? join(kitRoot, 'rules', sub) : join(kitRoot, 'rules');
    for (const ent of await readdir(abs, {withFileTypes: true})) {
      const rel = sub ? `${sub}/${ent.name}` : ent.name;
      if (ent.isDirectory()) {
        await walkRules(rel);
        continue;
      }
      if (!ent.name.endsWith('.md')) continue;
      const kitRel = posix(`rules/${rel}`);
      if (!indexRulePaths.has(kitRel)) {
        issues.push(`sync-coverage: orphan kit file (add to INDEX rules[]) -> ${kitRel}`);
      }
    }
  }
  if (await statExists(join(kitRoot, 'rules'))) {
    await walkRules('');
  }

  const indexRefPaths = new Set((index.reference ?? []).map((r) => posix(r.path ?? '')));
  const refDir = join(kitRoot, 'reference');
  if (await statExists(refDir)) {
    for (const ent of await readdir(refDir, {withFileTypes: true})) {
      if (!ent.isFile() || !ent.name.endsWith('.md')) continue;
      const rel = posix(`reference/${ent.name}`);
      if (!indexRefPaths.has(rel)) {
        issues.push(`sync-coverage: orphan kit file (add to INDEX reference[]) -> ${rel}`);
      }
    }
  }

  async function walkDecisions(sub: string): Promise<void> {
    const abs = sub ? join(kitRoot, 'docs', 'decisions', sub) : join(kitRoot, 'docs', 'decisions');
    for (const ent of await readdir(abs, {withFileTypes: true})) {
      const rel = sub ? `${sub}/${ent.name}` : ent.name;
      if (ent.isDirectory()) {
        await walkDecisions(rel);
        continue;
      }
      if (!ent.name.endsWith('.md')) continue;
      const kitRel = posix(`docs/decisions/${rel}`);
      const fileAbs = resolve(kitRoot, kitRel);
      if (!syncFrom.has(fileAbs)) {
        issues.push(`sync-coverage: decisions file not in sync sources -> ${kitRel}`);
      }
    }
  }
  const decDir = join(kitRoot, 'docs', 'decisions');
  if (await statExists(decDir)) {
    await walkDecisions('');
  }

  return issues;
}
