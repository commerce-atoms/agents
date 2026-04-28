# ADR 003 — `mcp-hydrogen-kit` archive path

- **Status:** Accepted
- **Date:** 2026-04-28
- **Tags:** `mcp-hydrogen-kit`, `architecture-validation`, `phase-0`
- **Source:** `PLAN.md §0.3`; `REVIEW.md §8.4`, `§9 Track A #6`

## Context

`mcp-hydrogen-kit` shipped four read-only MCP tools intended to validate Hydrogen codebases (route discovery, file outlining, schema lookup, architecture validation). All four have been overtaken:

| Tool | Replaced by |
|---|---|
| Route discovery | Cursor's semantic search + Read tool |
| File outlining | Same — modern IDE AI handles natively |
| Schema lookup | Shopify's official Storefront MCP |
| Architecture validation | Local vitest smoke tests + cursor rules |

What survives is **the architecture-validation idea**: every cookbook port and every architecture-touching change should be checkable against `AGENTS.md` rules. `REVIEW.md §8.4` proposes resurrecting that idea as a **skill**, not a service. The transport (a separate MCP server) is dead weight; the validator logic is load-bearing for the doctrine in `REVIEW.md §0`.



The forcing question: **what happens to the validator logic during the archive?**

The most useful primitive in `mcp-hydrogen-kit` is `path-to-owner` inference (`architecture.graphql.validatePlacement`): given a file path, infer whether it belongs to a `module`, the `platform`, the `layout`, or `unknown`. This is the foundation of any boundary check.

## Options considered

### A — Publish primitive as a standalone npm package

`@commerce-atoms/agent-utils` containing `path-to-owner` and related validators. `agents/` consumes it as a dependency.

- **Pros:** Reusable by external consumers.
- **Cons:** No external consumers exist. Publishing, versioning, releasing a tiny package costs more than it saves; `agents/` already publishes its own package (per [ADR 001](./001-agents-distribution-mechanism.md)) — adding another is overkill.

### B — Inline primitive into `agents/internal/`

Move the path-to-owner inference and any other useful logic into `agents/internal/path-to-owner.ts` (and friends). It becomes implementation detail of the `validate-architecture` skill, not a public API.

- **Pros:** Zero new infrastructure. The logic lives where its only consumer is. Easy to evolve as the agent skills grow.
- **Cons:** Not reusable outside the agent skills (acceptable given there's no demand).

### C — Defer the archive

Keep `mcp-hydrogen-kit` alive in maintenance mode. Build the skill on top of it, eventually.

- **Pros:** No archive work now.
- **Cons:** Tax compounds — every reader of the org thinks there are four projects, the unused repo costs attention, and the validation logic stays trapped behind a transport that nobody uses.

## Decision

**Option B — Inline primitive into `agents/internal/`.**

Migrate `path-to-owner` and any other genuinely useful validation logic from `mcp-hydrogen-kit/src/tools/architecture.graphql.validatePlacement.ts` into `agents/internal/`. It becomes the implementation backbone of the `validate-architecture` skill (`PLAN.md` task `1.5`). The `mcp-hydrogen-kit` GitHub repo gets archived (read-only) once the migration lands.

Standalone packaging (Option A) gets resurrected only if a third-party consumer materialises and asks for it.

## Consequences

### Positive

- Org drops from four repos to three. Less surface to track.
- Architecture validation becomes **more** central, not less — it gets called from `validate-architecture` (standalone) and from any future skill that mutates the codebase (`port-hydrogen-cookbook-recipe`, `upgrade-hydrogen`, `scaffold-module`).
- Migration is mechanical: copy the file, port to TypeScript module conventions of `agents/`, add unit tests.

### Negative

- The MCP-server transport is gone. If a third party wanted to plug the validator into their own MCP-aware tool, they would need to reach into `agents/internal/` directly. **Accepted** — no such third party exists today.

### Neutral

- The archived `mcp-hydrogen-kit` repo gets a top-of-README banner pointing to the new home (handled by `PLAN.md` task `1.8`).

## Implementation

- **Phase 1 task 1.5** extracts the primitive into `agents/internal/path-to-owner.ts` and builds the `validate-architecture` skill on top of it.
- **Phase 1 task 1.8** archives the `mcp-hydrogen-kit` GitHub repo (banner + read-only flag).

## Revisit when

- A third-party tool needs the validator in MCP-server form.
- The validation logic outgrows `agents/internal/` (e.g. >2k LOC, multiple distinct consumers, independent release cadence justified).
