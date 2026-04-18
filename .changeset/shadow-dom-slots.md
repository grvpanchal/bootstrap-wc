---
'@bootstrap-wc/core': minor
'@bootstrap-wc/components': minor
---

Restore real Web-Component semantics by rendering every component into an
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
