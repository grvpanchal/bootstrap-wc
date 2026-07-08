---
"@bootstrap-wc/components": minor
---

Dual-nature (data-driven) content on container components.

Every container-style `<bs-*>` component now accepts its content as a JS
property (array or object) in addition to slotted children. The contract:

- Property set + non-empty → drives rendering, default slot is ignored.
- Property empty / unset → falls back to the default `<slot>`.
- A JSON attribute (`items='[…]'`, `config='{…}'`) is a valid channel too.

This makes `<bs-*>` components a first-class fit for state-store-driven apps
(zustand, redux, signals, …) without hand-mutating light-DOM children.

| Component | Property | Shape |
|---|---|---|
| `<bs-nav>` | `items` | `{ label, href?, active?, disabled?, controls? }[]` |
| `<bs-tabs>` | `tabs` | `{ name, label, content?, active?, disabled? }[]` |
| `<bs-list-group>` | `items` | `{ text? \| html?, href?, active?, action?, disabled?, variant? }[]` |
| `<bs-dropdown>` | `items` | `{ label \| html, href?, divider?, header?, disabled?, active? }[]` |
| `<bs-accordion>` | `items` | `{ heading, body \| html, open? }[]` |
| `<bs-button-group>` | `buttons` | `{ label \| html, variant?, buttonStyle?, size?, href?, target?, active?, disabled?, type? }[]` |
| `<bs-offcanvas>` | `config` | `{ title?, titleHtml?, body?, bodyHtml?, footerHtml? }` |
| `<bs-pagination>` | `items` (explicit) | `{ label, href?, active?, disabled?, ellipsis?, ariaLabel? }[]` |
| `<bs-table>` | `columns` + `rows` | `Column[]` + `Record<string, unknown>[]` |
| `<bs-navbar>` | `config` | `{ brand?, links?, right?, collapseId? }` |

Pre-existing dual-nature (unchanged): `<bs-breadcrumb>` (items),
`<bs-select>` (options), `<bs-pagination>` numeric mode.

`<bs-navbar>` config `links[]` entries with a `children` array
automatically emit a nested `<bs-dropdown nav>` menu with `.items`
populated — recursive dropdown building from data.

`<bs-table>` in data-driven mode emits its own `<table>` and still applies
`striped` / `hover` / `bordered` / `border-variant` / `size` modifier
classes.

`<bs-pagination>` gains an explicit `items` array override alongside the
existing numeric `total` / `current` / `window` model. In items mode
`bs-page-change` fires with the item index instead of the 1-based page
number.

See `packages/components/DATA-DRIVEN.md` for the full reference,
framework-integration snippets (React, Lit, Vue, Svelte, Alpine), and a
zustand-driven `<app-shell>` example.

No breaking changes — slot-driven authoring keeps working exactly as
before for every component.
