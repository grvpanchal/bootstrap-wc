#!/usr/bin/env node
// Compare a bootstrap-wc component against the canonical Bootstrap 5.3
// reference on getbootstrap.com, enumerating EVERY example block on each
// side and pairing them up by preceding heading. Boots `astro preview`,
// snapshots each example pair, extracts structural HTML, and writes one
// aggregated report per component.
//
// Usage:
//   node scripts/compare-bootstrap.mjs <component> [component...]
//   node scripts/compare-bootstrap.mjs --all
//
// Env:
//   BWC_BASE   default http://127.0.0.1:4321   — preview server URL
//   BS_BASE    default https://getbootstrap.com/docs/5.3
//   OUT_DIR    default ./.audit
//   EXAMPLE_BWC   CSS selector scoping bwc example blocks    (default .bwc-example)
//   EXAMPLE_BS    CSS selector scoping bootstrap blocks      (default .bd-example)
//
// `scripts/component-map.json` now stores only the per-component URLs
// (bwcUrl, bsUrl); the example selectors are fixed defaults overridden
// per-component as needed via optional fields:
//   {
//     "<name>": {
//       "bwcUrl": "/components/<name>/",
//       "bsUrl":  "/components/<name>/",
//       "bwcExampleSelector": ".bwc-example",     // optional
//       "bsExampleSelector":  ".bd-example",       // optional
//       "bsExampleSkip":      ["class-to-ignore"], // optional: drop example blocks that contain these classes (e.g. ".bd-placeholder-img")
//       "notes":              "optional gotcha"
//     }
//   }
//
// Output (per component):
//   .audit/<name>/report.md                    aggregated findings
//   .audit/<name>/example-<nn>-<label>.bwc.png         screenshot of bwc side
//   .audit/<name>/example-<nn>-<label>.bootstrap.png   screenshot of bootstrap side
//   .audit/<name>/example-<nn>-<label>.bwc.html        flattened bs-* tree
//   .audit/<name>/example-<nn>-<label>.bootstrap.html  raw bootstrap markup

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const BWC_BASE = process.env.BWC_BASE || 'http://127.0.0.1:4321';
const BS_BASE = (process.env.BS_BASE || 'https://getbootstrap.com/docs/5.3').replace(/\/$/, '');
const OUT_DIR = path.resolve(process.env.OUT_DIR || path.join(repoRoot, '.audit'));
const MAP_PATH = path.join(here, 'component-map.json');
const DEFAULT_BWC_SELECTOR = process.env.EXAMPLE_BWC || '.bwc-example';
const DEFAULT_BS_SELECTOR = process.env.EXAMPLE_BS || '.bd-example';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('usage: compare-bootstrap.mjs <component> [component...] | --all');
  process.exit(2);
}
if (!fs.existsSync(MAP_PATH)) {
  console.error(`missing ${MAP_PATH}`);
  process.exit(2);
}
/** @type {Record<string, { bwcUrl: string, bsUrl: string, bwcExampleSelector?: string, bsExampleSelector?: string, bsExampleSkip?: string[], notes?: string }>} */
const MAP = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));
const wanted = args.includes('--all') ? Object.keys(MAP) : args;
for (const c of wanted) {
  if (!MAP[c]) {
    console.error(`unknown component "${c}" — add it to scripts/component-map.json`);
    process.exit(2);
  }
}
fs.mkdirSync(OUT_DIR, { recursive: true });

async function ensurePreview() {
  try {
    const r = await fetch(BWC_BASE + '/');
    if (r.ok) return null;
  } catch {}
  const url = new URL(BWC_BASE);
  const port = url.port || '4321';
  const host = url.hostname || '127.0.0.1';
  console.log(`starting astro preview on ${host}:${port} ...`);
  const child = spawn('npx', ['astro', 'preview', '--port', port, '--host', host], {
    cwd: path.join(repoRoot, 'apps/docs'),
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const r = await fetch(BWC_BASE + '/');
      if (r.ok) return child;
    } catch {}
  }
  throw new Error('astro preview did not come up within 30s');
}

/** Slugify an example heading into a filename-safe token. */
function slug(s, n = 28) {
  return (
    (s || 'example')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, n) || 'example'
  );
}

/** For each matching example block: find the closest preceding heading
 *  (h1/h2/h3) to use as a label, and return the element + label. */
