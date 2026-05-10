import { LitElement, html } from 'lit';

/**
 * <bs-peity-chart> — wraps the upstream Peity library inside a Lit element.
 *
 * Renders in LIGHT DOM (no shadow root) so the plugin's stylesheet selectors
 * reach the rendered DOM. Loading the upstream library itself is left to the
 * host page (e.g. via a CDN <script> tag); this wrapper reads
 * `globalThis.jQuery.fn.peity` at instantiation time.
 *
 * Common attributes:
 *   - `options`  JSON-stringified options object passed to the upstream library.
 *   - `auto`     If false, suppresses automatic instantiation on connect.
 *
 * Common events emitted:
 *   - `bs:ready`     after instantiation (`detail.instance` is the upstream instance).
 *   - `bs:destroy`   before disposal.
 */
export class BsPeityChart extends LitElement {
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
   * Create the upstream Peity instance against the slotted target element
   * and dispatch `bs:ready` with the instance.
   */
  protected instantiate() {
    const $ = (globalThis as { jQuery?: ((sel: HTMLElement) => { peity: (type: string, opts: unknown) => unknown }) & { fn?: { peity?: unknown } } }).jQuery;
    if (!$?.fn?.peity) return console.warn('[bs-peity-chart] jQuery + Peity not found.');
    this.target = (this.querySelector('span, [data-peity]') as HTMLElement) ?? (this.firstElementChild as HTMLElement);
    if (!this.target) return;
    const opts = ((this.options as { type?: string } | undefined) ?? {}) as { type?: string } & Record<string, unknown>;
    const { type = 'line', ...rest } = opts;
    this.instance = $(this.target).peity(type, rest);
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
