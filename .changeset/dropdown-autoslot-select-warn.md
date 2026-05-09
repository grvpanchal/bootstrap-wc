---
"@bootstrap-wc/components": minor
---

Two ergonomics improvements surfaced by the bootstrap-themes wc port:

- **`<bs-dropdown>`**: auto-defaults unattributed light-DOM children to
  `slot="menu"`. The component projects items via `<slot name="menu">`;
  forgetting the slot attribute used to leave items rendering invisibly
  in the trigger position. Authors who explicitly want a custom trigger
  label (`slot="label"`) or want to project into a different slot are
  unaffected — only children with no `slot` attribute get defaulted. A
  MutationObserver covers children added after connect.

  Before:
  ```html
  <bs-dropdown label="Apps">
    <bs-dropdown-item slot="menu" href="/blog">Blog</bs-dropdown-item>
    <bs-dropdown-item slot="menu" href="/mail">Mail</bs-dropdown-item>
  </bs-dropdown>
  ```
  After:
  ```html
  <bs-dropdown label="Apps">
    <bs-dropdown-item href="/blog">Blog</bs-dropdown-item>
    <bs-dropdown-item href="/mail">Mail</bs-dropdown-item>
  </bs-dropdown>
  ```

- **`<bs-select>`**: warns via `console.warn` when it sees light-DOM
  children that aren't `<option>` / `<optgroup>` / `<hr>`. The component
  reads native option children to build its internal `<select>`; an
  unrecognised tag (e.g. a typo'd `<bs-option>`) used to fail silently
  and the option text would leak into the parent flex layout via the
  host's `display: contents`. The warning calls out the offending tag
  names and suggests `<option>`.

Adds a "Dropdown" section to the Navbar docs page with two examples:
plain dropdown inside a navbar, plus the nested-submenu pattern via
`class="dropdown-submenu"`.

Tests:
- 2 new bs-dropdown specs (auto-slot defaulting + MutationObserver).
- 3 new bs-select specs (option reading, unknown-child warning, no
  warning when only allowed children present).
