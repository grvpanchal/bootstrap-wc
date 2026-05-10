import { LitElement, html } from 'lit';

/**
 * <bs-chartist-chart> — wraps the upstream Chartist 1 library inside a Lit element.
 *
 * Renders in LIGHT DOM (no shadow root) so the plugin's stylesheet selectors
 * reach the rendered DOM. Loading the upstream library itself is left to the
 * host page (e.g. via a CDN <script> tag); this wrapper reads
 * `globalThis.Chartist` at instantiation time.
 *
 * Common attributes:
 *   - `options`  JSON-stringified options object passed to the upstream library.
 *   - `auto`     If false, suppresses automatic instantiation on connect.
 *
 * Common events emitted:
 *   - `bs:ready`     after instantiation (`detail.instance` is the upstream instance).
 *   - `bs:destroy`   before disposal.
 */
export class BsChartistChart extends LitElement {
  static override properties = {
    options: { type: Object },
    auto: { type: Boolean, reflect: true },
  };

  declare options?: Record<string, unknown>;
  declare auto: boolean;

  protected instance: unknown = null;
  protected target: HTMLElement | null = null;

  // Light DOM render — required so the upstream plugin's CSS selectors apply.
  protected override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (this.auto !== false) {
      // Defer one tick so slotted children are in the DOM.
      queueMicrotask(() => this.instantiate());
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.dispose();
  }

  /**
   * Create the upstream Chartist 1 instance against the slotted target element
   * and dispatch `bs:ready` with the instance.
   */
  protected instantiate() {
    const Chartist = (globalThis as { Chartist?: { LineChart?: unknown; BarChart?: unknown; PieChart?: unknown } & Record<string, unknown> }).Chartist;
    if (!Chartist) return console.warn('[bs-chartist-chart] Chartist global not found.');
    this.target = (this.firstElementChild as HTMLElement) ?? this;
    const opts = ((this.options as { type?: string; data?: unknown; chartOptions?: unknown } | undefined) ?? {});
    const type = opts.type ?? 'LineChart';
    const Ctor = (Chartist as Record<string, unknown>)[type] ?? (Chartist as Record<string, unknown>)[`${type}Chart`] ?? Chartist.LineChart;
    if (typeof Ctor !== 'function') return console.warn(`[bs-chartist-chart] Chartist.${type} not a constructor.`);
    this.instance = new (Ctor as new (...args: unknown[]) => unknown)(this.target, opts.data, opts.chartOptions);
    this.dispatchEvent(new CustomEvent('bs:ready', {
      bubbles: true,
      detail: { instance: this.instance, target: this.target },
    }));
  }

  /** Tear down the upstream instance. */
  protected dispose() {
    const inst = this.instance as { detach?: () => void } | null;
    if (inst?.detach) inst.detach();
    this.instance = null;
    this.dispatchEvent(new CustomEvent('bs:destroy', { bubbles: true }));
  }

  override render() {
    return html`<slot></slot>`;
  }
}
