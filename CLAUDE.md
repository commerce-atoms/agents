# CLAUDE.md — `@commerce-atoms/agents` (kit authoring)

You are working on the **npm package itself**, not a Hydrogen storefront. Read [`AGENTS.md`](AGENTS.md) and then [`CONTRIBUTING.md`](CONTRIBUTING.md) before doing anything else.

The shipped product lives under [`kit/`](kit/) and has its own [`kit/CLAUDE.md`](kit/CLAUDE.md) — those rules are for AI agents in storefront repos and **do not govern this repo**.

## Behavioural defaults for this repo

1. **Edit, don't speculate.** When asked to change behaviour in `src/` or `bin/`, read the file first, then propose a minimal diff. The validators are pure; new tests should accompany behaviour changes.
2. **TypeScript strict mode is non-negotiable.** Don't suppress type errors with `as any`, `// @ts-expect-error`, or `// @ts-ignore`. Fix the root cause.
3. **Run `npm run verify` after substantive edits.** It runs `tsc --noEmit`, the INDEX.json linter, and the test suite. If something fails, fix before reporting work as done.
4. **Don't edit content under `kit/` without reading [`kit/AGENTS.md`](kit/AGENTS.md) first.** Treat that subtree as a separate sub-project.
5. **Releases happen via tag + CI, not from a workstation.** If asked to publish, push a tag; do not invoke `npm publish` directly.

## Where to look

| Question | Answer lives in |
|---|---|
| How is content shipped to consumers? | [`src/sync.ts`](src/sync.ts) + [`bin/sync.ts`](bin/sync.ts) |
| How is a new store initialised? | [`src/init.ts`](src/init.ts) |
| How are architecture rules enforced in consumer repos? | [`src/validate.ts`](src/validate.ts) + [`src/internal/validators/`](src/internal/validators/) |
| What lives in the kit? | [`kit/INDEX.json`](kit/INDEX.json) |
| Why a decision was made? | [`kit/docs/decisions/`](kit/docs/decisions/) |
| How do I add a rule / skill / command / prompt / persona? | [`CONTRIBUTING.md`](CONTRIBUTING.md) → "Kit content" |
