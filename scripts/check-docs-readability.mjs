#!/usr/bin/env node
// Headless docs-readability auditor for the bootstrap-wc docs site.
// Loads each rendered doc page in Chromium and checks for the kinds of
// problems that escape a typecheck and a build but make the page hard to
// read or use:
//
//   - HTTP errors / pageErrors / console errors
//   - missing or duplicated <h1>, skipped heading levels
//   - <bs-*> elements that never registered
//   - <Example> blocks whose body rendered empty (missing nodes / FOUC)
//   - dead in-page anchors (`href="#foo"` with no #foo target)
//   - dead internal links (404 or no preview build coverage)
//   - <img> without alt text
//   - leftover Lit template artifacts in text (e.g. literal `${...}`)
//
// Modes:
//   node scripts/check-docs-readability.mjs --all
//     iterate every MDX page in the docs collection
//
//   node scripts/check-docs-readability.mjs --changed
//     iterate only MDX files whose content sha256 differs from the
//     last-passed entry in the memory file (default — incremental)
//
//   node scripts/check-docs-readability.mjs <slug> [<slug>...]
//     iterate explicit slugs (e.g. `components/button`, `getting-started/cli`)
//
//   node scripts/check-docs-readability.mjs --print-memory
//     dump the memory file and exit
//
// Memory file: `.audit/readability-memory.json` (gitignored). Per-doc:
//   { sha256, lastChecked, status: 'pass' | 'fail', issues }
// On a `pass` we record the sha; on the next `--changed` run any doc whose
// current sha matches its last-pass sha is skipped.

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const DOCS_DIR = path.join(repoRoot, 'apps/docs');
const CONTENT_DIR = path.join(DOCS_DIR, 'src/content/docs');
const MEM_PATH = path.join(repoRoot, '.audit/readability-memory.json');
const REPORT_DIR = path.join(repoRoot, '.audit/readability');
const PORT = process.env.PORT || '4321';
const BASE = `http://127.0.0.1:${PORT}`;

const args = process.argv.slice(2);
const memory = readMemory();

if (args.includes('--print-memory')) {
  console.log(JSON.stringify(memory, null, 2));
  process.exit(0);
}

// Build the catalog of every MDX doc page.
const catalog = collectDocs();

let targetSlugs;
if (args.includes('--all')) {
  targetSlugs = catalog.map((d) => d.slug);
} else if (args.includes('--changed') || args.length === 0) {
  targetSlugs = catalog
    .filter((d) => {
      const m = memory[d.slug];
      return !m || m.sha256 !== d.sha256 || m.status !== 'pass';
    })
    .map((d) => d.slug);
} else {
  targetSlugs = args.filter((a) => !a.startsWith('--'));
}

if (targetSlugs.length === 0) {
  console.log('docs-readability: nothing to check (all docs match memory).');
  process.exit(0);
}

console.log(`docs-readability: checking ${targetSlugs.length} doc(s)`);
fs.mkdirSync(REPORT_DIR, { recursive: true });

const previewProc = await ensurePreview();
const browser = await chromium.launch({ headless: true });
let totalFailures = 0;

try {
  for (const slug of targetSlugs) {
    const doc = catalog.find((d) => d.slug === slug);
    if (!doc) {
      console.warn(`  skip ${slug}: not in catalog`);
      continue;
    }
    const result = await checkDoc(browser, doc);
    memory[slug] = {
      sha256: doc.sha256,
      lastChecked: new Date().toISOString(),
      status: result.failures.length === 0 ? 'pass' : 'fail',
      issues: result.failures,
    };
    writeMemory(memory);
    writeReport(slug, result);
    const mark = result.failures.length === 0 ? 'OK  ' : 'FAIL';
    console.log(`  ${mark} ${slug.padEnd(40)} ${result.failures.length === 0 ? '' : `(${result.failures.length} issue${result.failures.length === 1 ? '' : 's'})`}`);
    if (result.failures.length > 0) totalFailures++;
  }
} finally {
  await browser.close();
  if (previewProc) {
    try {
      process.kill(-previewProc.pid);
    } catch {}
  }
}

console.log(`\ndocs-readability: ${targetSlugs.length - totalFailures}/${targetSlugs.length} passed`);
process.exit(totalFailures === 0 ? 0 : 1);

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function collectDocs() {
  const out = [];
  const sections = ['getting-started', 'components'];
  for (const section of sections) {
    const dir = path.join(CONTENT_DIR, section);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.mdx')) continue;
      const filePath = path.join(dir, file);
      const slug = `${section}/${file.replace(/\.mdx$/, '')}`;
      const body = fs.readFileSync(filePath, 'utf8');
      const sha256 = createHash('sha256').update(body).digest('hex').slice(0, 16);
      out.push({ slug, filePath, sha256 });
    }
  }
  // Home page
  const indexPath = path.join(CONTENT_DIR, 'index.mdx');
  if (fs.existsSync(indexPath)) {
    const body = fs.readFileSync(indexPath, 'utf8');
    out.push({
      slug: 'index',
      filePath: indexPath,
      sha256: createHash('sha256').update(body).digest('hex').slice(0, 16),
    });
  }
  return out;
}

