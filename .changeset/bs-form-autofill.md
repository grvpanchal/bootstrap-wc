---
'@bootstrap-wc/components': minor
---

Browser autofill, fixed properly — by switching every form-control
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
