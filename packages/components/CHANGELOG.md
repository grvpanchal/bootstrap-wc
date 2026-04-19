# @bootstrap-wc/components

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