async function collectExamples(page, selector, skipClasses = []) {
  return await page.evaluate(
    ({ selector, skipClasses }) => {
      const nodes = Array.from(document.querySelectorAll(selector));
      const out = [];
      const findHeading = (el) => {
        let cur = el;
        while (cur) {
          let sib = cur.previousElementSibling;
          while (sib) {
            if (/^H[1-6]$/.test(sib.tagName)) return sib.textContent.trim();
            const h = sib.querySelector && sib.querySelector('h1, h2, h3, h4');
            if (h) return h.textContent.trim();
            sib = sib.previousElementSibling;
          }
          cur = cur.parentElement;
        }
        return '';
      };
      for (let i = 0; i < nodes.length; i++) {
        const el = nodes[i];
        if (skipClasses.some((c) => el.classList.contains(c))) continue;
        // Skip zero-size blocks (e.g. hidden modals that aren't rendered in situ).
        const r = el.getBoundingClientRect();
        const label = findHeading(el);
        out.push({ index: i, label, width: r.width, height: r.height });
      }
      return out;
    },
    { selector, skipClasses },
  );
}

/** Return flattened shadow+light tree of the nth matching element. */
async function flattenNth(page, selector, n) {
  return await page.evaluate(
    ({ selector, n }) => {
      const el = document.querySelectorAll(selector)[n];
      if (!el) return null;
      function walk(node, indent = 0) {
        const pad = '  '.repeat(indent);
        if (node.nodeType === 3) {
          const t = (node.textContent || '').trim();
          return t ? pad + t + '\n' : '';
        }
        if (node.nodeType !== 1) return '';
        const tag = node.tagName.toLowerCase();
        const attrs = Array.from(node.attributes)
          .filter((a) => !['dir', 'style'].includes(a.name))
          .map((a) => ` ${a.name}="${a.value}"`)
          .join('');
        let out = `${pad}<${tag}${attrs}>\n`;
        if (node.shadowRoot) {
          out += `${pad}  #shadow\n`;
          for (const c of node.shadowRoot.childNodes) out += walk(c, indent + 2);
        }
        for (const c of node.childNodes) out += walk(c, indent + 1);
        out += `${pad}</${tag}>\n`;
        return out;
      }
      return walk(el);
    },
    { selector, n },
  );
}

/** Collect every `class` token inside a rendered example block. */
async function collectBwcTokens(page, selector, n) {
  return await page.evaluate(
    ({ selector, n }) => {
      const el = document.querySelectorAll(selector)[n];
      if (!el) return { hosts: [], all: [] };
      const hosts = [];
      const allTokens = new Set();
      const walk = (node) => {
        if (node.classList) for (const c of node.classList) allTokens.add(c);
        if (node.tagName && node.tagName.toLowerCase().startsWith('bs-')) {
          hosts.push({ tag: node.tagName.toLowerCase(), classes: Array.from(node.classList) });
        }
        // Crawl shadow content too — classes inside shadow count as "covered".
        if (node.shadowRoot) for (const c of node.shadowRoot.children) walk(c);
        for (const c of node.children || []) walk(c);
      };
      walk(el);
      return { hosts, all: [...allTokens] };
    },
    { selector, n },
  );
}

/** Raw innerHTML of the nth matching block. */
async function nthOuterHTML(page, selector, n) {
  return await page.evaluate(
    ({ selector, n }) => {
      const el = document.querySelectorAll(selector)[n];
      return el ? el.outerHTML : null;
    },
    { selector, n },
  );
}

function extractClasses(html) {
  const out = new Set();
  const re = /class="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    for (const c of m[1].trim().split(/\s+/)) out.add(c);
  }
  return out;
}

// Ignore classes that are Bootstrap's docs chrome (page-utility utilities, not
// component-intrinsic styling). The script would otherwise flag them as
// "missing" and noise up reports. Both an explicit set AND a prefix-based
// pattern so utilities like `mb-3`, `bg-light`, `text-muted` get filtered
// without hand-listing every scale.
const IGNORE_CLASSES = new Set([
  'bd-example',
  'bd-example-row',
  'bd-placeholder-img',
  'bd-placeholder-img-lg',
  'collapse',
  'show',
  'fade',
  'container',
  'container-fluid',
  'row',
  'col',
  'visually-hidden',
  'visually-hidden-focusable',
  'clearfix',
]);

