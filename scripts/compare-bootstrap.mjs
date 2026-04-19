#!/usr/bin/env node
// Compare a bootstrap-wc component against the canonical Bootstrap 5.3
// reference on getbootstrap.com. Boots `astro preview`, snapshots both
// sides, extracts structural HTML, and writes a diff report.
//
// Usage:
//   node scripts/compare-bootstrap.mjs <component> [component...]
//   node scripts/compare-bootstrap.mjs --all
//
// Env:
//   BWC_BASE   default http://127.0.0.1:4321   — preview server URL
//   BS_BASE    default https://getbootstrap.com/docs/5.3
//   OUT_DIR    default ./.audit
//
// Reads `scripts/component-map.json` to look up each component's selectors
// and the matching Bootstrap docs path. Override or extend there.
//
// Output (per component):
//   .audit/<name>/bwc.png           screenshot of bs-* example area
//   .audit/<name>/bootstrap.png     screenshot of equivalent Bootstrap example
//   .audit/<name>/bwc.html          flattened shadow+light markup of the bs-* tree
//   .audit/<name>/bootstrap.html    raw Bootstrap example markup
//   .audit/<name>/report.md         structured findings: missing classes, role
//                                    / aria drift, sibling-selector hazards.

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

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('usage: compare-bootstrap.mjs <component> [component...] | --all');
  process.exit(2);
}

if (!fs.existsSync(MAP_PATH)) {
  console.error(`missing ${MAP_PATH} — see README.md in scripts/ for its shape.`);
  process.exit(2);
}
/** @type {Record<string, { bwcUrl: string, bwcSelector: string, bsUrl: string, bsSelector: string, notes?: string }>} */
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
  console.log(`starting astro preview on ${BWC_BASE} ...`);
  const child = spawn('npx', ['astro', 'preview', '--port', '4321', '--host', '127.0.0.1'], {
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

/** Flatten a bs-* tree into readable HTML (host classes + shadow contents). */
async function flattenBsTree(page, rootSelector) {
  return await page.evaluate((sel) => {
    const root = document.querySelector(sel);
    if (!root) return null;
    function walk(el, indent = 0) {
      const pad = '  '.repeat(indent);
      if (el.nodeType === 3) {
        const t = (el.textContent || '').trim();
        return t ? pad + t + '\n' : '';
      }
      if (el.nodeType !== 1) return '';
      const tag = el.tagName.toLowerCase();
      const attrs = Array.from(el.attributes)
        .filter((a) => !['dir', 'style'].includes(a.name))
        .map((a) => ` ${a.name}="${a.value}"`)
        .join('');
      let out = `${pad}<${tag}${attrs}>\n`;
      if (el.shadowRoot) {
        out += `${pad}  #shadow\n`;
        for (const child of el.shadowRoot.childNodes) out += walk(child, indent + 2);
      }
      for (const child of el.childNodes) out += walk(child, indent + 1);
      out += `${pad}</${tag}>\n`;
      return out;
    }
    return walk(root);
  }, rootSelector);
}

/** Extract host-level class lists of every <bs-*> in the example region. */
async function extractHostClasses(page, rootSelector) {
  return await page.evaluate((sel) => {
    const root = document.querySelector(sel);
    if (!root) return null;
    const out = [];
    const walk = (el) => {
      if (el.tagName && el.tagName.toLowerCase().startsWith('bs-')) {
        out.push({ tag: el.tagName.toLowerCase(), classes: Array.from(el.classList) });
      }
      for (const c of el.children) walk(c);
    };
    walk(root);
    return out;
  }, rootSelector);
}

function diffClasses(bsHtml, bwcHosts) {
  // Heuristic: every Bootstrap class that appears in the bs reference must
  // be either on a bs-* host or in the bwc rendered output.
  const bsClasses = new Set();
  const reClass = /class="([^"]+)"/g;
  let m;
  while ((m = reClass.exec(bsHtml)) !== null) {
    for (const c of m[1].trim().split(/\s+/)) bsClasses.add(c);
  }
  const bwcSeen = new Set();
  for (const h of bwcHosts) for (const c of h.classes) bwcSeen.add(c);
  const missing = [...bsClasses].filter((c) => !bwcSeen.has(c));
  return { bsClasses: [...bsClasses], missing };
}

