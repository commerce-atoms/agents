# Changelog

All notable changes to `@commerce-atoms/agents` are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). Versioning follows [SemVer](https://semver.org/) — once consumers pin a version, breaking changes require a major bump.

---

## [0.1.0] — Unreleased

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
