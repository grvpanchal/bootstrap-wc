# @bootstrap-wc/plugin-fullcalendar

FullCalendar 6 wrapper as a web component.

`<bs-calendar>` is a Lit-based web-component wrapper for [@fullcalendar/core].

## Why a wrapper?

The upstream library was written before web components and assumes CSS rules
in the host document can target its generated markup. This wrapper renders in
**light DOM** (no shadow root) so its stylesheet selectors continue to apply.

## Install

```bash
npm install @bootstrap-wc/plugin-fullcalendar fullcalendar
```

## Usage

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@bootstrap-wc/plugin-fullcalendar/dist/define.js"></script>

<bs-calendar options='{"key": "value"}'>
  <!-- slotted markup the plugin operates on -->
</bs-calendar>
```

Or in JS:

```js
import '@bootstrap-wc/plugin-fullcalendar/define';

const el = document.querySelector('bs-calendar');
el.addEventListener('bs:ready', (e) => console.log('plugin ready', e.detail));
```

## Compatibility caveats

- Lives in **light DOM** so plugin CSS reaches the children.
- If you place `<bs-calendar>` inside another wc component (e.g. `<bs-modal>`),
  the plugin still operates only on the *slotted* light-DOM children — that
  works fine for wc components that use named slots.
- Do **not** combine with `document`-wide jQuery selectors that assume the
  plugin DOM is at the page root.

See `/packages/PLUGINS.md` for the full plugin compatibility matrix.

## Status

Preview (0.1.0). Subclass-overridable lifecycle; per-plugin specialisation
typically needs ~30 lines of code. Contributions welcome.
