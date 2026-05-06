# `@bootstrap-wc/plugin-*` packages

Web-component wrappers for jQuery / standalone JS libraries that don't compose
naturally with the [@bootstrap-wc/components] core (because their stylesheets
target selectors that wouldn't reach into shadow DOM, or their APIs predate
custom elements). Each wrapper renders in **light DOM** so the upstream CSS
keeps working.

## Why these wrappers exist

Bootstrap 5 already ships toasts, carousels, accordions, dropdowns, modals,
offcanvas, popovers, tooltips, and progress bars — those have first-class
`<bs-*>` components in `@bootstrap-wc/components`. We do **not** wrap any
plugin that BS5 / `@bootstrap-wc/components` already covers:

| Plugin                | Why no wrapper                                  |
|-----------------------|-------------------------------------------------|
| `toastr`              | use `<bs-toast>` (BS5 native)                   |
| `slick-carousel`      | use `<bs-carousel>` (BS5 native)                |
| `spinkit`             | use `<bs-spinner>` (extra spinner styles can be added upstream) |
| `bootstrap-tour`      | use `@bootstrap-wc/plugin-shepherd` (Shepherd.js — actively maintained) |
| `jasny-bootstrap` (offcanvas) | use `<bs-offcanvas>` (BS5 native)       |
| `bootstrap-select`    | replaced by Tom Select via `@bootstrap-wc/plugin-tom-select` |
| `bootstrap-datepicker`| replaced by Flatpickr via `@bootstrap-wc/plugin-flatpickr` |
| `bootstrap-markdown`  | replaced by EasyMDE via `@bootstrap-wc/plugin-easymde` |

If a feature missing from a core component shows up while migrating a theme
page, the right fix is to extend the core component (and file an issue
upstream), not to publish a redundant plugin.

## Available wrappers

| Package                         | Tag                         | Upstream library                | Status |
|---------------------------------|-----------------------------|---------------------------------|--------|
| `@bootstrap-wc/plugin-datatables`     | `<bs-datatable>`      | DataTables 1.13+ (BS5 build)    | preview |
| `@bootstrap-wc/plugin-fullcalendar`   | `<bs-calendar>`       | FullCalendar 6                  | preview |
| `@bootstrap-wc/plugin-summernote`     | `<bs-rich-text>`      | Summernote 0.9 (BS5 build)      | preview |
| `@bootstrap-wc/plugin-easymde`        | `<bs-markdown-editor>`| EasyMDE 2                       | preview |
| `@bootstrap-wc/plugin-codemirror`     | `<bs-code-editor>`    | CodeMirror 5                    | preview |
| `@bootstrap-wc/plugin-chartjs`        | `<bs-chart>`          | Chart.js 4                      | **specialised** (reference impl) |
| `@bootstrap-wc/plugin-flatpickr`      | `<bs-datepicker>`     | Flatpickr                       | preview |
| `@bootstrap-wc/plugin-tom-select`     | `<bs-search-select>`  | Tom Select                      | preview |
| `@bootstrap-wc/plugin-sweetalert2`    | `<bs-swal>` + `bsSwal()` | SweetAlert2                  | preview |
| `@bootstrap-wc/plugin-dropzone`       | `<bs-file-upload>`    | Dropzone 6                      | preview |
| `@bootstrap-wc/plugin-shepherd`       | `<bs-tour>`           | Shepherd.js 13                  | preview |
| `@bootstrap-wc/plugin-flot`           | `<bs-flot-chart>`     | Flot (jQuery)                   | preview |
| `@bootstrap-wc/plugin-morris`         | `<bs-morris-chart>`   | Morris.js + Raphael             | preview |
| `@bootstrap-wc/plugin-c3`             | `<bs-c3-chart>`       | C3 + D3                         | preview |
| `@bootstrap-wc/plugin-chartist`       | `<bs-chartist-chart>` | Chartist 1                      | preview |
| `@bootstrap-wc/plugin-rickshaw`       | `<bs-rickshaw-chart>` | Rickshaw + D3                   | preview |
| `@bootstrap-wc/plugin-peity`          | `<bs-peity-chart>`    | Peity                           | preview |
| `@bootstrap-wc/plugin-sparkline`      | `<bs-sparkline>`      | jQuery Sparklines               | preview |
| `@bootstrap-wc/plugin-jstree`         | `<bs-tree>`           | jsTree                          | preview |
| `@bootstrap-wc/plugin-validate`       | `<bs-form-validator>` | jQuery Validation               | preview |
| `@bootstrap-wc/plugin-wizard`         | `<bs-wizard>`         | SmartWizard 6                   | preview |
| `@bootstrap-wc/plugin-clipboard`      | `<bs-clipboard>`      | clipboard.js                    | preview |
| `@bootstrap-wc/plugin-i18next`        | `<bs-i18n>`           | i18next                         | preview |
| `@bootstrap-wc/plugin-blueimp-gallery`| `<bs-lightbox>`       | blueimp-gallery                 | preview |

