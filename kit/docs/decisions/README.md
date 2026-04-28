# Architecture Decision Records (ADRs)

Decisions that shape `agents/` and the wider `commerce-atoms` org.

Each ADR captures the **context**, the **options considered**, the **decision taken**, and the **consequences** that flow from it. ADRs are append-only — supersede with a new ADR rather than rewriting history.

## Index

| # | Title | Status |
|---|---|---|
| [001](./001-agents-distribution-mechanism.md) | `agents/` distribution mechanism | Accepted |
| [002](./002-canonical-org-name.md) | Canonical org name (`@commerce-atoms` vs `@shoppy`) | Accepted |
| [003](./003-mcp-hydrogen-kit-archive-path.md) | `mcp-hydrogen-kit` archive path | Accepted |
| [004](./004-skill-and-command-format.md) | Skill / Prompt / Slash Command format | Accepted |

## Format

Each ADR follows a lightweight [MADR](https://adr.github.io/madr/)-style template:

- **Status** — `Proposed`, `Accepted`, `Superseded by ###`, `Rejected`.
- **Date** — when the decision was last updated.
- **Context** — the forcing question, with prose references to the org-level `REVIEW.md` / `PLAN.md` sections that justify it.
- **Options considered** — at least two, with honest trade-offs.
- **Decision** — the chosen option, in one sentence.
- **Consequences** — what changes downstream (positive and negative).

If a decision turns out wrong, write ADR `00X-revisit-…` rather than editing the original.

## Source documents

`REVIEW.md` (the architecture review) and `PLAN.md` (the executable plan) live at the **`commerce-atoms` org workspace level**, not in any single repo. ADRs cite them by section number (e.g. `REVIEW.md §8.7`, `PLAN.md §0.1`) rather than by URL — those documents are not yet pinned to a public location.

These ADRs are referenced by:

- `REVIEW.md §9 Track A` — recommended action list.
- `PLAN.md §Phase 0` — pre-flight decisions that gate Phase 1.
