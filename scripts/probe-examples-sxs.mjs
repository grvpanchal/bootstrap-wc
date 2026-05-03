#!/usr/bin/env node
// Side-by-side fullPage screenshots of /examples/<slug>/ on the local
// preview server vs https://getbootstrap.com/docs/5.3/examples/<slug>/.
// Writes composite PNGs to .audit/examples-sxs/<slug>.png.
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const outDir = path.join(root, '.audit/examples-sxs');
await mkdir(outDir, { recursive: true });

const SLUGS = [
  'album',
  'pricing',
  'checkout',
  'product',
  'headers',
  'heroes',
  'features',
  'footers',
  'navbars',
  'navbars-offcanvas',
  'navbar-static',
  'navbar-fixed',
];

const BASE_LOCAL = 'http://127.0.0.1:4321';
const BASE_REMOTE = 'https://getbootstrap.com/docs/5.3/examples';
const VIEWPORT = { width: 1280, height: 900 };

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: VIEWPORT,
  ignoreHTTPSErrors: true,
});
const page = await ctx.newPage();

const summary = [];
for (const slug of SLUGS) {
  const localUrl = `${BASE_LOCAL}/examples/${slug}/`;
  const remoteUrl = `${BASE_REMOTE}/${slug}/`;
  let localBuf, remoteBuf;
  try {
    await page.goto(localUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForLoadState('load', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(800);
    localBuf = await page.screenshot({ fullPage: true });
  } catch (err) {
    summary.push({ slug, error: `local: ${err.message}` });
    continue;
  }
  try {
    await page.goto(remoteUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);
    remoteBuf = await page.screenshot({ fullPage: true });
  } catch (err) {
    summary.push({ slug, error: `remote: ${err.message}` });
    continue;
  }

  const [a, b] = await Promise.all([
    sharp(localBuf).metadata(),
    sharp(remoteBuf).metadata(),
  ]);
  const h = Math.max(a.height, b.height);
  const composite = await sharp({
    create: {
      width: a.width + b.width + 8,
      height: h,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .composite([
      { input: localBuf, top: 0, left: 0 },
      { input: remoteBuf, top: 0, left: a.width + 8 },
    ])
    .png()
    .toBuffer();

  const outPath = path.join(outDir, `${slug}.png`);
  await sharp(composite).toFile(outPath);
  summary.push({
    slug,
    local: { w: a.width, h: a.height },
    remote: { w: b.width, h: b.height },
    out: path.relative(root, outPath),
  });
  console.log(
    `${slug}: local ${a.width}x${a.height} | remote ${b.width}x${b.height} → ${path.relative(root, outPath)}`,
  );
}

await browser.close();

const errs = summary.filter((s) => s.error);
if (errs.length) {
  console.error('errors:');
  for (const e of errs) console.error(`  ${e.slug}: ${e.error}`);
  process.exit(1);
}
console.log('all OK');
