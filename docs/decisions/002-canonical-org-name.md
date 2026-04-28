# ADR 002 — Canonical org name

- **Status:** Accepted
- **Date:** 2026-04-28
- **Tags:** `naming`, `phase-0`
- **Source:** `PLAN.md §0.2`; `REVIEW.md §4 finding #1`, `§8.5`

## Context

The codebase carries two parallel names:

- **`@commerce-atoms`** — actual npm scope of the published packages and the GitHub org name.
- **`@shoppy`** — informal historical name still surfaced in docs, comments, and a handful of agent personas.

`REVIEW.md §4` enumerates ~17 files mixing the two. Some examples:

- `agents/rules/cursor/hydrogen/30-architecture-boundaries.mdc`
- `agents/rules/copilot/hydrogen/copilot-instructions.md`
- `agents/agents/commerce/catalog-variants.agent.md`
- `hydrogen-storefront-starter/CONTRIBUTING.md`
- `shoppy/README.md`, `shoppy/docs/*`

The drift confuses humans and risks confusing AI agents (rules say `@shoppy/*`, the actual import path is `@commerce-atoms/*`). Picking once and ruthlessly mopping up is cheap; deferring is expensive because every new file inherits the ambiguity.

The forcing question: **which name is canonical, and what becomes of the other?**

## Options considered

### A — Stay on `@commerce-atoms/*`

Keep the existing npm scope. Mop up remaining `@shoppy` references across docs, comments, and personas.

- **Pros:** Already the npm scope; no republishing; no consumer breakage; matches the GitHub org name.
- **Cons:** ~17 files need editing (mostly cosmetic, fast in practice).

### B — Switch to `@shoppy/*`

Republish all 10 `shoppy` packages under `@shoppy/*`. Update every `import` statement in `hydrogen-storefront-starter`. Update the GitHub org or accept the mismatch.

- **Pros:** "shoppy" is shorter and arguably more memorable as a brand.
- **Cons:** 10 packages need republishing; every consumer's `package.json` changes; every import statement changes; version history forks; the GitHub org and the npm scope diverge.

## Decision

**Option A — Stay on `@commerce-atoms/*`.**

`@commerce-atoms` is the canonical npm scope and the canonical mention everywhere — README, docs, agent personas, code comments, AGENTS.md, ESLint configs, anywhere it appears. `shoppy` is documentation-level drift that gets cleaned up.

`shoppy` survives **only** as the GitHub repo name (`commerce-atoms/shoppy`) — that's a directory label, not a brand. The published packages are `@commerce-atoms/*`.

## Consequences

### Positive

- One name everywhere. No drift between code and docs.
- AI agents are not asked to reconcile two names while reasoning about imports.
- The 17-file mop-up collapses to:
  - Most of it disappears as a side-effect of `PLAN.md` task `1.1` (the AGENTS.md migration writes the canonical name once into the new universal layer).
  - Whatever remains is picked up by `PLAN.md` task `3.1` (mop-up) — a small follow-up PR.

### Negative

- The "shoppy" mascot/brand identity gets retired in code; only the GitHub repo name carries it.

### Neutral

- No package republishing.
- No consumer-side changes.

## Implementation

- **Phase 1 task 1.1** writes `@commerce-atoms/*` everywhere as it migrates rules into `AGENTS.md`.
- **Phase 3 task 3.1** mops up remaining `@shoppy` references in `shoppy/`, `hydrogen-storefront-starter/`, and any leftovers in `agents/`.
- Verification: `rg @shoppy` across all three repos must return zero matches.

## Revisit when

- An external consumer demands the `@shoppy` brand for marketing reasons.
- The GitHub org gets renamed (very unlikely; out of scope of any current task).
