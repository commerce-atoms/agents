---
name: pr-description
description: Draft a PR description in commerce-atoms house style.
trigger_phrases:
  - "Write a PR description for this change"
  - "Draft the PR body for [branch]"
inputs:
  - name: diff
    required: false
    description: '`git diff main...HEAD`.'
  - name: commit_summary
    required: false
    description: '`git log main..HEAD --oneline`.'
  - name: scope_hint
    required: false
    description: 'agents | shoppy | starter | store-<name> | meta'
---

# PR description

Draft a PR description from a diff and / or a commit list. Output should be reviewable in under a minute.

## Rules

1. **Title** — conventional commit: `<type>(<scope>): <imperative summary>`. Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`. Keep ≤ 70 chars.

2. **Body — three sections, in order, no others:**
   - **Summary** — 1-3 bullets covering the *why* and the user-visible effect. Not a file list.
   - **What's in the diff** — terse list of meaningful surfaces (max 5 entries). Skip lockfile / generated noise.
   - **Test plan** — checkboxes of what was verified locally + what the reviewer should sanity-check. Don't fabricate; only list what was actually run.

3. **Surface doctrine when applicable:**
   - Touches a Shopify cookbook surface → confirm it's a port, not a reimplementation ([`AGENTS.md §0`](../AGENTS.md)).
   - Touches `app/platform/*`, `app/routes.ts`, or shared `app/components/*` → mention `validate-architecture` was run.
   - Release / version bump → confirm `CHANGELOG.md` updated.

## Template

```markdown
{title}

## Summary

- {primary_change}
- {optional_secondary}

## What's in the diff

- {area}: {what_changed}

## Test plan

- [ ] {verified_locally}
- [ ] {ci_check_to_watch}
- [ ] {reviewer_sanity_check}
```

## Example

```markdown
feat(starter): port hydrogen infinite-scroll cookbook into modules/products

## Summary

- Ports Shopify's [Infinite Scroll cookbook](https://github.com/Shopify/hydrogen/tree/main/cookbook/recipes/infinite-scroll) — collection PLPs now scroll continuously.
- Pagination wrapper extracted to `app/components/pagination/PaginatedResourceSection.tsx` per the cross-module reuse ladder.

## What's in the diff

- `app/components/pagination/PaginatedResourceSection.tsx` — new component.
- `app/modules/collections/collection-handle.route.tsx` — wires pagination wrapper.
- `package.json` — adds `react-intersection-observer`.

## Test plan

- [x] `npm run typecheck` clean.
- [x] `/deploy-check` passing locally.
- [ ] CI: lint + smoke + build green.
```
