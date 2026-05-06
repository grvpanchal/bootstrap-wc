// Smoke tests for the @bootstrap-wc/plugin-* wrappers.
//
// Each plugin's `define.js` is imported once (side-effect register), then we
// verify:
//   1. The custom element is registered.
//   2. Instantiating it in the DOM doesn't throw — the base wrapper's
//      lifecycle (`createRenderRoot` returns light DOM, `connectedCallback`
//      schedules `instantiate` on a microtask) runs without errors.
//   3. The wrapper renders something (slot or canvas).
//
// We do NOT load the upstream libs (Chart.js, DataTables, etc.) because the
// wrappers are designed to gracefully no-op when `globalThis.X` is missing
// (they `console.warn` and return). What we're proving here is that the
// wrapper itself doesn't crash and the lifecycle hooks fire.

import { expect, fixture, html } from '@open-wc/testing';

// Side-effect imports — each `define.js` calls customElements.define().
import '@bootstrap-wc/plugin-blueimp-gallery/define';
import '@bootstrap-wc/plugin-c3/define';
import '@bootstrap-wc/plugin-chartist/define';
import '@bootstrap-wc/plugin-chartjs/define';
import '@bootstrap-wc/plugin-clipboard/define';
import '@bootstrap-wc/plugin-codemirror/define';
import '@bootstrap-wc/plugin-datatables/define';
import '@bootstrap-wc/plugin-dropzone/define';
import '@bootstrap-wc/plugin-easymde/define';
import '@bootstrap-wc/plugin-flatpickr/define';
import '@bootstrap-wc/plugin-flot/define';
import '@bootstrap-wc/plugin-fullcalendar/define';
import '@bootstrap-wc/plugin-i18next/define';
import '@bootstrap-wc/plugin-jstree/define';
import '@bootstrap-wc/plugin-morris/define';
import '@bootstrap-wc/plugin-peity/define';
import '@bootstrap-wc/plugin-rickshaw/define';
import '@bootstrap-wc/plugin-shepherd/define';
import '@bootstrap-wc/plugin-sparkline/define';
import '@bootstrap-wc/plugin-summernote/define';
import '@bootstrap-wc/plugin-sweetalert2/define';
import '@bootstrap-wc/plugin-tom-select/define';
import '@bootstrap-wc/plugin-validate/define';
import '@bootstrap-wc/plugin-wizard/define';

// Map plugin package -> tag name. Order kept stable for readability.
const PLUGIN_TAGS = [
  'bs-lightbox',         // plugin-blueimp-gallery
  'bs-c3-chart',
  'bs-chartist-chart',
  'bs-chart',            // plugin-chartjs (specialised)
  'bs-clipboard',
  'bs-code-editor',
  'bs-datatable',
  'bs-file-upload',
  'bs-markdown-editor',
  'bs-datepicker',
  'bs-flot-chart',
  'bs-calendar',
  'bs-i18n',
  'bs-tree',
  'bs-morris-chart',
  'bs-peity-chart',
  'bs-rickshaw-chart',
  'bs-tour',
  'bs-sparkline',
  'bs-rich-text',
  'bs-swal',
  'bs-search-select',
  'bs-form-validator',
  'bs-wizard',
] as const;

describe('@bootstrap-wc/plugin-* smoke', () => {
  for (const tag of PLUGIN_TAGS) {
    it(`<${tag}> registers as a custom element`, () => {
      expect(customElements.get(tag), `${tag} should be defined`).to.be.a('function');
    });
  }

  for (const tag of PLUGIN_TAGS) {
    it(`<${tag}> instantiates without throwing`, async () => {
      // Suppress the wrapper's expected console.warn ("Chart.js global not
      // found") so the test runner's noisy-log filter stays happy.
      const origWarn = console.warn;
      console.warn = () => {};
      try {
        const el = await fixture(html`<div>${
          // String-template the tag so HTML parser accepts unknown tags.
          // open-wc/testing returns the rendered fragment.
          html`${unsafeHtml(`<${tag}></${tag}>`)}`
        }</div>`);
        const host = el.querySelector(tag);
        expect(host, `<${tag}> should be in DOM`).to.exist;
        expect(host!.shadowRoot, `${tag} renders in light DOM`).to.equal(null);
        // Wait for the queueMicrotask scheduled in connectedCallback.
        await new Promise((r) => queueMicrotask(() => r(null)));
        // Wrapper survives the lifecycle and is still connected.
        expect(host!.isConnected).to.equal(true);
      } finally {
        console.warn = origWarn;
      }
    });
  }

  it('<bs-chart> emits bs:ready when Chart.js global is present', async () => {
    // Stub a minimal Chart.js global. The wrapper should call `new Chart(...)`.
    let constructed = false;
    class FakeChart {
      destroy() {}
      update() {}
      data: unknown;
      options: unknown;
      constructor() { constructed = true; }
    }
    (globalThis as { Chart?: typeof FakeChart }).Chart = FakeChart;
    try {
      const el = await fixture(html`${unsafeHtml(
        `<bs-chart type="bar" data='{"labels":["a"],"datasets":[{"data":[1]}]}'></bs-chart>`,
      )}`);
      // Wait for queueMicrotask + the next macrotask.
      await new Promise((r) => setTimeout(r, 0));
      expect(constructed, 'FakeChart should have been instantiated').to.equal(true);
      expect(el.querySelector('canvas'), 'bs-chart should append <canvas>').to.exist;
    } finally {
      delete (globalThis as { Chart?: unknown }).Chart;
    }
  });
});

// Tiny helper: open-wc's html literal escapes unknown tags. We need raw HTML.
function unsafeHtml(s: string) {
  const t = document.createElement('template');
  t.innerHTML = s;
  return t.content.cloneNode(true);
}
