# @commerce-atoms/agents

> **Universal AI manifest, rules, skills, prompts, slash commands, and personas for the `commerce-atoms` ecosystem.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

This repo is the **single source of truth** for AI behaviour across every storefront forked from `hydrogen-storefront-starter`. Read by Cursor, GitHub Copilot, Claude Code, Codex, and other agentic editors via the universal [`AGENTS.md`](AGENTS.md) manifest.

---

## Layout

```text
agents/
├── AGENTS.md                       # ⭐ Universal manifest (read first)
├── CLAUDE.md                       # Claude-specific overlay
├── copilot-instructions.md         # Copilot-specific overlay
├── .cursor/rules/*.mdc             # Cursor-specific overlays
│
├── rules/
│   ├── core/
│   │   ├── architecture.md         # Module boundaries, route/view split, shared folder policy
│   │   ├── routing.md              # app/routes.ts manifest rules
│   │   ├── imports.md              # React Router only, path aliases
│   │   └── styling.md              # CSS module colocation
│   ├── packages.md                 # @commerce-atoms/* package authoring (for shoppy)
│   └── stores.md                   # Per-store fork conventions
│
├── skills/                         # Reusable AI capabilities
│   └── <name>/SKILL.md
├── commands/                       # Slash commands
│   └── <name>.md
├── prompts/                        # Reusable task templates
│   └── <name>.prompt.md
│
├── personas/                       # Domain-expert system prompts
│   ├── hydrogen/
│   ├── shopify/
│   └── commerce/
│
├── reference/
│   ├── philosophy.md
│   └── conventions.md
│
├── docs/
│   └── decisions/                  # ADRs justifying the architecture of this repo
│       └── 00X-*.md
│
├── INDEX.json                      # Registry walked by the sync CLI
├── INDEX.schema.json               # Schema for INDEX.json
├── QUICKSTART.md                   # Install → init → first deploy walkthrough
└── RUN_PROTOCOL.md                 # Execution steps + escalation rules
```

---

## How consumers use this

Per [ADR 001](docs/decisions/001-agents-distribution-mechanism.md), this repo is published as `@commerce-atoms/agents` on npm. Each consumer repo (`hydrogen-storefront-starter`, store forks, `shoppy`) pins a version and runs:

```bash
npm i -D @commerce-atoms/agents
npx commerce-atoms-agents sync
```

The sync CLI copies canonical content (`AGENTS.md`, `rules/`, …) and **deterministically generates** per-tool overlays in the consumer repo (`.cursor/rules/*.mdc`, `.github/copilot-instructions.md`, `CLAUDE.md`).

> **Status — `0.1.1`:** the CLI ships, copies canonical content, and rewrites repo-relative markdown links to absolute GitHub URLs so synced files keep working in consumer repos. The "deterministic generation" of per-tool overlays from canonical sources (instead of copying hand-maintained overlays) is the next step (PLAN §2.9). Today's overlays in `.cursor/rules/`, `CLAUDE.md`, and `copilot-instructions.md` are hand-authored mirrors of the canonical sources in `rules/core/`.

### CLI commands

```bash
commerce-atoms-agents init <name>      # clone the starter, brand, pin, first commit
commerce-atoms-agents sync             # copy canonical content into cwd; pin version
commerce-atoms-agents sync --dry-run   # preview without writing
commerce-atoms-agents sync --force     # overwrite consumer divergence
commerce-atoms-agents sync --out <dir> # alternate output directory
commerce-atoms-agents sync --config <path>     # alternate config file
commerce-atoms-agents validate-architecture    # run the boundary validators
commerce-atoms-agents check            # validate-arch + version freshness + config sanity
commerce-atoms-agents version
commerce-atoms-agents help
```

For a guided walkthrough from install to first deploy, see [`QUICKSTART.md`](QUICKSTART.md).

### `agents.config.json`

Generated on first `sync` and updated each run with the pinned version. Shape:

```json
{
  "agentsVersion": "0.1.0",
  "audience": "store-fork",
  "tools": {"cursor": true, "copilot": true, "claude": true, "codex": true},
  "out": {
    "agentsMd": "AGENTS.md",
    "claudeMd": "CLAUDE.md",
    "copilotInstructions": ".github/copilot-instructions.md",
    "cursorRulesDir": ".cursor/rules"
  }
}
```