function readMemory() {
  try {
    return JSON.parse(fs.readFileSync(MEM_PATH, 'utf8'));
  } catch {
    return {};
  }
}
function writeMemory(m) {
  fs.mkdirSync(path.dirname(MEM_PATH), { recursive: true });
  fs.writeFileSync(MEM_PATH, JSON.stringify(m, null, 2) + '\n');
}

async function ensurePreview() {
  try {
    const r = await fetch(BASE + '/');
    if (r.ok) return null;
  } catch {}
  console.log(`  starting astro preview on ${BASE} ...`);
  const child = spawn('npx', ['astro', 'preview', '--port', PORT, '--host', '127.0.0.1'], {
    cwd: DOCS_DIR,
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const r = await fetch(BASE + '/');
      if (r.ok) return child;
    } catch {}
  }
  throw new Error(`astro preview did not come up within 30s on ${BASE}`);
}

async function checkDoc(browser, doc) {
  const url = doc.slug === 'index' ? '/' : `/${doc.slug}/`;
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await ctx.newPage();
  const failures = [];
  const consoleErrors = [];
  const pageErrors = [];
  // Track which URLs failed at the network layer so we can correlate
  // generic "Failed to load resource" console errors back to their origin.
  // Off-origin failures (cdn.jsdelivr.net, getbootstrap.com, etc.) depend
  // on the runtime environment (e.g. sandboxed CI w/o TLS roots) and
  // aren't readability bugs in the page itself.
  const failedRequests = new Set();
  page.on('requestfailed', (req) => failedRequests.add(req.url()));
  page.on('response', (r) => {
    if (r.status() >= 400) failedRequests.add(r.url());
  });
  const sameOriginFailedRequest = () => {
    for (const u of failedRequests) {
      try {
        if (new URL(u).origin === new URL(BASE).origin) return u;
      } catch {}
    }
    return null;
  };
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => pageErrors.push(e.message));

  let resp;
  try {
    resp = await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    failures.push({ kind: 'navigation', detail: e.message });
    await ctx.close();
    return { failures, consoleErrors, pageErrors };
  }
  if (!resp || resp.status() !== 200) {
    failures.push({ kind: 'http', detail: `HTTP ${resp?.status() ?? 'no-response'}` });
  }
  await page.waitForTimeout(400);

  if (pageErrors.length) {
    failures.push({ kind: 'pageerror', detail: pageErrors.slice(0, 5) });
  }
  if (consoleErrors.length) {
    // Filter out third-party / Lit-dev-mode chatter that isn't actionable.
    const sameOriginFail = sameOriginFailedRequest();
    const interesting = consoleErrors.filter((m) => {
      if (m.includes('Lit is in dev mode')) return false;
      if (m.toLowerCase().includes('favicon')) return false;
      if (m.includes('downloadable font')) return false;
      // Generic "Failed to load resource …" console errors are emitted
      // for both first- and third-party network failures. Only keep them
      // if at least one same-origin request failed; otherwise the page
      // itself is fine and the chatter comes from external CDNs that
      // can't be reached from a sandboxed environment.
      if (m.startsWith('Failed to load resource') && !sameOriginFail) return false;
      return true;
    });
    if (interesting.length) failures.push({ kind: 'console-error', detail: interesting.slice(0, 5) });
  }

  const audit = await page.evaluate(() => {
    const body = {};
    body.title = document.title;

    // Heading hierarchy — exclude headings INSIDE example blocks
    // (`.bwc-example`), which are part of the demoed component (e.g. a
    // bs-card's `<h5 class="card-title">`, or an "Headings" example with
    // an `<h1>`-`<h6>` rundown), not the document's outline.
    const headings = Array.from(
      document.querySelectorAll(
        'article :is(h1,h2,h3,h4,h5,h6), main :is(h1,h2,h3,h4,h5,h6)',
      ),
    )
      .filter((h) => !h.closest('.bwc-example'))
      .map((h) => ({ level: parseInt(h.tagName.slice(1)), text: h.textContent?.trim().slice(0, 80) }));
    body.headings = headings;
    body.h1Count = headings.filter((h) => h.level === 1).length;
    let prev = 0;
    body.skippedLevels = [];
    for (const h of headings) {
      if (prev && h.level > prev + 1) body.skippedLevels.push({ from: prev, to: h.level, at: h.text });
      prev = h.level;
    }

    // Custom elements that never upgraded
    const allBs = Array.from(document.querySelectorAll('*')).filter((el) =>
      el.tagName.toLowerCase().startsWith('bs-'),
    );
    const undefinedTags = Array.from(
      new Set(allBs.filter((el) => !customElements.get(el.tagName.toLowerCase())).map((el) => el.tagName.toLowerCase())),
    );
    body.undefinedTags = undefinedTags;

    // <Example> blocks with empty rendered body
    const examples = Array.from(document.querySelectorAll('.bwc-example'));
    body.exampleCount = examples.length;
    body.emptyExamples = examples
      .map((ex, i) => ({ i, hasChildren: ex.children.length > 0, hasText: !!ex.textContent?.trim() }))
      .filter((e) => !e.hasChildren && !e.hasText)
      .map((e) => e.i);

    // Images without alt
    body.imagesWithoutAlt = Array.from(document.querySelectorAll('article img, main img'))
      .filter((img) => !img.hasAttribute('alt'))
      .map((img) => img.getAttribute('src') || '(no src)');

    // In-page anchors that don't resolve
    const anchorTargets = new Set(
      Array.from(document.querySelectorAll('[id]')).map((el) => el.id),
    );
    body.deadAnchors = Array.from(document.querySelectorAll('article a[href^="#"], main a[href^="#"]'))
      .map((a) => a.getAttribute('href'))
      .filter((h) => h && h !== '#' && !anchorTargets.has(h.slice(1)));

    // Internal links (same-origin) — collect for cross-page validation
    body.internalLinks = Array.from(document.querySelectorAll('article a[href^="/"], main a[href^="/"]'))
      .map((a) => a.getAttribute('href'))
      .filter((h, i, arr) => arr.indexOf(h) === i);

    // Leftover template artifacts in visible text
    const allText = document.body.innerText || '';
    body.templateArtifacts = [];
    if (/\$\{[a-zA-Z_]/.test(allText)) body.templateArtifacts.push('${...} interpolation');
    if (/\bnothing\b/.test(allText) && allText.match(/\bnothing\b/g).length > 2) {
      // many literal occurrences of "nothing" probably indicate a leaked Lit `nothing` symbol
      body.templateArtifacts.push('multiple literal `nothing` occurrences');
    }

    return body;
  });

  if (audit.h1Count !== 1) {
    failures.push({
      kind: 'heading-h1',
      detail: `expected 1 <h1>, found ${audit.h1Count}`,
    });
  }
  if (audit.skippedLevels.length) {
    failures.push({ kind: 'heading-skip', detail: audit.skippedLevels });
  }
  if (audit.undefinedTags.length) {
    failures.push({ kind: 'undefined-element', detail: audit.undefinedTags });
  }
  if (audit.emptyExamples.length) {
    failures.push({ kind: 'empty-example', detail: `example #${audit.emptyExamples.join(', #')} rendered empty` });
  }
  if (audit.imagesWithoutAlt.length) {
    failures.push({ kind: 'img-alt', detail: audit.imagesWithoutAlt });
  }
  if (audit.deadAnchors.length) {
    failures.push({ kind: 'dead-anchor', detail: audit.deadAnchors });
  }
  if (audit.templateArtifacts.length) {
    failures.push({ kind: 'template-artifact', detail: audit.templateArtifacts });
  }

  // Internal links → check each is reachable on the preview server.
  for (const href of audit.internalLinks) {
    if (href.startsWith('//') || href.includes('://')) continue; // external
    const u = href.split('#')[0];
    if (!u) continue;
    try {
      const r = await fetch(BASE + u, { method: 'HEAD' });
      if (r.status === 404) {
        failures.push({ kind: 'dead-internal-link', detail: u });
      }
    } catch {}
  }

  await ctx.close();
  return { failures, consoleErrors, pageErrors, audit };
}

function writeReport(slug, result) {
  const filePath = path.join(REPORT_DIR, `${slug.replace(/\//g, '__')}.md`);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const lines = [];
  lines.push(`# readability: ${slug}`);
  lines.push('');
  lines.push(`status: **${result.failures.length === 0 ? 'PASS' : 'FAIL'}**`);
  lines.push('');
  if (result.audit) {
    lines.push(`- title: \`${result.audit.title}\``);
    lines.push(`- examples: ${result.audit.exampleCount}`);
    lines.push(`- headings: ${result.audit.headings.length}`);
  }
  if (result.failures.length === 0) {
    lines.push('');
    lines.push('No issues found.');
  } else {
    lines.push('');
    lines.push('## Issues');
    for (const f of result.failures) {
      lines.push(`- **${f.kind}** — ${typeof f.detail === 'string' ? f.detail : JSON.stringify(f.detail)}`);
    }
  }
  fs.writeFileSync(filePath, lines.join('\n') + '\n');
}
