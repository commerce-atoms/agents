import type {OwnerInfo} from './types.js';

const MODULE_PATTERN = /\/modules\/([^/]+)\//;

export function inferOwner(filePath: string): OwnerInfo {
  const normalized = filePath.replace(/\\/g, '/');

  const moduleMatch = normalized.match(MODULE_PATTERN);
  if (moduleMatch && moduleMatch[1]) {
    return {kind: 'module', name: moduleMatch[1]};
  }

  if (normalized.includes('/platform/')) return {kind: 'platform'};
  if (normalized.includes('/layout/')) return {kind: 'layout'};
  if (normalized.includes('/components/')) return {kind: 'components'};
  if (normalized.includes('/hooks/')) return {kind: 'hooks'};
  if (normalized.includes('/utils/')) return {kind: 'utils'};
  if (normalized.includes('/config/')) return {kind: 'config'};
  if (normalized.includes('/styles/')) return {kind: 'styles'};
  if (normalized.includes('/assets/')) return {kind: 'assets'};

  return {kind: 'unknown'};
}

export function ownerOfImport(specifier: string, importerPath: string): OwnerInfo | null {
  if (specifier.startsWith('@modules/')) {
    const segments = specifier.slice('@modules/'.length).split('/');
    const moduleName = segments[0];
    if (moduleName) return {kind: 'module', name: moduleName};
    return null;
  }
  if (specifier.startsWith('@layout/')) return {kind: 'layout'};
  if (specifier.startsWith('@components/')) return {kind: 'components'};
  if (specifier.startsWith('@hooks/')) return {kind: 'hooks'};
  if (specifier.startsWith('@utils/')) return {kind: 'utils'};
  if (specifier.startsWith('@platform/')) return {kind: 'platform'};
  if (specifier.startsWith('@styles/')) return {kind: 'styles'};

  if (specifier.startsWith('.')) {
    const importerDir = importerPath.replace(/\\/g, '/').replace(/\/[^/]*$/, '');
    const joined = joinRelative(importerDir, specifier);
    return inferOwner(joined);
  }

  return null;
}

function joinRelative(base: string, rel: string): string {
  const baseSegments = base.split('/').filter(Boolean);
  const relSegments = rel.split('/').filter(Boolean);
  for (const seg of relSegments) {
    if (seg === '.') continue;
    if (seg === '..') {
      baseSegments.pop();
      continue;
    }
    baseSegments.push(seg);
  }
  return `/${baseSegments.join('/')}`;
}
