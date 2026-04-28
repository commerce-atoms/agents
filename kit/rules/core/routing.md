---
title: Routing manifest rules
applies_to:
  - "app/routes.ts"
canonical: true
generates:
  - .cursor/rules/20-routing.mdc
---

# Routing manifest rules (`app/routes.ts`)

> Canonical source. Per-tool overlays are generated from this file.

## Single source of truth

- `app/routes.ts` is the only routing manifest.
- Do not add additional route manifest files.
- Do not add a second routing entrypoint in `app/` or `server/` that duplicates routing definitions.

## No filesystem routing

- Do not rely on `app/routes/*` filesystem discovery as the routing source of truth.
- If `app/routes/*` exists, it must not be used for route discovery.

## Explicit mapping

- Each URL pattern must map explicitly to a route module file under `app/modules/*`.
- Avoid abstractions that generate, auto-compose, or implicitly register routes.

## Layout nesting

- UI routes are nested under the layout shell route (owned by `app/layout/*`).
- The layout shell is responsible for global chrome and renders the `Outlet`.
- Feature route modules must not assume they are responsible for header / footer chrome.

## Resource routes (outside shell)

Resource routes do not render the application shell. They remain outside the layout nesting.

Examples:

- `robots.txt`
- `sitemap.xml` and sitemap endpoints
- API-style endpoints (if present)

## URL conventions (defaults)

Use conventional storefront paths unless there is a project-specific reason to deviate:

| Path                   | Purpose           |
| ---------------------- | ----------------- |
| `/`                    | home              |
| `/products/:handle`    | product detail    |
| `/collections/:handle` | collection detail |
| `/cart`                | cart              |
| `/search`              | search            |
| `/policies/:handle`    | policy pages      |
| `/account/*`           | account area      |
| `/blogs/*`             | blogs             |

## Stability

- Prefer stable URLs; avoid unnecessary churn.
- If a URL changes, update all internal links and any relevant tests or docs in the same change.
