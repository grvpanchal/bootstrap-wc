# scripts/

Reusable tooling for the repo.

## `compare-bootstrap.mjs`

Walks **every example** on a Bootstrap 5.3 docs page and pairs it against
the bootstrap-wc doc page for the same component. Pairs are matched by the
nearest preceding heading (`## Variants`, `## Sizes`, ...), and the script
writes one screenshot + HTML snapshot per side, per example, plus an
aggregated report.

This catches two classes of drift:

1. **Structural drift in paired examples** — Bootstrap's markup contains a
   class (`card-img-top`, `btn-link`, `btn-outline-secondary`, ...) that
   bootstrap-wc doesn't render for the equivalent variant.
2. **Coverage gaps** — Bootstrap shows an example ("Outline buttons", "List
   groups in cards", "Horizontal alignment") that our docs don't show at
   all. The report flags each one with `⚠︎ no bootstrap-wc example found
   for this label.` and the reference screenshot is saved so you can
   recreate the example in the `.mdx` page.

### Usage

    # one component
    node scripts/compare-bootstrap.mjs button

    # several
    node scripts/compare-bootstrap.mjs accordion alert card

    # every entry in scripts/component-map.json
    node scripts/compare-bootstrap.mjs --all

    # via npm script
    npm run audit:component -- button

Starts `astro preview` automatically if nothing is listening on
`http://127.0.0.1:4321/`. Writes to `.audit/<component>/` (gitignored):

- `report.md` — summary: bwc / bs example counts, pairs, totals of missing
  classes, and one section per example with its host classes and class
  delta.
- `example-<NN>-<label>.bootstrap.png` / `.bwc.png` — cropped screenshots.
- `example-<NN>-<label>.bootstrap.html` / `.bwc.html` — raw bootstrap
  markup on one side; flattened shadow+light tree of bs-* on the other.

### Extending

Add a component by appending to `component-map.json`:

    {
      "<name>": {
        "bwcUrl": "/components/<name>/",
        "bsUrl":  "/components/<name>/",
        "bwcExampleSelector": ".bwc-example",     // optional override
        "bsExampleSelector":  ".bd-example",      // optional override
        "bsExampleSkip":      ["bd-placeholder-img"], // optional: skip blocks with these classes
        "notes":              "(optional gotcha for the auditor)"
      }
    }

The default selectors (`.bwc-example` / `.bd-example`) already match
Starlight's `<Example>` component and Bootstrap's docs structure, so most
entries only need `bwcUrl` and `bsUrl`.

### How "missing" is computed

Every class on an example block's markup (Bootstrap side) is compared
against every class present on any element — host OR inside the shadow —
in the rendered bootstrap-wc example. Bootstrap's docs utility classes
(`m-3`, `bg-light`, `text-muted`, `d-flex`, Astro / Starlight / Pagefind
internals, `col-*`, `w-*`, etc.) are filtered out by a default ignore
list so the diff surfaces only component-intrinsic classes.

If a class shows up missing that's really intentional (e.g. you've
renamed it to a prop instead of a class), add it to the per-component
`notes` so a future auditor can confirm it's by design.

### Agent

For Claude Code users: `.claude/agents/bootstrap-component-auditor.md`
wraps this script into a full audit → fix → re-verify loop. Invoke it
with:

    /agents → bootstrap-component-auditor

## `check-docs-readability.mjs`

Headlessly browses every page of the rendered docs site (driving Chromium
against `astro preview`) and verifies it reads cleanly — catching
problems that escape `npm run build:docs`:

- HTTP non-200, page errors, substantive `console.error`s
- Missing or duplicate `<h1>`, skipped heading levels
- Unregistered `<bs-*>` elements still on the page
- Empty `<Example>` (`.bwc-example`) blocks
- `<img>` without `alt`
- Dead in-page anchors (`href="#…"` with no matching id)
- Dead internal links (`href="/…"` returning 404 against preview)
- Leftover Lit template artifacts (`${…}`, multiple literal `nothing`)

Headings inside `.bwc-example` demos are deliberately excluded from the
heading-outline check so component examples don't poison the page audit.

### Usage

    # every doc, ignoring memory
    node scripts/check-docs-readability.mjs --all

    # only docs whose MDX sha256 doesn't match the last `pass` (default)
    node scripts/check-docs-readability.mjs --changed
    node scripts/check-docs-readability.mjs

    # explicit slugs
    node scripts/check-docs-readability.mjs components/button getting-started/installation

    # dump current memory and exit
    node scripts/check-docs-readability.mjs --print-memory

    # via npm script
    npm run audit:docs -- --changed

Auto-starts `astro preview` on `:4321` if nothing is listening. Per-page
reports land under `.audit/readability/<section>__<name>.md` (gitignored).

### The memory file

`.audit/readability-memory.json` is **tracked in git** (the one
hand-picked exception under `.audit/`). It maps each doc slug to:

    {
      "<slug>": {
        "sha256": "<first 16 hex chars of MDX sha256>",
        "lastChecked": "<ISO timestamp>",
        "status": "pass" | "fail",
        "issues": [...]
      }
    }

`--changed` is the default mode and only re-checks docs whose current
MDX sha256 differs from the recorded `pass` entry. This keeps the loop
tight as the docs grow — a typical PR-time run only walks the pages it
actually touches. Always commit the updated memory alongside any docs
fix so future runs (and CI / agents) start from the same baseline.

### Agent

For Claude Code users: `.claude/agents/docs-readability-auditor.md`
wraps this script into a full snapshot → diagnose → fix → re-verify
loop and is meant to run before any PR that touches
`apps/docs/src/content/**.mdx`. Invoke it with:

    /agents → docs-readability-auditor
