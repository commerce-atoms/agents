---
name: release-notes
description: Draft Keep-a-Changelog release notes for a commerce-atoms package.
trigger_phrases:
  - "Draft release notes for v…"
  - "Update CHANGELOG for the next release"
inputs:
  - name: version
    required: true
    description: Target SemVer (e.g. `0.1.2`).
  - name: changelog_unreleased
    required: false
    description: Existing `[Unreleased]` section content.
  - name: commit_log
    required: false
    description: '`git log v<previous>..HEAD --oneline`.'
  - name: merged_prs
    required: false
    description: '`gh pr list --state merged --base main --search "merged:>=<date>"`.'
  - name: scope
    required: true
    description: 'agents | shoppy/<package> | starter | store-<name>'
---

# Release notes

Generate consumer-facing release notes for a `commerce-atoms` package. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and goes into the repo's `CHANGELOG.md`.

## Rules

1. **Heading** — `## [{version}] — YYYY-MM-DD`. Replace the existing `## [Unreleased]` heading and re-add a fresh empty `## [Unreleased]` above it.

2. **Sub-sections in this order, omit empty ones:**
   - `### Added` — new features, files, primitives, exports.
   - `### Changed` — modifications to existing behaviour or shape.
   - `### Fixed` — bug fixes.
   - `### Removed` — deleted features, files, exports.
   - `### Deprecated` — features still present but scheduled for removal.
   - `### Security` — security-relevant fixes only.
   - `### Migration notes` — required reader action when consumers upgrade. Include code snippets for renames or signature changes.

3. **Bullet style:**
   - Each bullet is a complete thought; pick imperative or past tense and stay consistent.
   - Wrap file / symbol names in backticks.
   - Prefix with the surface when scope is broad: `**CLI:** added \`check\` subcommand`.

4. **What to omit:** internal refactors with no consumer effect, lockfile bumps, CI / lint config tweaks, doc typo fixes.

5. **Doctrine flags to surface explicitly:**
   - Breaking changes → in `### Changed` with **BREAKING:** prefix and a `### Migration notes` section.
   - For storefront-affecting changes → mention `validate-architecture` impact when applicable.
   - For releases of `@commerce-atoms/agents` → if `INDEX.json` changed, list which primitives were added / removed.

## Template

```markdown
## [{version}] — {date}

### Added

- {new_feature_or_export}

### Changed

- {behaviour_change}

### Fixed

- {bug_fix_with_user_visible_symptom}

### Removed

- {deleted_feature_with_replacement_pointer}

### Migration notes

{required_consumer_action_if_any_with_code_snippet}
```

For a worked example, see [`CHANGELOG.md`](../../CHANGELOG.md) — it's the canonical reference for tone and shape.
