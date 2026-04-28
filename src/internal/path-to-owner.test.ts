import {test} from 'node:test';
import {strict as assert} from 'node:assert';

import {inferOwner, ownerOfImport} from './path-to-owner.js';

void test('inferOwner: module path', () => {
  assert.deepEqual(
    inferOwner('app/modules/products/products.route.tsx'),
    {kind: 'module', name: 'products'},
  );
});

void test('inferOwner: platform path', () => {
  assert.deepEqual(
    inferOwner('/repo/app/platform/shopify/context.ts'),
    {kind: 'platform'},
  );
});

void test('inferOwner: layout path', () => {
  assert.deepEqual(
    inferOwner('app/layout/components/Header.tsx'),
    {kind: 'layout'},
  );
});

void test('inferOwner: components / hooks / utils', () => {
  assert.deepEqual(inferOwner('app/components/primitives/Button.tsx'), {kind: 'components'});
  assert.deepEqual(inferOwner('app/hooks/primitives/useDebounce.ts'), {kind: 'hooks'});
  assert.deepEqual(inferOwner('app/utils/format-date.ts'), {kind: 'utils'});
});

void test('inferOwner: backslashes are normalised', () => {
  assert.deepEqual(
    inferOwner('app\\modules\\cart\\cart.route.tsx'),
    {kind: 'module', name: 'cart'},
  );
});

void test('inferOwner: unknown when no recognised marker', () => {
  assert.deepEqual(inferOwner('something/random/file.ts'), {kind: 'unknown'});
});

void test('ownerOfImport: aliases', () => {
  const importerPath = 'app/modules/cart/cart.route.tsx';
  assert.deepEqual(ownerOfImport('@modules/products/queries', importerPath), {kind: 'module', name: 'products'});
  assert.deepEqual(ownerOfImport('@layout/PageLayout', importerPath), {kind: 'layout'});
  assert.deepEqual(ownerOfImport('@components/primitives/Button', importerPath), {kind: 'components'});
  assert.deepEqual(ownerOfImport('@hooks/primitives/useDebounce', importerPath), {kind: 'hooks'});
  assert.deepEqual(ownerOfImport('@utils/format-date', importerPath), {kind: 'utils'});
  assert.deepEqual(ownerOfImport('@platform/shopify/context', importerPath), {kind: 'platform'});
  assert.deepEqual(ownerOfImport('@styles/tokens.css', importerPath), {kind: 'styles'});
});

void test('ownerOfImport: relative imports resolve against importerPath', () => {
  assert.deepEqual(
    ownerOfImport('./products.view', 'app/modules/products/products.route.tsx'),
    {kind: 'module', name: 'products'},
  );
  assert.deepEqual(
    ownerOfImport('../../platform/shopify/context', 'app/modules/products/products.route.tsx'),
    {kind: 'platform'},
  );
});

void test('ownerOfImport: third-party packages return null', () => {
  assert.equal(ownerOfImport('react', 'app/modules/x/x.route.tsx'), null);
  assert.equal(ownerOfImport('@shopify/hydrogen', 'app/modules/x/x.route.tsx'), null);
  assert.equal(ownerOfImport('@commerce-atoms/seo', 'app/modules/x/x.route.tsx'), null);
});
