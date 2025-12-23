# 🤖 agents

> **AI assistance for commerce-atoms.**  
> Rules for editors. Personas for expertise.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## What's Here

| Folder       | Purpose                         | Usage                |
| ------------ | ------------------------------- | -------------------- |
| `rules/`     | Always-on editor guardrails     | Committed into repos |
| `agents/`    | Expert personas for domains     | Invoked in AI chat   |
| `reference/` | Shared philosophy & conventions | Human reading        |

---

## Rules vs Agents

**Rules** = passive guardrails committed into repos. Run automatically in editors.

**Agents** = expert personas you invoke for specialized help. Deep domain knowledge.

See [`reference/philosophy.md`](reference/philosophy.md) for details.

---

## Structure

```
agents/
├── rules/                              # Editor guardrails
│   ├── cursor/hydrogen/
│   │   ├── 00-system.mdc
│   │   ├── 10-imports.mdc
│   │   ├── 20-routing.mdc
│   │   └── 30-architecture-boundaries.mdc
│   └── copilot/hydrogen/
│       └── copilot-instructions.md
│
├── agents/                             # Expert personas
│   ├── hydrogen/
│   │   ├── storefront-architect.agent.md
│   │   └── storefront-performance.agent.md
│   ├── shopify/
│   │   └── storefront-api-specialist.agent.md
│   └── commerce/
│       ├── catalog-variants.agent.md
│       └── seo-structured-data.agent.md
│
├── reference/
│   ├── philosophy.md
│   └── conventions.md
│
├── README.md
├── LICENSE
└── CHANGELOG.md
```

---

## Agents

Expert personas organized by domain:

### Hydrogen

| Agent                                                                     | Mission                                    |
| ------------------------------------------------------------------------- | ------------------------------------------ |
| [Storefront Architect](agents/hydrogen/storefront-architect.agent.md)     | Architecture, boundaries, scaling patterns |
| [Storefront Performance](agents/hydrogen/storefront-performance.agent.md) | Speed, caching, Core Web Vitals            |

### Shopify

| Agent                                                                          | Mission                        |
| ------------------------------------------------------------------------------ | ------------------------------ |
| [Storefront API Specialist](agents/shopify/storefront-api-specialist.agent.md) | GraphQL queries, data modeling |

### Commerce

| Agent                                                                 | Mission                               |
| --------------------------------------------------------------------- | ------------------------------------- |
| [Catalog & Variants](agents/commerce/catalog-variants.agent.md)       | Variant selection, availability logic |
| [SEO & Structured Data](agents/commerce/seo-structured-data.agent.md) | Meta tags, JSON-LD, OpenGraph         |

---

## Using Rules

Copy into your repo:

```bash
# Cursor
cp -r rules/cursor/hydrogen/* .cursor/rules/

# Copilot
cp rules/copilot/hydrogen/copilot-instructions.md .github/
```

Or use sync script in consuming repos.

---

## Using Agents

1. Open the `.agent.md` file
2. Copy the contents
3. Paste as system prompt in Claude/Cursor/ChatGPT
4. Get specialized assistance

**Agent Guidance:**
- [Prompt Library](PROMPT_LIBRARY.md) — Enforced context and constraints
- [Run Protocol](RUN_PROTOCOL.md) — Execution steps and escalation rules

---

## Adding Agents

1. Create `agents/<domain>/<name>.agent.md`
2. Add frontmatter: `name`, `description`, `scope`
3. Structure: Identity → Mission → Knowledge → Style

See [`reference/conventions.md`](reference/conventions.md).

---

## License

[MIT](LICENSE)
