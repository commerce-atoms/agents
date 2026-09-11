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
    ├── store-example/  → github.com/commerce-atoms/store-example  (private)
    ├── store-acme/     → github.com/commerce-atoms/store-acme     (private)
    └── …
```

Remote conventions:

- Each store is its own independent GitHub repo, **private** by default.
- Internal stores live at `github.com/commerce-atoms/store-<name>` — single org keeps secrets, billing, and Trusted Publishing config in one place. Public visitors only see public repos.
- Customer stores live under the customer's own org (`github.com/<customer>/<repo>`); the customer owns the code.
- Local directory name matches the remote (`stores/store-example/` ↔ `commerce-atoms/store-example`).
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

### Project-local additions — `AGENTS.local.md`

The canonical `AGENTS.md` is synced from `@commerce-atoms/agents` and enforced by the drift gate — editing it directly fails CI. For per-repo additions (product briefs, deployment specifics, project-only conventions), create `AGENTS.local.md` at the repository root.

The canonical `AGENTS.md` instructs every consuming agent to read `AGENTS.local.md` after it. Because `CLAUDE.md` and `.github/copilot-instructions.md` both start with "read AGENTS.md first", coverage is universal from a single consumer-owned file — no `CLAUDE.local.md` or `copilot-instructions.local.md` needed.

**Sync-safe by construction.** `agents:sync` operates only on files listed in the kit inventory; `AGENTS.local.md` isn't in the inventory, so sync leaves it untouched and the drift gate stays green. Commit the file to the repo — it's project source, not a machine-generated artefact.

**Cursor rules.** `.cursor/rules/*.mdc` don't need a `.local` variant: any `.mdc` file the consumer adds is loaded automatically by Cursor and ignored by sync (kit inventory tracks only the numbered rule files it ships). Use a project-local `.mdc` when you want a tool-specific, always-in-context overlay in addition to what `AGENTS.local.md` covers universally.

## Feature flags

- Optional modules are gated by `app/config/features.ts` (`enableSearch`, `enableBlog`, `enableCollections`, etc.).
- Build pruning eliminates code paths whose flag is off.
- `app/routes.ts` registers routes conditionally based on flags.

## Deploy

- **GitHub Actions deploys**, the agent never invokes `shopify hydrogen deploy` directly.
- Two workflows split the responsibility:
  - **Validation gate** — `.github/workflows/ci.yml` runs on every PR + `push:main`. Blocks merge via branch protection. Pipeline: install → lint → codegen → typecheck → test → validate-architecture.
  - **Deployer** — `.github/workflows/oxygen-deployment-<storefrontId>.yml` is **auto-provisioned by Shopify** when a Hydrogen storefront is linked to the repo. Trigger: `push` on any branch. Production on `main`, preview URL per branch elsewhere. One workflow file per Hydrogen storefront (multi-storefront setups get multiple files).
- Runtime env (`PUBLIC_STORE_DOMAIN`, `PUBLIC_STOREFRONT_ID`, tokens, `SESSION_SECRET`, etc.) lives in **Oxygen storefront settings** (Shopify Admin), not GitHub Actions secrets. The only GitHub secret is `OXYGEN_DEPLOYMENT_TOKEN_<storefrontId>`, which Shopify auto-manages.
- The kit does **not** ship a competing deploy workflow — accepting Shopify's auto-provisioned PR is a step in `/deploy-setup`. Legacy kit-shipped `deploy.yml` files from versions ≤ 0.3.3 must be removed to avoid duplicating every prod deploy.
- The `/deploy-setup`, `/deploy-check`, `/release` slash commands wrap CI — they prepare and validate, they never deploy.

## Cross-store learning loop

- When a fork develops a useful pattern that belongs upstream, open PRs against `hydrogen-storefront-starter` (core layers) or `@commerce-atoms/agents` (rules / personas).
- A `/back-port` slash command is **backlog** (`commands/README.md`) — until then, back-port manually with `git diff` / cherry-pick.
- Store-specific divergence stays in the fork.
