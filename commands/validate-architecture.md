---
name: validate-architecture
description: Run the architecture validators against the current project (or a given path). Wraps the validate-architecture skill.
arguments:
  - name: path
    required: false
    description: Project root to validate. Defaults to the current working directory.
---

# `/validate-architecture`

Run the architecture validators against a Hydrogen storefront project.

## Workflow

1. Resolve the target directory:
   - If the user supplied a path, use it.
   - Otherwise, use the current working directory.
2. Invoke the CLI:

   ```bash
   npx @commerce-atoms/agents validate-architecture --out <path>
   ```

3. Read the human-readable output. If exit code is non-zero, summarise violations grouped by `code` for the user.
4. If invoked as part of a larger skill (for example after `port-hydrogen-cookbook-recipe` or `upgrade-hydrogen`), include the violation summary in the resulting PR description under an "Architecture validation" heading.

## Output expectations

- **PASS** — exit 0, no further action needed.
- **WARN** — exit 0 (unless `--strict`), but surface the warnings to the user with their remedies.
- **FAIL** — exit 1, list every error with file path and remedy. Do not mark the work complete until errors are addressed or explicitly accepted.

## See also

- [`skills/validate-architecture/SKILL.md`](../skills/validate-architecture/SKILL.md) — the skill definition this command wraps.
- [`AGENTS.md §3`](../AGENTS.md) — the rules being validated.
- [ADR 003](../docs/decisions/003-mcp-hydrogen-kit-archive-path.md) — why this skill exists in `agents/` rather than as a separate MCP server.
