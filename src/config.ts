import {readFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';

export type Audience = 'store-fork' | 'shoppy' | 'starter';

export interface ToolFlags {
  cursor: boolean;
  copilot: boolean;
  claude: boolean;
  codex: boolean;
}

export interface OutPaths {
  agentsMd: string;
  claudeMd: string;
  copilotInstructions: string;
  cursorRulesDir: string;
}

export interface AgentsConfig {
  agentsVersion: string | null;
  audience: Audience;
  tools: ToolFlags;
  out: OutPaths;
}

export interface LoadConfigParams {
  configPath?: string | undefined;
  outDir: string;
}

const VALID_AUDIENCES: ReadonlySet<Audience> = new Set<Audience>(['store-fork', 'shoppy', 'starter']);

export async function loadConfig({configPath, outDir}: LoadConfigParams): Promise<AgentsConfig> {
  const path = configPath ? resolve(configPath) : join(outDir, 'agents.config.json');
  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch (err) {
    if (isNodeError(err) && err.code === 'ENOENT') {
      return defaults();
    }
    throw err;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid JSON in ${path}: ${message}`);
  }

  validate(parsed, path);
  return {...defaults(), ...(parsed as Partial<AgentsConfig>)};
}

export function defaults(): AgentsConfig {
  return {
    agentsVersion: null,
    audience: 'store-fork',
    tools: {cursor: true, copilot: true, claude: true, codex: true},
    out: {
      agentsMd: 'AGENTS.md',
      claudeMd: 'CLAUDE.md',
      copilotInstructions: '.github/copilot-instructions.md',
      cursorRulesDir: '.cursor/rules',
    },
  };
}

function validate(config: unknown, path: string): asserts config is Partial<AgentsConfig> {
  if (typeof config !== 'object' || config === null || Array.isArray(config)) {
    throw new Error(`${path}: config must be an object`);
  }
  const c = config as Record<string, unknown>;

  if (c['audience'] != null && !VALID_AUDIENCES.has(c['audience'] as Audience)) {
    throw new Error(
      `${path}: audience must be one of ${[...VALID_AUDIENCES].join(', ')}; got ${String(c['audience'])}`,
    );
  }
  if (c['tools'] != null && (typeof c['tools'] !== 'object' || Array.isArray(c['tools']))) {
    throw new Error(`${path}: tools must be an object`);
  }
  if (c['out'] != null && (typeof c['out'] !== 'object' || Array.isArray(c['out']))) {
    throw new Error(`${path}: out must be an object`);
  }
}

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && 'code' in err;
}