## Common API

Every wrapper extends a small Lit base with this contract:

- `createRenderRoot()` returns `this` — the wrapper is **always light DOM**.
- `connectedCallback()` schedules `instantiate()` on a microtask so slotted
  children land first.
- `disconnectedCallback()` calls `dispose()`.
- Subclass `instantiate()` to construct the plugin against `this` (or a
  query-selected target inside the slot).
- Subclass `dispose()` to tear it down.
- Re-dispatch upstream events as `bs:*` custom elements (`bubbles: true`),
  with a `detail.instance` payload pointing at the underlying plugin object.

The `chartjs` package (`packages/plugin-chartjs/src/bs-chart.ts`) is the
reference specialisation — copy/paste it as the template when implementing
the long-tail wrappers.

## Compatibility caveats

These apply to anything inside the `wc/` Jekyll theme port (and to any host
app combining `@bootstrap-wc/components` with these wrappers).

### 1. Shadow DOM CSS isolation

`@bootstrap-wc/components` consumes Bootstrap CSS variables (`--bs-*`) which
**do** pierce shadow boundaries — themes change colour as expected. But
plugin stylesheets that target classes like `.dataTables_wrapper` are
loaded into the host document and only style **light DOM**. That's why the
wrappers render light DOM.

If a wrapper is placed *inside* a `<bs-*>` component, the plugin only sees
the **slotted** light-DOM children — that works fine for slot-based wc
components (e.g. `<bs-modal>`, `<bs-card>`) since those project light-DOM
content into the shadow root.

### 2. `data-bs-toggle` / `data-bs-dismiss` don't trigger wc components

The `bs5_to_wc.js` migration script in `bootstrap-themes/tools/` converts
the common patterns automatically (`<button data-bs-dismiss="modal">` →
`<bs-close-button>` inside `<bs-modal>`). Anything left over needs to use
the wc component's imperative API or events instead of the BS5 attributes.

### 3. Form association

Form-input wc components (`<bs-input>`, `<bs-select>`, `<bs-checkbox>`,
`<bs-switch>`, `<bs-range>`, `<bs-textarea>`) must be `formAssociated = true`
with `ElementInternals` for native form submission and `FormData` collection
to work. If the bootstrap-themes `wc/` port surfaces a missing case, file an
issue against `@bootstrap-wc/components` rather than working around it in
the plugin layer.

### 4. Utility classes still apply

Bootstrap utility CSS (`.row`, `.col-*`, `.mt-3`, `.text-center`, etc.) is
loaded globally in the `wc/` Jekyll layout and continues to drive layout
around wc components. The components are leaves — they don't replace the
grid/utility system.

### 5. jQuery plugins inside `<bs-modal>` / `<bs-offcanvas>` / `<bs-tabs>`

When the slotted light-DOM child contains a wrapper like `<bs-datatable>`,
the plugin instantiates against the slotted DOM — fine on first show. But
plugins that need to recompute layout on visibility change (DataTables,
FullCalendar) must be re-notified. Each wrapper should listen for the wc
container's `bs:shown` (modal), `bs:visible` (offcanvas), or `bs:tab-shown`
(tabs) event and call the upstream `redraw()` / `render()` method. Track
this in each plugin's README under "Compatibility caveats".

### 6. SSR / hydration

The wrappers do not pre-render upstream output. If the host app uses
SSR (Astro, etc.), declarative shadow DOM, or hydration, expect a flash
between the slotted markup and the plugin's generated DOM. Mitigate with
CSS that hides children until `bs:ready` fires, or by deferring the wrapper
to a `client:visible` directive (Astro).

### 7. CDN distribution: use `+esm` for jsDelivr

`@bootstrap-wc/components`'s published `dist/define.js` ships unbundled bare
imports (`import { html } from 'lit'`). Browsers can't resolve those without
an importmap. When loading directly from a CDN in a `<script type="module">`,
use jsDelivr's auto-bundled URL:

