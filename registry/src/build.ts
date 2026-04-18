#!/usr/bin/env node
/**
 * Reads packages/components/src/<name>/ directories and emits
 * apps/docs/public/r/<name>.json + apps/docs/public/r/index.json.
 *
 * Runs from the repo root (or any nested dir — walks up to find the workspace).
 */
import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RegistryEntry, RegistryFile, RegistryIndex } from './schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const COMPONENTS_DIR = join(ROOT, 'packages', 'components', 'src');
const OUT_DIR = join(ROOT, 'apps', 'docs', 'public', 'r');

interface ComponentManifest {
  category: RegistryEntry['category'];
  tagName?: string;
  description?: string;
  registryDependencies?: string[];
  dependencies?: string[];
}

// Per-component metadata. Keeps the registry self-describing without needing
// a manifest file in every component directory.
const MANIFESTS: Record<string, ComponentManifest> = {
  accordion: { category: 'disclosure', tagName: 'bs-accordion', description: 'Expandable accordion with single- or multi-open behavior.', registryDependencies: ['core'] },
  alert: { category: 'feedback', tagName: 'bs-alert', description: 'Dismissible contextual feedback message.', registryDependencies: ['core'] },
  badge: { category: 'content', tagName: 'bs-badge', description: 'Inline label or counter.', registryDependencies: ['core'] },
  breadcrumb: { category: 'navigation', tagName: 'bs-breadcrumb', description: 'Breadcrumb trail.', registryDependencies: ['core'] },
  button: { category: 'forms', tagName: 'bs-button', description: 'Primary action button (link or button).', registryDependencies: ['core'] },
  'button-group': { category: 'forms', tagName: 'bs-button-group', description: 'Groups related buttons.', registryDependencies: ['core'] },
  card: { category: 'content', tagName: 'bs-card', description: 'Flexible content container.', registryDependencies: ['core'] },
  'close-button': { category: 'forms', tagName: 'bs-close-button', description: 'Dismiss button (×).', registryDependencies: ['core'] },
  collapse: { category: 'disclosure', tagName: 'bs-collapse', description: 'Animated show/hide container.', registryDependencies: ['core'] },
  dropdown: { category: 'disclosure', tagName: 'bs-dropdown', description: 'Floating dropdown menu (floating-ui positioned).', registryDependencies: ['core'], dependencies: ['@floating-ui/dom'] },
  'form-check': { category: 'forms', tagName: 'bs-form-check', description: 'Checkbox, radio, or switch form control.', registryDependencies: ['core'] },
  'form-label': { category: 'forms', tagName: 'bs-form-label', description: 'Form label.', registryDependencies: ['core'] },
  'form-text': { category: 'forms', tagName: 'bs-form-text', description: 'Help / valid / invalid feedback text.', registryDependencies: ['core'] },
  input: { category: 'forms', tagName: 'bs-input', description: 'Form-associated text input.', registryDependencies: ['core'] },
  'input-group': { category: 'forms', tagName: 'bs-input-group', description: 'Wraps inputs with addons.', registryDependencies: ['core'] },
  'list-group': { category: 'content', tagName: 'bs-list-group', description: 'List of items, optionally actionable.', registryDependencies: ['core'] },
  modal: { category: 'overlays', tagName: 'bs-modal', description: 'Modal dialog with focus trap and backdrop.', registryDependencies: ['core'], dependencies: ['focus-trap'] },
  nav: { category: 'navigation', tagName: 'bs-nav', description: 'Nav container (tabs, pills, underline).', registryDependencies: ['core'] },
  navbar: { category: 'navigation', tagName: 'bs-navbar', description: 'Responsive navigation bar with collapse toggler.', registryDependencies: ['core'] },
  offcanvas: { category: 'overlays', tagName: 'bs-offcanvas', description: 'Side drawer / offcanvas panel.', registryDependencies: ['core'], dependencies: ['focus-trap'] },
  pagination: { category: 'navigation', tagName: 'bs-pagination', description: 'Pagination controls with windowing.', registryDependencies: ['core'] },
  popover: { category: 'overlays', tagName: 'bs-popover', description: 'Rich floating panel with title + body.', registryDependencies: ['core'], dependencies: ['@floating-ui/dom'] },
  progress: { category: 'feedback', tagName: 'bs-progress', description: 'Progress bar with striped/animated options.', registryDependencies: ['core'] },
  range: { category: 'forms', tagName: 'bs-range', description: 'Form-associated range slider.', registryDependencies: ['core'] },
  select: { category: 'forms', tagName: 'bs-select', description: 'Form-associated select.', registryDependencies: ['core'] },
  spinner: { category: 'feedback', tagName: 'bs-spinner', description: 'Loading spinner (border or grow).', registryDependencies: ['core'] },
  tabs: { category: 'navigation', tagName: 'bs-tabs', description: 'Tabbed interface with panels.', registryDependencies: ['core'] },
  textarea: { category: 'forms', tagName: 'bs-textarea', description: 'Form-associated multiline text input.', registryDependencies: ['core'] },
  toast: { category: 'feedback', tagName: 'bs-toast', description: 'Transient notification toast.', registryDependencies: ['core'] },
  tooltip: { category: 'overlays', tagName: 'bs-tooltip', description: 'Floating text tooltip.', registryDependencies: ['core'], dependencies: ['@floating-ui/dom'] },
};

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function buildCoreEntry(): Promise<RegistryEntry> {
  const coreDir = join(ROOT, 'packages', 'core', 'src');
  const files: RegistryFile[] = [];
  for await (const p of walk(coreDir)) {
    const rel = p.slice(coreDir.length + 1);
    const content = await readFile(p, 'utf8');
    files.push({
      path: `core/${rel}`,
      content: rewriteImports(content),
      type: rel.endsWith('.scss') ? 'style' : 'component',
    });
  }
  return {
    name: 'core',
    category: 'core',
    description: 'Base class, controllers (transition, floating, focus-trap), and form-associated mixin. Required by every component.',
    dependencies: ['@floating-ui/dom', 'focus-trap', 'lit'],
    registryDependencies: [],
    files,
  };
}

