---
name: deploy-setup
description: One-time deploy wiring for a fresh storefront. Accepts Shopify's auto-provisioned Oxygen workflow, verifies the validation gate, and confirms readiness.
arguments: []
---

# `/deploy-setup`

> Doctrine reminder (`AGENTS.md §0` sub-doctrine): **the agent prepares and validates. CI deploys.** This command wires CI; it never runs `shopify hydrogen deploy`.

Wire deploy CI for a fresh storefront. The pipeline has two independent workflows with distinct jobs:

- **Validation gate**. `.github/workflows/ci.yml`, runs on every PR + `push:main`. Blocks merge via branch protection.
- **Deployer**. `.github/workflows/oxygen-deployment-<storefrontId>.yml`, **auto-provisioned by Shopify** when a Hydrogen storefront is created in Shopify Admin. Runs on every push (any branch): production on `main`, preview URL on every other branch.

Because Shopify owns the deployer (auto-managed deployment token, one file per Hydrogen storefront), the operator's job is to **accept** it. Not to author it.

## Prerequisites

- Repo bootstrapped via `/init-store`.
- `gh` CLI authenticated against the repo's GitHub org.
- Shopify Partner account with a Hydrogen storefront created (Oxygen-hosted). Creating the Hydrogen storefront in Shopify Admin is what triggers the auto-provisioned PR.

## Workflow

### 1. Verify the validation gate is present

```bash
test -f .github/workflows/ci.yml || echo "FAIL: missing .github/workflows/ci.yml"
```

Confirm `ci.yml` includes a `Validate architecture` step invoking `npx --yes @commerce-atoms/agents validate-architecture`. If missing, surface. This is what preserves the boundary check now that Shopify owns the deployer.

### 2. Wait for (or find) Shopify's auto-provisioned deploy PR

When a Hydrogen storefront is created (or linked) in Shopify Admin, Shopify's GitHub App opens a PR titled `Set up Oxygen deployment workflow file` on the connected repo, adding `.github/workflows/oxygen-deployment-<storefrontId>.yml` and setting the `OXYGEN_DEPLOYMENT_TOKEN_<storefrontId>` secret.

Find it:

```bash
gh pr list --search "Set up Oxygen deployment workflow file" --state open --json number,title,author,headRefName
```

If nothing is returned:

- Confirm the repo is connected to a Hydrogen storefront in Shopify Admin → **Hydrogen** → **Storefront** → **Storefront settings**.
- Re-check after a minute (Shopify may take a moment to open the PR).
- If still nothing, connect via Shopify Admin manually. The agent does not create Hydrogen storefronts.

### 3. Review + merge the auto-provisioned PR

```bash
gh pr view <number> --json files,body
gh pr checks <number>
```

Sanity-check:

- The single new file is `.github/workflows/oxygen-deployment-<storefrontId>.yml`.
- Pinned action SHAs (Shopify ships them pinned).
- Trigger is `on: [push]`. This is intentional (preview envs per branch).
- Deploy step reads `secrets.OXYGEN_DEPLOYMENT_TOKEN_<storefrontId>`. Matches the secret Shopify auto-set.

Merge:

```bash
gh pr merge <number> --squash --delete-branch
```

### 4. Confirm the secret is set

```bash
gh secret list | grep OXYGEN_DEPLOYMENT_TOKEN_
```

Should show `OXYGEN_DEPLOYMENT_TOKEN_<storefrontId>` (auto-set by Shopify). No other Oxygen secrets are required. The deployment token is the only credential the deployer needs. Runtime env for the Hydrogen worker comes from **Oxygen storefront settings** in Shopify Admin, not GitHub secrets.

### 5. Push runtime env to Oxygen (if not already done via Shopify Admin)

Runtime env vars (`PUBLIC_STORE_DOMAIN`, `PUBLIC_STOREFRONT_ID`, `PUBLIC_STOREFRONT_API_TOKEN`, `PRIVATE_STOREFRONT_API_TOKEN`, `SESSION_SECRET`, etc.) are injected by Oxygen at request time. Manage them in Shopify Admin → **Hydrogen** → **Storefront** → **Environments and variables**, or push a local `.env` file:

```bash
npx shopify hydrogen env push --env production
```

Mirror the same keys locally in `.env` (gitignored) for dev. Never put runtime env in GitHub Actions secrets. The kit's deploy path does not rebuild env at CI time.

### 6. Confirm branch protection requires `ci.yml`

```bash
gh api "repos/:owner/:repo/branches/main/protection" --jq '.required_status_checks.contexts'
```

Should include `ci`. If not, add it. This is what makes `ci.yml` the true validation gate for the Shopify deployer.

### 7. Print the readiness checklist

```text
✓ .github/workflows/ci.yml with Validate architecture step
✓ .github/workflows/oxygen-deployment-<storefrontId>.yml (Shopify auto-provisioned)
✓ Secret configured: OXYGEN_DEPLOYMENT_TOKEN_<storefrontId>
✓ Runtime env pushed to Oxygen (or set in Shopify Admin)
✓ Branch protection requires ci.yml
✓ .env is gitignored

Next: /deploy-check before your first push, then merge PRs normally — pushes to
main deploy to production, pushes to any other branch deploy to a preview URL.
```

## Done when

- `gh workflow list` shows both `CI` and `Storefront <storefrontId>`.
- `gh secret list` shows `OXYGEN_DEPLOYMENT_TOKEN_<storefrontId>`.
- Branch protection on `main` requires `ci`.
- The operator has been told **never** to run `shopify hydrogen deploy` directly.

## Failure modes

| Failure | Remedy |
|---|---|
| `gh: command not found` | Install `gh`; the agent does not write to GitHub via raw API for deploy setup. |
| No auto-PR from Shopify | Verify the Hydrogen storefront exists and is linked to this repo in Shopify Admin. Do not hand-author a replacement. The auto-PR carries the correct pinned SHAs and secret binding. |
| Auto-PR appears with wrong repo/branch | Someone else linked a Hydrogen storefront to this repo. Reject the PR and reconcile in Shopify Admin before re-triggering. |
| Kit's legacy `deploy.yml` still present | Kit versions ≤ 0.3.3 shipped a `deploy.yml` that races with Shopify's workflow. Delete it as part of the same PR that accepts Shopify's. Running both duplicates every prod deploy. See [CHANGELOG 0.3.4](./CHANGELOG.md). |
| Preview URL doesn't render | Runtime env not pushed to Oxygen or missing per-env override. Set via Shopify Admin or `shopify hydrogen env push`. |

## See also

- [`commands/deploy-check.md`](deploy-check.md). Runs locally before every push.
- [`commands/release.md`](release.md). Versioned release.
- [`AGENTS.md §0`](./AGENTS.md). Deploy doctrine.
- [Shopify. Continuous deployment with Hydrogen and Oxygen](https://shopify.dev/docs/custom-storefronts/hydrogen/deployments).
