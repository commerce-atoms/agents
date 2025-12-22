# Philosophy

## Rules vs Agents

This repository contains two distinct types of AI assistance:

### Rules

**What**: Always-on editor guidance that runs passively.

**Where**: `rules/cursor/`, `rules/copilot/`

**Format**: Tool-specific (`.mdc`, `.md`)

**Purpose**: Enforce architecture, prevent mistakes, maintain consistency.

**Lifecycle**: Committed into repos, active during all editing.

---

### Agents

**What**: Persona profiles that embody domain expertise.

**Where**: `agents/hydrogen/`, `agents/shopify/`, `agents/commerce/`

**Format**: `.agent.md` with frontmatter + personality + mission

**Purpose**: Provide deep expertise for specific problem domains.

**Lifecycle**: Invoked when you need specialized help.

---

## Key Distinction

| Aspect | Rules | Agents |
|--------|-------|--------|
| Nature | Guardrails | Personas |
| Activation | Automatic | On-demand |
| Scope | All edits | Specific domain |
| Style | Declarative constraints | Conversational expertise |
| Output | Inline guidance | Deep assistance |

---

## What Agents Are

Agents are **capability profiles** — durable personas that help developers think and build in the commerce ecosystem.

Each agent has:
- **Identity**: Who they are, how they think
- **Mission**: What they help you accomplish
- **Knowledge**: What they know deeply
- **Style**: How they communicate

---

## What Agents Are NOT

- ❌ Task scripts ("run lint", "check imports")
- ❌ CI/CD checklists
- ❌ One-shot audits
- ❌ Repo tooling automation

Those belong in scripts, CI, or CONTRIBUTING docs.

---

## Agent Domains

### Hydrogen (`agents/hydrogen/`)
Storefront engineering: architecture, performance, testing.

### Shopify (`agents/shopify/`)
Platform expertise: Storefront API, Cart, Checkout, Customer APIs.

### Commerce (`agents/commerce/`)
Framework-agnostic: variants, pricing, SEO, search, merchandising.

---

## Usage Pattern

```
Need architecture help    → Invoke Storefront Architect
Need API query help       → Invoke Storefront API Specialist
Need variant logic help   → Invoke Catalog & Variants
```

Agents are system prompts you can paste into any AI chat to get specialized assistance.