const IGNORE_PATTERNS = [
  /^(m|p|mb|mt|ml|mr|mx|my|pb|pt|pl|pr|px|py)-/, // spacing utilities (m-0, px-3, my-auto)
  /^bg-/, // color backgrounds used in docs examples (bg-light, bg-dark)
  /^text-/, // text utilities
  /^border(-|$)/, // border utilities — but NOT .border-primary as a card modifier; flagged only if other classes miss too
  /^(d|flex|align|justify|gap|order|flex-wrap|flex-column|flex-row)(-|$)/, // flex utilities
  /^(w|h|mw|mh)-/, // sizing
  /^col(-|$)/, // grid columns
  /^rounded(-|$)/, // rounding utilities
  /^(fs|fw|lh|font)-/, // typography
  /^shadow(-|$)/, // shadows
  /^(position|top|bottom|start|end|sticky|fixed)-/, // positioning
  /^opacity-/, // opacity utilities
  /^(user-select|pe)-/, // pointer-events / user-select
  /^(bs-|sl-)/, // our own bs-* host chrome + Starlight internals
  /^astro-/, // Astro scoped class ids
  /^pagefind-/, // Starlight search chrome
  /^starlight-/, // Starlight custom elements
];

const isIgnored = (c) => IGNORE_CLASSES.has(c) || IGNORE_PATTERNS.some((re) => re.test(c));

