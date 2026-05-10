---
"@bootstrap-wc/plugin-blueimp-gallery": minor
"@bootstrap-wc/plugin-c3": minor
"@bootstrap-wc/plugin-chartist": minor
"@bootstrap-wc/plugin-clipboard": minor
"@bootstrap-wc/plugin-codemirror": minor
"@bootstrap-wc/plugin-datatables": minor
"@bootstrap-wc/plugin-dropzone": minor
"@bootstrap-wc/plugin-easymde": minor
"@bootstrap-wc/plugin-flatpickr": minor
"@bootstrap-wc/plugin-flot": minor
"@bootstrap-wc/plugin-fullcalendar": minor
"@bootstrap-wc/plugin-i18next": minor
"@bootstrap-wc/plugin-jstree": minor
"@bootstrap-wc/plugin-morris": minor
"@bootstrap-wc/plugin-peity": minor
"@bootstrap-wc/plugin-rickshaw": minor
"@bootstrap-wc/plugin-shepherd": minor
"@bootstrap-wc/plugin-sparkline": minor
"@bootstrap-wc/plugin-summernote": minor
"@bootstrap-wc/plugin-sweetalert2": minor
"@bootstrap-wc/plugin-tom-select": minor
"@bootstrap-wc/plugin-validate": minor
"@bootstrap-wc/plugin-wizard": minor
---

Specialize all 23 `@bootstrap-wc/plugin-*` wrappers so they actually drive
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
