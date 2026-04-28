---
name: init-store
description: Clone the canonical Hydrogen starter, brand it, pin @commerce-atoms/agents, and create the first commit.
arguments:
  - name: store-name
    required: true
    description: Kebab-case store name (e.g. `merch-shop`). Becomes the project directory and the `package.json#name`.
---

# `/init-store <store-name>`

Initialise a new Shopify Hydrogen storefront from the canonical starter, with the agent layer pinned and a brand-layer placeholder ready to fill in.

## Workflow

1. **Validate the name.** Lowercase letters, digits, hyphens; starts with a letter; 2–50 chars. Reject anything else and surface the validation error.
2. **Refuse to overwrite.** If `<cwd>/<store-name>` already exists, abort with a clear message — do not destroy work.
3. **Run the CLI:**

   ```bash
   npx @commerce-atoms/agents init <store-name>
   ```

   This wraps:

   1. `git clone --depth=1 --branch main https://github.com/commerce-atoms/hydrogen-storefront-starter.git <store-name>`
   2. Remove the inherited `.git/` history.
   3. Rename `package.json#name` to `<store-name>`, set `private: true`, reset to `0.1.0`.
   4. Replace `README.md` with a store-specific stub (linked to `@commerce-atoms/agents` version).
   5. Seed `app/config/brand.ts` and `app/assets/brand/` with placeholders if the starter doesn't provide them.
   6. Run `commerce-atoms-agents sync` internally to materialise `AGENTS.md`, `CLAUDE.md`, `copilot-instructions.md`, and `.cursor/rules/*.mdc`.
   7. `git init --initial-branch=main` + initial commit.

4. **Print the next-steps checklist** (the CLI does this; surface it verbatim to the user):

   ```text
   1. cd <store-name>
   2. Edit app/config/brand.ts (name, locales, colours, fonts).
   3. Replace app/assets/brand/* with your real assets.
   4. Set up Shopify Admin (storefront token, products, theme).
   5. Wire CI: /deploy-setup
   6. First deploy: git push origin main
   ```

## Done when

- The directory `<cwd>/<store-name>` exists.
- `package.json#name` is `<store-name>`.
- `agents.config.json` pins the current `@commerce-atoms/agents` version.
- `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, and `.cursor/rules/*.mdc` are present.
- `app/config/brand.ts` exists with placeholder values.
- The repo has a single initial commit on `main`.

## Failure modes and recovery

| Failure | Remedy |
|---|---|
| `git: command not found` | Install git; the starter is git-cloned, not downloaded as a tarball. |
| Network failure during clone | Retry. Optionally pass `--starter-repo <local-path>` to clone from a local mirror. |
| Initial commit fails because `user.email` isn't configured | Non-fatal; the project is created without a commit. Configure git user, then `git add . && git commit -m "init"`. |
| `validate-architecture` fails immediately after init | Almost certainly a regression in the starter. Capture the report and open an issue at `commerce-atoms/hydrogen-storefront-starter`. |

## See also

- [`commands/deploy-setup.md`](deploy-setup.md) — the next step after a fresh `init`.
- [`AGENTS.md §0`](../AGENTS.md) — the doctrine the kit operates under.
- [`PLAN.md` task 1.7 / 2.1](https://github.com/commerce-atoms) — the executable plan that justifies this command.
