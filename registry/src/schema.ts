/**
 * Registry entry schema consumed by the `bwc` CLI.
 * Matches shadcn/ui's v1 schema so existing tooling expectations carry over.
 */
export interface RegistryFile {
  /** Path relative to the user's components directory. */
  path: string;
  /** File contents (TypeScript source, SCSS, etc.). */
  content: string;
  /** File kind — drives how the CLI places it. */
  type: 'component' | 'style' | 'hook' | 'util' | 'type';
}

export interface RegistryEntry {
  /** Registry key (e.g. "button", "form-check"). */
  name: string;
  /** Stable tag name emitted by the component (e.g. "bs-button"). */
  tagName?: string;
  /** Category for docs grouping. */
  category: 'layout' | 'forms' | 'feedback' | 'navigation' | 'overlays' | 'disclosure' | 'content' | 'core';
  /** External npm packages the component needs (excluding @bootstrap-wc/* when copying). */
  dependencies: string[];
  /** Other registry entries this component needs (e.g. "core", "button"). */
  registryDependencies: string[];
  /** Source files. */
  files: RegistryFile[];
  /** Marketing description shown by `bwc add`. */
  description?: string;
}

export interface RegistryIndex {
  schemaVersion: 1;
  components: { name: string; tagName?: string; category: string; description?: string }[];
}
