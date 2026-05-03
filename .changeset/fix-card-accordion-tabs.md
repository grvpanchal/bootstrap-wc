---
'@bootstrap-wc/components': minor
'@bootstrap-wc/core': minor
---

Bug fixes against Bootstrap 5.3 visual parity.

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
