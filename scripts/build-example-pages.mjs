#!/usr/bin/env node
// Convert compare/example-<slug>/wc.astro into the public standalone
// /examples/<slug>.astro page: strip data-compare-key, set title.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const SLUGS = [
  ['album', 'Album'],
  ['pricing', 'Pricing'],
  ['checkout', 'Checkout'],
  ['product', 'Product'],
  ['headers', 'Headers'],
  ['heroes', 'Heroes'],
  ['features', 'Features'],
  ['footers', 'Footers'],
  ['navbars', 'Navbars'],
  ['navbars-offcanvas', 'Offcanvas navbar'],
  ['navbar-static', 'Navbar static'],
  ['navbar-fixed', 'Navbar fixed'],
  ['cover', 'Cover'],
  ['sign-in', 'Sign-in'],
  ['sticky-footer', 'Sticky footer'],
  ['sticky-footer-navbar', 'Sticky footer navbar'],
  ['jumbotron', 'Jumbotron'],
  ['navbar-bottom', 'Navbar bottom'],
  ['offcanvas-navbar', 'Offcanvas navbar'],
];

for (const [slug, title] of SLUGS) {
  const src = path.join(
    root,
    'apps/docs/src/pages/compare',
    `example-${slug}`,
    'wc.astro',
  );
  const dst = path.join(root, 'apps/docs/src/pages/examples', `${slug}.astro`);
  let body = await readFile(src, 'utf8');
  // Drop the comparator-port header comment (refers to a sibling reference.astro
  // that doesn't exist next to the public page) and replace with an upstream
  // pointer.
  body = body.replace(
    /\/\/ `<bs-\*>` port of \.\/reference\.astro[^]*?(?=\nconst |\n---)/,
    `// Standalone port of https://getbootstrap.com/docs/5.3/examples/${slug}/\n// to bootstrap-wc components. Comparator pair lives at\n// apps/docs/src/pages/compare/example-${slug}/.\n`,
  );
  body = body.replace(
    /<title>[^<]*<\/title>/i,
    `<title>${title} example · bootstrap-wc</title>`,
  );
  // Strip data-compare-key="…" and data-compare-key={`…`} (backticked JSX
   // expressions that may contain ${…} interpolations).
  body = body.replace(/\s+data-compare-key="[^"]*"/g, '');
  body = body.replace(/\s+data-compare-key=\{`[^`]*`\}/g, '');
  await writeFile(dst, body, 'utf8');
  console.log(`wrote ${path.relative(root, dst)}`);
}
