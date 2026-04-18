import { readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

export interface BwcConfig {
  $schema?: string;
  /** Directory (relative to cwd) where component source files are written. */
  componentsDir: string;
  /** Import alias used in generated files (e.g. "@/components"). */
  alias: string;
  /** Whether the consumer wants TypeScript or JavaScript sources. */
  typescript: boolean;
  /** Registry URL. Override via BWC_REGISTRY_URL for local dev. */
  registryUrl: string;
}

export const CONFIG_FILE = 'bwc.json';

export const DEFAULT_CONFIG: BwcConfig = {
  $schema: 'https://bootstrap-wc.dev/schema.json',
  componentsDir: 'src/components/ui',
  alias: '@/components/ui',
  typescript: true,
  registryUrl: 'https://bootstrap-wc.dev/r',
};

export async function loadConfig(cwd: string): Promise<BwcConfig | null> {
  const path = join(cwd, CONFIG_FILE);
  try {
    await access(path);
  } catch {
    return null;
  }
  const raw = await readFile(path, 'utf8');
  const parsed = JSON.parse(raw) as Partial<BwcConfig>;
  return {
    ...DEFAULT_CONFIG,
    ...parsed,
    registryUrl: process.env.BWC_REGISTRY_URL ?? parsed.registryUrl ?? DEFAULT_CONFIG.registryUrl,
  };
}

export async function saveConfig(cwd: string, config: BwcConfig): Promise<void> {
  const path = join(cwd, CONFIG_FILE);
  await writeFile(path, JSON.stringify(config, null, 2) + '\n', 'utf8');
}
