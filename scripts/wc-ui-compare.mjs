#!/usr/bin/env node
// scripts/wc-ui-compare.mjs
//
// Compare a plain HTML+Bootstrap reference page against the bootstrap-wc
// (`<bs-*>`) port of the same UI and report visual + structural drift.
//
// The agent scaffolds two Astro pages under
// `apps/docs/src/pages/compare/<slug>/`:
//
//   reference.astro  — the design "ground truth" written with raw
//                      Bootstrap classes only.
//   wc.astro         — the port that uses our `<bs-*>` components.
//
// This script:
//   1. Auto-starts `astro preview` on :4321 if nothing is listening.
//   2. Loads /compare/<slug>/reference/ and /compare/<slug>/wc/ at the
//      same viewport, takes screenshots, and runs a sharp-based pixel
//      diff (returning the % of pixels that differ above an RGB delta).
//   3. Walks both DOMs collecting elements tagged with `data-compare-key
//      ="<key>"`, and for each matched pair compares getBoundingClient
//      Rect + computed visual styles (color, background, border, padding,
//      margin, font, shadow, border-radius, display, width, height).
//   4. Writes screenshots, diff PNG, and a Markdown report under
//      `.audit/wc-ui/<slug>/`.
//
// Usage:
//   node scripts/wc-ui-compare.mjs --name <slug>
//   node scripts/wc-ui-compare.mjs --name <slug> --viewport 1280x900
//   node scripts/wc-ui-compare.mjs --name <slug> --threshold 0.5
//   node scripts/wc-ui-compare.mjs --ref <url> --wc <url> --name <slug>
//   npm run audit:ui -- --name pricing-section
//
// Exit status: 0 if pixel diff <= threshold AND no style-prop mismatches
//              were found above the per-prop tolerance, 1 otherwise.

import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const PORT = process.env.PORT || '4321';
const BASE = `http://127.0.0.1:${PORT}`;

// Per-property tolerances for the style diff. Picked to absorb sub-pixel
// rounding without hiding real drift (e.g. a missing class delivering 8px
// vs 12px padding). Declared at module top so it's outside the
// temporal-dead-zone of the top-level `try` block below.
const PROP_TOLERANCE = {
  'border-top-width': 0.5,
  'border-right-width': 0.5,
  'border-bottom-width': 0.5,
  'border-left-width': 0.5,
  'border-top-left-radius': 0.5,
  'border-top-right-radius': 0.5,
  'border-bottom-left-radius': 0.5,
  'border-bottom-right-radius': 0.5,
  'padding-top': 0.5,
  'padding-right': 0.5,
  'padding-bottom': 0.5,
  'padding-left': 0.5,
  'margin-top': 0.5,
  'margin-right': 0.5,
  'margin-bottom': 0.5,
  'margin-left': 0.5,
  'font-size': 0.5,
  'line-height': 1,
  opacity: 0.05,
};

const args = process.argv.slice(2);
const opts = parseArgs(args);

if (!opts.name) {
  console.error(
    'usage: node scripts/wc-ui-compare.mjs --name <slug> [--viewport WxH] [--threshold 1.0] [--ref <url> --wc <url>]',
  );
  process.exit(2);
}

const viewport = parseViewport(opts.viewport || '1280x900');
const threshold = Number.parseFloat(opts.threshold ?? '1.0'); // % of pixels
const refUrl = opts.ref || `${BASE}/compare/${opts.name}/reference/`;
const wcUrl = opts.wc || `${BASE}/compare/${opts.name}/wc/`;
const outDir = resolve(REPO_ROOT, '.audit/wc-ui', opts.name);
await mkdir(outDir, { recursive: true });

const previewProc = await ensurePreview();

