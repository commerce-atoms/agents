# @commerce-atoms/agents

> **Universal AI manifest, rules, skills, prompts, slash commands, and personas for the `commerce-atoms` ecosystem.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

This is the npm package that distributes the AI kit consumed by every storefront forked from `hydrogen-storefront-starter`. The shipped product (manifests, rules, primitives, ADRs) lives under [`kit/`](kit/) and is read by Cursor, GitHub Copilot, Claude Code, and Codex via the universal [`kit/AGENTS.md`](kit/AGENTS.md) manifest.

---

## How consumers use it

```bash
npm i -D @commerce-atoms/agents
npx commerce-atoms-agents sync
```

The CLI copies the manifest + per-tool overlays + Cursor rules into the consumer's repo, rewrites repo-relative links to absolute GitHub URLs, and pins the kit version in `agents.config.json`.

For a guided walkthrough from install to first deploy, see [`kit/QUICKSTART.md`](kit/QUICKSTART.md).

### CLI commands

```bash
commerce-atoms-agents init <name>      # clone the starter, brand, pin, first commit
commerce-atoms-agents sync             # copy canonical content into cwd; pin version
commerce-atoms-agents sync --dry-run   # preview without writing
commerce-atoms-agents sync --force     # overwrite consumer divergence
commerce-atoms-agents sync --out <dir> # alternate output directory
commerce-atoms-agents validate-architecture    # run the boundary validators
commerce-atoms-agents version
commerce-atoms-agents help
```

### `agents.config.json`

Generated on first `sync`; updated each run with the pinned version.

```json
{
  "agentsVersion": "0.2.0",
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

Disable a tool by setting `tools.<name>` to `false`. Customise an output path by editing `out.<key>`.

### Conflict handling

If a consumer mutates a synced file, the next `sync` writes the new canonical content to a `<file>.kit-incoming.<ext>` sidecar next to the consumer's edit and reports the file as `divergent`. The consumer's edit is left untouched and **all unrelated files still sync**. The sidecar is auto-removed once the consumer file converges with canonical (or is deleted).

Default exit code is `0` so unrelated updates aren't blocked by one local edit. CI gates that want to fail on divergence should pass `--strict`. To overwrite the consumer's edit instead of producing a sidecar, pass `--force`.

---

## Repo layout

The repo separates the **npm package** from the **shipped product**:

```text
agents/
├── package.json, tsconfig.*, LICENSE, CHANGELOG.md, README.md  ← npm package metadata
├── bin/, src/                                                   ← package source (TypeScript)
├── .github/workflows/                                           ← publish.yml + verify.yml
├── CONTRIBUTING.md                                              ← kit-authoring rules
├── AGENTS.md, CLAUDE.md, .github/copilot-instructions.md,
│   .cursor/rules/                                               ← root overlays for kit authors
└── kit/                                                         ← what ships to consumers
    ├── AGENTS.md, CLAUDE.md, copilot-instructions.md            ← per-tool overlays for storefronts
    ├── .cursor/rules/                                           ← Cursor overlays for storefronts
    ├── rules/                                                   ← canonical storefront rules
    ├── skills/, commands/, prompts/, personas/                  ← the five primitives
    ├── reference/                                               ← philosophy + conventions
    ├── docs/decisions/                                          ← ADRs
    ├── INDEX.json + INDEX.schema.json                           ← registry of shipped artefacts
    ├── RUN_PROTOCOL.md, QUICKSTART.md
```

The split is doctrine — root files govern the package; `kit/` files ship to consumers and govern Hydrogen storefronts. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the rationale.

### Where to look

| Question | Answer lives in |
|---|---|
| Storefront architecture rules and primitives | [`kit/AGENTS.md`](kit/AGENTS.md), [`kit/rules/core/`](kit/rules/core/) |
| The five primitives (rule / persona / skill / command / prompt) | [`kit/reference/philosophy.md`](kit/reference/philosophy.md) |
| Frontmatter and naming conventions | [`kit/reference/conventions.md`](kit/reference/conventions.md) |
| Why a decision was made | [`kit/docs/decisions/`](kit/docs/decisions/) |
| How to author or extend the kit | [`CONTRIBUTING.md`](CONTRIBUTING.md) |
| CLI source | [`src/sync.ts`](src/sync.ts), [`src/init.ts`](src/init.ts), [`src/validate.ts`](src/validate.ts), [`bin/sync.ts`](bin/sync.ts) |

---

## Doctrine

`commerce-atoms` is the **adapter layer** between Shopify upstream (runtime + cookbooks) and a modular, AI-consistent storefront architecture. The kit **ports** Shopify cookbook recipes; it does **not** write competing implementations.

Full statement in [`kit/AGENTS.md §0`](kit/AGENTS.md).

---

## Status

- `0.1.x` — sync CLI, init CLI, validate-architecture skill + slash command, five personas, three prompt templates, manifest + per-tool overlays. Released via Trusted Publishing (OIDC).
- Per-tool overlays are currently hand-maintained mirrors of the canonical sources in [`kit/rules/core/`](kit/rules/core/). Deterministic generation from canonical sources is on the roadmap.

---

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for local setup, kit-authoring conventions, and the release workflow.

## License

[MIT](LICENSE)
