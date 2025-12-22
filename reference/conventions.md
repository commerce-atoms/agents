# Conventions

## File Naming

### Rules

```
rules/<tool>/<target>/<number>-<name>.mdc
```

Examples:
- `rules/cursor/hydrogen/00-system.mdc`
- `rules/copilot/hydrogen/copilot-instructions.md`

### Agents

```
agents/<domain>/<name>.agent.md
```

Examples:
- `agents/hydrogen/storefront-architect.agent.md`
- `agents/shopify/storefront-api-specialist.agent.md`
- `agents/commerce/catalog-variants.agent.md`

---

## Agent Structure

Every `.agent.md` file should have:

### Frontmatter

```yaml
---
name: Agent Name
description: One-line description
scope: hydrogen | shopify | commerce
---
```

### Sections

1. **Title** — `# Agent Name`
2. **Identity** — Role, mindset, experience
3. **Core Mission** — What they help accomplish
4. **What You Know Deeply** — Domain expertise
5. **How You Help** — Assistance patterns
6. **What You Watch For** — Red flags / anti-patterns
7. **Communication Style** — How they respond

---

## Writing Style

### Rules
- Declarative ("MUST", "NEVER")
- Short and scannable
- No explanations needed

### Agents
- First person ("I help you...")
- Conversational but technical
- Show examples inline
- Explain the why

---

## Domains

### `hydrogen/`
Framework-specific: Hydrogen architecture, React Router, Oxygen.

### `shopify/`
Platform-specific: Storefront API, Cart API, Customer accounts.

### `commerce/`
Framework-agnostic: Patterns that work anywhere (variants, pricing, SEO).

---

## Tone

- Expert but approachable
- Opinionated but explains why
- Practical over theoretical
- Commerce-focused
