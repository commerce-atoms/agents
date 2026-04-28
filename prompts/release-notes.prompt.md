---
name: release-notes
description: Generate release notes from a CHANGELOG entry, commit history, or merged PR list, in the commerce-atoms house style.
trigger_phrases:
  - "Draft release notes for v…"
  - "Update CHANGELOG for the next release"
  - "Generate release notes from these commits"
inputs:
  - name: version
    required: true
    description: Target SemVer (e.g. `0.1.1`).
  - name: changelog_unreleased
    required: false
    description: Existing `[Unreleased]` section content from `CHANGELOG.md`.
  - name: commit_log
    required: false
    description: '`git log v<previous>..HEAD --oneline`.'
  - name: merged_prs
    required: false
    description: '`gh pr list --state merged --base main --search "merged:>=<date>"` output.'
  - name: scope
    required: true
    description: 'agents | shoppy/<package> | starter | store-<name>'
---

# Release notes

Generate consumer-facing release notes for a `commerce-atoms` package or repo. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and goes into the repo's `CHANGELOG.md`.

## Inputs

- `{version}` — SemVer target (e.g. `0.1.1`, `1.0.0`).
- `{changelog_unreleased}` — content of the existing `## [Unreleased]` section, if any.
- `{commit_log}` — commit list since the previous tag.
- `{merged_prs}` — merged PR titles since the previous tag (preferred over commit log when available).
- `{scope}` — repo / package name; affects what counts as user-facing.

## Generation rules

1. **Heading** — `## [{version}] — YYYY-MM-DD` (today's date). Replace the previous `[Unreleased]` heading and re-add a fresh empty `[Unreleased]` above it.

2. **Sub-sections (in order, omit empty ones):**
   - `### Added` — new features, files, primitives, exports.
   - `### Changed` — modifications to existing behaviour or shape.
   - `### Fixed` — bug fixes.
   - `### Removed` — deleted features, files, or exports.
   - `### Deprecated` — features still present but scheduled for removal.
   - `### Security` — security-relevant fixes only.
   - `### Migration notes` — required reader action when consumers upgrade. Include code snippets for renames or signature changes.

3. **Bullet style:**
   - Each bullet is a complete thought. Imperative or past tense; pick one and stay consistent.
   - Wrap file / symbol names in backticks (`` `AGENTS.md` ``, `` `commerce-atoms-agents-sync` ``).
   - Prefix with the surface when scope is broad: `**CLI:** added \`check\` subcommand`.
   - Link to ADRs / PRs only when they materially explain the change.

4. **What to omit:**
   - Internal refactors with no consumer effect (unless they change types or exports).
   - Lockfile bumps.
   - CI / lint config tweaks (those go in the commit, not release notes).
   - Documentation typo fixes.

5. **Doctrine flags to surface explicitly:**
   - Breaking changes → include in `### Changed` with **BREAKING:** prefix and a `### Migration notes` section.
   - For storefront-affecting changes → mention `validate-architecture` impact (new error code, new check) when applicable.
   - For releases of `@commerce-atoms/agents` → if `INDEX.json` changed, list which primitives were added / removed.

## Template

```markdown
## [{version}] — {date}

### Added

- {new_feature_or_export}
- {new_file_or_primitive}

### Changed

- {behaviour_change}
- {signature_change_with_inline_example}

### Fixed

- {bug_fix_with_user_visible_symptom}

### Removed

- {deleted_feature_with_replacement_pointer}

### Migration notes

{required_consumer_action_if_any_with_code_snippet}
```

## Example — `@commerce-atoms/agents@0.1.1`

```markdown
## [0.1.1] — 2026-04-28

### Added

- **3 real prompt templates** in `prompts/`: [`pr-description.prompt.md`](prompts/pr-description.prompt.md), [`release-notes.prompt.md`](prompts/release-notes.prompt.md), [`store-launch-checklist.prompt.md`](prompts/store-launch-checklist.prompt.md). The directory previously promised templates that did not exist.
- **`commerce-atoms-agents check`** subcommand — runs `validate-architecture`, checks pinned `agentsVersion` freshness against npm, and validates `agents.config.json` shape.
- **`QUICKSTART.md`** — concrete walkthrough from `init` to first deploy.
- **`reference/{philosophy,conventions}.md`** registered in [`INDEX.json`](INDEX.json) so the sync system surfaces them.

### Changed

- **Sync CLI** rewrites repo-relative markdown links to absolute GitHub URLs when copying into consumer repos. Synced `AGENTS.md` / `CLAUDE.md` / `copilot-instructions.md` / `.cursor/rules/*.mdc` no longer contain dead links.
- **`AGENTS.md`** restructured as a navigator: §1 now ladders the five primitives (rule / persona / skill / command / prompt) up-front; §3 trimmed to a tight summary that points at canonical sources in `rules/core/`.
- **`CLAUDE.md`** rewritten to add Claude-specific value (slash command resolution, skill invocation pattern, persona-as-system-prompt, behavioural defaults for long-running sessions) instead of mirroring `AGENTS.md`.
- **`copilot-instructions.md`** rewritten to highlight Copilot autocomplete vs. Chat vs. Skills surfaces and the five constraints autocomplete must enforce.
- **All 5 personas** strengthened: each declares `when_to_invoke`, `not_for`, and `companions` frontmatter; bodies gained "what you are NOT" sections; the duplicated `Execution Contract` block was replaced with persona-specific discipline.

### Fixed

- **`CLAUDE.md`** broken `/back-port` link removed.
- **`skills/validate-architecture/SKILL.md`** stale `.mjs` references corrected to `.ts` post-TypeScript migration.
- **`AGENTS.md` §11** stale "until the sync CLI ships" prose updated to reflect that it shipped in `0.1.0`.
- **`.cursor/rules/00-agents-md.mdc`** same stale prose fix.

### Removed

- **`PROMPT_LIBRARY.md`** — defunct stub; its content already lived in `AGENTS.md`. The misleading filename suggested a prompt library where none existed.

### Migration notes

Consumers can upgrade with no code changes:

```bash
npm i -D @commerce-atoms/agents@0.1.1
npx commerce-atoms-agents sync
```

The sync will report all synced files as `written` (link rewriting changed the bytes) on first run, then idempotent thereafter.
```
