---
title: Rules for store forks
applies_to:
  - "app/**/*"
canonical: true
audience: store-fork
---

# Rules for store forks

> Active in any consumer repo that is a **fork** of `hydrogen-storefront-starter` (a real running store). The starter itself follows these rules pre-emptively so forks inherit them.

## Brand layer

- 100% of per-store divergence lives in:
  - `app/config/brand.ts` — the typed brand interface (name, slogan, colours, fonts, social handles, locales, contact).
  - `app/assets/brand/` — visual assets (`logo.svg`, `og-default.png`, `favicon.svg`, theme tokens CSS).
- **No** hardcoded brand strings outside these two locations.
- Title / meta defaults, footer copy, contact info, OpenGraph defaults, theme CSS variables all read from `brand.ts` or `app/assets/brand/`.

## Core vs. app split

The starter is divided into two layers:

| Layer | What lives here | Sync behaviour |
|---|---|---|
| **Core** | `app/platform/*`, `app/routes.ts`, `tsconfig.json`, `eslint.config.js`, the `*.route.tsx` / `*.view.tsx` contract, the architecture rules | Synced from upstream — modify upstream, never in the fork |
| **App** | `app/modules/*` body, `app/styles/*`, `app/assets/*`, `app/config/*` | Per-store — modify freely in the fork |

- Core files carry a top-comment marker: `// SYNCED FROM @commerce-atoms/agents — modify upstream`.
- A smoke test fails if a "core" file's hash diverges from the version pinned by `agents.config.json`.
- Upgrades: bump `@commerce-atoms/agents` → `npx commerce-atoms-agents sync` → run tests → commit.

## AGENTS.md overlay

- Each fork ships its own `AGENTS.md` that **extends** `@commerce-atoms/agents@<x.y.z>`.
- Pinned version recorded in `agents.config.json`.
- Store-specific context (brand, locales, catalog quirks) lives in the overlay, not in the upstream.

## Feature flags

- Optional modules are gated by `app/config/features.ts` (`enableSearch`, `enableBlog`, `enableCollections`, etc.).
- Build pruning eliminates code paths whose flag is off.
- `app/routes.ts` registers routes conditionally based on flags.

## Deploy

- **GitHub Actions deploys**, the agent never invokes `shopify hydrogen deploy` directly.
- Deploy triggered by `push to main` and `workflow_dispatch`.
- Pipeline: install → codegen → typecheck → lint → test → build → deploy to Oxygen.
- The `/deploy-setup`, `/deploy-check`, `/release` slash commands wrap CI — they prepare and validate, they never deploy.

## Cross-store learning loop

- When a fork develops a useful pattern, run `/back-port` to diff the fork against the kit and propose upstream PRs for **core**-classified changes.
- App-classified divergence stays in the fork.
