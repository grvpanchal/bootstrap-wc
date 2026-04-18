---
'@bootstrap-wc/components': patch
---

Broaden `sideEffects` to cover every file in `dist/` so bundlers (Vite,
Rollup, webpack) no longer tree-shake the `customElements.define()`
calls when consumers use the side-effect entry `import
'@bootstrap-wc/components'`. Previously only `./dist/index.js` and
`./dist/*/index.js` were listed, so each component's actual class file
(`./dist/<name>/<name>.js`) was considered side-effect-free and its
registration was stripped at build time, leaving `<bs-*>` tags as
unregistered elements.
