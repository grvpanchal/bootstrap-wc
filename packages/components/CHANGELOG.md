# @bootstrap-wc/components

## 0.6.1

### Patch Changes

- 26e0b0e: Fix `<bs-avatar>` `shape="circle"` and `shape="rounded"` not visibly clipping
  the inner image / initials wrapper.

  The host gets the inline `border-radius` set in `updated()`, but the inner
  `<span part="wrapper">` (which has `overflow: hidden` and contains the image)
  had no `border-radius`, so the visible content stayed square. The wrapper now
  inherits `border-radius` from the host, so all three shapes render correctly.

## 0.6.0

### Minor Changes

- d77dceb: Add `<bs-avatar>` — a sized, optionally-rounded box for displaying a user's
  profile picture, initials, or icon.

  The numeric size scale matches bootstrap-essentials
  (`16/24/32/48/64/96/128`), but `size` accepts any pixel value, and
  `width`/`height` allow non-square boxes. Supports three shapes
  (`circle`/`rounded`/`square`), Bootstrap variant tinting via
  `bg-{variant}-subtle` + `text-{variant}-emphasis`, an image source via `src`
  (rendered with `object-fit: cover` and `loading="lazy"`), and a `status` slot
  for absolute-positioned badges (online/offline indicators).

  ```html
  <bs-avatar size="48" src="/img/jane.jpg" alt="Jane Doe"></bs-avatar>
  <bs-avatar size="64" shape="circle">JD</bs-avatar>
  <bs-avatar size="48" variant="success">
    AB
    <span slot="status" class="bg-success"></span>
  </bs-avatar>
  ```

  This was previously shimmed via CSS-only `.avatar.avatar-{N}` classes in the
  bootstrap-themes Jekyll site; the real component supersedes that shim for wc
  consumers.

- 3c9a64c: Two ergonomics improvements surfaced by the bootstrap-themes wc port:
  - **`<bs-dropdown>`**: auto-defaults unattributed light-DOM children to
    `slot="menu"`. The component projects items via `<slot name="menu">`;
    forgetting the slot attribute used to leave items rendering invisibly
    in the trigger position. Authors who explicitly want a custom trigger
    label (`slot="label"`) or want to project into a different slot are
    unaffected — only children with no `slot` attribute get defaulted. A
    MutationObserver covers children added after connect.

    Before:

    ```html
    <bs-dropdown label="Apps">
      <bs-dropdown-item slot="menu" href="/blog">Blog</bs-dropdown-item>
      <bs-dropdown-item slot="menu" href="/mail">Mail</bs-dropdown-item>
    </bs-dropdown>
    ```

    After:

    ```html
    <bs-dropdown label="Apps">
      <bs-dropdown-item href="/blog">Blog</bs-dropdown-item>
      <bs-dropdown-item href="/mail">Mail</bs-dropdown-item>
    </bs-dropdown>
    ```

  - **`<bs-select>`**: warns via `console.warn` when it sees light-DOM
    children that aren't `<option>` / `<optgroup>` / `<hr>`. The component
    reads native option children to build its internal `<select>`; an
    unrecognised tag (e.g. a typo'd `<bs-option>`) used to fail silently
    and the option text would leak into the parent flex layout via the
    host's `display: contents`. The warning calls out the offending tag
    names and suggests `<option>`.

  Adds a "Dropdown" section to the Navbar docs page with two examples:
  plain dropdown inside a navbar, plus the nested-submenu pattern via
  `class="dropdown-submenu"`.

  Tests:
  - 2 new bs-dropdown specs (auto-slot defaulting + MutationObserver).
  - 3 new bs-select specs (option reading, unknown-child warning, no
    warning when only allowed children present).

## 0.5.0

### Minor Changes

- 7ea2cee: Bug fixes against Bootstrap 5.3 visual parity.
  - **`bs-card`**: the host IS the `.card`. The wrapping `<div part="card">`
    has been removed and `.card`, `.border-{variant}`, and `.text-bg-{variant}`
    are mirrored onto the host via `hostClasses()`. Bootstrap's
    `.card > .card-body` and `.card > .card-img-top` selectors now match across
    the shadow boundary, restoring grid layout when `<bs-card>` is placed in a
    column. The `part="card"` selector is no longer exposed; `part="body"`,
    `part="header"`, `part="footer"`, and `part="img-overlay"` are unchanged.
  - **`bs-accordion-item`**: radius and shared bottom border now reflect host
    position (first / middle / last) so stacked items render with the
    correct rounded corners and a single shared divider, matching upstream.
  - **`bs-tabs`**: inactive panel hosts are hidden so the active panel sits
    flush below the tab strip instead of being pushed down by sibling panels
    consuming layout space.
  - **`bs-navbar`**: the host IS the `.navbar`. `.navbar`, `.navbar-expand-{x}`,
    `bg-{x}`, and the placement class are now mirrored onto the host so author
    classes like `mb-4` and Bootstrap's `.navbar` layout (display: flex, padding,
    text-color via `data-bs-theme`) take effect on the host element itself.
    Shadow-scoped CSS reproduces three Bootstrap selectors that can't reach
    across the shadow boundary: `.navbar > .container-fluid` flex layout,
    `.navbar-expand-{x} .navbar-toggler { display: none }` at breakpoint, and
    `.navbar-expand-{x} .navbar-collapse { display: flex !important }` at
    breakpoint. Adds a new `container="default"` value for the `.container`
    (responsive max-width) variant alongside the existing
    `fluid`/`sm`/`md`/`lg`/`xl`/`xxl`/`none`. The `theme` attribute now reflects
    to `data-bs-theme` on the host so the dark navbar variants pick up
    Bootstrap's theme-scoped CSS variables.

