import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { fileURLToPath } from 'node:url';

// Custom docs site for @bootstrap-wc — built with @bootstrap-wc/components
// itself. No Starlight; the layout, sidebar, and chrome are all bs-* web
// components rendered into a hand-rolled Astro layout.
export default defineConfig({
  site: 'https://bootstrap-wc.dev',
  integrations: [mdx()],
  vite: {
    resolve: {
      alias: {
        // Drop-in shim so existing MDX `import { Card, CardGrid, Tabs,
        // TabItem } from '@astrojs/starlight/components'` lines keep
        // resolving — without re-adding the Starlight dependency. Maps to
        // bs-* re-implementations under src/components/starlight-shims/.
        '@astrojs/starlight/components': fileURLToPath(
          new URL('./src/components/starlight-shims/index.ts', import.meta.url),
        ),
      },
    },
  },
});
