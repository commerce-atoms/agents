---
title: Architecture boundaries and policies
applies_to:
  - "app/**/*.ts"
  - "app/**/*.tsx"
canonical: true
generates:
  -.cursor/rules/30-architecture-boundaries.mdc
---

# Architecture boundaries and policies

> Canonical source. Mirror edits into `.cursor/rules/30-architecture-boundaries.mdc` by hand until automated overlay generation lands ([ADR 001](././docs/decisions/001-agents-distribution-mechanism.md)). Consumers pull kit updates with `npx commerce-atoms-agents sync`.

## 1. Module boundaries

### Zero module-to-module imports

- Modules **NEVER** import from other modules. No exceptions.
- This is non-negotiable and enforced by smoke tests in the consumer repo.

### Allowed imports from within a module

- Relative imports within the same module subtree.
- `app/components/*` (shared UI).
- `app/hooks/*` (generic UI hooks only).
- `app/utils/*` (generic utilities only).
- `app/platform/*` (infrastructure).
- `app/layout/*` (app shell. Can import from modules for shell integration).
- `@commerce-atoms/*` (pure logic packages).

### Forbidden imports

- `app/modules/<other>/*`. Any cross-module import.
- Platform code importing from modules.
- Components, hooks, utils importing from modules.

### Cross-module reuse ladder (in order)

1. **Duplicate intentionally** for small, unstable pieces (< 50 lines).
2. **Promote to `app/components/**`** for shared UI:
   - `primitives/`. Domain-agnostic building blocks.
   - `catalog/`. Filter / sort controls.
   - `commerce/`. Shared commerce UI (cart, product card).
   - `pagination/`. Pagination wrappers.
3. **Promote to `app/hooks/*`** for generic UI hooks only.
4. **Promote to `app/utils/*`** for generic utilities only.
5. **Extract pure logic to `@commerce-atoms/*`** for reusable business logic.
6. **Create platform utilities** for infrastructure helpers.

## 2. Shared folders policy

### `app/components/*`. Shared UI components

#### Structure (subfolders for organisation)

`app/components/` is organised into subfolders to prevent it from becoming a junk drawer:

- `primitives/`. Pure UI building blocks (domain-agnostic).
  - Examples: `Button`, `Input`, `Loading`, `Price`.
  - Must be truly generic; no domain concepts.
- `catalog/`. Catalog browsing controls (filter / sort UI only).
  - Examples: `CheckboxGroup`, `RangeInput`, `SortSelect`.
  - Used by Search and Collections (and future catalog surfaces).
  - **Not** "primitives". Encodes filter / sort intent.
- `commerce/`. Shared commerce UI (cart, product card).
  - Examples: `ProductCard`, `CartPanel`, `CartLineItem`, `CartSummary`.
  - Used across modules / layout.
  - Allowed to accept Shopify fragments (shared commerce surface).
- `pagination/`. Shared pagination wrappers.
  - Examples: `PaginatedResourceSection`.
  - Must remain purely presentational. No schema logic.

#### Allowed

- Shared UI components used across multiple modules or by layout.
- Components can be domain-specific if shared (e.g. `ProductCard` in `commerce/`).
- Shopify types acceptable in `commerce/` subfolder (shared commerce surface).

#### Forbidden

- Components that fetch data or call Storefront API.
- Components specific to a single module.
- Imports from `app/modules/*`.
- Loader / session / Shopify context in `app/components/*`.

#### Rule of thumb

Promote to `app/components/**` when a component is reused across 2+ modules or by layout, even if domain-specific. Use subfolders to keep primitives vs. domain-shared controls separate.

### `app/hooks/*`. Generic UI hooks

#### Structure

All hooks organised in subfolders. No root-level hooks.

- `app/hooks/primitives/**`. Domain-agnostic hooks (truly cross-domain).
- `app/hooks/catalog/**`. Catalog-specific UI hooks (used by Search + Collections).
- Future: `app/hooks/<domain>/**` for other domain-specific shared hooks.

#### Allowed

- `primitives/` subfolder: UI-level, domain-agnostic React hooks **only**.
  - Examples: `useDocumentTitle`, `useDebounce`, `useMediaQuery`, `useClickOutside`.
  - Must be truly cross-domain and stable.
  - No Shopify / Storefront API types.
  - No business logic.
