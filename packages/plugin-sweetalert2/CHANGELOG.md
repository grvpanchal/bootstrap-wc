# @bootstrap-wc/plugin-sweetalert2

## 0.2.0

### Minor Changes

- f2e683e: Initial preview release of `@bootstrap-wc/plugin-*` packages — Lit-based web-component wrappers for jQuery/standalone JS libraries that don't compose naturally with the `@bootstrap-wc/components` core (because their stylesheets target selectors that wouldn't reach into shadow DOM, or their APIs predate custom elements).

  Each wrapper renders in **light DOM** (no shadow root) so the upstream plugin's CSS keeps working. Hosts load the upstream lib via CDN/bundle; the wrapper grabs `globalThis.X` at instantiation time.

  **Packages**: blueimp-gallery (`<bs-lightbox>`), c3 (`<bs-c3-chart>`), chartist (`<bs-chartist-chart>`), chartjs (`<bs-chart>` — specialised reference impl), clipboard (`<bs-clipboard>`), codemirror (`<bs-code-editor>`), datatables (`<bs-datatable>`), dropzone (`<bs-file-upload>`), easymde (`<bs-markdown-editor>`), flatpickr (`<bs-datepicker>`), flot (`<bs-flot-chart>`), fullcalendar (`<bs-calendar>`), i18next (`<bs-i18n>`), jstree (`<bs-tree>`), morris (`<bs-morris-chart>`), peity (`<bs-peity-chart>`), rickshaw (`<bs-rickshaw-chart>`), shepherd (`<bs-tour>`), sparkline (`<bs-sparkline>`), summernote (`<bs-rich-text>`), sweetalert2 (`<bs-swal>`), tom-select (`<bs-search-select>`), validate (`<bs-form-validator>`), wizard (`<bs-wizard>`).

  **Common API**:
  - `createRenderRoot()` returns `this` (light DOM).
  - `connectedCallback()` schedules `instantiate()` on a microtask so slotted children land first.
  - `disconnectedCallback()` calls `dispose()`.
  - Subclass `instantiate()` / `dispose()` per-plugin.
  - Re-dispatch upstream events as `bs:*` custom events (`bubbles: true`), with `detail.instance` pointing at the underlying plugin object.

  See `packages/PLUGINS.md` for the full plugin matrix, status (preview vs specialised), and the shadow-DOM compatibility caveats.

  Status: `chartjs` is specialised; the rest are scaffolded with the shared base ready for per-plugin specialisation.
