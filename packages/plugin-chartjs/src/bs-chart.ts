import { LitElement, html } from 'lit';
import { property } from 'lit/decorators.js';

/**
 * <bs-chart> — Chart.js 4 wrapper as a Lit-based web component.
 *
 * Renders a single `<canvas>` in LIGHT DOM (no shadow root) and constructs a
 * Chart instance against it. Reference implementation showing how a
 * @bootstrap-wc/plugin-* package specialises the lifecycle and re-dispatches
 * upstream events as `bs:*` custom events.
 *
 * Attributes:
 *   - `type`     bar | line | pie | doughnut | radar | polarArea | scatter | bubble.
 *   - `data`     JSON-stringified Chart.js data object.
 *   - `options`  JSON-stringified Chart.js options object.
 *   - `width`/`height`  Canvas size attrs (passed through).
 *
 * Events:
 *   - `bs:ready`   after Chart instance is created (detail.instance).
 *   - `bs:destroy` before destroy.
 *
 * The host page must load Chart.js (CDN or bundle); the wrapper grabs
 * `globalThis.Chart` at instantiation time.
 */
export class BsChart extends LitElement {
  static properties = {
    type:    { type: String, reflect: true },
    data:    { type: Object },
    options: { type: Object },
    width:   { type: String },
    height:  { type: String },
  };

  declare type: string;
  declare data?: Record<string, unknown>;
  declare options?: Record<string, unknown>;
  declare width?: string;
  declare height?: string;

  private chart: { destroy: () => void; update: () => void; data: unknown; options: unknown } | null = null;
  private canvas: HTMLCanvasElement | null = null;

  protected createRenderRoot() { return this; }

  connectedCallback() {
    super.connectedCallback();
    queueMicrotask(() => this.instantiate());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.dispose();
  }

  updated(changed: Map<string, unknown>) {
    if (this.chart && (changed.has('data') || changed.has('options'))) {
      this.chart.data    = (this.data    ?? this.chart.data) as never;
      this.chart.options = (this.options ?? this.chart.options) as never;
      this.chart.update();
    }
  }

  private instantiate() {
    const Chart = (globalThis as { Chart?: new (...args: unknown[]) => typeof this.chart }).Chart;
    if (!Chart) {
      console.warn('[bs-chart] Chart.js global not found. Load Chart.js before bs-chart.');
      return;
    }
    this.canvas = this.querySelector('canvas') ?? document.createElement('canvas');
    if (!this.canvas.parentNode) this.appendChild(this.canvas);
    if (this.width)  this.canvas.setAttribute('width',  this.width);
    if (this.height) this.canvas.setAttribute('height', this.height);

    this.chart = new (Chart as new (ctx: HTMLCanvasElement, cfg: unknown) => NonNullable<typeof this.chart>)(
      this.canvas,
      { type: this.type || 'bar', data: this.data || {}, options: this.options || {} }
    );

    this.dispatchEvent(new CustomEvent('bs:ready', {
      bubbles: true, detail: { instance: this.chart },
    }));
  }

  private dispose() {
    if (this.chart) {
      this.dispatchEvent(new CustomEvent('bs:destroy', { bubbles: true }));
      this.chart.destroy();
      this.chart = null;
    }
  }

  render() { return html`<slot></slot>`; }
}
