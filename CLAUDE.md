# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Bootstrap 5 as framework-agnostic Web Components. Two distribution modes from one source of truth (`packages/components/src/**`):

1. **`npm install @bootstrap-wc/components`** — drop-in custom elements (`<bs-button>`, `<bs-modal>`, …).
2. **`npx @bootstrap-wc/cli add button modal`** — shadcn-style: the CLI fetches a registry JSON built from the same sources and writes TypeScript files into the consumer's project.

A React wrapper package (`@bootstrap-wc/react`) and a long tail of `@bootstrap-wc/plugin-*` wrappers (Chart.js, DataTables, Flatpickr, …) sit on top of the core. The Astro/Starlight docs site at `apps/docs/` builds the registry as a prerequisite — those JSON files live under `apps/docs/public/r/` and are served at `bootstrap-wc.dev/r/`.

Default branch is **`master`** (changesets `baseBranch`, release workflow trigger). Don't assume `main`.

## Toolchain

- Node `>=18` (`.nvmrc` is `20`).
- npm workspaces (root `package.json` lists `packages/*`, `apps/*`, `registry`).
- TypeScript project references with `tsc -b` from the root.
- ESLint (`.eslintrc.json`), Prettier (`.prettierrc.json`: single quotes, semis, 100 width, 2-space indent, trailing commas), EditorConfig.
- `@web/test-runner` + Playwright Chromium for component tests.
- `changesets` for versioning. `@bootstrap-wc/core` and `@bootstrap-wc/components` are **`linked`** in `.changeset/config.json` — they version together; bumping one bumps the other.

## Commands

```sh
npm install
npm run build                  # builds every workspace (core → components → cli → react → registry)
npm run build:core             # rebuild a single workspace; use this when iterating
npm run build:components
npm run build:docs             # build:registry then astro build
npm run dev:docs               # astro dev (also what audit scripts auto-start)
npm run typecheck              # tsc -b across the workspace
npm run lint                   # eslint . --ext .ts,.js
npm run format                 # prettier write
npm test                       # all workspace tests (effectively just @bootstrap-wc/components)
npm run test --workspace @bootstrap-wc/components

# single test file / pattern (run from packages/components)
cd packages/components && npx web-test-runner test/button.test.ts
cd packages/components && npx web-test-runner --group default --filter "renders variant"

# audit scripts (require docs to be built or astro preview running on :4321 — scripts auto-start it)
npm run audit:component -- button alert       # screenshots vs getbootstrap.com/docs/5.3
npm run audit:component -- --all
npm run audit:docs -- --changed               # readability of docs pages whose MDX changed
npm run audit:ui -- --name <slug>             # reference.astro vs wc.astro pixel + DOM diff

# changesets
npm run changeset            # author a changeset
npm run version              # apply pending changesets (run by release workflow / RELEASE PR)
npm run release              # build + changeset publish (CI only)
```

## Build order (matters)

`core` must build before `components`, because `packages/core/src/bootstrap-css.ts` is **generated** by `packages/core/scripts/generate-bootstrap-css.mjs` (it embeds `bootstrap/dist/css/bootstrap.min.css` into a TS module). `tsc -b` from the root handles this via project references, but the per-workspace scripts assume a clean order:

```
core → components → cli → react → registry → docs
```

If a component test fails with "Cannot find module bootstrap-css" or shows un-styled output, you skipped the core rebuild. Run `npm run build:core` first.

## Architecture

### `BootstrapElement` and the host-class pattern (`packages/core`)

Every component extends `BootstrapElement` (extends `LitElement`). The base class:

1. Renders into an **open shadow root** and adopts one shared `CSSStyleSheet` containing the full Bootstrap 5.3 stylesheet.
2. Also calls `injectBootstrapIntoDocument()` once on first `connectedCallback`, so Bootstrap styles also apply in light DOM.
3. Exposes `hostClasses(): string` — subclasses return a space-separated class list that gets mirrored onto the **host** element. The base diffs the list each update; classes added or removed reactively without clobbering author-applied ones.
4. Watches `document.documentElement[dir]` and mirrors it onto the host (RTL).
5. Registers idempotently via `defineElement(tag, ctor)` (warns on a different existing constructor; otherwise silent).

