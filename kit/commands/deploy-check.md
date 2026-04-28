---
name: deploy-check
description: Pre-flight verification before pushing to main. Reproduces the CI gates locally so the push doesn't fail in production.
arguments: []
---

# `/deploy-check`

> Doctrine reminder (`AGENTS.md §0` sub-doctrine): **the agent prepares and validates. CI deploys.** This command validates locally; CI runs the same gates again on push.

Reproduce the CI gates locally before `git push origin main`. If anything fails, fix it and re-run — do not push a broken change and rely on CI to catch it.

## Prerequisites

- Working tree should ideally be clean. Uncommitted changes are validated but flagged.
- Dependencies installed (`npm install` or `npm ci`).

## Workflow

Run each step in order. Stop on the first failure and surface the output to the operator.

### 1. Working tree status

```bash
git status --porcelain
```

If output is non-empty, surface a warning: *"Uncommitted changes detected — they will be excluded from the push but included in the local pre-flight."*

### 2. Codegen

```bash
npm run codegen
```

Must succeed. If GraphQL fragments / types drift, codegen reports it; commit any regenerated files before proceeding.

### 3. TypeScript

```bash
npm run typecheck
```

Zero errors required.

### 4. Lint

```bash
npm run lint
```

Zero errors required. Warnings are surfaced but do not block.

### 5. Tests

```bash
npm test
```

Full unit + integration suite. All green.

### 6. Build

```bash
npm run build
```

Production build must succeed. Bundle-size regressions are not blocking but are surfaced.

### 7. Architecture validation

```bash
npx @commerce-atoms/agents validate-architecture
```

Zero errors required (the [validate-architecture skill](../skills/validate-architecture/SKILL.md)).

### 8. Summary

If all eight steps pass, print:

```text
PRE-FLIGHT PASSED — safe to push.

Push when ready:
  git push origin main

Or, if the change warrants a release: /release
```

## Done when

- All eight steps exit 0 (with warnings allowed only at step 1, codegen-clean, and lint).
- Operator has been told whether to push directly or to `/release`.

## Failure modes

| Failure | Remedy |
|---|---|
| codegen drift | Commit regenerated GraphQL types. |
| typecheck fails | Fix the TS errors; do not loosen `tsconfig` to silence them. |
| lint fails | Fix the rule violations; do not suppress globally. |
| validate-architecture fails | Resolve the violations per the cross-module reuse ladder. |
| Build fails | Inspect Vite / Oxygen-specific errors; do not work around them. |

## See also

- [`commands/deploy-setup.md`](deploy-setup.md) — one-time CI wiring.
- [`commands/release.md`](release.md) — versioned release.
- [`AGENTS.md §0`](../AGENTS.md) — deploy doctrine.
