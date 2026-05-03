---
'@bootstrap-wc/components': minor
'@bootstrap-wc/core': minor
---

Close 6 framework gaps surfaced by the Bootstrap example port pages.

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
