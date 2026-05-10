---
"@bootstrap-wc/components": patch
---

Fix `<bs-avatar>` `shape="circle"` and `shape="rounded"` not visibly clipping
the inner image / initials wrapper.

The host gets the inline `border-radius` set in `updated()`, but the inner
`<span part="wrapper">` (which has `overflow: hidden` and contains the image)
had no `border-radius`, so the visible content stayed square. The wrapper now
inherits `border-radius` from the host, so all three shapes render correctly.
