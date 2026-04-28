# Copilot instructions

> Copilot-specific overlay. The canonical AI manifest is [`AGENTS.md`](AGENTS.md) — read it first; this file extends it with Copilot-native affordances.

You are assisting with the **`commerce-atoms`** ecosystem — a Shopify Hydrogen storefront kit built around a published agent layer (`@commerce-atoms/agents`), 10 pure-logic packages (`@commerce-atoms/*` from the `shoppy` repo), and a canonical fork point (`hydrogen-storefront-starter`).

## Project architecture (summary)

Module-driven architecture with strict boundaries. **Full rules in [`AGENTS.md`](AGENTS.md) — refer to it for any architecture decision.**

```text
app/
├── routes.ts          # single route manifest (explicit, not filesystem-based)
├── modules/*          # feature domains — vertical slices
├── components/*       # shared UI — domain-agnostic primitives
├── layout/*           # application shell — header, footer, navigation
├── platform/*         # infrastructure — sessions, i18n, routing
├── styles/*           # global design tokens
├── config/*           # per-store config (brand, feature flags)
└── assets/*           # static assets including brand assets
```

## Key constraints

1. **Single route manifest** — all routes defined in `app/routes.ts` only. No filesystem routing.
2. **Module boundaries** — modules NEVER import from other modules. Non-negotiable.
3. **Route / view split** — `*.route.tsx` owns loaders / actions / API calls / meta / headers; `*.view.tsx` owns rendering only.
4. **Import policy** — `react-router` only. Never `@remix-run/*` or `react-router-dom`.
5. **No barrel files** — explicit imports always: `import {Button} from '@components/Button'`.
6. **CSS modules** — colocated with components, lowercase kebab-case filenames.
7. **No dumping-ground folders** — `app/lib`, `app/common`, `app/shared`, `app/ui` forbidden.
8. **Canonical name** — `@commerce-atoms/*` everywhere. `@shoppy/*` is deprecated.

## Path aliases

- `@layout/*` → `app/layout/`
- `@modules/*` → `app/modules/`
- `@components/*` → `app/components/`
- `@platform/*` → `app/platform/`
- `@styles/*` → `app/styles/`
- `~/*` → app root (escape hatch)

## Skills (Copilot-native)

Skills live in [`skills/`](skills/) using the GitHub Copilot Skills folder layout. Each skill has a `SKILL.md`, optional `assets/`, optional `tests/`. Available skills are listed in `AGENTS.md §8`.

## Behaviour guidelines

- Be technical and precise.
- Keep changes minimal and scoped.
- Match existing patterns in the repository over external examples.
- Do not reformat unrelated code.
- Avoid new abstractions unless explicitly requested.
- Run [`RUN_PROTOCOL.md`](RUN_PROTOCOL.md) before marking work complete.
- **Doctrinal rule**: never write a competing implementation of a Shopify cookbook feature. Port them via `port-hydrogen-cookbook-recipe`. See `AGENTS.md §0`.
