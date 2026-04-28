# ADR 004 — Skill / Prompt / Slash Command format

- **Status:** Accepted
- **Date:** 2026-04-28
- **Tags:** `skills`, `commands`, `prompts`, `phase-0`
- **Source:** `PLAN.md §0.4`; `REVIEW.md §8.7`

## Context

`REVIEW.md §8.7` names three new primitives the kit needs:

- **Skills** — reusable AI capabilities (`validate-architecture`, `port-hydrogen-cookbook-recipe`, `scaffold-module`).
- **Slash Commands** — short, named workflows (`/init-store`, `/deploy-setup`, `/release`).
- **Prompts** — versioned task templates (PR descriptions, release notes, retro after a launch).

Each modern AI tool has its own native format:

- **GitHub Copilot Skills** — folder per skill, `SKILL.md` plus assets, well-documented schema.
- **Claude Code Commands** — single `.md` file under `commands/<name>.md`, with optional frontmatter.
- **Cursor Slash Commands / Project Rules** — `.cursor/rules/*.mdc` for rules; chat-pinned prompts for ad-hoc commands; first-class slash commands evolving.

The forcing question: **which format(s) do we author against, knowing the same content must work across Cursor, Copilot, Claude, and Codex?**

The non-negotiable constraints:

- One source of truth — the `sync` CLI ([ADR 001](./001-agents-distribution-mechanism.md)) regenerates per-tool overlays deterministically.
- Source format is plain markdown — every tool reads markdown; binary or proprietary formats are off-limits.
- Skills and Commands have different shapes — Skills are richer (multi-file, fixtures, tests); Commands are short workflows.

## Options considered

### A — One format for everything

Pick one (e.g. Copilot Skills layout) and force Skills, Commands, and Prompts into it.

- **Pros:** Maximum simplicity; one mental model.
- **Cons:** Skills wants a folder; Commands fits naturally in a single file; mashing them together makes the lightweight Commands feel heavy and discourages adding small ones.

### B — Tool-native everything

Author each artefact in its tool-native format. Maintain three copies of every Skill (Copilot folder, Claude `.md`, Cursor `.mdc`).

- **Pros:** Each tool gets its ideal experience.
- **Cons:** Direct duplication; drift is the default; the entire point of [ADR 001](./001-agents-distribution-mechanism.md) is to avoid this.

### C — Hybrid, source-first, generated overlays

Split by **artefact type**, not by tool:

- **Skills** → Copilot Skills layout (folder per skill: `agents/skills/<name>/SKILL.md` + `assets/` + optional `tests/`). Most structured shape; rich enough to host fixtures and prompt-based tests.
- **Slash Commands** → Claude Code layout (`agents/commands/<name>.md`, frontmatter for invocation contract). Lightweight, single-file.
- **Prompts** → Claude Code layout (`agents/prompts/<name>.prompt.md`). Same lightweight pattern.

The `sync` CLI then **generates** the per-tool consumption form from these canonical sources:

- Cursor reads `.cursor/rules/*.mdc` for rules and the `AGENTS.md` for everything else; commands surfaced via project-level snippets.
- Copilot reads `.github/copilot-instructions.md` (generated) and Skills natively from `agents/skills/`.
- Claude reads `AGENTS.md` + `CLAUDE.md` + `commands/<name>.md` natively.
- Codex reads `AGENTS.md`.

Each authored once; each consumable in every supported tool.

- **Pros:** Right-shaped per artefact type; one source of truth; deterministic per-tool generation; no per-tool duplication.
- **Cons:** Two formats to learn (Copilot Skills for Skills, Claude Commands for everything else) — minor; both are markdown.

## Decision

**Option C — Hybrid, source-first.**

| Artefact | Source format | Source path | Generator targets |
|---|---|---|---|
| Skills | GitHub Copilot Skills layout | `agents/skills/<name>/SKILL.md` (+ `assets/`, `tests/`, fixtures) | Copilot natively; Claude/Cursor via prompt embedding |
| Slash Commands | Claude Code commands | `agents/commands/<name>.md` (frontmatter optional) | Claude natively; Cursor as command snippets; Copilot referenced from `copilot-instructions.md` |
| Prompts | Claude Code prompts | `agents/prompts/<name>.prompt.md` | Same |

All sources are markdown. The `sync` CLI ([ADR 001](./001-agents-distribution-mechanism.md), task `1.3`) walks `INDEX.json` and emits the per-tool consumption form into the consumer repo.

## Consequences

### Positive

- Each artefact is authored where it's structurally happiest. Skills get folders + tests; Commands stay as a single file.
- The `sync` CLI's generator is mechanical: it reads canonical markdown and emits per-tool variants. No semantic translation.
- New skills/commands are easy to add — clone an existing one as a template; the generator handles the rest.
- Encourages frequent, small additions (Commands stay cheap to author).

### Negative

- Two formats to learn. Mitigated by templates and by both being markdown.
- The Copilot Skills schema may evolve; the generator must keep up.

### Neutral

- `agents/skills/`, `agents/commands/`, `agents/prompts/` are siblings, all first-class.
- `INDEX.json` lists every artefact across all three categories.

## Implementation

- **Phase 1 task 1.2** creates the empty `agents/skills/`, `agents/commands/`, `agents/prompts/` directories with one example each demonstrating the format.
- **Phase 1 task 1.3** ships the `sync` CLI with a generator per tool that consumes the canonical sources.
- **Phase 1 tasks 1.4 / 1.5 / 1.6** populate Skills.
- **Phase 1 task 1.7** ships the first Slash Command (`/init-store`).
- **Phase 2 task 2.7** ships the deploy-triplet Slash Commands.

## Revisit when

- A tool ships a richer command/skill format that materially beats markdown (e.g. a typed contract, a manifest with declared inputs/outputs).
- The Copilot Skills schema diverges enough that hosting Skills in its layout no longer carries cross-tool benefit.
- A second source format proves necessary for prompts (e.g. Continue's, Codex CLI's).
