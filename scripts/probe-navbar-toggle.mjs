#!/usr/bin/env node
// Click the first .navbar-toggler on every example demo page at mobile
// viewport, sample state across the click, and report what happened so
// we can compare bs-navbar's collapse animation + the offcanvas-page
// behavior against upstream's stock Bootstrap collapse + offcanvas.
import { chromium, devices } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const outDir = path.join(root, '.audit/navbar-toggler');
await mkdir(outDir, { recursive: true });

const SLUGS = [
  'album',
  'product',
  'navbar-static',
  'navbar-fixed',
  'navbars',
  'navbars-offcanvas',
];

const BASE_LOCAL = 'http://127.0.0.1:4321/examples';
const BASE_REMOTE = 'https://getbootstrap.com/docs/5.3/examples';

const browser = await chromium.launch();
const reports = [];

for (const slug of SLUGS) {
  for (const where of ['local', 'upstream']) {
    const ctx = await browser.newContext({
      ...devices['iPhone 13'],
      ignoreHTTPSErrors: true,
    });
    const page = await ctx.newPage();
    const consoleLog = [];
    page.on('console', (m) => consoleLog.push(`${m.type()}: ${m.text()}`));
    page.on('pageerror', (e) => consoleLog.push(`pageerror: ${e.message}`));
    const url = `${where === 'local' ? BASE_LOCAL : BASE_REMOTE}/${slug}/`;

    let toggleResult = null;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(800);

      // Snapshot: pre-click
      const pre = await snapshot(page, slug);
      const beforePath = path.join(outDir, `${slug}-${where}-1-before.png`);
      await page.screenshot({ path: beforePath, fullPage: false });

      // Find the hamburger toggler. For local bs-navbar, toggler is in
      // shadow root — open with custom selector.
      const toggler = await findToggler(page);
      if (!toggler) {
        toggleResult = { ok: false, reason: 'no toggler found' };
      } else {
        await toggler.click({ force: true });
        // Snapshot mid-animation (~150ms in)
        await page.waitForTimeout(150);
        const midPath = path.join(outDir, `${slug}-${where}-2-mid.png`);
        await page.screenshot({ path: midPath, fullPage: false });
        // Wait for animation to settle
        await page.waitForTimeout(450);
        const post = await snapshot(page, slug);
        const afterPath = path.join(
          outDir,
          `${slug}-${where}-3-after.png`,
        );
        await page.screenshot({ path: afterPath, fullPage: false });
        toggleResult = { ok: true, pre, post };
      }
    } catch (err) {
      toggleResult = { ok: false, reason: err.message };
    }

    reports.push({
      slug,
      where,
      url,
      ...toggleResult,
      console: consoleLog.slice(0, 10),
    });
    await ctx.close();
  }
}

await browser.close();

function compactSummary(reports) {
  const lines = [];
  for (const r of reports) {
    lines.push(`## ${r.slug} — ${r.where}`);
    lines.push(`url: ${r.url}`);
    if (!r.ok) {
      lines.push(`!! ${r.reason}`);
    } else {
      lines.push(
        `pre:  expanded=${r.pre.expanded} collapseDisplay=${r.pre.collapseDisplay} collapseHeight=${r.pre.collapseHeight} hasOffcanvasShown=${r.pre.hasOffcanvasShown} hasCollapsing=${r.pre.hasCollapsing}`,
      );
      lines.push(
        `post: expanded=${r.post.expanded} collapseDisplay=${r.post.collapseDisplay} collapseHeight=${r.post.collapseHeight} hasOffcanvasShown=${r.post.hasOffcanvasShown} hasCollapsing=${r.post.hasCollapsing}`,
      );
    }
    if (r.console.length) {
      lines.push('console:');
      for (const c of r.console) lines.push(`  ${c}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function findToggler(page) {
  return page.evaluateHandle(() => {
    // Try a regular .navbar-toggler in light DOM first.
    let t = document.querySelector('.navbar-toggler');
    if (t) return t;
    // Otherwise drill into bs-navbar shadow roots.
    for (const nav of document.querySelectorAll('bs-navbar')) {
      const sr = nav.shadowRoot;
      if (sr) {
        t = sr.querySelector('.navbar-toggler');
        if (t) return t;
      }
    }
    return null;
  });
}

function snapshot(page) {
  return page.evaluate(() => {
    function findCollapse() {
      let c = document.querySelector('.collapse.navbar-collapse, .navbar-collapse.collapse');
      if (c) return c;
      for (const nav of document.querySelectorAll('bs-navbar')) {
        const sr = nav.shadowRoot;
        if (sr) {
          c = sr.querySelector('[part="collapse"]');
          if (c) return c;
        }
      }
      return null;
    }
    const c = findCollapse();
    const oc = document.querySelector('.offcanvas.show');
    const collapsing = document.querySelector('.collapsing');
    return {
      expanded: c?.classList.contains('show') ?? null,
      collapseDisplay: c ? getComputedStyle(c).display : null,
      collapseHeight: c ? Math.round(c.getBoundingClientRect().height) : null,
      hasOffcanvasShown: !!oc,
      hasCollapsing: !!collapsing,
    };
  });
}

await writeFile(path.join(outDir, 'report.md'), compactSummary(reports), 'utf8');
console.log('done — see .audit/navbar-toggler/report.md');
console.log(compactSummary(reports));
