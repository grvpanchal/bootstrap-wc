---
'@bootstrap-wc/components': patch
---

`bs-modal` now teleports its host element to `document.body` when opened
and restores it to its author-placed position when closed (matches
Bootstrap's own modal plugin). Fixes the modal being clipped by ancestor
stacking contexts — notably Starlight's `.main-pane` which uses
`isolation: isolate` and was capping the modal's z-index below the docs
site's fixed header.

Static-preview modals (`<bs-modal static-preview>`) intentionally stay
inline since they exist precisely to be rendered in normal document flow
for visual documentation.
