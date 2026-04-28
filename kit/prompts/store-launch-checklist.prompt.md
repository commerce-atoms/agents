---
name: store-launch-checklist
description: Pre-launch sweep before flipping a `commerce-atoms` storefront fork to production traffic.
trigger_phrases:
  - "Are we ready to launch the store?"
  - "Pre-launch sweep"
  - "Run a launch checklist for [store-name]"
  - "What's left before [store] goes live?"
inputs:
  - name: store_name
    required: true
    description: 'e.g. `store-bonzoverse` or `store-doctor-undefined`.'
  - name: launch_date
    required: false
    description: Target launch date (informational).
  - name: skip
    required: false
    description: Comma-separated list of section IDs to skip with rationale.
---

# Store launch checklist

Use this template to produce a pre-launch report for a `commerce-atoms` storefront fork. The checklist is grouped into eight sections; each item is a yes/no/blocker with evidence.

## How to use

1. Run each section in order. Don't skip ahead — order is dependency-driven.
2. For each item: mark `[x]` (verified), `[ ]` (not yet), or `[!]` (blocker, must resolve).
3. If `[!]` — name the file / setting / person blocking, not just "TODO".
4. Final summary at the bottom: GO, NO-GO, or NO-GO-WITH-CONDITIONS.

## Inputs

- `{store_name}` — required, kebab-case (e.g. `store-bonzoverse`).
- `{launch_date}` — optional target date (informational).
- `{skip}` — optional list of section IDs to skip, with rationale.

## Sections

### 1. Repository hygiene

- [ ] Repo is private (`gh repo view {store_name} --json visibility`).
- [ ] On `main` branch with clean working tree.
- [ ] `package.json#name` matches the store name.
- [ ] `package.json#version` matches the intended launch version (e.g. `1.0.0`).
- [ ] No `review/`, `notes/`, or scratch dirs accidentally committed.
- [ ] `.env*` is gitignored; no secrets in tracked files.

### 2. Brand layer

- [ ] `app/config/brand.ts` has real values, no placeholders (no `'TODO: write a slogan'`).
- [ ] `app/assets/brand/logo.svg`, `favicon.svg`, `og-default.png` are real assets, not placeholders.
- [ ] `app/assets/brand/tokens.css` (if present) defines the actual colour / spacing tokens used in `app/styles/`.
- [ ] No hardcoded brand strings outside `app/config/brand.ts` and `app/assets/brand/` (`grep -rE 'BrandName|store@example' app/` should be silent).

### 3. Architecture and rules

- [ ] `npx commerce-atoms validate-architecture` exits 0.
- [ ] `agents.config.json` `agentsVersion` matches the `@commerce-atoms/agents` version you installed (`npm ls @commerce-atoms/agents`).
- [ ] No barrel files (`find app -name 'index.ts' -o -name 'index.tsx'` returns empty).
- [ ] No `app/lib`, `app/common`, `app/shared`, `app/ui` folders.
- [ ] All rules from [`rules/stores.md`](../rules/stores.md) respected (brand layer, core/app split, deploy doctrine).

### 4. Build, type, lint, test

- [ ] `npm run codegen` clean (commit any regenerated GraphQL types).
- [ ] `npm run typecheck` zero errors.
- [ ] `npm run lint` zero errors (warnings noted but allowed).
- [ ] `npm test` all green.
- [ ] `npm run build` succeeds; production bundle inspected for obvious bloat.

### 5. Storefront API and data

- [ ] `SHOPIFY_STOREFRONT_API_TOKEN` is the **production** token (not dev).
- [ ] `PUBLIC_STOREFRONT_API_VERSION` matches a current Storefront API version.
- [ ] Real catalogue data loaded (not just dev fixtures).
- [ ] At least one product PDP, one collection PLP, and the cart flow tested end-to-end on the production storefront URL.
- [ ] Search and filtering tested with realistic catalogue size.

### 6. SEO, structured data, accessibility

- [ ] Every public route exports `meta` (title, description, canonical).
- [ ] `robots.txt` allows the production domain; `noindex` removed from any production routes.
- [ ] JSON-LD validates against [Google's Rich Results Test](https://search.google.com/test/rich-results) for at least one product and one collection URL.
- [ ] OpenGraph image renders on `og-default.png` and on a representative PDP.
- [ ] Lighthouse accessibility score ≥ 90 on home, PDP, PLP, cart.
- [ ] Forms and interactive elements keyboard-navigable.

### 7. Performance — Core Web Vitals (CWV)

- [ ] Lighthouse production-mode (or WebPageTest) LCP ≤ 2.5s on home + PDP.
- [ ] INP ≤ 200ms p75 on PDP variant selection.
- [ ] CLS ≤ 0.1 on home + PDP.
- [ ] Bundle size budget set; main route bundle within budget.
- [ ] Cache strategy explicit per route (`personas/hydrogen/storefront-performance` reviewed if uncertain).

### 8. Deploy and observability

- [ ] `.github/workflows/deploy.yml` present and enabled (`gh workflow list`).
- [ ] All required secrets set (`gh secret list` shows `OXYGEN_DEPLOYMENT_TOKEN`, `SHOPIFY_STOREFRONT_API_TOKEN`, `SHOPIFY_STOREFRONT_ID`, `PUBLIC_STOREFRONT_API_VERSION`).
- [ ] `/deploy-check` passes locally.
- [ ] Last `main` deploy succeeded (`gh run list --workflow deploy.yml`).
- [ ] DNS / domain pointing at Oxygen confirmed.
- [ ] Error monitoring wired (Sentry / Datadog / chosen tool); test event received.
- [ ] Analytics wired and respecting consent.

## Final summary template

```markdown
# {store_name} launch readiness — {YYYY-MM-DD}

**Launch target:** {launch_date_or_TBD}
**Verdict:** GO | NO-GO | NO-GO-WITH-CONDITIONS

## Sections passed

- {list_of_section_ids}

## Blockers (must resolve before launch)

- §{section}: {blocker_description} — owner: {who} — eta: {when}

## Conditions (acceptable to launch with, fix post-launch)

- §{section}: {minor_issue} — fix-by: {date}

## Recommended next actions

1. {action_1}
2. {action_2}
3. {action_3}
```

## Doctrine reminder

Per [`AGENTS.md §0`](../AGENTS.md): the agent prepares and validates; the agent does **not** flip the launch switch. After this checklist passes, the operator runs `/release` (or pushes to `main` if no version bump is needed) and CI deploys. The agent never invokes `shopify hydrogen deploy` directly.
