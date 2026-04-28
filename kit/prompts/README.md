# Prompts

> Versioned task templates pasted into chat as needed. Format: markdown with frontmatter (`name`, `description`, `trigger_phrases`, `inputs`). See [ADR 004](../docs/decisions/004-skill-and-command-format.md).

## Structure

```text
prompts/
├── README.md
└── <name>.prompt.md
```

Each `.prompt.md` is a reusable template for a recurring task. The body declares inputs, generation rules, and a worked example or two.

## What ships today

| Prompt | Purpose | Trigger phrases |
|---|---|---|
| [`pr-description.prompt.md`](pr-description.prompt.md) | Generate a PR description from a diff or commit list. | "Write a PR description for this change" |
| [`release-notes.prompt.md`](release-notes.prompt.md) | Generate `CHANGELOG.md` release notes from a commit / PR list. | "Draft release notes for v…" / "Update CHANGELOG…" |
| [`store-launch-checklist.prompt.md`](store-launch-checklist.prompt.md) | Pre-launch sweep before flipping a fork to production. | "Pre-launch sweep" / "Are we ready to launch?" |

## Prompt vs. command vs. skill

| | Prompt | Command | Skill |
|---|---|---|---|
| Trigger | Pasted into chat as needed | Invoked by name (`/<name>`) | Invoked by reference (`skills/<name>/SKILL.md`) |
| Frequency | Occasional | Frequent | Occasional but procedural |
| Shape | Template with placeholders | Workflow with steps | Multi-step procedure with input/output contract |
| Mutates files? | No | Yes | Yes |

A prompt that gets used often enough graduates into a [command](../commands/). A command that needs branching judgement graduates into a [skill](../skills/). Demotion (skill → command → prompt) is also fine when complexity falls.

## Adding a new prompt

1. Create `prompts/<name>.prompt.md` with frontmatter (`name`, `description`, `trigger_phrases`, `inputs`).
2. Add an entry to [`INDEX.json`](../INDEX.json) under `prompts`.
3. Optionally reference from [`CLAUDE.md`](../CLAUDE.md) and [`AGENTS.md §8`](../AGENTS.md) if the prompt is broadly useful.

## Tone

- **Templated.** Placeholders explicit: `{repo_name}`, `{version}`, `{changes_summary}`.
- **Worked examples.** At least one fully-filled-in example per prompt — readers learn faster from an example than from a list of rules.
- **Generation rules** stated at the top, before the template.
