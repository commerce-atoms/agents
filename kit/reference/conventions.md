# Conventions

> File naming, frontmatter, and structure for every artefact in this repo.

## File naming

### Rules (canonical sources)

```text
rules/core/<topic>.md
rules/<audience>.md
```

Examples:

- `rules/core/architecture.md`
- `rules/core/routing.md`
- `rules/packages.md` (audience: `shoppy` authors)
- `rules/stores.md` (audience: store forks)

### Tool-specific overlays (generated)

```text
.cursor/rules/<NN>-<topic>.mdc        # Cursor
copilot-instructions.md               # Copilot (top-level)
CLAUDE.md                             # Claude Code (top-level)
AGENTS.md                             # Universal (top-level)
```

The `.cursor/rules/*.mdc` overlays mirror `rules/core/*.md` — edit canonical sources first; keep overlays in sync by hand until generation ships (see ADR 001).

### Personas

```text
personas/<scope>/<name>.agent.md
```

Examples:

- `personas/hydrogen/storefront-architect.agent.md`
- `personas/shopify/storefront-api-specialist.agent.md`
- `personas/commerce/catalog-variants.agent.md`

### Skills

```text
skills/<kebab-name>/SKILL.md
skills/<kebab-name>/assets/...        # optional
skills/<kebab-name>/tests/...         # optional
```

### Slash commands

```text
commands/<kebab-name>.md
```

### Prompts

```text
prompts/<kebab-name>.prompt.md
```

### ADRs

```text
docs/decisions/<NNN>-<kebab-slug>.md
```

The `NNN` is monotonic and never reused.

---

## Frontmatter

### Persona frontmatter

```yaml
---
name: Persona Name
description: One-line description used in tool listings.
scope: hydrogen | shopify | commerce
---
```

### Rule (canonical) frontmatter

```yaml
---
title: Topic title
applies_to:
  - "glob/pattern/here"
canonical: true
generates:
  - .cursor/rules/<file>.mdc
audience: shoppy | store-fork | starter   # rules/<audience>.md only
---
```

### Slash command frontmatter

```yaml
---
name: command-name
description: One-line summary used in tool listings.
arguments:
  - name: arg-name
    required: true
    description: …
---
```

---

## Structure

### Persona body

1. **Title** — `# Persona Name`.
2. **Identity** — Role, mindset, experience.
3. **Core mission** — What they help accomplish.
4. **What you know deeply** — Domain expertise.
5. **How you help** — Assistance patterns.
6. **What you watch for** — Red flags / anti-patterns.
7. **Communication style** — How they respond.
8. **Execution contract** — Pointer to `RUN_PROTOCOL.md` and constraints.

### Skill body (`SKILL.md`)

1. **Description** — One paragraph.
2. **Invocation contract** — Input / output shape; side effects.
3. **Workflow** — Numbered steps the agent follows.
4. **Post-conditions** — What must be true after the skill runs (e.g. "always invoke `validate-architecture` after").
5. **References** — Links to assets, tests, related skills/commands.

### Slash command body

1. **Frontmatter** (above).
2. **Numbered steps** — Each step is a discrete action the agent takes.
3. **Output** — What the operator sees on completion.

### Prompt body

1. **Title**.
2. **Inputs** — placeholder list.
3. **Template** — the body, with `{placeholders}` for inputs.

---

## Writing style

### Rules

- Declarative ("MUST", "NEVER", "SHOULD").
- Short and scannable.
- No explanations needed — the rule is the contract.

### Personas

- First person ("I help you…").
- Conversational but technical.
- Examples inline.
- Explain the *why* — personas teach as they advise.

### Skills

- Imperative.
- Procedural — read like a checklist.
- No "personality" — skills are mechanical.

### Slash commands

- Imperative.
- Numbered.
- Optionally chatty in confirmation messages, but never in the procedure.

### Prompts

- Templated.
- Placeholders explicit (`{repo_name}`, `{changes_summary}`, …).

---

## Tone

- Expert but approachable.
- Opinionated but explains why (in personas; rules just declare).
- Practical over theoretical.
- Commerce-focused.
