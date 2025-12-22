# Copilot Instructions for Hydrogen Storefronts

You are assisting with a **Shopify Hydrogen storefront** built with React and React Router.

## Project Architecture

This is a module-driven architecture with strict boundaries:

### Directory Structure

```
app/
├── routes.ts          # Single route manifest (explicit, not filesystem-based)
├── modules/*          # Feature domains — vertical slices
├── components/*       # Shared UI — domain-agnostic primitives
├── layout/*           # Application shell — header, footer, navigation
├── platform/*         # Infrastructure — sessions, i18n, routing
└── styles/*           # Global design tokens
```

### Key Constraints

1. **Single Route Manifest**: All routes defined in `app/routes.ts` only. No filesystem routing.

2. **Module Boundaries**: Modules NEVER import from other modules. This is non-negotiable.

3. **Route/View Split**:
   - `*.route.tsx` — loaders, actions, API calls, meta/headers
   - `*.view.tsx` — UI rendering only, no data fetching

4. **Import Policy**: Use `react-router` packages only. Never use `@remix-run/*` or `react-router-dom`.

5. **No Barrel Files**: Always use explicit imports like `import {Button} from '@components/Button'`.

6. **CSS Modules**: Must be colocated with components. Use lowercase kebab-case filenames.

## Allowed Imports

From within a module, you may import:
- Relative imports within the same module
- `app/components/*` (shared UI)
- `app/hooks/*` (generic UI hooks)
- `app/utils/*` (generic utilities)
- `app/platform/*` (infrastructure)
- `app/layout/*` (app shell)
- `@shoppy/*` (pure logic packages)

## Forbidden

- Cross-module imports (`app/modules/A` → `app/modules/B`)
- Platform importing from modules
- Components/hooks/utils importing from modules
- Dumping ground folders: `app/lib`, `app/common`, `app/shared`, `app/ui`
- Barrel export files (`index.ts`)

## Behavior Guidelines

- Be technical and precise
- Keep changes minimal and scoped
- Match existing patterns in this repository
- Do not reformat unrelated code
- Avoid new abstractions unless explicitly requested

## Path Aliases

- `@layout/*` → `app/layout/`
- `@modules/*` → `app/modules/`
- `@components/*` → `app/components/`
- `@platform/*` → `app/platform/`
- `@styles/*` → `app/styles/`
- `~/*` → App root (escape hatch)

## Documentation

See `docs/` for detailed guidance:
- `docs/reference/MODULES.md` — Module structure
- `docs/reference/ROUTING.md` — Routing conventions
- `docs/guides/ADD_FEATURE.md` — Adding features

