# Changelog

All notable changes to `@commerce-atoms/agents` are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). Versioning follows [SemVer](https://semver.org/) — once consumers pin a version, breaking changes require a major bump.

---

## [Unreleased]

## [0.1.1] — 2026-04-28

### Added

- **3 real prompt templates** in `prompts/`: [`pr-description.prompt.md`](prompts/pr-description.prompt.md), [`release-notes.prompt.md`](prompts/release-notes.prompt.md), [`store-launch-checklist.prompt.md`](prompts/store-launch-checklist.prompt.md). The directory previously promised templates that did not exist.
- **`commerce-atoms-agents check`** subcommand — combined health check that runs `validate-architecture`, verifies pinned `agentsVersion` against the installed package, and validates `agents.config.json` shape. Exposed as `@commerce-atoms/agents/check` for programmatic use.
- **`QUICKSTART.md`** — concrete walkthrough from `init` to first deploy, plus a daily workflow cheatsheet. Shipped in the npm tarball and surfaced in `INDEX.json#manifest.quickstart`.
- **`reference/{philosophy,conventions}.md`** registered in [`INDEX.json`](INDEX.json) under a new `reference` array so the sync system surfaces them.
- **Store fork topology** documented in [`rules/stores.md`](rules/stores.md) and [`commands/init-store.md`](commands/init-store.md): local convention `~/Projects/commerce-atoms/stores/<store>/`, remote `github.com/commerce-atoms/store-<name>` (private). Customer stores live under the customer's own org.

### Changed

- **Sync CLI** rewrites repo-relative markdown links to absolute GitHub URLs when copying into consumer repos. Synced `AGENTS.md`, `CLAUDE.md`, `copilot-instructions.md`, and `.cursor/rules/*.mdc` no longer contain dead links to ADRs, rule sources, or canonical files. The repo URL base is read from `package.json#repository` and may be overridden via the `repoUrlBase` parameter on `sync()`.
- **`AGENTS.md`** restructured as a navigator: §1 now ladders the five primitives (rule / persona / skill / command / prompt) up-front with a "If you need X, reach for Y" table; §3 trimmed to a tight architecture summary that points at canonical sources in `rules/core/`. Doctrine §0 split into D1 (don't reimplement Shopify), D2 (CI deploys), D3 (rules are not advisory), D4 (repo topology).
- **`CLAUDE.md`** rewritten to add Claude-specific value (slash command resolution, skill invocation pattern, persona-as-system-prompt, completion contract, behavioural defaults for long-running sessions) instead of mirroring `AGENTS.md`.
- **`copilot-instructions.md`** rewritten to highlight Copilot autocomplete vs. Chat vs. Skills surfaces and the five constraints autocomplete must enforce on every suggestion.
- **All 5 personas** strengthened: each declares `when_to_invoke`, `not_for`, and `companions` frontmatter; bodies gained "what you are NOT" sections clarifying handoff to other personas; the duplicated boilerplate "Execution Contract" block was replaced with persona-specific discipline.
- **`init` next-steps output** updated: includes `gh repo create … --private --push` step and points at `QUICKSTART.md`.

### Fixed

- **`CLAUDE.md`** broken `/back-port` link removed (the file `commands/back-port.md` does not exist; the command is backlog).
- **`skills/validate-architecture/SKILL.md`** stale `.mjs` references (`validate.mjs`, `types.mjs`) corrected to `.ts` post-TypeScript migration.
- **`AGENTS.md` §11** stale "until the sync CLI ships" prose updated to reflect that it shipped in `0.1.0`.
- **`.cursor/rules/00-agents-md.mdc`** same stale prose fix; reframed overlays as hand-maintained mirrors with generation as a future step.

### Removed

- **`PROMPT_LIBRARY.md`** — defunct stub. Its content already lived in `AGENTS.md` and the misleading filename suggested a prompt library where none existed.

### Migration notes

Consumers can upgrade with no code changes:

```bash
npm i -D @commerce-atoms/agents@0.1.1
npx commerce-atoms-agents sync
```

The first sync after upgrade will report all synced files as `written` (link rewriting changed the bytes); subsequent syncs are idempotent. Optionally run the new `check` subcommand to verify pin / config / architecture in one go:

```bash
npx commerce-atoms-agents check
```

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
