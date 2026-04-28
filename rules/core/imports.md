---
title: Import policy
applies_to:
  - "app/**/*.ts"
  - "app/**/*.tsx"
canonical: true
generates:
  - .cursor/rules/10-imports.mdc
---

# Import policy

> Canonical source. Per-tool overlays are generated from this file.

## React Router, not Remix

This Hydrogen project uses **React Router** packages, not Remix packages.

### Forbidden

- Any imports from `@remix-run/*`.
- Any imports from `react-router-dom`.

### Required

- Use `react-router` (and `@react-router/*` packages) consistent with the existing codebase.

## When copying external examples

- Translate `@remix-run/react` usage to the equivalent React Router usage used in this repo.
- Before introducing a new `@react-router/*` package import, verify it is already used in the repo or is required by the current code path.

## Path aliases

| Alias            | Resolves to        |
| ---------------- | ------------------ |
| `@layout/*`      | `app/layout/`      |
| `@modules/*`     | `app/modules/`     |
| `@components/*`  | `app/components/`  |
| `@platform/*`    | `app/platform/`    |
| `@styles/*`      | `app/styles/`      |
| `~/*`            | App root (escape hatch — use only when no bucket alias fits) |

### Forbidden

- `@/*` root alias.
- Overlapping aliases.
- Deep relative imports across boundaries (`../../../modules/...`).

## Default practice

Match import patterns already present in adjacent files. Editor rules + ESLint enforce these constraints; if you find yourself fighting them, re-read the architecture rules in `architecture.md`.

## No barrel files

- Never create or use barrel export files (`index.ts`, `index.js`, etc.).
- Always use explicit imports: `import {Button} from '@components/Button'` — never `import {Button} from '@components'`.
- Barrel files hide dependencies and make imports less explicit.

## Prefer named exports

- Use named exports for components, hooks, utilities, and types: `export function Button() {}`.
- Use default exports only when required by frameworks (React Router routes, Vite config, etc.).
- Named exports make refactoring safer and imports more explicit.