**Why host classes matter.** Bootstrap's CSS uses parent/sibling combinators (`.btn-group > .btn + .btn`, `.list-group-item + .list-group-item`, `.nav-tabs .nav-link.active`). These only cross a shadow boundary via **slot flattening** — a parent sees the child's host, not its shadow interior. So if a component can be slotted into a compound container, its host must carry the Bootstrap class (`btn`, `list-group-item`, `nav-link`, …) and its shadow template should be a bare `<slot></slot>`. Don't wrap children in another `<div class="btn-group">` inside the shadow — you'll double the selector and break flattening.

For the canonical "the host IS the element" pattern (button as form-associated host with role/tabindex/keyboard handling on the host itself, no inner `<button>`), see `packages/components/src/button/button.ts`. Container patterns are in `button-group/`, `list-group/`, `nav/`, `breadcrumb/`.

### Controllers and mixins (`packages/core/src/`)

- `TransitionController` — CSS-class transition coordinator (show/hide lifecycle, `bs-show` / `bs-shown` / `bs-hide` / `bs-hidden`).
- `FloatingController` — wraps `@floating-ui/dom` for `dropdown`, `tooltip`, `popover`.
- `FocusTrapController` — wraps `focus-trap` for `modal` and `offcanvas`.
- `FormAssociated` mixin — turns a `LitElement` into a form-associated custom element via `ElementInternals`. Required for any input-like component (`input`, `select`, `textarea`, `range`, `form-check`). Call `_setValue` from `willUpdate` so initial `value`/`checked` attributes land in `FormData`.

### Components (`packages/components/src/`)

One subdirectory per element. Tree-shakeable imports: each component re-exports from its own `index.ts`; `packages/components/src/index.ts` re-exports without side-effects, while `packages/components/src/define.ts` is the "import for side-effects, register everything" entry. The `package.json` `exports` field maps `./define` and `./<component>` subpaths.

Events are namespaced `bs-*` (`bs-click`, `bs-change`, `bs-show`/`bs-shown`/`bs-hide`/`bs-hidden`, `bs-tab-change`, `bs-page-change`, etc.). Don't invent ad-hoc event names. The React wrappers in `packages/react/src/index.ts` map them to `onBsClick`, `onShow`, etc.

### CLI + registry (`packages/cli`, `registry/`)

`registry/src/build.ts` walks `packages/components/src/<name>/` and `packages/core/src/`, rewrites `@bootstrap-wc/core` imports to relative paths under the consumer's components dir, and writes `apps/docs/public/r/<name>.json` plus `index.json`. Per-component metadata (category, tag, npm deps) lives in the `MANIFESTS` map at the top of that file — adding a new component requires adding a manifest entry there or `[registry] skipping <name>: no manifest` is logged.

The `bwc` CLI (`packages/cli/src/`) reads `bwc.json` (see `DEFAULT_CONFIG` in `utils/config.ts`), resolves the dependency graph through `registryDependencies` (topological order, dedup), and writes each entry's `files` into `<componentsDir>/<file.path>`. `utils/transform.ts` rewrites `@bootstrap-wc/core` imports to the user's configured `alias`. `BWC_REGISTRY_URL` env var overrides the registry URL for local development — the CI smoke test in `.github/workflows/ci.yml` uses `file://...` to test against the freshly-built registry.

### Plugin packages (`packages/plugin-*`)

Wrappers for jQuery / standalone JS libraries whose stylesheets target light-DOM selectors. **These wrappers render in light DOM** (their `createRenderRoot()` returns `this`), unlike `@bootstrap-wc/components`. Lifecycle: `connectedCallback` schedules `instantiate()` on a microtask so slotted children land first; `disconnectedCallback` calls `dispose()`. Re-dispatch upstream events as `bs:*` custom events (`bubbles: true`, `detail.instance` → upstream object).

Don't wrap anything Bootstrap 5 / `@bootstrap-wc/components` already covers (toasts, carousels, accordions, dropdowns, modals, offcanvas, popovers, tooltips, progress) — see `packages/PLUGINS.md` for the exclusion list and compatibility caveats. `packages/plugin-chartjs/src/bs-chart.ts` is the reference specialisation; copy/paste it as the template.

**Plugin caveats worth keeping front-of-mind** (full list in `packages/PLUGINS.md`):

- `<bs-modal>` / `<bs-offcanvas>` `open` is a JS property, not an attribute. Use `el.show()` / `el.hide()` / `el.open = true`, **not** `setAttribute('open', '')`.
- CDN loading must use jsDelivr's `/+esm` URL (otherwise bare `lit` imports fail to resolve in the browser).
- Web-component hosts default to `display: inline`. The `wc-shim.css` overrides this in `.navbar`, `.btn-group`, `.navbar-nav`.
- `<bs-navbar>` uses Bootstrap's full vocabulary: `placement="fixed-top"`, `theme="dark"`, `background="dark"`, `expand="lg"`. There is only a default slot.