```html
<!-- WRONG — bare 'lit' specifier fails to resolve -->
<script type="module"
  src="https://cdn.jsdelivr.net/npm/@bootstrap-wc/components@latest/dist/define.js"></script>

<!-- RIGHT — '/+esm' tells jsDelivr to inline-bundle dependencies -->
<script type="module"
  src="https://cdn.jsdelivr.net/npm/@bootstrap-wc/components@latest/define/+esm"></script>
```

`bootstrap-themes`'s `_layouts/wc-*.html` were updated to use this pattern.

### 8. Web-component hosts default to `display:inline`

`<bs-button>`, `<bs-dropdown>`, `<bs-select>`, `<bs-modal>`, etc. all extend
`HTMLElement`, whose default `display` is `inline`. This collapses the host
to a 0×0 bounding box — fine for layout (the shadow content has its own box),
but breaks anything that probes the host directly (Playwright actionability
checks, `el.click()` on the host, drag-and-drop, etc.).

The `wc/assets/css/wc-shim.css` shim adds `display:inline-block` to hosts in
the contexts where this matters (`.navbar`, `.btn-group`, `.navbar-nav`).
Upstream fix would be a `:host { display: inline-block }` rule in each
component's `static styles`.

### 9. `<bs-modal>`, `<bs-offcanvas>` are property-driven, not attribute-driven

Their `open` state is a JS property on the component, **not** an `open=""`
HTML attribute. Tests / scripts must use `el.show()` / `el.hide()` (or
`el.open = true/false`) rather than `el.setAttribute('open', '')`. The
`bs-shown` / `bs-hidden` custom events fire after the transition.

### 10. `<bs-navbar>` API: `placement` / `theme` / `background`, not `position` / `variant`

The web component uses Bootstrap's full vocabulary directly:

| Native attribute    | Maps to                                                |
|---------------------|--------------------------------------------------------|
| `placement="fixed-top"` | `.fixed-top` on host                              |
| `theme="dark"`      | `.navbar-dark` on host                                 |
| `background="dark"` | `.bg-dark` on host                                     |
| `expand="lg"`       | `.navbar-expand-lg` on host                            |

The `bs-navbar` element exposes a single default slot — there are no named
`brand` / `nav-start` / `nav-end` slots. Layout-wise, mirror the BS5 navbar
markup (`.navbar-brand`, `.navbar-toggler`, `.collapse.navbar-collapse`)
inside `<bs-navbar>` and rely on the shared `bootstrap.bundle.min.js` for
the toggler collapse behavior.

### 11. wc-port migration tool quirks (`bootstrap-themes/tools/bs5_to_wc.js`)

When porting v5 demo markup to wc:

- The `data-bs-toggle="modal"` + `data-bs-target="#X"` pair must be preserved
  on `<bs-button>` triggers if you want them to drive a `<bs-modal>`. The
  default attribute allowlist in earlier revisions of the tool dropped these;
  the current revision keeps them.
- v5 demo markup uses `<ul class="nav nav-tabs"><li class="active"><a>…</a></li>`
  (no `.nav-item` wrapper). Earlier revisions of the tool only iterated
  `.nav-item`, leaving `<bs-tabs></bs-tabs>` empty after migration. The
  current revision iterates child `<li>`s directly.
- `.dropdown` selector excludes navbar dropdowns (`.navbar .dropdown` /
  `.navbar-nav .dropdown`) so the wc navbar's hand-authored `<bs-dropdown>`
  structure stays intact.

## Adding a new wrapper

1. Add an entry to `bootstrap-themes/tools/scaffold_wc_plugins.js` and re-run
   it (idempotent).
2. Open the generated `packages/plugin-<name>/src/bs-<tag>.ts` and replace
   the boilerplate with a specialisation modelled on `bs-chart.ts`.
3. Document any compatibility caveats in the package's README.
4. Add an entry to the table above.
5. Add a workspace build to `package.json` if needed (the root `npm run build`
   already iterates `--workspaces`).

## Roadmap

- Promote `chartjs`, `datatables`, `fullcalendar`, `summernote`, `flatpickr`,
  `tom-select`, `sweetalert2` from `preview` → `stable` first; they cover the
  majority of the bootstrap-themes demo pages.
- Add a `@bootstrap-wc/plugins` umbrella package that re-exports `define`
  for all wrappers (one-liner adoption).
- Author Playwright smoke tests per wrapper in `packages/components/`-style
  test runner.
