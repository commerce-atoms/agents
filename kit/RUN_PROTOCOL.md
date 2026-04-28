# Agent Run Protocol

This protocol defines how agents should execute work in this repository
to maximize one-shot success and minimize architectural drift.

## Execution Steps

1. Restate the task in repository terms
   - What is being changed or added?
   - What is explicitly out of scope?

2. Identify impacted boundaries
   - Modules / Layout / Platform / Shared code / Packages
   - Call out any potential boundary violations early

3. Propose a file-level plan
   - List files to add or modify
   - Describe responsibilities per file (before writing code)

4. Implement minimally
   - Prefer small, direct changes
   - Avoid refactors unless explicitly requested

5. Self-check before completion
   - Architecture boundaries respected
   - Import and routing rules respected
   - Types, linting, and tests considered

## Escalation Rule

If a solution requires breaking an enforced constraint:
- Stop
- Explain why
- Propose alternatives
- Ask for a decision

