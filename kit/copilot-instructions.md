# GitHub Copilot instructions

> Copilot-specific overlay. Read [`AGENTS.md`](AGENTS.md) first — it is the canonical manifest. This file extends it with affordances specific to Copilot autocomplete, Copilot Chat, and the GitHub Copilot Skills surface.

## How Copilot consumes this kit

Unlike Cursor's `.cursor/rules/*.mdc` (path-scoped) and Claude Code's slash commands, Copilot has three distinct surfaces, each with different consumption semantics:

| Surface | What it reads | When |
|---|---|---|
| **Copilot autocomplete** | This file + the immediate file context | Every keystroke; needs to be tight. |
| **Copilot Chat** | This file + opened files + repo search | On-demand conversation. |
| **Copilot Skills** ([`skills/<name>/SKILL.md`](skills/)) | The full `SKILL.md` body via the Skills UI | When the operator picks a skill. |

Path-scoped overlays (the way Cursor disables a rule for a particular glob) are **not natively supported** here. Treat the rules in [`AGENTS.md §3`](AGENTS.md) as repo-wide. When an instruction would only apply to a path subset (e.g. `app/routes.ts`), the canonical source ([`rules/core/routing.md`](rules/core/routing.md)) calls that out — read it before editing the matching file.

## Architecture in one paragraph

Module-driven Hydrogen storefront with strict boundaries. Routes (`app/routes.ts`) point at vertical-slice modules under `app/modules/*` (route + view + data + UI per domain). Modules **never** import from each other. Shared UI lives in `app/components/{primitives,catalog,commerce,pagination}/`; shared infrastructure in `app/platform/*`; per-store config in `app/config/*`. Full rules in [`AGENTS.md §3`](AGENTS.md) and [`rules/core/architecture.md`](rules/core/architecture.md).

## Five constraints Copilot must enforce on every suggestion

These are the most autocomplete-relevant rules. Surface a comment or refuse the suggestion if a violation would result.

1. **Single route manifest** — all routes registered in `app/routes.ts`. No filesystem-based discovery.
2. **Zero cross-module imports** — `app/modules/<A>` never imports from `app/modules/<B>`. Suggest the cross-module reuse ladder ([`AGENTS.md §4`](AGENTS.md)) when a developer reaches for one.
3. **Route / view split** — `*.route.tsx` owns loaders / actions / API calls / meta / headers; `*.view.tsx` renders only. Never co-locate them in a single file.
4. **React Router, never Remix** — `react-router` and `@react-router/*` only. Forbid `@remix-run/*` and `react-router-dom` outright.
5. **No barrel files** — never suggest creating `index.ts`. Always suggest explicit imports: `import {X} from '@components/X'` not `import {X} from '@components'`.

## Path aliases (use exactly these)

| Alias | Resolves to |
|---|---|
| `@layout/*` | `app/layout/` |
| `@modules/*` | `app/modules/` |
| `@components/*` | `app/components/` |
| `@platform/*` | `app/platform/` |
| `@styles/*` | `app/styles/` |
| `~/*` | App root (escape hatch — last resort). |

**Forbidden:** `@/*` root alias, overlapping aliases, deep relative paths across boundaries (`../../../modules/...`).

## Forbidden folders

`app/lib`, `app/common`, `app/shared`, `app/ui`. If a suggestion would land in one of these, redirect to the cross-module reuse ladder.

## Skills — invoking from Copilot

Skills ([`skills/<name>/SKILL.md`](skills/)) follow the GitHub Copilot Skills folder layout. The Copilot Skills UI surfaces them automatically; in Copilot Chat, reference by path:

```text
@skills/validate-architecture validate this project
```

The currently shipping skill is [`validate-architecture`](skills/validate-architecture/SKILL.md). Other skills (`port-hydrogen-cookbook-recipe`, `scaffold-module`, `upgrade-hydrogen`, `seed-catalog`) are backlog — see [`skills/README.md`](skills/README.md).

## Behavioural defaults for Copilot Chat

In autocomplete, follow the keystroke. In Chat, the following apply (in addition to `AGENTS.md`):

### Match adjacent code

When asked to add to an existing file, **mirror the patterns already there** before introducing new ones. Existing imports, naming, and structure are the contract. If they conflict with `AGENTS.md`, surface the conflict — don't silently propagate the violation.

### No reformatting

If the operator asked for a feature change, ship a feature change. Reformatting unrelated code, renaming files for "consistency", or "improving" import order are out of scope unless explicitly requested.

### Doctrinal rule — don't reimplement Shopify

Never write a competing implementation of a Shopify cookbook feature. Cart, checkout extensibility, B2B, Markets, subscriptions — these are Shopify's. The kit **ports** them via the `port-hydrogen-cookbook-recipe` skill. See [`AGENTS.md §0`](AGENTS.md).

### Deploy doctrine

Never suggest `shopify hydrogen deploy` directly. The agent prepares (`/deploy-check`) and tags (`/release`); GitHub Actions deploys. See [`AGENTS.md §0` D2](AGENTS.md).

### Completion contract

Before reporting work as done, run [`RUN_PROTOCOL.md`](RUN_PROTOCOL.md) mentally: architecture / imports / routing / types / tests. If any is unmet, say so. If the change was structural, recommend running `validate-architecture` before committing.

## Canonical name

Use **`@commerce-atoms/*`** everywhere — npm scope, code references, docs, comments. `@shoppy/*` is deprecated; see [ADR 002](docs/decisions/002-canonical-org-name.md).