Disable a tool by setting `tools.<name>` to `false` — its files are skipped on sync.

Customise an output path by editing `out.<key>`.

### Conflict handling

If a consumer mutates a synced file, the next `sync` reports it as a `skipped-conflict` and exits non-zero. Resolve with one of:

- Re-import the upstream content: `commerce-atoms-agents sync --force`.
- Move the divergence into a per-store overlay (e.g. extend `AGENTS.md` in a separate file or maintain a fork-only addendum).

---

## What lives here

| Folder | Purpose | Edited by |
|---|---|---|
| [`rules/core/`](rules/core/) | Canonical sources for path-scoped rules. | Humans. The `sync` CLI generates per-tool overlays from these. |
| [`rules/`](rules/) (packages, stores) | Audience-specific rules for shoppy authors and store forks. | Humans. |
| [`.cursor/rules/`](.cursor/rules/) | Cursor-specific overlays. **Generated** once the sync CLI ships; hand-maintained until then. | Generator (target). |
| [`copilot-instructions.md`](copilot-instructions.md), [`CLAUDE.md`](CLAUDE.md) | Per-tool overlays. **Generated** once the sync CLI ships. | Generator (target). |
| [`skills/`](skills/) | Reusable AI capabilities. | Humans. |
| [`commands/`](commands/) | Slash commands. | Humans. |
| [`prompts/`](prompts/) | Task templates. | Humans. |
| [`personas/`](personas/) | Domain-expert system prompts (paste into chat to scope a session). | Humans. |
| [`reference/`](reference/) | Philosophy and conventions for contributors to this repo. | Humans. |
| [`docs/decisions/`](docs/decisions/) | ADRs. Append-only — supersede with a new ADR rather than editing. | Humans. |

---

## Doctrine

`commerce-atoms` is the **adapter layer** between Shopify upstream (runtime + cookbooks) and a modular, AI-consistent storefront architecture. We **port** Shopify cookbook recipes; we do **not** write competing implementations.

Full statement in [`AGENTS.md §0`](AGENTS.md). The doctrine is non-negotiable — slipping into "let's write our own version of B2B/Markets/etc." is the kit's biggest risk.

---

## Personas

| Domain | Personas |
|---|---|
| `personas/hydrogen/` | [Storefront Architect](personas/hydrogen/storefront-architect.agent.md), [Storefront Performance](personas/hydrogen/storefront-performance.agent.md) |
| `personas/shopify/` | [Storefront API Specialist](personas/shopify/storefront-api-specialist.agent.md) |
| `personas/commerce/` | [Catalog & Variants](personas/commerce/catalog-variants.agent.md), [SEO & Structured Data](personas/commerce/seo-structured-data.agent.md) |

Paste the contents of any `.agent.md` into a fresh chat to scope the model's perspective for a session. See [`reference/philosophy.md`](reference/philosophy.md) for the rules-vs-personas-vs-skills distinction.

---

## Adding new content

| Add | Where | Format |
|---|---|---|
| A rule | `rules/core/<topic>.md` or `rules/<audience>.md` | Markdown with frontmatter; canonical source for tool-overlay generation. |
| A skill | `skills/<name>/SKILL.md` | GitHub Copilot Skills layout. See [`skills/README.md`](skills/README.md). |
| A slash command | `commands/<name>.md` | Claude Code commands layout. See [`commands/README.md`](commands/README.md). |
| A prompt | `prompts/<name>.prompt.md` | Claude Code prompt layout. See [`prompts/README.md`](prompts/README.md). |
| A persona | `personas/<scope>/<name>.agent.md` | See [`reference/conventions.md`](reference/conventions.md). |
| An ADR | `docs/decisions/00X-<slug>.md` | See [`docs/decisions/README.md`](docs/decisions/README.md). |

After adding, register the artefact in [`INDEX.json`](INDEX.json) so the sync CLI picks it up.

---

## License

[MIT](LICENSE)
