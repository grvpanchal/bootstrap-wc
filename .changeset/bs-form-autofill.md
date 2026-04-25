---
'@bootstrap-wc/components': minor
---

New `<bs-form>` component — a light-DOM wrapper around a native `<form>`
that closes the browser-autofill gap for shadow-DOM form controls.

Browsers' autofill predictors walk the light-DOM tree looking for
`<input name="…" autocomplete="…">` inside a `<form>`. Our `bs-input` /
`bs-textarea` / `bs-select` render native inputs *inside* a shadow root,
so Chrome, Safari, and Firefox never see them and never offer to
autofill on their own. `<bs-form>`:

- Wraps its children in a light-DOM `<form>` (moves initial children
  into it and watches for later additions via MutationObserver).
- Injects a hidden mirror `<input>` into the form for every
  form-associated `<bs-*>` child declaring both `name` and
  `autocomplete`. The mirror carries matching `name` / `autocomplete` /
  `type` so autofill prediction runs normally. It's visually hidden via
  the off-screen-clip pattern (not `display:none`, which would disqualify
  it from autofill).
- Propagates browser-filled values from the mirror into the real
  `<bs-*>` via its `value` property, and emits a `bs-input` event with
  `detail.autofilled = true`.
- Dispatches a single cancellable `bs-submit` event whose
  `detail.formData` already includes every form-associated CE (via
  `ElementInternals`) plus any plain `<input>` children.
- Applies Bootstrap's `.needs-validation` / `.was-validated` state
  automatically; exposes `reset()`, `checkValidity()`,
  `reportValidity()`, and a `formData` getter.

Opt out of the mirror injection with `<bs-form no-autofill-mirror>`.
