---
name: validate-architecture
description: Run boundary and structure validators against a Hydrogen storefront project. Reports cross-module imports, reverse imports from shared layers, dumping-ground folders, barrel files, forbidden Remix imports, and missing/duplicated route manifests.
status: stable
inputs:
  - name: root
    required: false
    description: Path to a Hydrogen project. Defaults to the current working directory.
  - name: strict
    required: false
    description: If true, warnings count as exit-failing.
  - name: json
    required: false
    description: If true, output the report as JSON instead of human-readable.
post_conditions:
  - "Exit code is 0 when no errors (and no warnings if --strict)."
  - "Exit code is 1 when violations exist."
---

# `validate-architecture`

> Replacement for the architecture-validation tool that lived in `mcp-hydrogen-kit`. Per [ADR 003](../../docs/decisions/003-mcp-hydrogen-kit-archive-path.md), the validator logic now lives inside `@commerce-atoms/agents` and is exposed as both a Skill and a slash command.

## What it does

Walks the target project's `app/` directory, parses imports, and reports violations of the architecture rules in [`AGENTS.md`](../../AGENTS.md) §3 and the canonical sources under [`rules/core/`](../../rules/core/).

| Code | Severity | Detects |
|---|---|---|
| `CROSS_MODULE_IMPORT` | error | `app/modules/A` importing from `@modules/B` (or relative paths that escape the module). |
| `REVERSE_IMPORT` | error | `app/platform/`, `app/components/`, `app/hooks/`, or `app/utils/` importing from `app/modules/*`. |
| `DUMPING_GROUND_FOLDER` | error | Presence of `app/lib`, `app/common`, `app/shared`, or `app/ui`. |
| `BARREL_FILE` | error | Any `index.ts` / `index.tsx` / `index.js` / `index.mjs` under `app/`. |
| `REMIX_IMPORT` | error | Imports from `@remix-run/*` or `react-router-dom`. |
| `MISSING_ROUTES_MANIFEST` | error | `app/routes.ts` is absent. |
| `FILESYSTEM_ROUTING_LIKELY` | warning | `app/routes/` exists without `app/routes.ts` (suggests filesystem routing). |
| `MISSING_APP_DIR` | error | The target has no `app/` directory at all. |

## Invocation

### As a slash command

```text
/validate-architecture                  # validate cwd
/validate-architecture path/to/project  # validate a specific path
```

### As an npm CLI

```bash
npx @commerce-atoms/agents validate-architecture
npx @commerce-atoms/agents validate-architecture --out path/to/project
npx @commerce-atoms/agents validate-architecture --strict   # warnings fail too
npx @commerce-atoms/agents validate-architecture --json     # for tool consumption
```

### Programmatically

```ts
import {validate, formatReport} from '@commerce-atoms/agents/validate';

const {report, exitCode} = await validate({root: '/path/to/project'});
console.log(formatReport(report));
process.exit(exitCode);
```

## Output

Human-readable mode prints one block per violation:

```text
[ERROR  ] CROSS_MODULE_IMPORT
    Module 'cart' imports from module 'products'. Modules must not import from other modules.
    file: app/modules/cart/cart.route.tsx  (@modules/products/queries)
    fix:  Promote the shared logic per the cross-module reuse ladder (AGENTS.md §4) or duplicate intentionally.
```

JSON mode emits the full `ValidationReport` object — see [`src/internal/types.ts`](../../../src/internal/types.ts).

## Future skills

Backlog skills (`port-hydrogen-cookbook-recipe`, `upgrade-hydrogen`, `scaffold-module`) should call `validate-architecture` after mutating code — when those skills exist, wire them through this skill.

## What this skill is NOT

- Not a TypeScript type checker. Run `tsc` separately.
- Not a linter. Run ESLint separately.
- Not a runtime analyzer. It reads source statically.
- Not a substitute for the smoke tests in `hydrogen-storefront-starter/app/tests/`. Those run in CI; this runs locally on demand.

## Limitations

- Imports are extracted via regex (not a full TS parser). Edge cases — re-exports through complex string templates, multi-line `import type` with comments — may slip through. The smoke tests in the consumer repo are the second line of defence.
- Owner inference depends on path conventions (`app/modules/<name>/`, `app/platform/`, etc.). Projects that rename these directories will report `unknown` owners and underreport violations.
- Cross-package boundary checks (`@commerce-atoms/A` → `@commerce-atoms/B`) are out of scope here — those live in `shoppy`'s own validation, governed by `rules/packages.md`.
