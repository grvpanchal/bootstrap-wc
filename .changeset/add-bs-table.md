---
'@bootstrap-wc/components': minor
---

Add `<bs-table>`, a Bootstrap table styling wrapper.

Authors nest a real `<table>` inside `<bs-table>` (the HTML parser drops
`<thead>` / `<tbody>` / `<tr>` outside a `<table>` ancestor). The
component applies `.table` plus every configured modifier class to that
inner `<table>`, and — when `responsive` is set — adds
`.table-responsive[-{bp}]` to the host so the layout still wraps wide
tables in a horizontally-scrolling container.

```html
<bs-table responsive="md" variant="dark" striped hover bordered border-variant="secondary" size="sm" group-divider>
  <table>
    <caption>List of users</caption>
    <thead>
      <tr><th>#</th><th>First</th><th>Last</th></tr>
    </thead>
    <tbody>
      <tr><th>1</th><td>Mark</td><td>Otto</td></tr>
    </tbody>
  </table>
</bs-table>
```

Attributes:

- `variant` — contextual color (`primary` … `dark`).
- `striped` / `striped-columns` — zebra-striped rows / columns.
- `bordered` / `borderless` / `border-variant` — border styling.
- `hover` — hover-highlighted rows.
- `size="sm"` — `.table-sm` compact padding.
- `caption-top` — caption above the table.
- `group-divider` — thicker separator on `<tbody>`.
- `responsive` — wrap in `.table-responsive[-{bp}]` for horizontal scroll.

The inner `<table>` gets a `part="table"` marker so consumers can style
it via `bs-table::part(table) { … }`. A `MutationObserver` reapplies
classes when the inner table or its rows are inserted late (e.g.
server-rendered fragments hydrated client-side).
