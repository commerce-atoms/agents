# QUICKSTART

> Spin up a new `commerce-atoms` storefront from zero and ship to production. Five steps.

If you want the deeper architectural context, read [`AGENTS.md`](AGENTS.md) after this.

---

## Prerequisites

- **Node.js ≥ 22.** (`@shopify/mini-oxygen` requires it.)
- **`gh` CLI** authenticated to the `commerce-atoms` GitHub org.
- **`git` CLI**.
- **Shopify Partner account** with a Hydrogen storefront created (Oxygen-hosted).

---

## 1. Initialise a store

By convention, store forks live under `commerce-atoms/stores/<store-name>/` in your local working tree. Each store is its own GitHub repo, **private** by default.

```bash
mkdir -p ~/Projects/commerce-atoms/stores
cd ~/Projects/commerce-atoms/stores

npx @commerce-atoms/agents init store-example
```

The `init` command:

1. Clones `hydrogen-storefront-starter` into `store-example/`.
2. Removes the inherited git history.
3. Renames `package.json#name` to `store-example`, sets `private: true`.
4. Seeds `app/config/brand.ts` and `app/assets/brand/` with placeholders.
5. Runs `commerce-atoms-agents sync` to materialise `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, and `.cursor/rules/*.mdc`.
6. Pins the agents version in `agents.config.json`.
7. Initialises a fresh git repo with one commit on `main`.

```bash
cd store-example
```

## 2. Push to its own GitHub repo

```bash
gh repo create commerce-atoms/store-example --private --source=. --push
```

The `commerce-atoms` org hosts both the public kit (`agents`, `shoppy`, `hydrogen-storefront-starter`, `.github`) and your private store forks. Public visitors only see public repos; your stores stay invisible.

For customer work, push to the customer's own org instead: `gh repo create <customer-org>/<repo> --private --source=. --push`.

## 3. Brand the store

Open `app/config/brand.ts` and fill in the real values:

```typescript
export const brand: BrandConfig = {
  name: 'Example Store',
  slogan: 'A real slogan, not a placeholder',
  contactEmail: 'hello@example.com',
  defaultLocale: 'en-US',
  supportedLocales: ['en-US'],
  colours: { /* real hex values */ },
  fonts: { /* real font stacks */ },
  social: { /* real handles */ },
};
```

Replace placeholder assets in `app/assets/brand/`:

- `logo.svg` — primary logo.
- `favicon.svg` — browser favicon.
- `og-default.png` — default OpenGraph image (1200 × 630).
- `tokens.css` — colour / spacing variables consumed by `app/styles/`.

Per [`rules/stores.md`](rules/stores.md), **all** brand divergence lives here. No hardcoded brand strings outside `app/config/brand.ts` and `app/assets/brand/`.

## 4. Wire CI for deploy

The kit's deploy doctrine ([`AGENTS.md §0` D2](AGENTS.md)): **the agent prepares and validates; CI deploys.** Two workflows split the job:

- **Validation gate** — `.github/workflows/ci.yml` (shipped by the starter). Runs on every PR; branch protection requires it green before merge.
- **Deployer** — `.github/workflows/oxygen-deployment-<storefrontId>.yml`, **auto-provisioned by Shopify** when you link a Hydrogen storefront to this repo in Shopify Admin.

Wire it up with `/deploy-setup`. In one command:

1. Create (or link) a Hydrogen storefront in Shopify Admin → **Hydrogen**.
2. Shopify opens a PR titled `Set up Oxygen deployment workflow file`. Merge it.
3. The `OXYGEN_DEPLOYMENT_TOKEN_<storefrontId>` secret is set automatically.
4. Push runtime env to Oxygen: `npx shopify hydrogen env push --env production`.
5. Verify branch protection requires `ci`.

```bash
gh workflow list          # should show "CI" + "Storefront <storefrontId>"
gh secret list            # should show OXYGEN_DEPLOYMENT_TOKEN_<storefrontId>
```

The kit does **not** ship its own `deploy.yml` — the Shopify auto-provisioned workflow is authoritative. Full step-by-step walkthrough: [`commands/deploy-setup.md`](commands/deploy-setup.md).

## 5. Develop, validate, ship

```bash
npm install
npm run dev
```

Daily workflow:

```bash
npm run codegen      # after Storefront API query changes
npm run typecheck
npm run lint
npm test
npm run build

