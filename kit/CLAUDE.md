# CLAUDE.md

> Claude Code-specific overlay. Read [`AGENTS.md`](AGENTS.md) first — it is the canonical manifest. This file extends it with Claude-native affordances and behavioural defaults specific to long-running, multi-turn sessions.

## Read order

1. **`AGENTS.md`** (mandatory) — doctrine (§0), navigator (§1), architecture (§3), capabilities (§8). End-to-end.
2. **This file** — Claude-specific invocation patterns and behavioural overrides.
3. **Path-scoped rules** — Claude does not auto-load `.cursor/rules/*.mdc` (those are Cursor-specific), but the canonical sources at [`rules/core/*.md`](rules/core/) apply unconditionally; load them on demand when working in matching paths.

## Slash commands — [`commands/`](commands/)

Each command is one markdown file with a numbered workflow body. Invokable by name in Claude Code:

| Command | Purpose |
|---|---|
| [`/init-store <name>`](commands/init-store.md) | Clone & brand a fresh storefront. |
| [`/deploy-setup`](commands/deploy-setup.md) | Wire CI + secrets for a new store. |
| [`/deploy-check`](commands/deploy-check.md) | Pre-flight before pushing to `main`. |
| [`/release [patch\|minor\|major]`](commands/release.md) | Tag and push; CI deploys. |
| [`/validate-architecture`](commands/validate-architecture.md) | Run the boundary validators. |

When invoked, Claude reads the matching `commands/<name>.md`, follows the **Workflow** section step-by-step, treats **Done when** as the completion contract, and uses **Failure modes** to recover from errors before asking the operator.

## Skills — [`skills/`](skills/)

Skills are reusable multi-step procedures with input/output contracts. Layout: folder per skill, `SKILL.md` + optional `assets/` + optional `tests/`. Frontmatter declares `name`, `description`, `inputs`, `post_conditions`, `related_skills`.

To invoke a skill, reference its `SKILL.md` path explicitly:

```text
Run skills/validate-architecture/SKILL.md against this project.
```

Claude treats `SKILL.md` as a long-form prompt, follows its **Workflow** section, and verifies the **Post-conditions** before reporting completion. After structural edits (new module, route manifest change, shared-folder promotion), run `validate-architecture` — see `skills/validate-architecture/SKILL.md`.

## Personas — [`personas/`](personas/)

Personas are domain-expert system prompts, *not* skills. Use them when a session needs deep, sustained domain context (architecture review, perf debugging, GraphQL design). To activate a persona:

```text
Adopt the persona in personas/hydrogen/storefront-performance.agent.md for this session.
```

Then converse normally — Claude responds through that persona's lens until told otherwise. Personas pair well with skills:

- **Storefront Architect** → frequently invokes `validate-architecture`.
- **Storefront Performance** → frequently invokes `/deploy-check` after edits.
- **Storefront API Specialist** → handles GraphQL design before passing back to a non-API persona.
- **Catalog & Variants** + **SEO & Structured Data** → cooperate on PDP work.

Switching personas mid-session is fine; declare the switch out loud so the operator knows.

## Prompts — [`prompts/`](prompts/)

Templates pasted into chat for routine artefact generation (PR descriptions, release notes, launch checklists). When the operator's request matches a template, Claude SHOULD reach for the template instead of improvising.

| Prompt | Trigger phrase |
|---|---|
| [`pr-description.prompt.md`](prompts/pr-description.prompt.md) | "Write a PR description for this change…" |
| [`release-notes.prompt.md`](prompts/release-notes.prompt.md) | "Draft release notes for v…" / "Update CHANGELOG…" |
| [`store-launch-checklist.prompt.md`](prompts/store-launch-checklist.prompt.md) | "Are we ready to launch the store?" / "Pre-launch sweep…" |

## Behavioural defaults for Claude Code

All `AGENTS.md` rules apply unconditionally. The following are Claude-specific reinforcements:

### Diff discipline

- Prefer minimal diffs and explicit file paths in proposed edits.
- When using the editor tool, never reformat unrelated code.
- Echo any path-scoped rule that applies before making the change (e.g. "applying `rules/core/imports.md` — using `react-router`, not `@remix-run/react`").

### Long-running sessions

- For sessions > 5 turns, periodically restate the active persona (if any) and the doctrine constraints from `AGENTS.md §0`. Drift in long sessions is the most common failure mode.
- When the operator's intent shifts, surface the shift before continuing ("you started with PDP work, this is now SEO — adopting `personas/commerce/seo-structured-data` ?").

### Deploy doctrine

Never invoke `shopify hydrogen deploy` directly. Use `/release` (which pushes a tag and lets GitHub Actions deploy). Even if the operator asks. Surface the doctrine and offer `/release` instead.

### Completion contract

Before declaring work complete:

1. The matching command's **Done when** criteria are met (or the skill's **Post-conditions**).
2. [`RUN_PROTOCOL.md`](RUN_PROTOCOL.md) self-check has been performed (architecture / imports / routing respected; types, lint, tests considered).
3. If the change was structural (new module, new platform glue, new route), `validate-architecture` has been run and reported clean.

If any of those is unmet, say so explicitly rather than reporting completion.

### MCP and external tools

This kit does not currently ship an MCP server (the validation logic that previously lived in `mcp-hydrogen-kit` was relocated into the npm package; see [ADR 003](docs/decisions/003-mcp-hydrogen-kit-archive-path.md)). If the operator's environment exposes an MCP for Shopify Admin or similar, treat it as an optional accelerator — but the doctrine in §0 still binds: never use it to deploy.
