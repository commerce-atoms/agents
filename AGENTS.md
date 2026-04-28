# AGENTS.md — `@commerce-atoms/agents` repo (kit authoring)

If an AI agent is reading this file, you are working on the **`@commerce-atoms/agents` npm package itself**, not a Hydrogen storefront. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before doing anything else.

## What this repo is

The `@commerce-atoms/agents` package distributes a kit of AI rules, skills, commands, prompts, and personas to consumer storefronts. The shipped product lives under [`kit/`](kit/) and is governed by [`kit/AGENTS.md`](kit/AGENTS.md). This repo's source code lives under `src/` and `bin/`, and is governed by this file plus [`CONTRIBUTING.md`](CONTRIBUTING.md).

The audiences and rules differ:

| You're working in… | Read | Don't apply |
|---|---|---|
| `src/`, `bin/`, `package.json`, workflows | This file + [`CONTRIBUTING.md`](CONTRIBUTING.md) | `kit/AGENTS.md` (those rules are about Hydrogen apps) |
| `kit/` (rules, skills, commands, prompts, personas, reference, docs) | [`kit/AGENTS.md`](kit/AGENTS.md) + [`kit/reference/conventions.md`](kit/reference/conventions.md) | none |

## Doctrine for kit authoring

1. **The root is config; `kit/` is product.** Don't move kit-authoring concerns into `kit/`, and don't move storefront concerns into the root. If the rule wouldn't apply to a consumer, it doesn't ship.
2. **Strict TypeScript across `src/` and `bin/`.** No `.js` / `.mjs` source. No `any`. `npm run verify` must be green before push.
3. **Every shipped artefact lives in [`kit/INDEX.json`](kit/INDEX.json).** Missing or broken paths fail `npm run lint:json` in CI.
4. **Synced files have their relative links rewritten to absolute GitHub URLs at sync time.** Don't pre-rewrite links in source files; let [`src/internal/rewrite-links.ts`](src/internal/rewrite-links.ts) do it.
5. **Releases go through `git tag` + `publish.yml` (OIDC Trusted Publishing).** Never `npm publish` from a workstation against this package — the CI path is the only audited surface.

## Quick reference

- Architecture, primitives, conventions for the kit: [`kit/AGENTS.md`](kit/AGENTS.md).
- How to add to the kit: [`CONTRIBUTING.md`](CONTRIBUTING.md) → "Kit content".
- ADRs: [`kit/docs/decisions/`](kit/docs/decisions/).
- CLI source: [`src/sync.ts`](src/sync.ts), [`src/init.ts`](src/init.ts), [`src/validate.ts`](src/validate.ts).
- CLI entrypoint: [`bin/sync.ts`](bin/sync.ts).
- Release flow: [`CONTRIBUTING.md`](CONTRIBUTING.md) → "Releasing".