/**
 * Rewrites `@bootstrap-wc/core` imports to the relative path expected when
 * the core files have been copied to `<components-dir>/core/`.
 */
function rewriteImports(source: string): string {
  return source
    .replace(/from ['"]@bootstrap-wc\/core['"]/g, "from '../core/index.js'")
    .replace(/from ['"]@bootstrap-wc\/core\//g, "from '../core/");
}

async function buildComponentEntry(name: string): Promise<RegistryEntry | null> {
  const dir = join(COMPONENTS_DIR, name);
  try {
    const st = await stat(dir);
    if (!st.isDirectory()) return null;
  } catch {
    return null;
  }
  const manifest = MANIFESTS[name];
  if (!manifest) {
    console.warn(`[registry] skipping ${name}: no manifest`);
    return null;
  }
  const files: RegistryFile[] = [];
  for await (const p of walk(dir)) {
    const rel = p.slice(dir.length + 1);
    const content = await readFile(p, 'utf8');
    files.push({
      path: `${name}/${rel}`,
      content: rewriteImports(content),
      type: rel.endsWith('.scss') ? 'style' : 'component',
    });
  }
  return {
    name,
    tagName: manifest.tagName,
    category: manifest.category,
    description: manifest.description,
    dependencies: manifest.dependencies ?? [],
    registryDependencies: manifest.registryDependencies ?? ['core'],
    files,
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const entries: RegistryEntry[] = [];

  // Core first.
  const core = await buildCoreEntry();
  entries.push(core);
  await writeFile(join(OUT_DIR, `${core.name}.json`), JSON.stringify(core, null, 2));

  // Components.
  const componentDirs = (await readdir(COMPONENTS_DIR, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  for (const name of componentDirs) {
    const entry = await buildComponentEntry(name);
    if (!entry) continue;
    entries.push(entry);
    await writeFile(join(OUT_DIR, `${entry.name}.json`), JSON.stringify(entry, null, 2));
  }

  const index: RegistryIndex = {
    schemaVersion: 1,
    components: entries.map((e) => ({
      name: e.name,
      tagName: e.tagName,
      category: e.category,
      description: e.description,
    })),
  };
  await writeFile(join(OUT_DIR, 'index.json'), JSON.stringify(index, null, 2));
  console.log(`[registry] wrote ${entries.length} entries to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