# Pre-flight before push (mirrors CI gates)
npx commerce-atoms-agents validate-architecture
```

Slash command equivalent of the pre-flight: [`/deploy-check`](commands/deploy-check.md).

When ready to release:

```bash
# /release in your editor, or:
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main
git push origin v1.0.0
```

GitHub Actions takes it from there. **Never** run `shopify hydrogen deploy` directly.

---

## Daily workflow cheatsheet

| Need | Command |
|---|---|
| Add a new module | Read `personas/hydrogen/storefront-architect.agent.md`, then create `app/modules/<name>/<name>.route.tsx` + `<name>.view.tsx` and register in `app/routes.ts`. |
| Add a Storefront API query | Read `personas/shopify/storefront-api-specialist.agent.md`. New `*.graphql.ts` lives in the owning module's `graphql/`. Run `npm run codegen` after. |
| Build a variant picker | Read `personas/commerce/catalog-variants.agent.md`. Reuse `@commerce-atoms/variants` and `@commerce-atoms/urlstate` instead of rolling your own. |
| Optimise LCP / INP | Read `personas/hydrogen/storefront-performance.agent.md`. Measure first; never optimise without a number. |
| Author meta tags / JSON-LD | Read `personas/commerce/seo-structured-data.agent.md`. Use `@commerce-atoms/seo` helpers; validate with Google Rich Results Test. |
| Validate boundaries before push | `/validate-architecture` or `npx commerce-atoms-agents validate-architecture`. |
| Pre-flight before push | `/deploy-check` (mirrors CI). |
| Cut a release | `/release [patch\|minor\|major]`. |

## Upgrading the kit

When a new `@commerce-atoms/agents` ships:

```bash
npm i -D @commerce-atoms/agents@latest
npx commerce-atoms-agents sync     # re-materialises overlays, re-pins version
npx commerce-atoms-agents validate-architecture   # sanity-check boundaries after bump
git add . && git commit -m "chore: bump @commerce-atoms/agents"
```

If `sync` reports a file as `divergent`, you've edited a synced file locally. Sync writes the new canonical content to `<file>.kit-incoming.<ext>` next to your edit so you can `diff` and merge by hand. Your edit is left untouched and all unrelated files still sync. To accept upstream wholesale, re-run with `--force`. To gate CI on no divergence, use `--strict`.

The sidecar is auto-removed on the next sync once your file converges with canonical, or you can delete it yourself.

## Where to ask for help

- **Architecture**: [`AGENTS.md §3`](AGENTS.md), [`rules/core/architecture.md`](rules/core/architecture.md), `personas/hydrogen/storefront-architect.agent.md`.
- **API**: [Shopify Storefront API docs](https://shopify.dev/docs/api/storefront), `personas/shopify/storefront-api-specialist.agent.md`.
- **Performance**: `personas/hydrogen/storefront-performance.agent.md`.
- **The kit itself**: [`reference/philosophy.md`](reference/philosophy.md), [`docs/decisions/`](docs/decisions/) (ADRs).

## Doctrine

Two non-negotiable rules. Re-read these whenever a shortcut feels appealing:

> **D1. Don't reimplement Shopify.** Cart, checkout extensibility, B2B, Markets, subscriptions — these are Shopify's. The kit *ports* them; it does not write competing implementations.
>
> **D2. The agent prepares and validates. CI deploys.** Never `shopify hydrogen deploy` directly. Use `/release`.

Full doctrine: [`AGENTS.md §0`](AGENTS.md).
