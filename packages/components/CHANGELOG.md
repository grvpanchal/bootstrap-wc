# @bootstrap-wc/components

## 0.4.0

### Minor Changes

- 5b23659: Browser autofill, fixed properly — by switching every form-control
  component to light-DOM rendering for the native control.

  Browser autofill heuristics walk the light-DOM tree looking for
  `<input name="…" autocomplete="…">` inside a `<form>` and anchor their
  autofill UI to the focused control. With our previous shadow-DOM
  implementation no autofill chip ever appeared on `bs-input` /
  `bs-textarea` / `bs-select` / `bs-range` / `bs-form-check`, no matter
  what mirror tricks we tried — Chrome's UI is positioned over whatever
  input the user actually clicked, so a hidden mirror in some sibling
  position never received the chip.

  This is the same problem Ionic, Adobe Spectrum, Lion, and Carbon's
  web-component libraries solved for their form controls, and they all
  landed on the same answer: **render the native control in light DOM**.
  That's what we now do.
  - New `<bs-form>` — wraps its children in a real light-DOM `<form>`,
    hoists submit into a cancellable `bs-submit` event, applies
    Bootstrap's `.needs-validation` / `.was-validated` lifecycle, exposes
    `reset()` / `checkValidity()` / `reportValidity()` / `formData` /
    `nativeForm`.
  - `bs-input` / `bs-textarea` / `bs-select` / `bs-range` / `bs-form-check`
    now render their native `<input>` / `<textarea>` / `<select>` into
    light DOM (`createRenderRoot()` returns `this`). Form participation,
    FormData, validation, and autofill all "just work" via the native
    control — no `ElementInternals` plumbing.
  - `bs-input` / `bs-textarea` / `bs-select` / `bs-form-check` gain an
    `autocomplete` attribute that's forwarded to the native control.
  - `bs-form-check` snapshots its inline label children before render so
    inline `<a>` / `<span>` content inside `<bs-form-check>I agree to
<a href="…">terms</a></bs-form-check>` keeps working.

  API compatibility note — these components no longer use the
  `FormAssociated` mixin, which means `el.form` / `el.validity` /
  `el.checkValidity()` are no longer methods on the host. Equivalent APIs
  are available on the underlying native control via the new
  `nativeInput` / `nativeTextarea` / `nativeSelect` getters.

### Patch Changes