- `<domain>/` subfolders: domain-specific hooks shared across modules.
  - Example: `catalog/useSearchStateNavigation` (catalog/search-specific but shared).
  - Used by 2+ modules.

#### Forbidden

- Root-level hooks (must be in subfolders).
- Hooks that use Shopify / Storefront API types (unless in module).
- Hooks with business logic (unless in module).
- Imports from `app/modules/*`.

#### Rule of thumb

If it references domain concepts or Shopify types, keep it in the module. Or use a domain subfolder if shared across modules.

### `app/utils/*`. Generic utilities

#### Allowed

- Small cross-module app-level utilities (non-React).
- May encode business meaning but must be:
  - Non-React (no React dependencies).
  - Non-Shopify-API (no Storefront API calls).
  - Used by 2+ modules.
- Examples: date formatting, string helpers, type guards, filter helpers, sort options.
- Must be < 150-200 LOC per file.

#### Forbidden

- Module-specific utilities (move to `modules/<module>/utils/`).
- Functions using Shopify / Hydrogen types (unless truly cross-module).
- Anything that will grow into a library.
- Imports from `app/modules/*`.

#### Rule of thumb

- Reusable logic → promote to `@commerce-atoms/*`.
- Module-specific → move to `modules/<module>/utils/`.
- Infra glue → move to `app/platform/*`.
- Domain-specific → keep in module.

## 3. Keep shared folders flat

- `app/hooks/*` uses subfolders (`primitives/`, `catalog/`, etc.).
  - All hooks must be in subfolders. No root-level hooks.
  - `primitives/` for domain-agnostic hooks (matches `components/primitives/`).
  - `<domain>/` for domain-specific but shared hooks.
- `app/utils/*` must be flat. No subfolders.
- `app/components/*` uses subfolders (`primitives/`, `catalog/`, `commerce/`, `pagination/`).
  - CSS modules MUST be colocated with components (same subfolder).
  - Do **not** create additional subfolders within these subfolders.

## 4. Platform policy (`app/platform`)

### Allowed

- Storefront API client setup.
- Session / cookie management.
- Caching helpers.
- Generic request / response utilities.
- SEO defaults and global metadata helpers.

### Forbidden

- Business logic that belongs to a domain.
- Feature-specific data shaping and orchestration.
- UI concerns.
- Imports from `app/modules/*`.

## 5. Module scaling. Start flat

### Default

Modules start flat: route / view pairs in the module root.

### Introduce subfolders only when needed

- `routes/` when > 3 routes or nested routing complexity exists.
- `components/` when UI is reused across routes or views become noisy.
- `graphql/` when multiple queries / mutations / fragments exist.
- `utils/` when non-UI helpers are reused or sizable.

### GraphQL organisation

#### Start consolidated (default)

- `graphql/queries.ts`. All queries.
- `graphql/fragments.ts`. Only if reusable fragments exist.
- `graphql/mutations.ts`. Only if mutations exist.

#### Split into subfolders only when

- `queries.ts` exceeds 250-400 LOC or is hard to scan.
- Fragments proliferate and ownership becomes unclear.
- Multiple routes need different subsets.

#### If splitting, use structure

- `graphql/queries/` folder.
- `graphql/mutations/` folder.
- `graphql/fragments/` folder.
- **No** verbose filenames like `add-to-cart.mutation.graphql.ts`.

#### Critical rules

- Don't over-normalise fragments. Only extract if reused or query is huge.
- Keep documents near the domain that owns them.
- **No cross-module GraphQL sharing.**

### Structure should follow real complexity

- Do not add folders for symmetry.
- Do not pre-structure modules "for the future".
- GraphQL files stay consolidated until they hit friction.

## 6. Route / view separation

### `*.route.tsx` MUST

- Own loaders / actions and data orchestration.
- Own metadata exports and `handle` exports for layout.
- Own redirects, validation, and errors.
- Own Storefront API calls and caching decisions.

### `*.view.tsx` MUST

- Render UI only.

### `*.view.tsx` MUST NOT

- Fetch Storefront API data.
- Write sessions / cookies.
- Define `loader` / `action` / `meta` / `headers`.

## 7. Forbidden dumping-ground folders

- `app/lib`
- `app/common`
- `app/shared`
- `app/ui`

If you find yourself wanting to create one, the answer is in the cross-module reuse ladder above.
