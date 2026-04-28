# Slash commands

> Short, named workflows the agent triggers in one keystroke. Format: Claude Code commands layout (single `.md` file per command). See [ADR 004](../docs/decisions/004-skill-and-command-format.md).

## Structure

```text
commands/
├── README.md              # this file
├── <command-name>.md      # one file per command
└── ...
```

Each `.md` file is a self-contained command spec. Recommended frontmatter:

```yaml
---
name: command-name
description: One-line summary used in tool listings.
arguments:
  - name: <arg-name>
    required: true
    description: …
---
```

The body of the file is the workflow the agent follows when invoked.

## Command index

| Command | Status | Purpose |
|---|---|---|
| `/init-store <name>` | MVP | Clone & brand a fresh storefront. |
| `/deploy-setup` | MVP | Wire CI + secrets for a new store. |
| `/deploy-check` | MVP | Pre-flight before pushing to `main`. |
| `/release` | MVP | Tag and push; CI deploys. |
| `/validate-architecture` | MVP | Run the boundary validators (wraps the skill). |
| `/back-port` | Backlog | Diff a store against the kit; propose upstream PRs. |
| `/upgrade-agents` | Backlog | Bump pinned `@commerce-atoms/agents` version. |

## Doctrinal note on deploy

> **The agent prepares and validates. CI deploys.**

`/release` pushes a tag — it never invokes `shopify hydrogen deploy` directly. GitHub Actions is the only deploy actor. See `AGENTS.md §0` and the `.github/workflows/deploy.yml` shipped in `hydrogen-storefront-starter`.

## Adding a new command

1. Create `commands/<name>.md` with frontmatter.
2. Add an entry to [`INDEX.json`](../INDEX.json).
3. Reference from [`CLAUDE.md`](../CLAUDE.md) (Claude Code surface) and [`AGENTS.md`](../AGENTS.md) §8.

## Tone

Commands are workflows, not conversations. The body should read like a checklist or a numbered procedure. If the command needs branching judgement, that's a sign it should be a skill instead.