### Docs site (`apps/docs`)

Astro + Starlight. `npm run build:docs` runs `build:registry` first — the registry JSON files in `apps/docs/public/r/` are inputs to the published site. Component MDX pages live under `apps/docs/src/content/docs/components/`. The docs site bundles every `@bootstrap-wc/plugin-*` (see `apps/docs/package.json`); the homepage and component pages assume all are available.

`apps/docs/src/pages/compare/<slug>/` is **outside** the Starlight content collection (under `src/pages/`, not `src/content/docs/`). These are reference/wc pairs consumed by `scripts/wc-ui-compare.mjs` — they route at `/compare/<slug>/reference/` and `/compare/<slug>/wc/` but are not in the sidebar, sitemap, or search.

## Audit scripts (`scripts/`)

Three scripts encode the team's regression workflow. Read `scripts/README.md` for full usage; the headline:

- **`compare-bootstrap.mjs`** (`npm run audit:component`) — walks every `.bd-example` on a getbootstrap.com/docs/5.3 page, pairs it against `.bwc-example` on our docs by nearest preceding heading, screenshots both and diffs the class lists. Writes `.audit/<component>/report.md` (gitignored). Add components via `scripts/component-map.json`.
- **`check-docs-readability.mjs`** (`npm run audit:docs`) — drives Chromium over `astro preview` and checks every doc page for: unregistered `<bs-*>` elements, empty `<Example>` blocks, missing/duplicate `<h1>`, skipped headings, missing `alt`, dead anchors, dead internal links, leftover Lit template artifacts. Per-page reports in `.audit/readability/` (gitignored); the memory file `.audit/readability-memory.json` **is tracked in git** and lets `--changed` mode re-check only docs whose MDX sha256 differs from the last `pass`. Always commit the updated memory file with any docs fix.
- **`wc-ui-compare.mjs`** (`npm run audit:ui`) — for new docs/theme pages: author `reference.astro` (plain Bootstrap CSS) and `wc.astro` (the `<bs-*>` port) under `apps/docs/src/pages/compare/<slug>/`, tag equivalent elements with `data-compare-key="<role>"`, and the script holds them side-by-side at the same viewport with sharp-based pixel diff + bounding-rect + ~30 computed-style props.

## Specialized agents (`.claude/agents/`)

Three agent definitions are available — invoke via `/agents → <name>`:

- **`bootstrap-component-auditor`** — full snapshot → diff → patch → rebuild → re-verify loop on `compare-bootstrap.mjs`. Use when "X component doesn't look/behave like Bootstrap", when adding a new `<bs-*>`, or after a Bootstrap bump.
- **`docs-readability-auditor`** — wraps `check-docs-readability.mjs`. Run before any PR touching `apps/docs/src/content/**.mdx`.
- **`wc-ui-developer`** — wraps `wc-ui-compare.mjs`. For building new docs/theme pages from a Bootstrap design via the build-twice pattern. Allowed to patch `packages/components/src/**` when a diff requires a framework change.

The agents own these loops end-to-end — prefer dispatching to them rather than running the scripts manually for non-trivial changes.

## Conventions

- **Variants and sizes** are typed in `packages/core/src/index.ts` (`Variant` = primary/secondary/.../dark; `Size` = sm/md/lg). Use these unions, not string literals.
- **`hostClasses()` over `::slotted()`**: when a Bootstrap selector targets a class on a child element, put that class on the host via `hostClasses()` and let slot flattening do the rest. Don't recreate Bootstrap rules with `::slotted()` inside the shadow.
- **No CDN at runtime.** `bootstrap-css.ts` is generated at build time from the installed `bootstrap` package; don't fetch CSS over the network.
- **Don't add CSS overrides in `apps/docs/src/styles/custom.css` to mask component drift.** Fix the component instead — the audit scripts exist to catch the underlying bug.
- **MDX docs and component code stay in sync.** When you add an attribute to a component, update the "API" table in `apps/docs/src/content/docs/components/<name>.mdx`.
- **Changesets.** Every PR with a user-facing change needs a `npm run changeset` entry; `core` + `components` bump together because they're linked.
