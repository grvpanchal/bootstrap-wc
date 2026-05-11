# @bootstrap-wc/plugin-validate

## 2.0.0

### Patch Changes

- Updated dependencies [3f2f89b]
  - @bootstrap-wc/components@0.7.0

## 1.1.0

### Minor Changes

- dee0857: Specialize all 23 `@bootstrap-wc/plugin-*` wrappers so they actually drive
  their upstream library on connect. Previously the base `LitElement` fired
  `bs:ready` cosmetically without instantiating anything (only `plugin-chartjs`
  was already specialized).

  Each wrapper now reads the expected upstream global at `connectedCallback`
  time, instantiates the upstream object against the slotted target, stores it
  on `this.instance`, and emits `bs:ready` with `{ instance, target }`. Disposal
  calls the appropriate teardown (`destroy()` / `toTextArea()` / `detach()` /
  `complete()` etc. depending on the upstream).

  Specifically:
  - `<bs-calendar>` → `new FullCalendar.Calendar(target).render()`
  - `<bs-datatable>` → `$(target).DataTable(opts)`
  - `<bs-rich-text>` → `$(target).summernote(opts)`
  - `<bs-markdown-editor>` → `new EasyMDE({element: target, ...opts})`
  - `<bs-code-editor>` → `CodeMirror.fromTextArea(target, opts)`
  - `<bs-datepicker>` → `flatpickr(input, opts)`
  - `<bs-search-select>` → `new TomSelect(target, opts)`
  - `<bs-swal>` → exposes `.fire()` calling `Swal.fire(opts)`
  - `<bs-file-upload>` → `new Dropzone(target, opts)`
  - `<bs-tour>` → `new Shepherd.Tour(opts)` + `.start()`
  - `<bs-flot-chart>` → `$.plot(target, data, opts)`
  - `<bs-morris-chart>` → `Morris[kind]({element, ...opts})`
  - `<bs-c3-chart>` → `c3.generate({bindto, ...opts})`
  - `<bs-chartist-chart>` → `new Chartist[type](target, data, opts)`
  - `<bs-rickshaw-chart>` → `new Rickshaw.Graph({...}).render()`
  - `<bs-peity-chart>` → `$(target).peity(type, opts)`
  - `<bs-sparkline>` → `$(target).sparkline(data, opts)`
  - `<bs-tree>` → `$(target).jstree(opts)`
  - `<bs-form-validator>` → `$(target).validate(opts)` (target via `options.selector`)
  - `<bs-wizard>` → `$(target).smartWizard(opts)`
  - `<bs-clipboard>` → `new ClipboardJS(target, opts)`
  - `<bs-i18n>` → renders `i18next.t(key, opts)` + auto-refreshes on language change
  - `<bs-lightbox>` → delegates clicks on `[data-gallery]` to `blueimp.Gallery(...)`

  End-to-end smoke verified with Playwright: 24/24 plugin doc pages now render
  the real upstream widget through the `<bs-*>` wrapper.

## 1.0.0

### Patch Changes

- Updated dependencies [d77dceb]
- Updated dependencies [3c9a64c]
  - @bootstrap-wc/components@0.6.0

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