- 26eba76: Close 6 framework gaps surfaced by the Bootstrap example port pages.
  - **`bs-badge`**: the host IS the `.badge`. New `tone="solid" | "subtle" |
"bordered"` (default `solid`, backwards compatible) gives access to the
    `.bg-{variant}-subtle .text-{variant}-emphasis` and
    `.border .border-{variant}-subtle` looks. New `dismissible` boolean
    renders an inline `.btn-close` that fires `bs-dismiss` (cancellable) and
    removes the host on activation. Slotted children now flow on the host
    itself so authors can mix in flex / sizing utilities (`.d-flex`,
    `.p-1 .pe-2`, etc.) directly via `class`.
  - **`bs-breadcrumb`**: host is now a `role="navigation"` landmark by
    default. New `wrap-in-nav` boolean renders an inner shadow `<ol class=
"breadcrumb">` (host stays a bare wrapper) for cases where the page CSS
    expects the `.breadcrumb` element type to be a real `<ol>`. New
    `list-class` adds modifier classes (e.g. `breadcrumb-chevron`, padding
    utilities) to that inner `<ol>` when `wrap-in-nav` is set.
  - **`bs-dropdown-menu`** (NEW): sibling component for the open
    `.dropdown-menu` shell only — no toggle, no JS lifecycle, no
    positioning. Use for documentation pages, mega-menus, or composing your
    own toggleable surface around the menu surface. Defaults: `show=true`,
    `position-static=true`, `display-block=false` (so authors can mix
    `.d-grid` / `.d-flex` via `class`). `<bs-dropdown>` is unchanged.
  - **`bs-list-group`**: new `as="ul" | "div"` (default `ul`, backwards
    compatible). When `as="div"`, child `<bs-list-group-item>` hosts adapt
    their semantics: each becomes `role="link"`, focusable, and gains
    `.list-group-item-action` automatically — matching Bootstrap's
    `<a class="list-group-item">` rich-link list shape. Items also stop
    clobbering author-set `aria-current` attributes.
  - **`bs-modal`**: new `static-display` attribute (alias for the existing
    `static-preview`) for the static `.modal.position-static.d-block` open
    shell pattern. In static mode the host now mirrors `.modal.show
.position-static.d-block` (plus any `modal-class` extras) onto itself —
    the inner shadow `.modal` wrapper is dropped — so the host IS the
    visible chrome. New `modal-class`, `content-class`, `header-class`,
    `body-class`, `footer-class` attributes thread Bootstrap utility classes
    onto the inner `.modal-content` / `.modal-header` / `.modal-body` /
    `.modal-footer` divs. Shadow stylesheet now also replays Bootstrap's
    `.modal-footer > *` margin / gap rule for slotted children. Internal
    fix: `BsModal.updated()` now calls `super.updated(changed)` so
    `hostClasses()` reflection runs.
  - **`bs-carousel`** + **`bs-carousel-item`** (NEW): self-contained
    slideshow components — own slide / interval / focus / keyboard / touch
    logic with no `bootstrap.bundle.min.js` dependency. `<bs-carousel>`
    exposes `interval`, `controls`, `indicators`, `fade`, `dark`,
    `pause-on-hover`, `wrap`, `touch` attributes; `next()` / `prev()` /
    `to(i)` / `pause()` / `cycle()` methods; and `bs-slide` / `bs-slid`
    events. `<bs-carousel-item>` carries `.carousel-item` plus the
    transient `.carousel-item-next` / `-prev` / `-start` / `-end` host
    classes during animation so Bootstrap's transform-based slide
    transitions resolve through slot flattening.

### Patch Changes

- Updated dependencies [7ea2cee]
- Updated dependencies [26eba76]
  - @bootstrap-wc/core@0.5.0

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
