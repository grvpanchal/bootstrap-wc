import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { fileURLToPath } from 'node:url';
import { visit } from 'unist-util-visit';

// Wrap every rendered Markdown <table> in a Bootstrap `.table-responsive`
// container so wide tables (e.g. the API tables on component pages, where
// the "Type" column lists every variant) can scroll horizontally on
// narrow viewports instead of overflowing the article.
function rehypeBootstrapTable() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (
        node.tagName !== 'table' ||
        !parent ||
        typeof index !== 'number' ||
        (parent.type === 'element' &&
          parent.tagName === 'div' &&
          Array.isArray(parent.properties?.className) &&
          parent.properties.className.includes('table-responsive'))
      ) {
        return;
      }
      const tableNode = { ...node };
      // Add the Bootstrap `.table` class so spacing/striping/borders pick
      // up the framework's table styling automatically.
      const existing = Array.isArray(tableNode.properties?.className)
        ? tableNode.properties.className
        : [];
      tableNode.properties = {
        ...tableNode.properties,
        className: existing.includes('table') ? existing : [...existing, 'table'],
      };
      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-responsive'] },
        children: [tableNode],
      };
    });
  };
}

// Custom docs site for @bootstrap-wc — built with @bootstrap-wc/components
// itself. No Starlight; the layout, sidebar, and chrome are all bs-* web
// components rendered into a hand-rolled Astro layout.
export default defineConfig({
  site: 'https://bootstrap-wc.dev',
  integrations: [mdx({ rehypePlugins: [rehypeBootstrapTable] })],
  markdown: {
    rehypePlugins: [rehypeBootstrapTable],
  },
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
