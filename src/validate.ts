import {join} from 'node:path';

import {collect, walkFiles, withExtensions, pathExists} from './internal/walk.js';
import {checkCrossModuleImports} from './internal/validators/cross-module-import.js';
import {checkReverseImports} from './internal/validators/reverse-import.js';
import {checkDumpingGroundFolders} from './internal/validators/dumping-ground.js';
import {checkBarrelFiles} from './internal/validators/barrel-file.js';
import {checkRemixImports} from './internal/validators/remix-import.js';
import {checkRoutesManifest} from './internal/validators/routes-manifest.js';
import type {ValidationCounts, ValidationReport, Violation} from './internal/types.js';

const TS_EXTS: readonly string[] = ['.ts', '.tsx', '.mts', '.cts'];

export interface ValidateParams {
  root: string;
  strict?: boolean;
}

export interface ValidateResult {
  report: ValidationReport;
  exitCode: number;
}

export async function validate({root, strict = false}: ValidateParams): Promise<ValidateResult> {
  const appDir = join(root, 'app');
  const hasApp = await pathExists(appDir);

  let appFiles: string[] = [];
  if (hasApp) {
    appFiles = await collect(withExtensions(walkFiles(appDir), TS_EXTS));
  }

  const violations: Violation[] = [];

  if (!hasApp) {
    violations.push({
      code: 'MISSING_APP_DIR',
      severity: 'error',
      message: `Expected ${root}/app/ directory; found none.`,
      file: 'app/',
      remedy: 'Run validate-architecture against the root of a Hydrogen project.',
    });
  } else {
    const results = await Promise.all([
      checkCrossModuleImports(appFiles, root),
      checkReverseImports(appFiles, root),
      checkDumpingGroundFolders(root),
      Promise.resolve(checkBarrelFiles(appFiles, root)),
      checkRemixImports(appFiles, root),
      checkRoutesManifest(root),
    ]);
    for (const r of results) violations.push(...r);
  }

  const counts: ValidationCounts = {errors: 0, warnings: 0, infos: 0};
  for (const v of violations) {
    if (v.severity === 'error') counts.errors += 1;
    else if (v.severity === 'warning') counts.warnings += 1;
    else counts.infos += 1;
  }

  const exitCode = counts.errors > 0 || (strict && counts.warnings > 0) ? 1 : 0;

  return {
    report: {root, violations, counts},
    exitCode,
  };
}

export function formatReport(report: ValidationReport): string {
  const {root, violations, counts} = report;
  const lines = ['commerce-atoms-agents validate-architecture', `  root: ${root}`];

  if (violations.length === 0) {
    lines.push('  result: PASS — no violations found.');
    return lines.join('\n');
  }

  lines.push(
    `  result: ${counts.errors > 0 ? 'FAIL' : 'WARN'} — ${counts.errors} error(s), ${counts.warnings} warning(s)`,
  );
  lines.push('');

  for (const v of violations) {
    const tag = v.severity.toUpperCase().padEnd(7);
    lines.push(`[${tag}] ${v.code}`);
    lines.push(`    ${v.message}`);
    lines.push(`    file: ${v.file}${v.specifier ? `  (${v.specifier})` : ''}`);
    if (v.remedy) lines.push(`    fix:  ${v.remedy}`);
    lines.push('');
  }

  return lines.join('\n');
}

export function formatReportJson(report: ValidationReport): string {
  return JSON.stringify(report, null, 2);
}

export type {ValidationReport, Violation, ValidationCounts} from './internal/types.js';
