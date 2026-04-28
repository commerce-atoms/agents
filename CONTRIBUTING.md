# Contributing to `@commerce-atoms/agents`

This file is the kit-authoring manual. It governs how the **npm package itself** is developed. The content that ships to consumer repos lives under [`kit/`](kit/) and is governed by its own conventions ([`kit/AGENTS.md`](kit/AGENTS.md)) — those rules are about Hydrogen storefronts, not about this repo. Don't conflate the two.

## Anatomy of this repo

```
agents/
├── package.json, tsconfig.*, LICENSE, CHANGELOG.md, README.md   ← npm package metadata
├── bin/                                                          ← CLI entrypoints (TypeScript)
├── src/                                                          ← package source (sync, init, validate, config)
│   └── internal/                                                 ← validators + helpers
├── .github/workflows/                                            ← publish.yml + verify.yml
├── kit/                                                          ← shipped product (synced into consumer repos)
│   ├── AGENTS.md, CLAUDE.md, copilot-instructions.md             ← per-tool overlays
│   ├── .cursor/rules/                                            ← Cursor overlays
│   ├── rules/, skills/, commands/, prompts/, personas/           ← the five primitives
│   ├── reference/                                                ← philosophy + conventions
│   ├── docs/decisions/                                           ← ADRs
│   ├── INDEX.json + INDEX.schema.json                            ← registry of shipped artefacts
│   ├── RUN_PROTOCOL.md, QUICKSTART.md
└── CONTRIBUTING.md (this file)                                   ← kit-authoring rules
```

The split between **root** and `kit/` is the most important convention to internalise:

- **Root** = the npm package and how to author it. Audience: kit maintainers.
- **`kit/`** = the *content* shipped to consumers. Audience: AI tools and developers in storefront repos.

Rules under `kit/rules/core/` apply to **storefronts**, not to this repo. Linters and editor overlays in this repo's root (`.cursor/rules/`) only target kit-authoring concerns.

## Local setup

```bash
git clone git@github.com:commerce-atoms/agents.git
cd agents
npm install
npm run verify   # typecheck + INDEX.json validation + tests
```

## Doing the work

### Source code (TypeScript)

- All `.ts` source under `src/` and `bin/`. Strict mode (`strict: true`, `noUncheckedIndexedAccess: true`, `verbatimModuleSyntax: true`).
- Imports use `node:` prefix for builtins. Use `.js` extensions in relative imports (NodeNext resolution).
- Tests are co-located: `src/foo.ts` ↔ `src/foo.test.ts`. Use `node:test` and `node:assert/strict`.
- Run `npm run verify` before pushing. Don't disable a check — fix the underlying issue.
- Run `npm run build` to produce `dist/`. The npm `prepack` runs this automatically before publish.

### Kit content (the five primitives)

When adding or modifying anything under `kit/`, follow the philosophy in [`kit/reference/philosophy.md`](kit/reference/philosophy.md) and the format conventions in [`kit/reference/conventions.md`](kit/reference/conventions.md).

Quick rules:

1. Pick the right primitive — rule, persona, skill, command, or prompt. Misclassification is the single most common smell. Consult [`kit/reference/philosophy.md`](kit/reference/philosophy.md) before authoring a new artefact.
2. Frontmatter must match the format in [`kit/reference/conventions.md`](kit/reference/conventions.md). Don't invent new keys without updating the reference.
3. Every artefact must be registered in [`kit/INDEX.json`](kit/INDEX.json). The CI step `npm run lint:json` rejects missing or broken paths.
4. New rules under `kit/rules/core/` must mirror into the relevant per-tool overlays (`.cursor/rules/`, `copilot-instructions.md`, `CLAUDE.md`) by hand. Generation from canonical sources is a planned future step ([ADR 001](kit/docs/decisions/001-agents-distribution-mechanism.md)).
5. Synced markdown gets its repo-relative links rewritten to absolute GitHub URLs at sync time. Author links naturally (e.g. `[ADR 003](docs/decisions/003-...md)`); the rewriter handles consumer-side resolution. See [`src/internal/rewrite-links.ts`](src/internal/rewrite-links.ts).

### Architectural decisions

- ADRs live in [`kit/docs/decisions/`](kit/docs/decisions/) (they ship with the kit because synced overlays reference them).
- New ADR: number sequentially, follow the existing format (Context / Decision / Consequences). Brief is good.

## Releasing

The workflow lives in [`kit/commands/release.md`](kit/commands/release.md), but for the kit itself:

1. Update `package.json#version` (SemVer; once consumers pin a version, breaking changes force a major bump).
2. Update `CHANGELOG.md` — replace `[Unreleased]` with `[<version>] — <YYYY-MM-DD>`, add a fresh empty `[Unreleased]` above.
3. Update `kit/INDEX.json#version` to match.
4. Open a PR. Merge to `main`.
5. Tag: `git tag -a vX.Y.Z -m "vX.Y.Z" && git push origin vX.Y.Z`.
6. CI (`.github/workflows/publish.yml`) publishes to npm via Trusted Publishing (OIDC).

If the publish fails after the tag is pushed, fix forward and push a new tag — never re-tag. See [ADR 001](kit/docs/decisions/001-agents-distribution-mechanism.md) for distribution rationale.

## What never goes in

- Storefront-specific rules. Those belong under `kit/rules/`. The root has no opinion about how Hydrogen apps are organised.
- Generated `dist/` artefacts. Build is run on publish; `dist/` is gitignored.
- Local notes (`review/`, scratch markdown). Use a personal `notes/` folder if needed; `.gitignore` already excludes `review/`.
