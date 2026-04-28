import {test} from 'node:test';
import {strict as assert} from 'node:assert';

import {rewriteRelativeLinks} from './rewrite-links.js';

const REPO = 'https://github.com/commerce-atoms/agents/blob/main';

void test('rewrites repo-root-relative links from a top-level source', () => {
  const out = rewriteRelativeLinks({
    content: 'See [ADR 001](docs/decisions/001-foo.md) for context.',
    sourceFileInRepo: 'AGENTS.md',
    repoUrlBase: REPO,
  });
  assert.equal(
    out,
    `See [ADR 001](${REPO}/docs/decisions/001-foo.md) for context.`,
  );
});

void test('rewrites links from a nested source by resolving relative paths', () => {
  const out = rewriteRelativeLinks({
    content: 'Canonical: [imports.md](../../rules/core/imports.md)',
    sourceFileInRepo: '.cursor/rules/10-imports.mdc',
    repoUrlBase: REPO,
  });
  assert.equal(
    out,
    `Canonical: [imports.md](${REPO}/rules/core/imports.md)`,
  );
});

void test('preserves anchors and query strings on rewrite', () => {
  const out = rewriteRelativeLinks({
    content: 'See [section](rules/core/architecture.md#cross-module-reuse-ladder-in-order).',
    sourceFileInRepo: 'AGENTS.md',
    repoUrlBase: REPO,
  });
  assert.equal(
    out,
    `See [section](${REPO}/rules/core/architecture.md#cross-module-reuse-ladder-in-order).`,
  );
});

void test('leaves anchor-only links untouched', () => {
  const input = 'Jump to [§0](#0-doctrine).';
  const out = rewriteRelativeLinks({
    content: input,
    sourceFileInRepo: 'AGENTS.md',
    repoUrlBase: REPO,
  });
  assert.equal(out, input);
});

void test('leaves absolute http(s) URLs untouched', () => {
  const input = 'See [docs](https://shopify.dev/docs/storefronts/headless).';
  const out = rewriteRelativeLinks({
    content: input,
    sourceFileInRepo: 'AGENTS.md',
    repoUrlBase: REPO,
  });
  assert.equal(out, input);
});

void test('leaves mailto: and tel: untouched', () => {
  const input = 'Email [me](mailto:hi@example.com) or [call](tel:+15551234).';
  const out = rewriteRelativeLinks({
    content: input,
    sourceFileInRepo: 'AGENTS.md',
    repoUrlBase: REPO,
  });
  assert.equal(out, input);
});

void test('leaves root-relative paths untouched (out-of-scope)', () => {
  const input = 'See [policy](/legal/privacy).';
  const out = rewriteRelativeLinks({
    content: input,
    sourceFileInRepo: 'AGENTS.md',
    repoUrlBase: REPO,
  });
  assert.equal(out, input);
});

void test('leaves links that escape the repo root untouched', () => {
  const input = 'See [outside](../../../something/outside.md).';
  const out = rewriteRelativeLinks({
    content: input,
    sourceFileInRepo: 'AGENTS.md',
    repoUrlBase: REPO,
  });
  assert.equal(out, input);
});

void test('rewrites multiple links in one document, mixed cases', () => {
  const input = [
    '# Title',
    '',
    'Read the [doctrine](AGENTS.md#0-doctrine).',
    'Then [imports](rules/core/imports.md).',
    'External: [Shopify](https://shopify.dev).',
    'Anchor: [back to top](#title).',
    '',
  ].join('\n');
  const out = rewriteRelativeLinks({
    content: input,
    sourceFileInRepo: 'AGENTS.md',
    repoUrlBase: REPO,
  });
  assert.match(out, new RegExp(`\\[doctrine\\]\\(${escapeRegex(REPO)}/AGENTS\\.md#0-doctrine\\)`));
  assert.match(out, new RegExp(`\\[imports\\]\\(${escapeRegex(REPO)}/rules/core/imports\\.md\\)`));
  assert.match(out, /\[Shopify\]\(https:\/\/shopify\.dev\)/);
  assert.match(out, /\[back to top\]\(#title\)/);
});

void test('strips trailing slashes from the repo URL base', () => {
  const out = rewriteRelativeLinks({
    content: '[x](rules/core/imports.md)',
    sourceFileInRepo: 'AGENTS.md',
    repoUrlBase: `${REPO}/`,
  });
  assert.equal(out, `[x](${REPO}/rules/core/imports.md)`);
});

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
