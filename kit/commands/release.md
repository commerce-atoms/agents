---
name: release
description: Tag a versioned release and push. CI deploys on the tag — the agent does not.
arguments:
  - name: bump
    required: false
    description: One of `patch`, `minor`, `major`. If absent, the agent infers the bump from commit messages and confirms before tagging.
---

# `/release [patch|minor|major]`

> Doctrine reminder (`AGENTS.md §0` sub-doctrine): **the agent prepares and validates. CI deploys.** This command tags and pushes; GitHub Actions deploys on tag detection. The agent never runs `shopify hydrogen deploy`.

Cut a versioned release from `main`. Bumps `package.json#version`, updates `CHANGELOG.md`, creates an annotated git tag, and pushes — letting CI take it from there.

## Prerequisites

- On `main` branch.
- Working tree clean.
- `/deploy-check` passed.
- `CHANGELOG.md` has an `[Unreleased]` section with the changes shipping in this release.

## Workflow

### 1. Verify branch and cleanliness

```bash
test "$(git rev-parse --abbrev-ref HEAD)" = "main" || echo "FAIL: not on main"
test -z "$(git status --porcelain)" || echo "FAIL: uncommitted changes"
```

Abort on either failure.

### 2. Run `/deploy-check`

If skipped, run it now. Do not release without a clean pre-flight.

### 3. Decide the bump

If the operator passed `patch` / `minor` / `major`, use that.

Otherwise, infer from commits since the last tag using Conventional Commit prefixes:

- `feat!:` or any `BREAKING CHANGE:` footer → **major**.
- `feat:` → **minor**.
- `fix:` / `chore:` / `docs:` / `refactor:` → **patch**.

Surface the inferred bump to the operator and pause for confirmation:

```text
Last tag:        v0.4.2
Inferred bump:   minor
Next version:    v0.5.0

Confirm? (y/n)
```

### 4. Update `package.json` and `CHANGELOG.md`

- Bump `package.json#version` to the new SemVer.
- In `CHANGELOG.md`, rename the `[Unreleased]` heading to `[<new-version>] — <YYYY-MM-DD>` and add a fresh empty `[Unreleased]` section above it.
- Stage both files.

### 5. Commit, tag, push

```bash
git add package.json CHANGELOG.md
git commit -m "chore(release): v<new-version>"
git tag -a "v<new-version>" -m "Release v<new-version>"
git push origin main
git push origin "v<new-version>"
```

### 6. Tell the operator what's happening

```text
Released v<new-version>.

GitHub Actions is now deploying (CI: .github/workflows/deploy.yml).
Watch the run: gh run watch
```

Do **not** invoke `shopify hydrogen deploy`. Do **not** poll the Oxygen API directly. CI is the only deploy actor.

## Done when

- `package.json#version` matches `v<new-version>`.
- `CHANGELOG.md` has the new dated heading.
- `git tag --list "v<new-version>"` returns the tag.
- The tag is pushed to `origin`.
- GitHub Actions has picked up the tag (visible in `gh run list`).

## Failure modes

| Failure | Remedy |
|---|---|
| Not on `main` | `git switch main` and re-run. Releases ship from `main` only. |
| Working tree dirty | Commit or stash before releasing. |
| Pre-flight fails | Fix and rerun `/deploy-check`. Do not release a broken state. |
| Tag already exists | The bump pushed someone else's tag — re-infer or pick a higher version. |
| Push to `origin/main` rejected | Pull, rebase, re-run `/deploy-check`, re-release. Do not force-push tags. |
| GitHub Actions doesn't trigger | Verify the deploy workflow listens on `push: tags: ['v*']`; rerun `/deploy-setup` if not. |

## See also

- [`commands/deploy-setup.md`](deploy-setup.md)
- [`commands/deploy-check.md`](deploy-check.md)
- [`AGENTS.md §0`](../AGENTS.md) — deploy doctrine.
- The deploy workflow specification lives in [PR S2](https://github.com/commerce-atoms/hydrogen-storefront-starter/pulls).
