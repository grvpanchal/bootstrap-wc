---
'@bootstrap-wc/components': patch
---

`bs-list-group-item`: fix click navigation when item content is nested.

Previously the click handler only navigated when `ev.target === this` —
so clicks on inner content (e.g. a `<div class="fw-semibold">` title +
`<div class="small">` excerpt, like the docs search results) bubbled
through without triggering navigation. The check now navigates on any
click that reaches the host, skipping only when the click landed on a
nested interactive element (`<a>`, `<button>`, `<input>`, `<select>`,
`<textarea>`, `[role="button"]`, `[role="link"]`) so that nested
controls can claim their own clicks.