let exitCode = 0;
try {
  const browser = await chromium.launch();
  console.log(`wc-ui-compare: ${opts.name}`);
  console.log(`  reference: ${refUrl}`);
  console.log(`  wc:        ${wcUrl}`);
  console.log(`  viewport:  ${viewport.width}x${viewport.height}`);

  const refResult = await capture(browser, refUrl, viewport, 'reference');
  const wcResult = await capture(browser, wcUrl, viewport, 'wc');
  await browser.close();

  if (refResult.status !== 200) {
    fail(`reference returned HTTP ${refResult.status} (${refUrl})`);
  }
  if (wcResult.status !== 200) {
    fail(`wc returned HTTP ${wcResult.status} (${wcUrl})`);
  }

  await writeFile(resolve(outDir, 'reference.png'), refResult.png);
  await writeFile(resolve(outDir, 'wc.png'), wcResult.png);

  const pixelDiff = await pixelCompare(
    refResult.png,
    wcResult.png,
    resolve(outDir, 'diff.png'),
  );
  console.log(
    `  pixel diff: ${pixelDiff.percentDifferent.toFixed(2)}% (${pixelDiff.differing}/${pixelDiff.total} px)`,
  );

  const pairs = pairElements(refResult.elements, wcResult.elements);
  const styleDiffs = computeStyleDiffs(pairs);
  console.log(
    `  paired elements: ${pairs.matched.length}/${pairs.total} ` +
      `(${pairs.unpairedRef.length} ref-only, ${pairs.unpairedWc.length} wc-only)`,
  );
  console.log(
    `  style mismatches: ${styleDiffs.length} prop${styleDiffs.length === 1 ? '' : 's'}`,
  );

  const report = renderReport({
    name: opts.name,
    refUrl,
    wcUrl,
    viewport,
    threshold,
    pixelDiff,
    pairs,
    styleDiffs,
    refResult,
    wcResult,
  });
  await writeFile(resolve(outDir, 'report.md'), report);
  console.log(`  report:    .audit/wc-ui/${opts.name}/report.md`);

  const passed =
    pixelDiff.percentDifferent <= threshold &&
    styleDiffs.length === 0 &&
    pairs.unpairedRef.length === 0 &&
    pairs.unpairedWc.length === 0;
  if (!passed) exitCode = 1;
  console.log(passed ? '\nPASS' : `\nFAIL (threshold ${threshold}%)`);
} finally {
  if (previewProc) {
    try {
      process.kill(-previewProc.pid);
    } catch {}
  }
  process.exit(exitCode);
}

// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const k = a.slice(2);
    const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
    o[k] = v;
  }
  return o;
}

function parseViewport(s) {
  const [w, h] = s.split('x').map(Number);
  if (!w || !h) throw new Error(`invalid --viewport ${s}`);
  return { width: w, height: h };
}

function fail(msg) {
  console.error(`wc-ui-compare: ${msg}`);
  process.exit(1);
}

async function ensurePreview() {
  try {
    const r = await fetch(BASE, { redirect: 'manual' });
    if (r.ok || (r.status >= 300 && r.status < 400)) return null;
  } catch {}
  console.log(`  starting astro preview on ${BASE} ...`);
  const child = spawn(
    'npx',
    ['astro', 'preview', '--port', PORT, '--host', '127.0.0.1'],
    {
      cwd: resolve(REPO_ROOT, 'apps/docs'),
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  child.stdout?.on('data', () => {});
  child.stderr?.on('data', () => {});

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const r = await fetch(BASE, { redirect: 'manual' });
      if (r.ok || (r.status >= 300 && r.status < 400)) return child;
    } catch {}
  }
  throw new Error(`astro preview did not come up within 30s on ${BASE}`);
}

