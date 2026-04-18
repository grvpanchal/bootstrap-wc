import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export interface RegistryFile {
  path: string;
  content: string;
  type: 'component' | 'style' | 'hook' | 'util' | 'type';
}

export interface RegistryEntry {
  name: string;
  tagName?: string;
  category: string;
  dependencies: string[];
  registryDependencies: string[];
  files: RegistryFile[];
  description?: string;
}

export interface RegistryIndex {
  schemaVersion: 1;
  components: { name: string; tagName?: string; category: string; description?: string }[];
}

/**
 * Fetches a registry resource. Supports:
 *  - HTTP/HTTPS URLs (production registry)
 *  - file:// URLs (local dev)
 *  - Bare paths (treated as https base)
 */
export async function fetchResource(baseUrl: string, name: string): Promise<string> {
  const url = `${baseUrl.replace(/\/$/, '')}/${name}.json`;
  if (url.startsWith('file://')) {
    return readFile(fileURLToPath(url), 'utf8');
  }
  if (url.startsWith('/') || url.startsWith('./')) {
    return readFile(url, 'utf8');
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  return res.text();
}

export async function fetchIndex(baseUrl: string): Promise<RegistryIndex> {
  const text = await fetchResource(baseUrl, 'index');
  return JSON.parse(text) as RegistryIndex;
}

export async function fetchComponent(baseUrl: string, name: string): Promise<RegistryEntry> {
  const text = await fetchResource(baseUrl, name);
  return JSON.parse(text) as RegistryEntry;
}

/**
 * Walks the dependency tree to collect every entry needed (including transitive deps).
 * Dedupes by name. Returns in topological order (deps before dependents).
 */
export async function resolveGraph(baseUrl: string, names: string[]): Promise<RegistryEntry[]> {
  const resolved = new Map<string, RegistryEntry>();
  const visiting = new Set<string>();

  async function visit(name: string) {
    if (resolved.has(name)) return;
    if (visiting.has(name)) throw new Error(`Circular dependency involving "${name}"`);
    visiting.add(name);
    const entry = await fetchComponent(baseUrl, name);
    for (const dep of entry.registryDependencies) {
      await visit(dep);
    }
    resolved.set(name, entry);
    visiting.delete(name);
  }

  for (const n of names) await visit(n);
  return Array.from(resolved.values());
}
