---
"@bootstrap-wc/components": minor
---

Add `<bs-avatar>` — a sized, optionally-rounded box for displaying a user's
profile picture, initials, or icon.

The numeric size scale matches bootstrap-essentials
(`16/24/32/48/64/96/128`), but `size` accepts any pixel value, and
`width`/`height` allow non-square boxes. Supports three shapes
(`circle`/`rounded`/`square`), Bootstrap variant tinting via
`bg-{variant}-subtle` + `text-{variant}-emphasis`, an image source via `src`
(rendered with `object-fit: cover` and `loading="lazy"`), and a `status` slot
for absolute-positioned badges (online/offline indicators).

```html
<bs-avatar size="48" src="/img/jane.jpg" alt="Jane Doe"></bs-avatar>
<bs-avatar size="64" shape="circle">JD</bs-avatar>
<bs-avatar size="48" variant="success">
  AB
  <span slot="status" class="bg-success"></span>
</bs-avatar>
```

This was previously shimmed via CSS-only `.avatar.avatar-{N}` classes in the
bootstrap-themes Jekyll site; the real component supersedes that shim for wc
consumers.