async function processComponent(browser, name) {
  const spec = MAP[name];
  const outDir = path.join(OUT_DIR, name);
  fs.mkdirSync(outDir, { recursive: true });
  // Clean stale artifacts from previous runs so naming collisions don't hide issues.
  for (const f of fs.readdirSync(outDir)) {
    if (f.startsWith('example-') || f === 'report.md') {
      fs.rmSync(path.join(outDir, f));
    }
  }

  const bwcSel = spec.bwcExampleSelector || DEFAULT_BWC_SELECTOR;
  const bsSel = spec.bsExampleSelector || DEFAULT_BS_SELECTOR;
  const bsSkip = spec.bsExampleSkip || [];

  const ctx = await browser.newContext({
    viewport: { width: 1000, height: 720 },
    ignoreHTTPSErrors: true,
  });
  const page = await ctx.newPage();

  const bwcUrl = BWC_BASE + spec.bwcUrl;
  await page.goto(bwcUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(400);
  const bwcBlocks = await collectExamples(page, bwcSel, []);

  const bsUrl = BS_BASE + spec.bsUrl;
  await page.goto(bsUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(400);
  const bsBlocks = await collectExamples(page, bsSel, bsSkip);

  // Pair examples by label (case-insensitive, de-punctuated). Unmatched go
  // at the end so the user sees coverage gaps at a glance.
  const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const pairs = [];
  // Group bwc blocks by label into consumable queues so multiple bs blocks
  // sharing a heading (e.g. "Sizes") each get at most one bwc partner.
  const bwcByLabel = new Map();
  for (const b of bwcBlocks) {
    const k = norm(b.label);
    if (!bwcByLabel.has(k)) bwcByLabel.set(k, []);
    bwcByLabel.get(k).push(b);
  }
  const usedBwc = new Set();
  for (const bs of bsBlocks) {
    const key = norm(bs.label);
    const q = bwcByLabel.get(key);
    const bwc = q && q.length ? q.shift() : null;
    if (bwc) usedBwc.add(bwc.index);
    pairs.push({ label: bs.label || (bwc && bwc.label) || '(untitled)', bs, bwc });
  }
  for (const bwc of bwcBlocks) {
    if (!usedBwc.has(bwc.index)) pairs.push({ label: bwc.label || '(untitled)', bs: null, bwc });
  }

  // For each pair: screenshot + dump HTML + compute class delta.
  const results = [];
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    const base = `example-${String(i + 1).padStart(2, '0')}-${slug(pair.label)}`;
    const r = { label: pair.label, bwcSeen: false, bsSeen: false, missing: [], extra: [], bwcHosts: [] };

    if (pair.bs) {
      await page.goto(bsUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      const bsEls = await page.$$(bsSel);
      const bsIndex = bsBlocks.indexOf(pair.bs);
      const bsEl = bsEls[pair.bs.index];
      if (bsEl) {
        try {
          await bsEl.screenshot({ path: path.join(outDir, `${base}.bootstrap.png`) });
        } catch {}
        const html = await nthOuterHTML(page, bsSel, pair.bs.index);
        if (html) fs.writeFileSync(path.join(outDir, `${base}.bootstrap.html`), html);
        r.bsClasses = [...extractClasses(html || '')].filter((c) => !isIgnored(c));
        r.bsSeen = true;
      }
    }

    if (pair.bwc) {
      await page.goto(bwcUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      const bwcEls = await page.$$(bwcSel);
      const bwcEl = bwcEls[pair.bwc.index];
      if (bwcEl) {
        try {
          await bwcEl.screenshot({ path: path.join(outDir, `${base}.bwc.png`) });
        } catch {}
        const tree = await flattenNth(page, bwcSel, pair.bwc.index);
        if (tree) fs.writeFileSync(path.join(outDir, `${base}.bwc.html`), tree);
        const { hosts, all } = await collectBwcTokens(page, bwcSel, pair.bwc.index);
        r.bwcHosts = hosts;
        r.bwcClasses = all.filter((c) => !isIgnored(c));
        r.bwcSeen = true;
      }
    }

    if (r.bsClasses && r.bwcClasses) {
      const bwcSet = new Set(r.bwcClasses);
      r.missing = r.bsClasses.filter((c) => !bwcSet.has(c));
      const bsSet = new Set(r.bsClasses);
      r.extra = r.bwcClasses.filter((c) => !bsSet.has(c) && c.startsWith('bs-') === false && !c.startsWith('btn-') === false); // keep extras quiet; not strictly a bug
      r.extra = []; // drop extras from report; often docs-only additions
    }
    results.push(r);
  }

  // Write report
  const lines = [];
  lines.push(`# ${name} — full example audit`);
  lines.push('');
  lines.push(`- bootstrap-wc: ${bwcUrl}`);
  lines.push(`- bootstrap:   ${bsUrl}`);
  lines.push(
    `- examples:    bwc=${bwcBlocks.length}  bs=${bsBlocks.length}  paired=${results.filter((r) => r.bsSeen && r.bwcSeen).length}`,
  );
  lines.push('');
  let totalMissing = 0;
  let bwcOnly = 0;
  let bsOnly = 0;
  for (const r of results) {
    if (!r.bsSeen) bwcOnly++;
    if (!r.bwcSeen) bsOnly++;
    totalMissing += (r.missing || []).length;
  }
  lines.push(`- total missing classes: ${totalMissing}`);
  if (bsOnly) lines.push(`- bootstrap examples without a bwc counterpart: ${bsOnly}`);
  if (bwcOnly) lines.push(`- bwc examples without a bootstrap counterpart: ${bwcOnly}`);
  lines.push('');
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const idx = String(i + 1).padStart(2, '0');
    lines.push(`## ${idx}. ${r.label}`);
    lines.push('');
    if (!r.bsSeen) lines.push('> ⚠︎ no Bootstrap reference block found for this label.');
    if (!r.bwcSeen) lines.push('> ⚠︎ no bootstrap-wc example found for this label.');
    if (r.bwcHosts.length) {
      lines.push('Host classes on `<bs-*>` elements:');
      for (const h of r.bwcHosts) {
        lines.push(`- \`<${h.tag}>\` → ${h.classes.length ? h.classes.map((c) => `\`${c}\``).join(' ') : '(none)'}`);
      }
    }
    if (r.missing && r.missing.length) {
      lines.push('');
      lines.push('Missing Bootstrap classes (not on any host, not in any shadow):');
      for (const m of r.missing) lines.push(`- \`${m}\``);
    } else if (r.bsSeen && r.bwcSeen) {
      lines.push('');
      lines.push('Missing classes: (none) ✓');
    }
    lines.push('');
    lines.push(
      `Artifacts: \`example-${idx}-${slug(r.label)}.{bootstrap,bwc}.{png,html}\`.`,
    );
    lines.push('');
  }
  lines.push('## How to read this report');
  lines.push('');
  lines.push('- **Missing classes** on a paired example → something in Bootstrap\'s');
  lines.push('  markup (class, wrapper element, modifier) isn\'t yet wired up on the');
  lines.push('  bs-* host or inside its shadow template.');
  lines.push('- **Bootstrap-only examples** (no bwc counterpart) → the docs example');
  lines.push('  coverage is incomplete. Either add an `<Example code={...} />` block');
  lines.push('  to the `.mdx` page or expose a new attribute/slot for the variant.');
  lines.push('- Compare the `*.bootstrap.png` and `*.bwc.png` screenshots side-by-side');
  lines.push('  for visual drift not captured by the class diff.');
  if (spec.notes) {
    lines.push('');
    lines.push('## Notes');
    lines.push(spec.notes);
  }
  fs.writeFileSync(path.join(outDir, 'report.md'), lines.join('\n') + '\n');

  await ctx.close();
  console.log(
    `${name}: bwc=${bwcBlocks.length} bs=${bsBlocks.length} missing=${totalMissing}  (see ${path.relative(repoRoot, outDir)}/report.md)`,
  );
}

const ranInBackground = await ensurePreview();
const browser = await chromium.launch({ headless: true });
try {
  for (const c of wanted) await processComponent(browser, c);
} finally {
  await browser.close();
  if (ranInBackground) {
    try {
      process.kill(-ranInBackground.pid);
    } catch {}
  }
}
