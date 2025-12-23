# Prompt Library

This repository relies on a set of enforced system rules and conventions
that are assumed to be present in the agent's environment.

These rules are enforced via editor / system configuration (e.g. Cursor rules),
not via normal documentation files.

## Always-Assumed Context

Agents must assume the following constraints are active:

- Global system rules (tone, scope, non-goals)
- Import discipline (no barrel files, explicit imports)
- Routing rules (explicit route manifest, no filesystem routing)
- Architecture boundaries (module isolation, platform separation)
- Repo-specific operating constraints (as defined by the system)

## Operating Rule

- If a solution conflicts with any enforced constraint, stop and surface the conflict.
- Do not invent new architecture or bypass existing rules.
- Prefer minimal, architecture-safe changes.
