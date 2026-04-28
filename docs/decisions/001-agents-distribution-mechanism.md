# ADR 001 — `agents/` distribution mechanism

- **Status:** Accepted
- **Date:** 2026-04-28
- **Tags:** `distribution`, `cross-repo`, `phase-0`
- **Source:** `PLAN.md §0.1`; `REVIEW.md §1` (cross-repo reality), `§8.7`, `§9 Track A #2`

## Context

The `commerce-atoms` org is composed of **independent GitHub repositories** developed locally side-by-side but versioned, released, and consumed independently. There is **no monorepo, no shared CI, no shared `package.json`**. Anything shared between them must be **published, versioned, and pinned** — not synced via `cp -r`.

Today `agents/` is consumed by manual `cp -r` (documented in `agents/README.md:62-67`). This breaks the moment N>1 stores exist: drift is the default state, every store ages independently, and "fix once, propagate to all stores" stops being a real workflow.

The forcing question: **how should consumer repos pull `agents/` content in a way that works for one operator with N stores, on the AI tooling shape described in `REVIEW.md §8.7` (`AGENTS.md` + Skills + Commands + per-tool overlays)?**

## Options considered

### A — Pure npm package

`@commerce-atoms/agents` published to npm. Consumers `npm i -D @commerce-atoms/agents`, then `npx commerce-atoms-agents sync` copies content into the consumer repo at well-known paths.

- **Pros:** Familiar; works for everyone; semver native; existing tooling.
- **Cons:** `AGENTS.md`/`.cursor/rules/` must be physically present in the consumer repo (so editor tools find them), so a copy step is unavoidable on every install/sync.

### B — Git subtree

Consumers `git subtree pull` from a tag in the `agents` repo. Files live natively in the consumer repo's tree.

- **Pros:** No install step; files are committed in the consumer; offline-friendly.
- **Cons:** `git subtree` is awkward in practice; merge conflicts on customization; no `package.json`-style version pinning visible at a glance; harder for AI tools to enforce "pinned version".

### C — Hybrid (npm package + sync CLI that generates per-tool overlays)

Publish `@commerce-atoms/agents` as the canonical content (`AGENTS.md`, `rules/`, `skills/`, `commands/`, `prompts/`, `personas/`, `INDEX.json`). The package ships a `sync` bin that:

1. Reads consumer's `agents.config.json` (or `package.json#commerce-atoms-agents` block).
2. Copies the canonical files into the consumer repo at the right paths.
3. **Generates** per-tool overlays deterministically (`.cursor/rules/*.mdc`, `.github/copilot-instructions.md`, `CLAUDE.md`) from the canonical sources rather than maintaining them by hand.
4. Pins the version that produced the output.

- **Pros:** `AGENTS.md` stays the single source; per-tool drift becomes structurally impossible (rebuilt every sync); upgrade workflow is one command; semver is honored end-to-end.
- **Cons:** Most upfront work — need to author the generator alongside the canonical content.

## Decision

**Option C — Hybrid.**

Publish `@commerce-atoms/agents` to npm. Ship a `commerce-atoms-agents sync` CLI that copies canonical content and **deterministically generates** per-tool overlays. Consumer pins the version in `agents.config.json`; upgrade is `npm i -D @commerce-atoms/agents@<x.y.z> && npx commerce-atoms-agents sync`.

This is the only mechanism that makes "fix once, propagate to N stores on their own upgrade schedule" a real workflow. It closes drift permanently because the per-tool files are not authored — they are *generated*.

## Consequences

### Positive

- `AGENTS.md` becomes the only place humans edit AI-rule content.
- Per-tool overlays (`.cursor/rules/*.mdc`, `copilot-instructions.md`, `CLAUDE.md`) cannot drift — they're rebuilt from canonical content on every `sync`.
- Each consumer repo declares its pinned version explicitly. Upgrade is intentional, never silent.
- `INDEX.json` becomes the manifest the CLI walks to know what to copy/generate.
- Sets the foundation for Phase 1 task `1.3` (build the package) and Phase 2 task `2.1` (`npx commerce-atoms init` wrapper, which will internally call `sync`).

### Negative

- Consumers gain a `node_modules` dependency on `@commerce-atoms/agents` (devDep only).
- The generator must be maintained as canonical formats evolve (e.g. when Cursor or Copilot change their schema).
- Tagged releases require a publishing pipeline (CI on tag push) — extra setup compared to manual `cp -r`.

### Neutral

- The package is internal-first; npm scope is `@commerce-atoms` (per [ADR 002](./002-canonical-org-name.md)). It is intentionally not framed as a general-purpose OSS distribution; cross-store consistency is the goal, OSS adoption is a side-effect.
- Existing `rules/cursor/` and `rules/copilot/` directories remain on disk during the transition (until `1.1` migrates their content into `AGENTS.md` + canonical sources, after which they get removed by the generator).

## Implementation

- **Phase 1 task 1.3** builds the package and `sync` CLI.
- **Phase 1 task 1.1** ensures `AGENTS.md` is the canonical source the generator reads from.
- **Phase 1 task 1.2** establishes the folder shape that the generator expects.
- **Phase 2 task 2.1** layers `npx commerce-atoms init` on top of `sync`.

## Revisit when

- A second public consumer (outside the org) emerges and asks for a different shape.
- A future Cursor/Copilot/Claude change makes the deterministic generator unviable.
- The npm registry stops being the right host (e.g. moving to JSR or a private registry).
