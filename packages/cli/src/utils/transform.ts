import type { BwcConfig } from './config.js';

/**
 * Rewrites registry-stored placeholder imports to the user's configured alias.
 * Registry files reference sibling files as `../core/index.js` and `./foo.js`.
 * We also replace any leftover `@bootstrap-wc/*` package imports with the alias.
 */
export function rewriteImports(source: string, config: BwcConfig): string {
  const alias = config.alias.replace(/\/$/, '');
  return source
    // `@bootstrap-wc/core` → `${alias}/core/index.js`
    .replace(/['"]@bootstrap-wc\/core['"]/g, `'${alias}/core/index.js'`)
    .replace(/['"]@bootstrap-wc\/core\//g, `'${alias}/core/`);
}
