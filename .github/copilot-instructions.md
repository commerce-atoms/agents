# GitHub Copilot — `@commerce-atoms/agents` (kit authoring)

Copilot is operating in the **`@commerce-atoms/agents` npm package itself**, not in a Hydrogen storefront. Read [`AGENTS.md`](../AGENTS.md) and [`CONTRIBUTING.md`](../CONTRIBUTING.md) for full context.

The shipped product lives under [`kit/`](../kit/) and has its own [`kit/copilot-instructions.md`](../kit/copilot-instructions.md). Those rules are for storefront repos and **do not govern this repo**.

## Constraints for autocomplete in this repo

1. **TypeScript everywhere.** All source under `src/` and `bin/` is `.ts`. Never suggest a `.js` or `.mjs` file. Use `import` syntax with `.js` extensions in relative imports (NodeNext resolution).
2. **Strict mode.** No `any`, no implicit `any`, no `as any` casts. If a type can't be derived, ask for an explicit interface in the body.
3. **Stable test pattern.** Tests use `node:test` and `node:assert/strict`. Co-locate `foo.test.ts` next to `foo.ts`. Don't suggest Jest, vitest, or other runners.
4. **`kit/` is content, not config for this repo.** Don't surface rules from `kit/rules/core/*` as if they applied here — they describe Hydrogen storefront discipline.
5. **Don't suggest `npm publish` from a workstation.** Releases go via tag + `.github/workflows/publish.yml`.

When in doubt, suggest reading [`CONTRIBUTING.md`](../CONTRIBUTING.md).
