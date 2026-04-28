# Philosophy

> What this repo is and isn't, and how its primitives relate to each other.

## Doctrine

`commerce-atoms` is the **adapter layer** between Shopify upstream and a modular, AI-consistent storefront architecture. The kit does **not** write competing implementations of features Shopify already ships. Full statement in [`../AGENTS.md §0`](../AGENTS.md).

This is the single most important sentence in the entire ecosystem. Internalise it before editing anything else here.

---

## Five primitives

This repo ships five distinct kinds of AI assistance. They are not interchangeable.

### Rules — guardrails

**Where:** [`rules/`](../rules/), generated into `.cursor/rules/`, `copilot-instructions.md`, `CLAUDE.md` overlays.

**What:** Always-on, passive guidance. Loaded automatically by the editor.

**Purpose:** Enforce architecture, prevent mistakes, maintain consistency.

**Lifecycle:** Synced into consumer repos via the `@commerce-atoms/agents` package (`commerce-atoms` CLI). Versioned and pinned.

### Personas — expertise

**Where:** [`personas/<scope>/<name>.agent.md`](../personas/).

**What:** Domain-expert system prompts (Hydrogen architect, Storefront API specialist, etc.).

**Purpose:** Scope the model's perspective for a session that needs deep domain knowledge.

**Lifecycle:** Pasted into a fresh chat. Not editor-loaded; invoked on demand.

### Skills — capabilities

**Where:** [`skills/<name>/SKILL.md`](../skills/).

**What:** Reusable AI workflows the agent can invoke (`validate-architecture`, `port-hydrogen-cookbook-recipe`, …).

**Purpose:** Encode multi-step procedures that the agent can run repeatedly with a defined input / output contract.

**Lifecycle:** Native to GitHub Copilot's Skills format; consumed as long-form prompts by Claude Code and Cursor.

### Commands — workflows

**Where:** [`commands/<name>.md`](../commands/).

**What:** Short, named workflows (`/init-store`, `/deploy-check`, `/release`).

**Purpose:** Single-keystroke triggers for routine operations.

**Lifecycle:** Native to Claude Code; surfaced as snippets / refs in Cursor and Copilot.

### Prompts — templates

**Where:** [`prompts/<name>.prompt.md`](../prompts/).

**What:** Reusable task templates with placeholders (PR descriptions, release notes, retros).

**Purpose:** Replace one-off "please do X" requests with a versioned, improvable artefact.

**Lifecycle:** Pasted into chat as needed.

---

## When to use what

| Need | Primitive |
|---|---|
| Stop the model from writing into `app/lib` | Rule |
| Ask an expert how Shopify variants work | Persona (`commerce/catalog-variants`) |
| Run the boundary validators against a project | Skill (`validate-architecture`) |
| Wrap CI deploy preparation behind one keystroke | Command (`/deploy-setup`) |
| Generate release notes from a changeset | Prompt (`release-notes.prompt.md`) |

If a primitive starts pulling toward another category — e.g. a rule that grew into a multi-step workflow — split it. Misclassification is the most common smell in this repo.

---

## What this repo is NOT

- ❌ A framework. The Hydrogen runtime and Storefront API are Shopify's; we don't reimplement them.
- ❌ A theme system. Brand swapping happens in `app/config/brand.ts` of the consumer repo.
- ❌ A CI/CD platform. GitHub Actions deploys; the agent prepares and validates.
- ❌ A testing harness. Smoke tests live in the consumer repo (`hydrogen-storefront-starter/app/tests/`).
- ❌ A persona zoo. Personas are intentional, scoped, and few. If you can't name the gap a new persona fills, write a skill instead.

---

## Domains (for personas)

### `personas/hydrogen/`

Framework-specific: Hydrogen architecture, React Router 7, Oxygen.

### `personas/shopify/`

Platform-specific: Storefront API, Customer Account API, Cart, Checkout.

### `personas/commerce/`

Framework-agnostic: variants, pricing, SEO, search, merchandising — patterns that work in any storefront, not just Hydrogen.