async function capture(browser, url, viewport, label) {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
  });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  let resp;
  try {
    resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    await ctx.close();
    return { status: 0, png: Buffer.alloc(0), elements: [], consoleErrors: [e.message] };
  }
  // Give bs-* time to upgrade and apply layout.
  await page.waitForTimeout(500);

  const png = await page.screenshot({ fullPage: true, animations: 'disabled' });

  const elements = await page.evaluate(() => {
    const VISUAL_PROPS = [
      'display',
      'color',
      'background-color',
      'background-image',
      'border-top-width',
      'border-right-width',
      'border-bottom-width',
      'border-left-width',
      'border-top-style',
      'border-right-style',
      'border-bottom-style',
      'border-left-style',
      'border-top-color',
      'border-right-color',
      'border-bottom-color',
      'border-left-color',
      'border-top-left-radius',
      'border-top-right-radius',
      'border-bottom-left-radius',
      'border-bottom-right-radius',
      'padding-top',
      'padding-right',
      'padding-bottom',
      'padding-left',
      'margin-top',
      'margin-right',
      'margin-bottom',
      'margin-left',
      'font-family',
      'font-size',
      'font-weight',
      'line-height',
      'text-align',
      'box-shadow',
      'opacity',
    ];
    return Array.from(document.querySelectorAll('[data-compare-key]'))
      .map((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const styles = {};
        for (const p of VISUAL_PROPS) styles[p] = cs.getPropertyValue(p);
        return {
          key: el.getAttribute('data-compare-key'),
          tag: el.tagName.toLowerCase(),
          rect: {
            x: Math.round(r.x),
            y: Math.round(r.y),
            w: Math.round(r.width),
            h: Math.round(r.height),
          },
          styles,
          // Truncate text content for the report so we can spot label drift.
          text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
        };
      });
  });

  const status = resp ? resp.status() : 0;
  await ctx.close();
  return { status, png, elements, consoleErrors, label };
}

async function pixelCompare(aBuf, bBuf, diffPath) {
  const a = await sharp(aBuf).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const b = await sharp(bBuf).raw().ensureAlpha().toBuffer({ resolveWithObject: true });

  // Pad shorter image to match the taller one so the diff has stable dims.
  const W = Math.max(a.info.width, b.info.width);
  const H = Math.max(a.info.height, b.info.height);
  const aPad = await padTo(a, W, H);
  const bPad = await padTo(b, W, H);

  const diff = Buffer.alloc(W * H * 4);
  let differing = 0;
  const tol = 8; // per-channel tolerance to absorb anti-aliasing
  for (let i = 0; i < diff.length; i += 4) {
    const dr = Math.abs(aPad[i] - bPad[i]);
    const dg = Math.abs(aPad[i + 1] - bPad[i + 1]);
    const db = Math.abs(aPad[i + 2] - bPad[i + 2]);
    if (dr > tol || dg > tol || db > tol) {
      // Highlight differing pixel red on white.
      diff[i] = 255;
      diff[i + 1] = 0;
      diff[i + 2] = 0;
      diff[i + 3] = 255;
      differing++;
    } else {
      // Faded reference pixel for context.
      diff[i] = (aPad[i] + 510) / 3;
      diff[i + 1] = (aPad[i + 1] + 510) / 3;
      diff[i + 2] = (aPad[i + 2] + 510) / 3;
      diff[i + 3] = 255;
    }
  }
  await sharp(diff, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toFile(diffPath);
  const total = W * H;
  return { differing, total, percentDifferent: (differing / total) * 100, width: W, height: H };
}

async function padTo(rawObj, W, H) {
  const { data, info } = rawObj;
  if (info.width === W && info.height === H) return data;
  const padded = Buffer.alloc(W * H * 4, 255); // white
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const src = (y * info.width + x) * 4;
      const dst = (y * W + x) * 4;
      padded[dst] = data[src];
      padded[dst + 1] = data[src + 1];
      padded[dst + 2] = data[src + 2];
      padded[dst + 3] = data[src + 3];
    }
  }
  return padded;
}

function pairElements(refElements, wcElements) {
  const refByKey = new Map(refElements.map((e) => [e.key, e]));
  const wcByKey = new Map(wcElements.map((e) => [e.key, e]));
  const matched = [];
  const unpairedRef = [];
  const unpairedWc = [];
  for (const [k, ref] of refByKey) {
    if (wcByKey.has(k)) matched.push({ key: k, ref, wc: wcByKey.get(k) });
    else unpairedRef.push(ref);
  }
  for (const [k, wc] of wcByKey) if (!refByKey.has(k)) unpairedWc.push(wc);
  return {
    matched,
    unpairedRef,
    unpairedWc,
    total: matched.length + unpairedRef.length + unpairedWc.length,
  };
}

