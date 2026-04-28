---
title: Rules for store forks
applies_to:
  - "app/**/*"
canonical: true
audience: store-fork
---

# Rules for store forks

> Active in any consumer repo that is a **fork** of `hydrogen-storefront-starter` (a real running store). The starter itself follows these rules pre-emptively so forks inherit them.

## Topology

Local working tree convention:

```text
~/Projects/commerce-atoms/
├── agents/                       # public — the kit's AI manifest + sync CLI
├── shoppy/                       # public — @commerce-atoms/* npm packages
├── hydrogen-storefront-starter/  # public — fork point for new stores
├── .github/                      # public — org profile + ops scripts
└── stores/                       # local-only convention; not a single git repo
    ├── store-bonzoverse/         → github.com/commerce-atoms/store-bonzoverse  (private)
    ├── store-doctor-undefined/   → github.com/commerce-atoms/store-doctor-undefined  (private)
    └── …
```

Remote conventions:

- Each store is its own independent GitHub repo, **private** by default.
- Internal stores live at `github.com/commerce-atoms/store-<name>` — single org keeps secrets, billing, and Trusted Publishing config in one place. Public visitors only see public repos.
- Customer stores live under the customer's own org (`github.com/<customer>/<repo>`); the customer owns the code.
- Local directory name matches the remote (`stores/store-bonzoverse/` ↔ `commerce-atoms/store-bonzoverse`).
- Stores are **never** mixed at the top level of `commerce-atoms/` — only `stores/` is allowed there.

## Brand layer

- 100% of per-store divergence lives in:
  - `app/config/brand.ts` — the typed brand interface (name, slogan, colours, fonts, social handles, locales, contact).
  - `app/assets/brand/` — visual assets (`logo.svg`, `og-default.png`, `favicon.svg`, theme tokens CSS).
- **No** hardcoded brand strings outside these two locations.
- Title / meta defaults, footer copy, contact info, OpenGraph defaults, theme CSS variables all read from `brand.ts` or `app/assets/brand/`.

## Core vs. app split

Conceptually the starter has two layers — shared scaffold vs. what changes per store:

| Layer | What lives here | Typical workflow |
|---|---|---|
| **Core** | `app/platform/*`, `app/routes.ts`, `tsconfig.json`, `eslint.config.js`, the `*.route.tsx` / `*.view.tsx` contract, the architecture rules | Prefer upstream PRs for improvements — fork pulls `hydrogen-storefront-starter` updates when practical |
| **App** | `app/modules/*` body, `app/styles/*`, `app/assets/*`, `app/config/*` | Per-store — edit freely in the fork |

Automatic marker comments / hash checks on "core" files are **not** enforced yet — track upstream discipline manually until tooling lands.

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

- When a fork develops a useful pattern that belongs upstream, open PRs against `hydrogen-storefront-starter` (core layers) or `@commerce-atoms/agents` (rules / personas).
- A `/back-port` slash command is **backlog** (`commands/README.md`) — until then, back-port manually with `git diff` / cherry-pick.
- Store-specific divergence stays in the fork.
