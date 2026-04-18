# @bootstrap-wc/components

## 0.1.1

### Patch Changes

- 64cc6fe: Broaden `sideEffects` to cover every file in `dist/` so bundlers (Vite,
  Rollup, webpack) no longer tree-shake the `customElements.define()`
  calls when consumers use the side-effect entry `import
'@bootstrap-wc/components'`. Previously only `./dist/index.js` and
  `./dist/*/index.js` were listed, so each component's actual class file
  (`./dist/<name>/<name>.js`) was considered side-effect-free and its
  registration was stripped at build time, leaving `<bs-*>` tags as
  unregistered elements.

## 0.1.0

### Minor Changes

- c2d5b27: Initial release (0.1.0).
  - 30+ Bootstrap 5.3 components as framework-agnostic Web Components (`<bs-*>`).
  - `@bootstrap-wc/core` — base class, controllers (transition, floating-ui, focus-trap), form-associated mixin.
  - `@bootstrap-wc/components` — full Bootstrap component set: forms, nav, overlays, feedback, disclosure, content.
  - `@bootstrap-wc/cli` (`bwc`) — shadcn-style CLI for copying component source into consumer projects.
  - `@bootstrap-wc/react` (preview) — typed React wrappers via `@lit/react`.
  - Astro + Starlight documentation site with a live example on every component page.

### Patch Changes

- Updated dependencies [c2d5b27]
  - @bootstrap-wc/core@0.1.0
