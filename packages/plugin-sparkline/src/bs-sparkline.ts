import { LitElement, html } from 'lit';

/**
 * <bs-sparkline> — wraps the upstream jQuery Sparklines library inside a Lit element.
 *
 * Renders in LIGHT DOM (no shadow root) so the plugin's stylesheet selectors
 * reach the rendered DOM. Loading the upstream library itself is left to the
 * host page (e.g. via a CDN <script> tag); this wrapper reads
 * `globalThis.jQuery.fn.sparkline` at instantiation time.
 *
 * Common attributes:
 *   - `options`  JSON-stringified options object passed to the upstream library.
 *   - `auto`     If false, suppresses automatic instantiation on connect.
 *
 * Common events emitted:
 *   - `bs:ready`     after instantiation (`detail.instance` is the upstream instance).
 *   - `bs:destroy`   before disposal.
 */
export class BsSparkline extends LitElement {
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
   * Create the upstream jQuery Sparklines instance against the slotted target element
   * and dispatch `bs:ready` with the instance.
   */
  protected instantiate() {
    const $ = (globalThis as { jQuery?: ((sel: HTMLElement) => { sparkline: (data: unknown, opts: unknown) => unknown }) & { fn?: { sparkline?: unknown } } }).jQuery;
    if (!$?.fn?.sparkline) return console.warn('[bs-sparkline] jQuery + Sparklines not found.');
    this.target = (this.querySelector('span') as HTMLElement) ?? (this.firstElementChild as HTMLElement);
    if (!this.target) return;
    const opts = ((this.options as { values?: unknown } | undefined) ?? {}) as { values?: unknown } & Record<string, unknown>;
    const { values, ...rest } = opts;
    const data = values ?? (this.target.textContent ?? '').split(',').map(s => Number(s.trim()));
    this.instance = $(this.target).sparkline(data, rest);
    this.dispatchEvent(new CustomEvent('bs:ready', {
      bubbles: true,
      detail: { instance: this.instance, target: this.target },
    }));
  }

  /** Tear down the upstream instance. */
  protected dispose() {
    if (this.instance && typeof (this.instance as { destroy?: () => void }).destroy === 'function') {
      (this.instance as { destroy: () => void }).destroy();
    }
    this.instance = null;
    this.dispatchEvent(new CustomEvent('bs:destroy', { bubbles: true }));
  }

  override render() {
    return html`<slot></slot>`;
  }
}
