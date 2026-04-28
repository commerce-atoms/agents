import {posix} from 'node:path';

export interface RewriteLinksParams {
  /** File contents (markdown / mdc / similar). */
  content: string;
  /**
   * Path of the source file *relative to the package root*, posix-style.
   * E.g. 'AGENTS.md', '.cursor/rules/30-architecture-boundaries.mdc'.
   * Used to resolve relative links against the source's own directory.
   */
  sourceFileInRepo: string;
  /**
   * Absolute base URL pointing at the repo's blob root.
   * E.g. 'https://github.com/commerce-atoms/agents/blob/main'.
   */
  repoUrlBase: string;
}

const MARKDOWN_LINK = /(\]\()([^)\s]+)(\))/g;
const ABSOLUTE_OR_PROTOCOL = /^(?:[a-zA-Z][a-zA-Z0-9+.-]*:|\/\/|\/|#|mailto:|tel:)/;

/**
 * Rewrite repo-relative markdown links to absolute GitHub URLs.
 *
 * The agents package authors files (AGENTS.md, CLAUDE.md, .cursor/rules/*.mdc, etc.)
 * with repo-relative links such as `[ADR 001](docs/decisions/001-foo.md)`.
 * When those files are synced into a consumer repo, the relative paths break
 * because the consumer doesn't ship the agents repo's directory structure.
 *
 * This rewriter resolves each relative link against the source file's directory
 * within the agents repo, then prefixes it with `repoUrlBase` so the link points
 * at the canonical content on GitHub.
 *
 * Links that are already absolute (http(s)://, mailto:, tel:, root-relative `/x`,
 * or anchor-only `#section`) are left untouched.
 *
 * Code fences and inline code spans are left untouched (they're not markdown links).
 */
export function rewriteRelativeLinks({
  content,
  sourceFileInRepo,
  repoUrlBase,
}: RewriteLinksParams): string {
  const sourceDir = posix.dirname(toPosix(sourceFileInRepo));
  const cleanBase = repoUrlBase.replace(/\/+$/, '');

  return content.replace(MARKDOWN_LINK, (match, open: string, link: string, close: string) => {
    if (ABSOLUTE_OR_PROTOCOL.test(link)) return match;

    const {pathPart, suffix} = splitSuffix(link);
    if (!pathPart) return match;

    const resolved = posix.normalize(posix.join(sourceDir, pathPart));

    if (resolved.startsWith('../') || resolved === '..') return match;

    return `${open}${cleanBase}/${resolved}${suffix}${close}`;
  });
}

interface SplitSuffix {
  pathPart: string;
  suffix: string;
}

function splitSuffix(link: string): SplitSuffix {
  const hash = link.indexOf('#');
  const query = link.indexOf('?');
  const cuts = [hash, query].filter((i) => i >= 0);
  if (cuts.length === 0) return {pathPart: link, suffix: ''};
  const cut = Math.min(...cuts);
  return {pathPart: link.slice(0, cut), suffix: link.slice(cut)};
}

function toPosix(p: string): string {
  return p.replace(/\\/g, '/');
}