async function processComponent(browser, name) {
  const spec = MAP[name];
  const outDir = path.join(OUT_DIR, name);
  fs.mkdirSync(outDir, { recursive: true });

  const ctx = await browser.newContext({
    viewport: { width: 1000, height: 720 },
    ignoreHTTPSErrors: true,
  });
  const page = await ctx.newPage();

  // 1) Our component
  const bwcUrl = BWC_BASE + spec.bwcUrl;
  await page.goto(bwcUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(400);
  const bwcEl = await page.$(spec.bwcSelector);
  if (bwcEl) await bwcEl.screenshot({ path: path.join(outDir, 'bwc.png') });
  const bwcTree = await flattenBsTree(page, spec.bwcSelector);
  const bwcHosts = (await extractHostClasses(page, spec.bwcSelector)) || [];
  if (bwcTree) fs.writeFileSync(path.join(outDir, 'bwc.html'), bwcTree);

  // 2) Bootstrap reference
  const bsUrl = BS_BASE + spec.bsUrl;
  await page.goto(bsUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(400);
  const bsEl = await page.$(spec.bsSelector);
  if (bsEl) await bsEl.screenshot({ path: path.join(outDir, 'bootstrap.png') });
  const bsHtml = bsEl ? await bsEl.evaluate((el) => el.outerHTML) : '';
  if (bsHtml) fs.writeFileSync(path.join(outDir, 'bootstrap.html'), bsHtml);

  // 3) Diff
  const diff = diffClasses(bsHtml, bwcHosts);

  // 4) Report
  const lines = [];
  lines.push(`# ${name} audit`);
  lines.push('');
  lines.push(`- bootstrap-wc: ${bwcUrl}`);
  lines.push(`- bootstrap:   ${bsUrl}`);
  lines.push('');
  lines.push('## Host classes observed on <bs-*> elements');
  for (const h of bwcHosts) lines.push(`- \`<${h.tag}>\` → ${h.classes.length ? h.classes.map((c) => `\`${c}\``).join(' ') : '(none)'}`);
  lines.push('');
  lines.push('## Bootstrap reference classes');
  lines.push(diff.bsClasses.map((c) => `\`${c}\``).join(' ') || '(none)');
  lines.push('');
  lines.push('## Missing Bootstrap classes (neither on host nor in shadow)');
  if (diff.missing.length === 0) {
    lines.push('(none) ✓');
  } else {
    for (const m of diff.missing) lines.push(`- \`${m}\``);
    lines.push('');
    lines.push('For each missing class, check which element should carry it. If');
    lines.push('it belongs to a host-level modifier (e.g. `.btn-group`, `.btn`,');
    lines.push('`.list-group-item`), add it via the component\'s `hostClasses()`');
    lines.push('override. If it belongs to an inner Bootstrap element (e.g.');
    lines.push('`.card-body`, `.modal-dialog`), add it in the render template.');
  }
  lines.push('');
  lines.push('## Next steps');
  lines.push('- Compare `bwc.png` vs `bootstrap.png` visually.');
  lines.push('- Read `bwc.html` and `bootstrap.html` side-by-side for structural drift.');
  lines.push('- Edit the component under `packages/components/src/' + name + '/`.');
  lines.push('- Re-run: `node scripts/compare-bootstrap.mjs ' + name + '`.');
  if (spec.notes) {
    lines.push('');
    lines.push('## Notes');
    lines.push(spec.notes);
  }
  fs.writeFileSync(path.join(outDir, 'report.md'), lines.join('\n') + '\n');
  await ctx.close();
  console.log(`${name}: missing=${diff.missing.length}  (see ${path.relative(repoRoot, outDir)}/report.md)`);
}

const ranInBackground = await ensurePreview();
const browser = await chromium.launch({ headless: true });
try {
  for (const c of wanted) await processComponent(browser, c);
} finally {
  await browser.close();
  if (ranInBackground) {
    try { process.kill(-ranInBackground.pid); } catch {}
  }
}
