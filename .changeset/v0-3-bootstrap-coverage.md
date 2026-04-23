---
'@bootstrap-wc/core': minor
'@bootstrap-wc/components': minor
---

Cover every Bootstrap 5.3 component's docs examples and land a batch of
additive attribute / slot extensions picked up by the auditor loop.

### `@bootstrap-wc/core`

- `BootstrapElement` now exposes a `hostClasses()` subclass hook. Every
  update reflects the returned space-separated class list onto the host,
  diffing against the last call so author-applied classes are preserved.
  Required for compound components (`.btn-group > .btn + .btn`,
  `.list-group-item + .list-group-item`, `.nav-tabs .nav-link.active`,
  etc.) to work across shadow roots via slot flattening.
- Bundled Bootstrap's full stylesheet (`bootstrap-css.ts`, built from
  `bootstrap/dist/css/bootstrap.min.css`) and adopts it into every
  component's shadow root via `adoptedStyleSheets`. New
  `injectBootstrapIntoDocument()` helper drops the same sheet into the
  document head on first `<bs-*>` connect (idempotent) so
  document-scope selectors also match hosts.

### `@bootstrap-wc/components`

All additive. No breaking changes.

- `bs-button` — host IS the button now. `variant="none"` for bare `.btn`,
  `toggle` for Bootstrap-style `data-bs-toggle="button"` behavior.
- `bs-button-group` — host carries `.btn-group` / `-vertical` / `-{size}`;
  shadow simplified to `<slot>`.
- `bs-list-group` / `bs-list-group-item` — host-class pattern;
  `horizontal` accepts `sm` / `md` / `lg` / `xl` / `xxl` breakpoints in
  addition to boolean.
- `bs-nav` / `bs-nav-item` — host-class pattern; auto-adds `.navbar-nav`
  when nested inside `bs-navbar`.
- `bs-breadcrumb` / `bs-breadcrumb-item` — new `bs-breadcrumb-item`
  element; divider accepts `url(...)` (SVG), literal strings, or
  `none`/empty.
- `bs-dropdown` — `size`, `drop` (`down` / `up` / `end` / `start` /
  `center` / `up-center`), `menu-end`, `menu-dark`, `toggle-tag`.
- `bs-dropdown-item` — `text`, `as="button"`, `aria-current` on active.
- `bs-modal` — `static-preview` (renders the dialog skeleton while
  closed); `fullscreen` accepts responsive breakpoints (`sm-down`,
  `md-down`, `lg-down`, `xl-down`, `xxl-down`).
- `bs-card` — `horizontal` attribute (`.row g-0` layout); `img-overlay`
  slot (`.card-img-overlay`).
- `bs-spinner` — `variant` now optional (inherits `currentColor` when
  omitted); `width`/`height` attrs; `:host { display: inline-block }`.
- `bs-form-label` — `column` / `size` for horizontal forms
  (`.col-form-label-{sm,lg}`).
- `bs-form-check` — `indeterminate` attr; `aria-label` passthrough.
- `bs-form-text` — host-class refactor (`.form-text` on host); `inline`
  attr; supports `kind="valid"` / `kind="invalid"` feedback variants.
- `bs-input` — emits `.form-control-color` when `type="color"` and not
  `plaintext`.
- `bs-offcanvas` — `dark`, `responsive="{sm|md|lg|xl|xxl}"`,
  `no-close-button` attrs; `title` slot.
- `bs-navbar` — additive attribute extensions to support Bootstrap's
  full navbar API surface.

### Docs

Every component's `.mdx` page is regenerated around Bootstrap 5.3's own
section headings so the coverage auditor (`scripts/compare-bootstrap.mjs`)
pairs them. Roughly 170 new `<Example>` blocks across 21 components.
Sidebar gets a shadcn-style muted / no-underline treatment; dark-mode
theme is bridged to Bootstrap's `data-bs-theme`.
