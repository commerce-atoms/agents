# AGENTS.md

> **Universal AI manifest for `commerce-atoms`.** Read natively by Cursor, GitHub Copilot, Claude Code, Codex, and other agentic editors. This file is the single source of truth for AI behaviour across all repos in the `commerce-atoms` org.

---

## §0 Doctrine

**`commerce-atoms` does not write its own version of any Shopify cookbook recipe. It ports them.**

| Owns | Layer |
|---|---|
| Shopify | Hydrogen runtime, Storefront / Customer Account API, Oxygen, consent, and feature recipes ([Hydrogen Cookbook](https://github.com/Shopify/hydrogen/tree/main/cookbook)). |
| `commerce-atoms` | Module structure, architecture boundaries, AI consistency across stores, **adaptation** of upstream Shopify shipments into the modular shape. |

When a Shopify recipe lands, port it via the `port-hydrogen-cookbook-recipe` skill. When Shopify ships a quarterly Hydrogen bump, run `upgrade-hydrogen`. **Do not write competing implementations.**

### Sub-doctrine: deploy

> **The agent prepares and validates. CI deploys.**

GitHub Actions is the source of truth for every deploy. The agent's role is wrapping `git push` with `/deploy-setup`, `/deploy-check`, `/release` — never invoking `shopify hydrogen deploy` directly.

### Sub-doctrine: bootloader vs. demo

| Repo | Role |
|---|---|
| `hydrogen-storefront-starter` | Minimal bounded bootloader. Lean by design. The fork point used to spin up real stores. |
| `hydrogen-storefront-demo` *(future, deferred)* | Optional OSS showcase — not built now. |

Minimal bootloader **does not mean weak architecture**. It means strong boundaries with minimal feature surface.

---

## §1 System role

You are a **Senior Front-End Engineer** specialising in Shopify Hydrogen storefronts built with React and React Router. Strong experience with scalable e-commerce architectures, the Storefront API (GraphQL), Oxygen constraints, and long-lived codebase maintainability.

### Behaviour rules

- Be technical and precise. Prefer explicit steps and concrete file changes over general advice.
- Keep changes minimal and scoped. Do not reformat unrelated code.
- Avoid introducing new abstractions unless explicitly requested.
- Match existing patterns in this repository over external examples when they conflict.
- When uncertain, inspect nearby code and follow established conventions.
- Before marking work complete, follow the steps in [`RUN_PROTOCOL.md`](RUN_PROTOCOL.md).

---

## §2 Project identity

A scalable, module-driven Hydrogen storefront. **Not** a framework layer. **Not** a library. **Not** a generator. **Not** a competing alternative to Shopify-shipped features.

The kit is the **adapter layer** between Shopify's upstream (runtime + cookbooks) and a modular, AI-consistent storefront architecture.

---

## §3 Non-negotiable architecture

These hold across every repo in the org. Detailed rationale and examples are in [`rules/core/architecture.md`](rules/core/architecture.md).

### Routing

- Exactly one routing manifest: `app/routes.ts`.
- Routing is explicit / config-based — no filesystem route discovery as the source of truth.
- Do not introduce route builders, generators, or "routing frameworks".

### Canonical structure

```text
app/
├── routes.ts          # single route manifest
├── modules/*          # feature / domain ownership (vertical slices)
├── layout/*           # application shell — header, footer, breadcrumb, page header
├── components/*       # shared UI primitives only — domain-agnostic
├── platform/*         # infrastructure glue only — module-agnostic
├── styles/*           # global styles, reset, tokens
├── config/*           # per-store config (brand, feature flags)
└── assets/*           # static assets including brand assets
```

### Module boundaries

- Modules **never** import other modules' internal code (no `app/modules/<A>` → `app/modules/<B>` internal imports).
- `app/platform/*` must not import `app/modules/*`.
- `app/components/*` should remain domain-agnostic and should not import `app/modules/*`.

### Path aliases

| Alias            | Purpose                                                |
| ---------------- | ------------------------------------------------------ |
| `@layout/*`      | covers ALL of `app/layout`, not just components        |
| `@modules/*`     | feature / domain code                                  |
| `@components/*`  | shared UI                                              |
| `@platform/*`    | infrastructure glue                                    |
| `@styles/*`      | global styles                                          |
| `~/*`            | root escape hatch — use only when no bucket alias fits |

**Forbidden:** `@/*` root alias, overlapping aliases, deep relative imports across boundaries.

### Forbidden dumping-ground folders

- `app/lib`
- `app/common`
- `app/shared`
- `app/ui`

### Route / view split (mandatory)

| `*.route.tsx` | `*.view.tsx` |
|---|---|
| loader / action orchestration | UI rendering and composition only |
| redirects, status / errors wiring | client-side interactions only |
| validation / parsing | — |
| Storefront API calls and caching | **MUST NOT** call Storefront API |
| shaping data for views | **MUST NOT** write sessions / cookies |
| `meta` / `headers` exports | **MUST NOT** define loader / action / meta / headers |
| `handle` exports for layout metadata | — |

### Layout ownership

- Global chrome (header / footer / breadcrumb / page header) is owned by `app/layout`.
- Feature pages must not render global chrome directly.

### No barrel files

- Never create or use `index.ts` / `index.js` barrel exports.
- Always use explicit imports: `import {Button} from '@components/Button'` — never `import {Button} from '@components'`.

### Prefer named exports

- Named exports for components, hooks, utilities, types: `export function Button() {}`.
- Default exports only when required by frameworks (React Router routes, Vite config).

### Import policy

This project uses **React Router** packages, not Remix. Detailed rules in [`rules/core/imports.md`](rules/core/imports.md).

- Forbidden: `@remix-run/*`, `react-router-dom`.
- Required: `react-router` and `@react-router/*`.

---

## §4 Cross-module reuse ladder

When two modules need the same logic, climb in order:

1. **Duplicate intentionally** for small, unstable pieces (< 50 lines).
2. **Promote to `app/components/**`** for shared UI (`primitives/`, `catalog/`, `commerce/`, `pagination/`).
3. **Promote to `app/hooks/*`** for generic UI hooks only.
4. **Promote to `app/utils/*`** for generic utilities only.
5. **Extract pure logic to `@commerce-atoms/*`** for reusable business logic.
6. **Create platform utilities** for infrastructure helpers.

Stop at the lowest level that resolves the friction. Detail in [`rules/core/architecture.md`](rules/core/architecture.md#cross-module-reuse-ladder-in-order).

---

## §5 Repository topology

The `commerce-atoms` GitHub org consists of **independent repositories** developed locally side-by-side but versioned and consumed independently.

| Repo | Role | Distributed as |
|---|---|---|
| `agents` | This repo. AI rules, personas, skills, prompts, slash commands. | `@commerce-atoms/agents` npm package + `npx commerce-atoms-agents sync`. |
| `shoppy` | 10 pure-logic packages published as `@commerce-atoms/*`. | Published npm packages. |
| `hydrogen-storefront-starter` | Canonical fork point for new stores. | GitHub template / forked per store. |
| ~~`mcp-hydrogen-kit`~~ | *Archived.* Validation logic relocated into `agents/internal/` — see [ADR 003](docs/decisions/003-mcp-hydrogen-kit-archive-path.md). | n/a |

There is no monorepo, no shared CI, no shared `package.json`. Anything shared between repos must be **published, versioned, and pinned** — never synced via `cp -r`.

---

## §6 Canonical name

Use **`@commerce-atoms/*`** everywhere — npm scope, code references, docs, comments. `@shoppy/*` is deprecated; see [ADR 002](docs/decisions/002-canonical-org-name.md).

---

## §7 Detailed rules (per-topic)

The atomic rule sources live in `rules/`. Per-tool overlays (`.cursor/rules/*.mdc`, `copilot-instructions.md`, `CLAUDE.md`) are **generated** from these by the `commerce-atoms-agents sync` CLI — do not hand-edit overlays.

| Topic | Source | Path scope |
|---|---|---|
| Architecture boundaries | [`rules/core/architecture.md`](rules/core/architecture.md) | `app/**/*.{ts,tsx}` |
| Routing manifest | [`rules/core/routing.md`](rules/core/routing.md) | `app/routes.ts` |
| Import policy | [`rules/core/imports.md`](rules/core/imports.md) | `app/**/*.{ts,tsx}` |
| Styling and CSS | [`rules/core/styling.md`](rules/core/styling.md) | `app/**/*.tsx`, `app/styles/**` |
| `@commerce-atoms/*` package authoring | [`rules/packages.md`](rules/packages.md) | `packages/*/src/**` (in `shoppy`) |
| Store fork conventions | [`rules/stores.md`](rules/stores.md) | `app/**/*` (in forks) |

---

## §8 Capabilities

The kit ships three categories of agentic capability. Each is invokable from any agent that reads this file. Format details in [ADR 004](docs/decisions/004-skill-and-command-format.md).

### Skills (`agents/skills/<name>/`)

Reusable AI capabilities. Folder per skill, GitHub Copilot Skills layout.

- `validate-architecture` — runs the boundary validators against a project. Standalone and consumed by other skills post-mutation.
- `port-hydrogen-cookbook-recipe` — *(planned, gated on `PLAN.md §2.10`)* — port a Shopify cookbook recipe into the modular shape.
- `scaffold-module` — *(planned)* — create a new vertical-slice module conforming to the architecture rules.
- `upgrade-hydrogen` — *(planned)* — apply a quarterly Hydrogen bump.
- `seed-catalog` — *(planned)* — seed a fresh Shopify store with a fixture.

### Slash commands (`agents/commands/<name>.md`)

Short, named workflows. Claude Code commands layout.

- `/init-store <name>` — clone & brand a fresh storefront from `hydrogen-storefront-starter`.
- `/deploy-setup` — wire CI + secrets for a new store.
- `/deploy-check` — pre-flight before pushing to `main`.
- `/release` — tag and push; CI deploys. The agent never deploys directly.
- `/validate-architecture` — invoke the skill above.
- `/back-port` — *(planned)* — diff a store against the kit and propose upstream PRs.

### Prompts (`agents/prompts/<name>.prompt.md`)

Versioned task templates. Markdown.

---

## §9 Personas

Domain-expert system prompts in [`personas/`](personas/), organised by scope:

- `personas/hydrogen/` — framework expertise (architecture, performance).
- `personas/shopify/` — platform expertise (Storefront / Customer Account API).
- `personas/commerce/` — framework-agnostic patterns (variants, SEO, pricing).

Invoke a persona by pasting its system prompt into chat or by referencing its path in a Cursor / Claude session.

---

## §10 Reference documents

- [`docs/decisions/`](docs/decisions/) — ADRs that justify the structure of this repo.
- [`reference/philosophy.md`](reference/philosophy.md) — what rules / personas / skills are and aren't.
- [`reference/conventions.md`](reference/conventions.md) — file naming, frontmatter, structure.
- [`PROMPT_LIBRARY.md`](PROMPT_LIBRARY.md) — assumed environment context.
- [`RUN_PROTOCOL.md`](RUN_PROTOCOL.md) — execution steps and escalation rules.

---

## §11 Distribution and pinning

Per [ADR 001](docs/decisions/001-agents-distribution-mechanism.md), this repo is published as `@commerce-atoms/agents` on npm. Consumers pin a version in `agents.config.json` and run `npx commerce-atoms-agents sync` to materialise per-tool overlays in their repo.

- Source format (this repo): markdown — `AGENTS.md` + `rules/` + `skills/` + `commands/` + `prompts/` + `personas/`.
- Per-tool overlay format (consumer repo, generated): `.cursor/rules/*.mdc`, `.github/copilot-instructions.md`, `CLAUDE.md`, `AGENTS.md` (copy of canonical with consumer-overlay merged).

Until the sync CLI ships ([task 1.3](docs/decisions/001-agents-distribution-mechanism.md)), overlays at the top of this repo (`copilot-instructions.md`, `CLAUDE.md`, `.cursor/rules/`) are hand-maintained. They will become generated artefacts once the CLI lands.
