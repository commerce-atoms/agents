# Skills

> Reusable AI capabilities the agent can invoke. Format: GitHub Copilot Skills layout (folder per skill). See [ADR 004](../docs/decisions/004-skill-and-command-format.md).

## Structure

```text
skills/
└── <skill-name>/
    ├── SKILL.md           # The skill definition (required)
    ├── assets/            # Fixtures, templates, prompt fragments (optional)
    │   └── ...
    └── tests/             # Prompt-based regression tests (optional)
        └── ...
```

Each skill is a folder. The single required file is `SKILL.md`, which contains:

- A short description (used in tool listings).
- The invocation contract — input shape, output shape, side effects.
- The workflow the agent follows when invoked.
- References to assets and any post-conditions (e.g. "after running, invoke `validate-architecture`").

Optional `assets/` carries fixtures or templates the skill embeds. Optional `tests/` carries prompt-based regression cases — checked into the repo so behaviour changes are detectable.

## Skill index

The MVP slice ships one skill:

| Skill | Status | Purpose |
|---|---|---|
| `validate-architecture` | MVP | Run the boundary validators against a project; surface violations. |
| `port-hydrogen-cookbook-recipe` | Backlog | Port a Shopify cookbook recipe into the modular shape. Ship when the first port needs it. |
| `scaffold-module` | Backlog | Create a new vertical-slice module. |
| `upgrade-hydrogen` | Backlog | Apply a quarterly Hydrogen bump. |
| `seed-catalog` | Backlog | Seed a fresh Shopify store from a fixture. |

Backlog skills are intentionally absent until real friction justifies building them. Adding one is cheap; over-building before the friction shows up is the trap to avoid.

## Adding a new skill

1. Create `skills/<name>/SKILL.md`.
2. Add an entry to [`INDEX.json`](../INDEX.json).
3. Reference the skill from [`AGENTS.md`](../AGENTS.md) §8.
4. If the skill has a corresponding slash command, add `commands/<name>.md` (Claude Code format).
5. Add at least one prompt-based test under `skills/<name>/tests/` if the output shape is regression-prone.

## Tone

Skills are mechanical. They take input, do a defined thing, return output. They are **not** personas — they don't carry opinions, they execute workflows. If a skill's `SKILL.md` reads like a persona, it's the wrong primitive — see [`personas/`](../personas/) instead.
