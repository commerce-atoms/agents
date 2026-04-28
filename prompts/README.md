# Prompts

> Versioned task templates. Format: Claude Code prompts (`.prompt.md`). See [ADR 004](../docs/decisions/004-skill-and-command-format.md).

## Structure

```text
prompts/
├── README.md
└── <name>.prompt.md
```

Each `.prompt.md` is a reusable template for a recurring task. Common examples:

- `pr-description.prompt.md` — produce a PR description from a diff.
- `store-launch-checklist.prompt.md` — pre-launch sweep before going live.
- `shoppy-release-notes.prompt.md` — generate release notes from a changeset.
- `retro-after-store-launch.prompt.md` — structured retrospective.

## Prompt vs. command

| | Prompt | Command |
|---|---|---|
| Trigger | Pasted into chat as needed | Invoked by name (`/<name>`) |
| Frequency | Occasional | Frequent |
| Shape | Template with placeholders | Workflow with steps |
| Examples | "Write release notes for this changeset" | `/release` |

A prompt that gets used often enough graduates into a [command](../commands/). A command that needs more than mechanical execution graduates into a [skill](../skills/).

## Adding a new prompt

1. Create `prompts/<name>.prompt.md`.
2. Add an entry to [`INDEX.json`](../INDEX.json).
3. Optionally reference from [`CLAUDE.md`](../CLAUDE.md) under "Prompts".
