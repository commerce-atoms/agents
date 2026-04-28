---
name: deploy-setup
description: Wire CI + secrets for a fresh storefront. Run once after /init-store before the first push to main.
arguments:
  - name: oxygen-deployment-token
    required: false
    description: The Oxygen deployment token. If absent, the command prints how to fetch it and pauses.
---

# `/deploy-setup`

> Doctrine reminder (`AGENTS.md §0` sub-doctrine): **the agent prepares and validates. CI deploys.** This command wires CI; it never runs `shopify hydrogen deploy`.

Wire GitHub Actions secrets, environment variables, and Oxygen tokens so that `git push origin main` deploys the storefront via CI — and not via the agent.

## Prerequisites

- Repo bootstrapped via `/init-store` (or otherwise mirroring the canonical layout).
- `gh` CLI authenticated against the repo's GitHub org.
- Shopify Partner account with Hydrogen storefront created (Oxygen-hosted).

## Workflow

1. **Verify the deploy workflow is present.**

   ```bash
   test -f .github/workflows/deploy.yml || echo "FAIL: missing .github/workflows/deploy.yml"
   ```

   If missing, sync the upstream starter or copy it from `hydrogen-storefront-starter` (per PR S2).

2. **Inventory required secrets.** Based on the canonical workflow:

   | Secret | Where to get it |
   |---|---|
   | `OXYGEN_DEPLOYMENT_TOKEN` | Shopify Admin → Hydrogen → Storefront → Settings → Deployment tokens |
   | `SHOPIFY_STOREFRONT_API_TOKEN` | Shopify Admin → Apps → Hydrogen → API credentials |
   | `SHOPIFY_STOREFRONT_ID` | Hydrogen storefront ID (URL slug in Shopify Admin) |
   | `PUBLIC_STOREFRONT_API_VERSION` | Pinned Storefront API version (e.g. `2026-04`) |

3. **Set them.** For each secret above, prompt the operator for the value and run:

   ```bash
   gh secret set OXYGEN_DEPLOYMENT_TOKEN --body "<value>"
   gh secret set SHOPIFY_STOREFRONT_API_TOKEN --body "<value>"
   gh secret set SHOPIFY_STOREFRONT_ID --body "<value>"
   gh secret set PUBLIC_STOREFRONT_API_VERSION --body "<value>"
   ```

   Do not echo the values back to chat. Do not commit any of them to the repo.

4. **Document local equivalents.** Verify `.env.example` lists the same keys. Update if missing. Confirm `.env` is gitignored.

5. **Smoke-check the workflow file.**

   ```bash
   gh workflow list
   gh workflow view deploy.yml
   ```

   Confirm the workflow is enabled and references the secrets above.

6. **Print the readiness checklist** to the operator:

   ```text
   ✓ .github/workflows/deploy.yml present
   ✓ Secrets configured: OXYGEN_DEPLOYMENT_TOKEN, SHOPIFY_STOREFRONT_API_TOKEN,
     SHOPIFY_STOREFRONT_ID, PUBLIC_STOREFRONT_API_VERSION
   ✓ .env.example documents the same keys
   ✓ Local .env is gitignored
   ✓ Workflow is enabled

   Next: /deploy-check before your first `git push origin main`.
   ```

## Done when

- `gh secret list` shows the four required secrets.
- `gh workflow list` shows `deploy.yml` enabled.
- `.env.example` matches the secret list.
- The operator has been told **never** to run `shopify hydrogen deploy` directly.

## Failure modes

| Failure | Remedy |
|---|---|
| `gh: command not found` | Install `gh`; the agent does not write to GitHub via raw API. |
| Missing `.github/workflows/deploy.yml` | The repo wasn't init'd from the canonical starter. Re-run `/init-store` against a clean directory or copy the workflow file from `hydrogen-storefront-starter`. |
| Operator unsure where to find Oxygen token | Pause; surface the Shopify Admin path. Do not guess. |

## See also

- [`commands/deploy-check.md`](deploy-check.md) — runs before every push.
- [`commands/release.md`](release.md) — tag + push when the change warrants a release.
- [`AGENTS.md §0`](../AGENTS.md) — deploy doctrine.
- [`hydrogen-storefront-starter/.github/workflows/deploy.yml`](https://github.com/commerce-atoms/hydrogen-storefront-starter/blob/main/.github/workflows/deploy.yml) — canonical workflow (lands in PR S2).
