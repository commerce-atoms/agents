---
name: pr-description
description: Generate a PR description from a diff, change summary, or commit list, in the commerce-atoms house style.
trigger_phrases:
  - "Write a PR description for this change"
  - "Draft the PR body for [branch]"
  - "Summarise these commits for a PR"
inputs:
  - name: diff
    required: false
    description: A `git diff main...HEAD` output, or a paste of the changed files.
  - name: commit_summary
    required: false
    description: A `git log main..HEAD --oneline` output, or a list of commits.
  - name: scope_hint
    required: false
    description: 'agents | shoppy | starter | store-<name> | meta'
---

# PR description

Use this template to generate a PR description for a change in any `commerce-atoms` repo. The output should be tight, accurate, and reviewable in under 60 seconds.

## Inputs

Provide one or more of the following before generating:

- `{diff}` — `git diff main...HEAD` (or `git diff base...head`).
- `{commit_summary}` — `git log <base>..HEAD --oneline`.
- `{scope_hint}` — which repo / package the change lives in.

## Generation rules

1. **Title** — conventional commit style: `<type>(<scope>): <imperative summary>`. Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`. Scope examples: `agents`, `shoppy/cart`, `starter`, `store-bonzoverse`. Keep ≤ 70 chars.

2. **Body** — three sections, in order, no others:
   - **Summary** — 1–3 bullet points covering the *why* and the *user-visible* effect. Not a file list. If the change is mechanical (rename, version bump, lint), say so plainly.
   - **What's in the diff** — terse list of meaningful files / surfaces (max 5 entries). Group by area when there are many. Skip lockfile / generated noise.
   - **Test plan** — checkbox list of what was verified locally and what the reviewer should sanity-check. For storefront changes include "ran `/deploy-check`" if applicable.

3. **What to omit**:
   - Don't restate the diff in prose.
   - Don't include "this PR adds / removes" — the body is implicit.
   - Don't list every changed file when 3 categories cover it.
   - Don't fabricate test plans — only list what was actually verified.

4. **Doctrine reminders** to flag in the PR body when applicable:
   - If the change touches a Shopify cookbook surface → confirm it's a port, not a reimplementation ([`AGENTS.md §0`](../AGENTS.md)).
   - If the change touches `app/platform/*`, `app/routes.ts`, or shared `app/components/*` → mention that `validate-architecture` was run.
   - If the change is a release / version bump → confirm `CHANGELOG.md` updated.

## Template

```markdown
{title}

## Summary

- {primary_change_user_visible_effect}
- {optional_secondary_change}
- {optional_doctrine_or_constraint_note}

## What's in the diff

- {area_1}: {what_changed}
- {area_2}: {what_changed}
- {area_3}: {what_changed}

## Test plan

- [ ] {ran_locally_check}
- [ ] {ci_check_to_watch}
- [ ] {reviewer_sanity_check}
```

## Examples

### Tiny doc fix

```markdown
docs(agents): fix broken /back-port link in CLAUDE.md

## Summary

- Removed the dangling `/back-port` row in `CLAUDE.md` that linked to a file that does not exist.

## What's in the diff

- `agents/CLAUDE.md` — drop one row.

## Test plan

- [ ] Visual diff review only; no behaviour change.
```

### Feature

```markdown
feat(starter): port hydrogen infinite-scroll cookbook into modules/products

## Summary

- Ports Shopify's [Infinite Scroll cookbook recipe](https://github.com/Shopify/hydrogen/tree/main/cookbook/recipes/infinite-scroll) into the modular shape — collection PLPs now scroll continuously.
- Cross-module reuse ladder respected: pagination wrapper extracted to `app/components/pagination/PaginatedResourceSection.tsx` per [AGENTS.md §4](../AGENTS.md).
- This is a *port*, not a reimplementation. Doctrine D1 holds.

## What's in the diff

- `app/components/pagination/PaginatedResourceSection.tsx` — new component.
- `app/modules/collections/collection-handle.route.tsx` — wires pagination wrapper.
- `package.json` + `package-lock.json` — adds `react-intersection-observer`.
- `docs/cookbook-ports.md` — log the port.

## Test plan

- [x] `npm run typecheck` clean.
- [x] `npm test` passing.
- [x] `/deploy-check` passing locally.
- [ ] CI: lint + smoke + build green.
- [ ] Reviewer sanity-check `/collections/<handle>` in dev.
```

### Release

```markdown
chore(release): @commerce-atoms/agents v0.1.1

## Summary

- Patches the sync CLI to rewrite repo-relative links to absolute GitHub URLs in synced files.
- Strengthens persona content (triggers, companions, what-I'm-NOT) and ships 3 real prompt templates (`pr-description`, `release-notes`, `store-launch-checklist`).
- Deletes defunct `PROMPT_LIBRARY.md`; fixes broken `/back-port` link in `CLAUDE.md`.

## What's in the diff

- `agents/src/internal/rewrite-links.ts` — new link rewriter + tests.
- `agents/{AGENTS.md,CLAUDE.md,copilot-instructions.md,personas/**}` — content rewrite.
- `agents/prompts/*.prompt.md` — 3 new templates.
- `agents/CHANGELOG.md` + `agents/package.json` — bump 0.1.0 → 0.1.1.

## Test plan

- [x] `npm run verify` passing (typecheck + lint:json + tests).
- [x] `commerce-atoms-agents sync --dry-run` against a temp dir produces the expected files.
- [ ] Tag triggers `publish.yml`; npm version landed.
```
