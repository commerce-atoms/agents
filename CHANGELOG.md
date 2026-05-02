# Changelog

All notable changes to `@commerce-atoms/agents` are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). Versioning follows [SemVer](https://semver.org/) — once consumers pin a version, breaking changes require a major bump.

---

## [Unreleased]

## [0.3.0] — 2026-05-02

### Changed

- Sync no longer bails on consumer-edited files. Divergent files are reported as `divergent`; canonical content lands in a `<file>.kit-incoming.<ext>` sidecar next to the consumer file. All unrelated files still sync. Sidecars auto-clean once the consumer file converges with canonical.
- Default exit code is `0`; pass `--strict` to fail on any divergent file (used by the starter's drift CI).
- `WriteStatus`: `skipped-conflict` removed; `divergent` and `sidecar-cleaned` added.

### Removed

- Dead `tools.codex` flag and unused `'starter'` audience. Codex auto-reads `AGENTS.md` (always synced); no per-tool projection was ever needed.

## [0.2.0] — 2026-04-28

### Added

- **Full kit projection** — `sync` materialises INDEX-backed content into tool-native paths when `claude` / `copilot` are enabled: `.claude/{commands,skills,prompts,personas,rules,docs}` and `.github/skills/*` plus `.github/commerce-atoms/**` mirror. Non-markdown skill assets copy byte-for-byte; markdown still gets repo link rewrite.
- **`validateSyncCoverage`** — `npm run lint:json` (`bin/validate-index.ts`) now asserts INDEX ↔ disk ↔ sync alignment, including `rules[].generates` overlays and no orphan kit files under commands, prompts, personas, skills, rules, reference.

### Migration

After upgrading, run sync once (new paths may conflict with local edits — use `--force` only if you intend to replace):

```bash
npm i -D @commerce-atoms/agents@0.2.0
npx commerce-atoms-agents sync
```

## [0.1.2] — 2026-04-28

### Fixed

- **Kit docs honesty pass** — removed stale references to `commerce-atoms-agents check`, local `PLAN.md` / “PR S2” placeholders, and `/back-port` as operational. [`kit/rules/stores.md`](kit/rules/stores.md) no longer claims enforced core-file markers or hash smoke tests (manual upstream discipline until tooling exists). Canonical [`kit/rules/core/*.md`](kit/rules/core/) blockquotes now describe **hand-maintained** Cursor overlays, not generated ones. [`kit/skills/validate-architecture/SKILL.md`](kit/skills/validate-architecture/SKILL.md) and [`kit/commands/validate-architecture.md`](kit/commands/validate-architecture.md) drop the fictional multi-skill PR workflow. [`kit/rules/packages.md`](kit/rules/packages.md) drops a brittle per-package version snapshot. Misc: [`kit/reference/philosophy.md`](kit/reference/philosophy.md) prompt filename fix; [`kit/CLAUDE.md`](kit/CLAUDE.md) aligned with the skill edit.

### Migration notes

Consumers upgrade the same way as prior patches:

```bash
npm i -D @commerce-atoms/agents@0.1.2
npx commerce-atoms-agents sync
```

---

## [0.1.1] — 2026-04-28

### Added

- **`kit/` subdirectory** — every artefact that ships to consumers (manifests, rules, skills, commands, prompts, personas, ADRs, INDEX.json, QUICKSTART.md, RUN_PROTOCOL.md) now lives under [`kit/`](kit/). The repo root is reserved for npm package metadata, source, CI, and kit-authoring docs. The split clarifies that the root governs *this package* while `kit/` governs *consumer storefronts*. See [`CONTRIBUTING.md`](CONTRIBUTING.md).
- **[`CONTRIBUTING.md`](CONTRIBUTING.md)** — kit-authoring manual: anatomy of the repo, local setup, source-code conventions, kit-content conventions, releasing.
- **Root kit-authoring overlays** — minimal [`AGENTS.md`](AGENTS.md), [`CLAUDE.md`](CLAUDE.md), [`.github/copilot-instructions.md`](.github/copilot-instructions.md), and [`.cursor/rules/00-kit-authoring.mdc`](.cursor/rules/00-kit-authoring.mdc) so AI tools opened against this repo know they're authoring the npm package, not editing a storefront.
- **3 real prompt templates** in [`kit/prompts/`](kit/prompts/): `pr-description.prompt.md`, `release-notes.prompt.md`, `store-launch-checklist.prompt.md`. The directory previously promised templates that did not exist.
- **[`kit/QUICKSTART.md`](kit/QUICKSTART.md)** — concrete walkthrough from `init` to first deploy, plus a daily workflow cheatsheet.
- **`kit/reference/{philosophy,conventions}.md`** registered in [`kit/INDEX.json`](kit/INDEX.json) under a new `reference` array.
- **Store fork topology** documented in [`kit/rules/stores.md`](kit/rules/stores.md) and [`kit/commands/init-store.md`](kit/commands/init-store.md): local convention `~/Projects/commerce-atoms/stores/<store>/`, remote `github.com/commerce-atoms/store-<name>` (private).

### Changed

- **`package.json#files`** simplified to `["kit/", "dist/", "README.md", "CHANGELOG.md", "LICENSE"]`. The npm tarball ships exactly the package + its product.
- **Sync CLI** sources from `kit/` via the new `KIT_DIR` constant in [`src/sync.ts`](src/sync.ts). Consumer-side output paths (`AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.cursor/rules/`) are unchanged.
- **Sync CLI** rewrites repo-relative markdown links to absolute GitHub URLs when copying into consumer repos. Synced overlays no longer contain dead links to ADRs, rule sources, or canonical files. The repo URL base is read from `package.json#repository` and may be overridden via the `repoUrlBase` parameter on `sync()`.
- **`kit/AGENTS.md`** restructured as a navigator: §1 ladders the five primitives (rule / persona / skill / command / prompt) up-front; §3 trimmed to a tight architecture summary that points at canonical sources in `kit/rules/core/`. Doctrine §0 split into D1 (don't reimplement Shopify), D2 (CI deploys), D3 (rules are not advisory), D4 (repo topology).
- **`kit/CLAUDE.md`** rewritten to add Claude-specific value (slash command resolution, skill invocation pattern, persona-as-system-prompt, completion contract, behavioural defaults).
- **`kit/copilot-instructions.md`** rewritten to highlight Copilot autocomplete vs. Chat vs. Skills surfaces and the five constraints autocomplete must enforce.
- **All 5 personas** in `kit/personas/` strengthened with "what you are NOT" sections clarifying handoff. Frontmatter kept terse (`name / description / scope`); routing hints live in the body where they're readable when pasted into chat.
- **`init` next-steps output** updated: includes `gh repo create … --private --push` step and points at `kit/QUICKSTART.md`.
- **`bin/validate-index.ts`** resolves INDEX entries against `kit/` and now validates the new `reference[]` array and `manifest.quickstart` field.

### Fixed

- **`kit/CLAUDE.md`** broken `/back-port` link removed (the file does not exist; the command is backlog).
- **`kit/skills/validate-architecture/SKILL.md`** stale `.mjs` references corrected to `.ts` post-TypeScript migration.
- **`kit/AGENTS.md` §11** stale "until the sync CLI ships" prose updated to reflect that it shipped in `0.1.0`.
- **`kit/.cursor/rules/00-agents-md.mdc`** same stale prose fix; reframed overlays as hand-maintained mirrors with generation as a future step.

### Removed

- **`PROMPT_LIBRARY.md`** — defunct stub.

### Migration notes

Consumers can upgrade with no code changes:

```bash
npm i -D @commerce-atoms/agents@0.1.1
npx commerce-atoms-agents sync
```

The first sync after upgrade will report all synced files as `written` (link rewriting changed the bytes); subsequent syncs are idempotent.

---

## [0.1.0] — 2026-04-28

### Added

- **`AGENTS.md`** — universal AI manifest read by Cursor, Copilot, Claude, Codex.
- **`CLAUDE.md`** and **`copilot-instructions.md`** — per-tool overlays.
- **`.cursor/rules/*.mdc`** — Cursor-specific path-scoped overlays.
- **`rules/core/`** — canonical sources for `architecture`, `routing`, `imports`, `styling`.
- **`rules/packages.md`**, **`rules/stores.md`** — audience-specific rules.
- **`skills/`**, **`commands/`**, **`prompts/`**, **`personas/`** — primitive directories with READMEs documenting their formats per [ADR 004](docs/decisions/004-skill-and-command-format.md).
- **`INDEX.json`** + **`INDEX.schema.json`** — registry walked by the sync CLI.
- **`commerce-atoms-agents` CLI** — `sync`, `validate-architecture`, `version`, `help` commands per [ADR 001](docs/decisions/001-agents-distribution-mechanism.md) and [ADR 003](docs/decisions/003-mcp-hydrogen-kit-archive-path.md).
- **`validate-architecture` skill + slash command** — runs the boundary validators and reports cross-module imports, reverse imports, dumping-ground folders, barrel files, Remix imports, and missing/duplicated route manifests. Migrated from the now-archived `mcp-hydrogen-kit`.
- **`src/internal/path-to-owner.mjs`** — owner-inference primitive (migrated from `mcp-hydrogen-kit/src/tools/architecture.graphql.validatePlacement.ts`).
- **`init` subcommand + `/init-store` slash command** — clone the canonical starter, brand it, pin `@commerce-atoms/agents`, generate brand-layer placeholders, run `sync`, and create the first commit.
- **Deploy triplet slash commands** — `/deploy-setup` (one-time CI + secrets wiring), `/deploy-check` (pre-flight that mirrors CI gates locally), `/release` (tag + push; CI deploys). Encodes the `AGENTS.md §0` deploy sub-doctrine: the agent prepares and validates, CI deploys.
- **GitHub Actions** — `publish.yml` (on tag push) + `verify.yml` (on PR / push to main).

### Changed

- Renamed `agents/<scope>/*.agent.md` directory to `personas/<scope>/*.agent.md`.
- Replaced `@shoppy/*` references with `@commerce-atoms/*` per [ADR 002](docs/decisions/002-canonical-org-name.md).

### Removed

- `rules/cursor/hydrogen/*.mdc` and `rules/copilot/hydrogen/*.md` — collapsed into the canonical sources + per-tool overlays.

### Migration notes

Consumers previously copying files manually with `cp -r rules/cursor/hydrogen/* .cursor/rules/` should switch to:

```bash
npm i -D @commerce-atoms/agents
npx commerce-atoms-agents sync
```

The CLI copies `AGENTS.md`, the per-tool overlays, and the Cursor `.mdc` rules into the consumer repo and pins the version in `agents.config.json`.
