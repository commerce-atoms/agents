# CLAUDE.md

> Claude-specific overlay. The canonical AI manifest is [`AGENTS.md`](AGENTS.md) — read it first; this file extends it with Claude Code-native affordances.

## Slash commands

Commands live in [`commands/`](commands/) as plain markdown files. Each command is invokable in Claude Code as `/<name>`:

| Command | File | Purpose |
|---|---|---|
| `/init-store` | [`commands/init-store.md`](commands/init-store.md) | Clone & brand a fresh storefront. |
| `/deploy-setup` | [`commands/deploy-setup.md`](commands/deploy-setup.md) | Wire CI + secrets for a new store. |
| `/deploy-check` | [`commands/deploy-check.md`](commands/deploy-check.md) | Pre-flight before pushing to `main`. |
| `/release` | [`commands/release.md`](commands/release.md) | Tag and push; CI deploys. |
| `/validate-architecture` | [`commands/validate-architecture.md`](commands/validate-architecture.md) | Run the boundary validators. |
| `/back-port` *(planned)* | [`commands/back-port.md`](commands/back-port.md) | Diff a store against the kit. |

## Skills

Claude Code consumes skills as multi-step prompts. The skills folder uses the GitHub Copilot Skills layout (folder per skill, `SKILL.md` + assets); Claude reads them as long-form prompts.

See [`skills/`](skills/) for the full list. Invoke by referencing `skills/<name>/SKILL.md` in your message, or via the matching slash command when one exists.

## Prompts

Reusable task templates live in [`prompts/`](prompts/) (`.prompt.md` extension). Paste or reference these when a task fits the template (PR descriptions, release notes, store-launch checklist, etc.).

## Personas

Domain-expert system prompts in [`personas/`](personas/). Paste a persona's contents into a fresh chat to scope Claude's perspective for a session.

## Behavioural defaults

All `AGENTS.md` rules apply unconditionally. Specifically for Claude Code:

- Prefer minimal diffs and explicit file paths.
- Run [`RUN_PROTOCOL.md`](RUN_PROTOCOL.md) before marking work complete.
- Do not invoke `shopify hydrogen deploy` or any other deploy command directly — use `/release` (which pushes a tag and lets GitHub Actions deploy).