function computeStyleDiffs(pairs) {
  const out = [];
  for (const p of pairs.matched) {
    for (const prop of Object.keys(p.ref.styles)) {
      const a = p.ref.styles[prop] ?? '';
      const b = p.wc.styles[prop] ?? '';
      if (a === b) continue;
      const tol = PROP_TOLERANCE[prop];
      if (typeof tol === 'number' && tol > 0) {
        const na = Number.parseFloat(a);
        const nb = Number.parseFloat(b);
        if (
          Number.isFinite(na) &&
          Number.isFinite(nb) &&
          Math.abs(na - nb) <= tol
        ) {
          continue;
        }
      }
      out.push({ key: p.key, prop, ref: a, wc: b });
    }
    // Bounding-box drift > 2px is also a diff worth listing.
    const dx = Math.abs(p.ref.rect.x - p.wc.rect.x);
    const dy = Math.abs(p.ref.rect.y - p.wc.rect.y);
    const dw = Math.abs(p.ref.rect.w - p.wc.rect.w);
    const dh = Math.abs(p.ref.rect.h - p.wc.rect.h);
    if (dx > 2 || dy > 2 || dw > 2 || dh > 2) {
      out.push({
        key: p.key,
        prop: 'bounding-rect',
        ref: `${p.ref.rect.w}x${p.ref.rect.h}@${p.ref.rect.x},${p.ref.rect.y}`,
        wc: `${p.wc.rect.w}x${p.wc.rect.h}@${p.wc.rect.x},${p.wc.rect.y}`,
      });
    }
  }
  return out;
}

function renderReport({
  name,
  refUrl,
  wcUrl,
  viewport,
  threshold,
  pixelDiff,
  pairs,
  styleDiffs,
  refResult,
  wcResult,
}) {
  const lines = [];
  const passed =
    pixelDiff.percentDifferent <= threshold &&
    styleDiffs.length === 0 &&
    pairs.unpairedRef.length === 0 &&
    pairs.unpairedWc.length === 0;

  lines.push(`# wc-ui-compare: ${name}`);
  lines.push('');
  lines.push(`status: **${passed ? 'PASS' : 'FAIL'}**`);
  lines.push('');
  lines.push(`- reference: ${refUrl}`);
  lines.push(`- wc:        ${wcUrl}`);
  lines.push(`- viewport:  ${viewport.width}x${viewport.height}`);
  lines.push(`- threshold: ${threshold}% pixel-diff`);
  lines.push('');
  lines.push('## Pixel diff');
  lines.push('');
  lines.push(
    `${pixelDiff.percentDifferent.toFixed(2)}% of pixels differ ` +
      `(${pixelDiff.differing} / ${pixelDiff.total}, ${pixelDiff.width}×${pixelDiff.height}).`,
  );
  lines.push('');
  lines.push('![reference](./reference.png) ![wc](./wc.png) ![diff](./diff.png)');
  lines.push('');
  lines.push('## DOM pairing');
  lines.push('');
  lines.push(
    `${pairs.matched.length} matched / ${pairs.unpairedRef.length} ref-only / ${pairs.unpairedWc.length} wc-only`,
  );
  if (pairs.unpairedRef.length) {
    lines.push('');
    lines.push('### keys present only in reference');
    for (const e of pairs.unpairedRef) lines.push(`- \`${e.key}\` (${e.tag})`);
  }
  if (pairs.unpairedWc.length) {
    lines.push('');
    lines.push('### keys present only in wc');
    for (const e of pairs.unpairedWc) lines.push(`- \`${e.key}\` (${e.tag})`);
  }
  lines.push('');
  lines.push('## Style mismatches');
  lines.push('');
  if (!styleDiffs.length) {
    lines.push('_(none)_');
  } else {
    lines.push('| key | property | reference | wc |');
    lines.push('| --- | --- | --- | --- |');
    for (const d of styleDiffs) {
      lines.push(
        `| \`${d.key}\` | \`${d.prop}\` | \`${d.ref}\` | \`${d.wc}\` |`,
      );
    }
  }
  lines.push('');
  if (refResult.consoleErrors?.length) {
    lines.push('## reference console errors');
    for (const e of refResult.consoleErrors) lines.push(`- ${e}`);
    lines.push('');
  }
  if (wcResult.consoleErrors?.length) {
    lines.push('## wc console errors');
    for (const e of wcResult.consoleErrors) lines.push(`- ${e}`);
    lines.push('');
  }
  return lines.join('\n');
}
