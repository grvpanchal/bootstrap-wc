---
'@bootstrap-wc/core': patch
'@bootstrap-wc/components': patch
---

Three long-standing web-components-with-shadow-DOM papercuts get
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
