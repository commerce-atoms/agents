import {join, relative} from 'node:path';

import {pathExists} from '../walk.js';
import type {Violation} from '../types.js';

export async function checkRoutesManifest(root: string): Promise<Violation[]> {
  const violations: Violation[] = [];
  const manifestPath = join(root, 'app', 'routes.ts');
  const manifestExists = await pathExists(manifestPath);

  if (!manifestExists) {
    violations.push({
      code: 'MISSING_ROUTES_MANIFEST',
      severity: 'error',
      message: 'app/routes.ts is missing. Routing must be config-based, not filesystem-discovered.',
      file: 'app/routes.ts',
      remedy: 'Create app/routes.ts as the single explicit route manifest.',
    });
  }

  const routesDir = join(root, 'app', 'routes');
  if (!manifestExists && (await pathExists(routesDir))) {
    violations.push({
      code: 'FILESYSTEM_ROUTING_LIKELY',
      severity: 'warning',
      message: 'app/routes/ exists but app/routes.ts does not — likely filesystem routing.',
      file: relative(root, routesDir),
      remedy:
        'Add app/routes.ts and reference modules explicitly. app/routes/ may exist as a colocation helper but not as the source of truth.',
    });
  }

  return violations;
}
