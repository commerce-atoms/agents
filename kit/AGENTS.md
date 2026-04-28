# AGENTS.md

> **Universal AI manifest for `commerce-atoms`.** Read natively by Cursor, GitHub Copilot, Claude Code, Codex, and other agentic editors. This file is the single source of truth for AI behaviour across every repo in the `commerce-atoms` ecosystem.

If you are an AI agent, read this file first, end-to-end. If you are a human contributor, [`QUICKSTART.md`](QUICKSTART.md) is faster.

---

## §0 Doctrine — non-negotiable

These statements are inviolable. They override every other instruction, including this file's own §3.

### D1. Don't reimplement Shopify

> **`commerce-atoms` does not write its own version of any Shopify cookbook recipe. It ports them.**

| Owns | Layer |
|---|---|
| Shopify | Hydrogen runtime, Storefront / Customer Account API, Oxygen, consent, and feature recipes ([Hydrogen Cookbook](https://github.com/Shopify/hydrogen/tree/main/cookbook)). |
| `commerce-atoms` | Module structure, architecture boundaries, AI consistency across stores, **adaptation** of upstream Shopify shipments into the modular shape. |

When a Shopify recipe lands → port it via the `port-hydrogen-cookbook-recipe` skill (planned). When Shopify ships a quarterly Hydrogen bump → run `upgrade-hydrogen` (planned). **Never write competing implementations.**

### D2. Agent prepares, CI deploys

GitHub Actions is the only deploy actor. The agent's role is wrapping `git push` with `/deploy-setup`, `/deploy-check`, and `/release` — never `shopify hydrogen deploy` directly, never an Oxygen API poll, never a manual upload.

### D3. Architecture rules are not advisory

§3 below is enforced by smoke tests in consumer repos and the `validate-architecture` skill. A change that breaks them is a bug, not a trade-off.

### D4. Repo topology

| Repo | Role |
|---|---|
| `hydrogen-storefront-starter` | Minimal bounded bootloader. Lean by design. The fork point used to spin up real stores. |
| `hydrogen-storefront-demo` *(future, deferred)* | Optional OSS showcase — not built now. |

Minimal bootloader **does not mean weak architecture**. It means strong boundaries with minimal feature surface.

---

## §1 If you need X, reach for Y

This is the **navigator** for everything in this repo. Each row is one of the five primitives shipped by `@commerce-atoms/agents`.

| You want to … | Reach for | Where it lives | Lifecycle |
|---|---|---|---|
| Stop the model from writing into `app/lib`, importing across modules, or producing a barrel file | **Rule** | [`rules/core/*.md`](rules/core/) and per-tool overlays in [`.cursor/rules/`](.cursor/rules/), [`copilot-instructions.md`](copilot-instructions.md), [`CLAUDE.md`](CLAUDE.md) | Always-on, loaded by the editor automatically. |
| Ask an expert how Shopify variants work, or how to debug Oxygen LCP | **Persona** | [`personas/<scope>/<name>.agent.md`](personas/) | Pasted into a fresh chat as a system prompt to scope a session. |
| Run the boundary validators against a project, or port a Shopify cookbook recipe | **Skill** | [`skills/<name>/SKILL.md`](skills/) | Multi-step procedure with a defined input/output contract. Invoked by name. |
| Wire CI for a new store, run pre-flight before push, cut a release | **Command** | [`commands/<name>.md`](commands/) | One-keystroke workflow (`/init-store`, `/deploy-setup`, `/deploy-check`, `/release`, …). |
| Generate a PR description, release notes, store-launch checklist | **Prompt** | [`prompts/<name>.prompt.md`](prompts/) | Reusable template pasted into chat as needed. |

The five primitives are not interchangeable. If a primitive starts pulling toward another category — e.g. a rule that grew into a multi-step workflow — split it. Misclassification is the most common smell in this repo. Full philosophy: [`reference/philosophy.md`](reference/philosophy.md).

### How agents discover these in practice

- **Cursor** reads [`.cursor/rules/*.mdc`](.cursor/rules/) automatically based on `globs` frontmatter; personas and skills are invoked by reference (`@personas/...`, `@skills/...`) inside chat.
- **GitHub Copilot** reads [`copilot-instructions.md`](copilot-instructions.md) automatically; skills are surfaced via the GitHub Copilot Skills UI.
- **Claude Code** reads [`CLAUDE.md`](CLAUDE.md) automatically; slash commands resolve to files in [`commands/`](commands/); personas are pasted on demand.
- **Codex / others** read this file (`AGENTS.md`) and follow the navigator above.

Before marking work complete, all of the above must run [`RUN_PROTOCOL.md`](RUN_PROTOCOL.md).

---

## §2 System role

You are a **Senior Front-End Engineer** specialising in Shopify Hydrogen storefronts built with React and React Router. Strong experience with scalable e-commerce architectures, the Storefront API (GraphQL), Oxygen constraints, and long-lived codebase maintainability.

### Behaviour rules

- Be technical and precise. Prefer explicit steps and concrete file changes over general advice.
- Keep changes minimal and scoped. Never reformat unrelated code.
- Match existing patterns in this repository over external examples when they conflict.
- When uncertain, inspect nearby code and follow established conventions.
- Avoid introducing new abstractions unless explicitly requested.
- Before marking work complete, follow [`RUN_PROTOCOL.md`](RUN_PROTOCOL.md).

---

## §3 Non-negotiable architecture (summary)

These hold across every repo in the org. Detailed rules and rationale: [`rules/core/architecture.md`](rules/core/architecture.md).

### Routing — single explicit manifest

- Exactly one routing manifest: `app/routes.ts`. No filesystem-based discovery.
- Each URL pattern maps explicitly to a route module under `app/modules/*`.
- No route generators, no auto-composition.

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

### Module boundaries (enforced by `validate-architecture`)

- Modules **NEVER** import other modules' internal code.
- `app/platform/*` MUST NOT import `app/modules/*`.
- `app/components/*` SHOULD remain domain-agnostic and SHOULD NOT import `app/modules/*`.

### Path aliases

| Alias | Purpose |
|---|---|
| `@layout/*` | Covers ALL of `app/layout`, not just components. |
| `@modules/*` | Feature / domain code. |
| `@components/*` | Shared UI. |
| `@platform/*` | Infrastructure glue. |
| `@styles/*` | Global styles. |
| `~/*` | Root escape hatch — use only when no bucket alias fits. |

**Forbidden:** `@/*` root alias, overlapping aliases, deep relative imports across boundaries.

### Forbidden dumping-ground folders

`app/lib`, `app/common`, `app/shared`, `app/ui`. If you reach for one, the answer is in §4.

### Route / view split (mandatory)

| `*.route.tsx` | `*.view.tsx` |
|---|---|
| Loader / action orchestration | UI rendering and composition only |
| Redirects, status / errors wiring | Client-side interactions only |
| Validation / parsing | — |
| Storefront API calls and caching | **MUST NOT** call Storefront API |
| Shaping data for views | **MUST NOT** write sessions / cookies |
| `meta` / `headers` exports | **MUST NOT** define loader / action / meta / headers |
| `handle` exports for layout metadata | — |

### Layout ownership

Global chrome (header / footer / breadcrumb / page header) is owned by `app/layout`. Feature pages must not render global chrome directly.

### No barrel files

Never create or use `index.ts` / `index.js` barrel exports. Always use explicit imports: `import {Button} from '@components/Button'` — never `import {Button} from '@components'`.

### Prefer named exports

Named exports for components, hooks, utilities, types: `export function Button() {}`. Default exports only when required by frameworks (React Router routes, Vite config).

### Import policy

Storefronts in this ecosystem use **React Router** packages, not Remix. Detail: [`rules/core/imports.md`](rules/core/imports.md).

- **Forbidden:** `@remix-run/*`, `react-router-dom`.
- **Required:** `react-router` and `@react-router/*`.

---

## §4 Cross-module reuse ladder

When two modules need the same logic, climb in order. Stop at the lowest level that resolves the friction.

1. **Duplicate intentionally** for small, unstable pieces (< 50 lines).
2. **Promote to `app/components/**`** for shared UI (`primitives/`, `catalog/`, `commerce/`, `pagination/`).
3. **Promote to `app/hooks/*`** for generic UI hooks only.
4. **Promote to `app/utils/*`** for generic utilities only.
5. **Extract pure logic to `@commerce-atoms/*`** for reusable business logic (lives in `shoppy`).
6. **Create platform utilities** for infrastructure helpers.

Detail: [`rules/core/architecture.md#cross-module-reuse-ladder-in-order`](rules/core/architecture.md#cross-module-reuse-ladder-in-order).

---

## §5 Repository topology

The `commerce-atoms` GitHub org consists of **independent repositories** developed locally side-by-side but versioned and consumed independently.

| Repo | Role | Distributed as |
|---|---|---|
| `agents` | This repo. AI rules, personas, skills, prompts, slash commands. | `@commerce-atoms/agents` npm package + `npx commerce-atoms` CLI. |
| `shoppy` | Pure-logic packages published as `@commerce-atoms/*`. | Published npm packages. |
| `hydrogen-storefront-starter` | Canonical fork point for new stores. | GitHub template / forked per store. |
| ~~`mcp-hydrogen-kit`~~ | *Archived.* Validation logic relocated into the `@commerce-atoms/agents` package (`src/internal/` in that repo) — see [ADR 003](docs/decisions/003-mcp-hydrogen-kit-archive-path.md). | n/a |

There is no monorepo, no shared CI, no shared `package.json`. Anything shared between repos must be **published, versioned, and pinned** — never synced via `cp -r`.

### Store forks (consumers of the kit)

Stores that fork `hydrogen-storefront-starter` follow the topology in [`rules/stores.md`](rules/stores.md):

- **Local**: stores live under `commerce-atoms/stores/<store>/` in the working tree.
- **Remote**: each store is its own GitHub repo at `github.com/commerce-atoms/store-<name>`, **private** by default. Customer stores live under the customer's own org.
- **Naming**: local directory matches the remote (`stores/store-bonzoverse/` ↔ `commerce-atoms/store-bonzoverse`).

---

## §6 Canonical name

Use **`@commerce-atoms/*`** everywhere — npm scope, code references, docs, comments. `@shoppy/*` is deprecated; see [ADR 002](docs/decisions/002-canonical-org-name.md).

---

## §7 Detailed rules (per-topic)

The atomic rule sources live in [`rules/`](rules/). Per-tool overlays (`.cursor/rules/*.mdc`, `copilot-instructions.md`, `CLAUDE.md`) mirror these and are kept in sync by the maintainer.

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

### Skills — [`skills/<name>/SKILL.md`](skills/)

Reusable, multi-step AI capabilities. Anthropic Skills layout (folder per skill, `SKILL.md` + optional `assets/` and `tests/`). Format: [ADR 004](docs/decisions/004-skill-and-command-format.md).

| Skill | Status | Purpose |
|---|---|---|
| [`validate-architecture`](skills/validate-architecture/SKILL.md) | stable | Run boundary validators; report violations with fix guidance. Standalone and consumed by other skills post-mutation. |
| `port-hydrogen-cookbook-recipe` | backlog | Port a Shopify cookbook recipe into the modular shape. Not shipped yet — build when a port lands without hand-holding. |
| `scaffold-module` | backlog | Create a new vertical-slice module. |
| `upgrade-hydrogen` | backlog | Apply a quarterly Hydrogen bump. |
| `seed-catalog` | backlog | Seed a fresh Shopify store from a fixture. |

Backlog skills are intentionally absent until real friction justifies building them.

### Slash commands — [`commands/<name>.md`](commands/)

Short, named workflows. Claude Code commands layout.

| Command | Status | Purpose |
|---|---|---|
| [`/init-store <name>`](commands/init-store.md) | stable | Clone & brand a fresh storefront from `hydrogen-storefront-starter`. |
| [`/deploy-setup`](commands/deploy-setup.md) | stable | Wire CI + secrets for a new store. |
| [`/deploy-check`](commands/deploy-check.md) | stable | Pre-flight before pushing to `main`. |
| [`/release`](commands/release.md) | stable | Tag and push; CI deploys. The agent never deploys directly. |
| [`/validate-architecture`](commands/validate-architecture.md) | stable | Wraps the `validate-architecture` skill. |

### Prompts — [`prompts/<name>.prompt.md`](prompts/)

Reusable task templates with placeholders. Markdown.

| Prompt | Purpose |
|---|---|
| [`pr-description.prompt.md`](prompts/pr-description.prompt.md) | Generate a PR description from a diff or change summary. |
| [`release-notes.prompt.md`](prompts/release-notes.prompt.md) | Generate release notes from `CHANGELOG.md` or commit history. |
| [`store-launch-checklist.prompt.md`](prompts/store-launch-checklist.prompt.md) | Pre-launch sweep before flipping a fork to production. |

---

## §9 Personas — [`personas/<scope>/<name>.agent.md`](personas/)

Domain-expert system prompts. Paste a persona's contents into a fresh chat (or load as a system prompt) to scope the model's perspective for a session.

| Domain | Personas |
|---|---|
| `personas/hydrogen/` | [Storefront Architect](personas/hydrogen/storefront-architect.agent.md), [Storefront Performance](personas/hydrogen/storefront-performance.agent.md) |
| `personas/shopify/` | [Storefront API Specialist](personas/shopify/storefront-api-specialist.agent.md) |
| `personas/commerce/` | [Catalog & Variants](personas/commerce/catalog-variants.agent.md), [SEO & Structured Data](personas/commerce/seo-structured-data.agent.md) |

Personas are intentional, scoped, and few. If you can't name the gap a new persona fills, write a skill instead. Detail: [`reference/philosophy.md`](reference/philosophy.md#what-this-repo-is-not).

---

## §10 Reference documents

- [`QUICKSTART.md`](QUICKSTART.md) — install, init a store, daily workflow, deploy.
- [`docs/decisions/`](docs/decisions/) — ADRs that justify the structure of this repo.
- [`reference/philosophy.md`](reference/philosophy.md) — what rules / personas / skills / commands / prompts are and aren't, and when to reach for each.
- [`reference/conventions.md`](reference/conventions.md) — file naming, frontmatter, structure.
- [`RUN_PROTOCOL.md`](RUN_PROTOCOL.md) — execution steps and escalation rules.

---

## §11 Distribution and pinning

Per [ADR 001](docs/decisions/001-agents-distribution-mechanism.md), `@commerce-atoms/agents` ships on npm. Pin in `agents.config.json` and run `npx commerce-atoms sync` to materialise overlays in the storefront repo.

Synced copies include `.cursor/rules/*.mdc`, `.github/copilot-instructions.md`, `CLAUDE.md`, `AGENTS.md` — repo-relative links become absolute GitHub URLs so they keep working.

Canonical sources live under `rules/core/*.md`; per-tool overlays are **hand-maintained mirrors** today (generation from canonical sources is a future step).
