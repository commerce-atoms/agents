---
title: Rules for `@commerce-atoms/*` package authors
applies_to:
  - "packages/*/src/**/*.ts"
  - "packages/*/src/**/*.tsx"
canonical: true
audience: shoppy
---

# Rules for `@commerce-atoms/*` package authors

> Active when working **inside** the `shoppy` monorepo (the source of `@commerce-atoms/*` packages). The starter and other consumers use these packages but do not author them.

## Package design

### Pure logic only

- **Zero runtime dependencies on framework packages** — no `react`, no `@shopify/hydrogen`, no `@react-router/*` in any `package.json#dependencies`.
- Framework integrations live in the consumer (`hydrogen-storefront-starter` glues `@commerce-atoms/seo` into React Router `MetaDescriptor[]`, etc.).

### One concept per package

- 10 packages, each scoped to one commerce concept (`cart`, `filters`, `money`, `seo`, `urlstate`, `variants`, `pagination`, `metafield`, `discounts`, `date`).
- A new concept warrants a new package — not an extension of an existing one.

### Zero cross-package imports

- Packages do **not** import from each other.
- If two packages would benefit from sharing logic, either:
  - Duplicate (preferred for small, unstable pieces).
  - Inline the shared logic in both with a `// see @commerce-atoms/<other>/<path>` comment.
- Cross-package dependencies break independent versioning.

## Subpath exports

- Use granular subpaths: `./meta/buildPageMeta`, `./pagination/setPage`, `./filters/applyPrice`.
- Tree-shaking depends on it.
- No barrel files (`./index`).

## Versioning

- Independent semver per package.
- Publish deliberately — coordinate bumps with consumers when behaviour changes.

## Naming

- Package name: `@commerce-atoms/<concept>`. Never `@shoppy/*` (deprecated; see ADR 002).
- Repo directory: `shoppy/packages/<concept>/`.

## Tests

- Each package owns its own unit tests.
- CI runs `verify` = typecheck + lint + build + tests + `pack:check` + consumer ESM smoke install.
- JSON-LD-emitting code MUST have shape-snapshot tests (see `seo`).

## Lint

- `@typescript-eslint/no-explicit-any` is **on** at error level. Localised disables with reasons only.

## Documentation

- Package `README.md` describes the public API and at least one consumer example.
- Generated docs live alongside source where relevant (e.g. JSDoc that emits TypeScript declarations).

## When to extract from the starter

Use the cross-module reuse ladder in `core/architecture.md`. Promotion to `@commerce-atoms/*` is the **final** step and applies only when:

1. The logic is pure (no framework, no Shopify runtime).
2. The logic is reused by 2+ consumers in practice.
3. The shape is stable enough to commit to.

If any of those is uncertain, keep the logic in the consumer module or in `app/utils/*`.