- 43bc1de: `bs-modal` now teleports its host element to `document.body` when opened
  and restores it to its author-placed position when closed (matches
  Bootstrap's own modal plugin). Fixes the modal being clipped by ancestor
  stacking contexts — notably Starlight's `.main-pane` which uses
  `isolation: isolate` and was capping the modal's z-index below the docs
  site's fixed header.

  Static-preview modals (`<bs-modal static-preview>`) intentionally stay
  inline since they exist precisely to be rendered in normal document flow
  for visual documentation.

- 1f3bdfb: Three long-standing web-components-with-shadow-DOM papercuts get
  addressed in one pass:
  - **`delegatesFocus: true`** on every `FormAssociated` shadow root
    (`bs-input`, `bs-textarea`, `bs-select`, `bs-range`, `bs-form-check`).
    Clicking a `<label for="my-input">` — or calling
    `myBsInput.focus()` — now correctly forwards focus through the shadow
    boundary to the real native `<input>` / `<select>` / `<textarea>`
    inside. Before this, the host was focused but the inner control
    wasn't, so `:focus` styling, caret placement, IME, and autofill
    prompts all missed their mark on label click.
  - **FOUC preflight.**
    `injectBootstrapIntoDocument()` now also injects a small
    `style[data-bootstrap-wc="preflight"]` block that gives every
    `bs-*:not(:defined)` element a sensible `display` value and hides
    it until upgrade. Removes the flash of unstyled / inline-layout
    content while JavaScript is still loading, and prevents the layout
    shift as custom elements upgrade.
  - **`composed: true` on every cross-shadow event.** Audited every
    `dispatchEvent(new CustomEvent(...))` — several
    `bs-show` / `bs-shown` / `bs-hide` / `bs-hidden` dispatches on
    `bs-modal`, `bs-collapse`, `bs-dropdown`, `bs-offcanvas`, `bs-toast`
    were missing `composed: true`, so listeners attached to `document`
    or any ancestor outside the component's shadow root never saw them.
    Now every cross-shadow custom event uniformly sets both
    `bubbles: true` and `composed: true`.

- Updated dependencies [1f3bdfb]
  - @bootstrap-wc/core@0.4.0

## 0.3.0

### Minor Changes

- 48fcb7c: Cover every Bootstrap 5.3 component's docs examples and land a batch of
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

### Patch Changes

- Updated dependencies [48fcb7c]
  - @bootstrap-wc/core@0.3.0

## 0.2.0

### Minor Changes

- 4c3b65a: Restore real Web-Component semantics by rendering every component into an
  open shadow root with Bootstrap's CSS adopted via `adoptedStyleSheets`.
  - `BootstrapElement.createRenderRoot()` now returns a `ShadowRoot` (Lit's
    default) instead of the light-DOM host, so `<slot>` projection, `::part`,
    and style encapsulation all work as the spec intends. Previously every
    component rendered templates with `<slot>` markers into light DOM where
    slots are inert, which left the original children as siblings of the
    template (e.g. `<bs-button>Primary</bs-button>` rendered the word
    "Primary" next to an empty `<button>` instead of inside it).
  - `@bootstrap-wc/core` now bundles `bootstrap/dist/css/bootstrap.min.css` as
    a string at build time (`scripts/generate-bootstrap-css.mjs`), exposes
    `getBootstrapSheet()` which returns a single shared `CSSStyleSheet`
    constructed on first use, and `addGlobalStylesheet(css)` for consumers
    who want to add a custom theme. Every component's shadow root adopts
    that one sheet — no per-instance CSS cost.
  - Form-associated components (`bs-input`, `bs-textarea`, `bs-select`,
    `bs-range`, `bs-form-check`) now call `ElementInternals.setFormValue`
    in `willUpdate` so the initial `value`/`checked` attribute participates
    in form submission (previously this worked only because the native
    `<input>` lived in light DOM and the enclosing `<form>` picked it up
    directly — with shadow DOM we must route through `ElementInternals`).

### Patch Changes

- Updated dependencies [4c3b65a]
  - @bootstrap-wc/core@0.2.0

## 0.1.1

### Patch Changes

- 64cc6fe: Broaden `sideEffects` to cover every file in `dist/` so bundlers (Vite,
  Rollup, webpack) no longer tree-shake the `customElements.define()`
  calls when consumers use the side-effect entry `import
'@bootstrap-wc/components'`. Previously only `./dist/index.js` and
  `./dist/*/index.js` were listed, so each component's actual class file
  (`./dist/<name>/<name>.js`) was considered side-effect-free and its
  registration was stripped at build time, leaving `<bs-*>` tags as
  unregistered elements.

## 0.1.0

### Minor Changes

- c2d5b27: Initial release (0.1.0).
  - 30+ Bootstrap 5.3 components as framework-agnostic Web Components (`<bs-*>`).
  - `@bootstrap-wc/core` — base class, controllers (transition, floating-ui, focus-trap), form-associated mixin.
  - `@bootstrap-wc/components` — full Bootstrap component set: forms, nav, overlays, feedback, disclosure, content.
  - `@bootstrap-wc/cli` (`bwc`) — shadcn-style CLI for copying component source into consumer projects.
  - `@bootstrap-wc/react` (preview) — typed React wrappers via `@lit/react`.
  - Astro + Starlight documentation site with a live example on every component page.

### Patch Changes

- Updated dependencies [c2d5b27]
  - @bootstrap-wc/core@0.1.0
