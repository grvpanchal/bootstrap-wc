#!/usr/bin/env node
// Mobile-width (390x844, iPhone-ish) screenshot pairs of the four navbar
// example pages, local vs upstream. Captures:
//   - the collapsed state on load (toggler visible, menu hidden)
//   - the expanded state after clicking the first toggler
import { chromium, devices } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const outDir = path.join(root, '.audit/navbar-mobile');
await mkdir(outDir, { recursive: true });

const SLUGS = ['navbar-static', 'navbar-fixed', 'navbars', 'navbars-offcanvas'];
const BASE_LOCAL = 'http://127.0.0.1:4321';
const BASE_REMOTE = 'https://getbootstrap.com/docs/5.3/examples';

const browser = await chromium.launch();

async function shot(ctx, url, expand) {
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(700);
  if (expand) {
    const toggler = await page.$('.navbar-toggler');
    if (toggler) {
      await toggler.click();
      await page.waitForTimeout(700);
    }
  }
  const buf = await page.screenshot({ fullPage: false });
  await page.close();
  return buf;
}

for (const slug of SLUGS) {
  for (const expand of [false, true]) {
    const ctx = await browser.newContext({
      ...devices['iPhone 13'],
      ignoreHTTPSErrors: true,
    });
    const localBuf = await shot(ctx, `${BASE_LOCAL}/examples/${slug}/`, expand);
    const remoteBuf = await shot(ctx, `${BASE_REMOTE}/${slug}/`, expand);
    await ctx.close();

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
    const tag = expand ? 'expanded' : 'collapsed';
    const outPath = path.join(outDir, `${slug}-${tag}.png`);
    await sharp(composite).toFile(outPath);
    console.log(`${slug} ${tag}: ${a.width}x${a.height} | ${b.width}x${b.height}`);
  }
}

await browser.close();
console.log('done');
