---
title: Styling and CSS rules
applies_to:
  - "app/**/*.tsx"
  - "app/**/*.module.css"
  - "app/styles/**"
canonical: true
generates:
  - .cursor/rules/40-styling.mdc
---

# Styling and CSS

> Canonical source. Per-tool overlays are generated from this file.

## Rules

- CSS modules **MUST** be colocated with their components / views (same directory).
- CSS module filenames **MUST** be lowercase / kebab-case (e.g. `button.module.css`, `product-card.module.css`).
- Global styles **MUST** live in `app/styles/`.
- **No** `styles/` subfolders — keep flat.
- Prefer named CSS variables (tokens) over hardcoded values.

## Examples

### Correct — colocated

```text
components/
├── primitives/
│   ├── Button.tsx
│   └── button.module.css            ✓ colocated
├── commerce/
│   ├── ProductCard.tsx
│   └── product-card.module.css      ✓ colocated
└── catalog/
    ├── SortSelect.tsx
    └── sort-select.module.css       ✓ colocated
```

### Wrong — `styles/` subfolder

```text
components/
├── primitives/
│   ├── Button.tsx
│   └── styles/
│         └── button.module.css      ✗ no styles/ subfolder
```

## Rationale

Colocation makes the relationship between component and stylesheet obvious at a glance, simplifies refactoring (move both files together), and prevents the rise of an unmaintainable `styles/` directory mirroring `components/`.
