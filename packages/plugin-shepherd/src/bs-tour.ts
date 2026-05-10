import { LitElement, html } from 'lit';

/**
 * <bs-tour> — wraps the upstream Shepherd.js library inside a Lit element.
 *
 * Renders in LIGHT DOM (no shadow root) so the plugin's stylesheet selectors
 * reach the rendered DOM. Loading the upstream library itself is left to the
 * host page (e.g. via a CDN <script> tag); this wrapper reads
 * `globalThis.Shepherd` at instantiation time.
 *
 * Common attributes:
 *   - `options`  JSON-stringified options object passed to the upstream library.
 *   - `auto`     If false, suppresses automatic instantiation on connect.
 *
 * Common events emitted:
 *   - `bs:ready`     after instantiation (`detail.instance` is the upstream instance).
 *   - `bs:destroy`   before disposal.
 */
export class BsTour extends LitElement {
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
   * Create the upstream Shepherd.js instance against the slotted target element
   * and dispatch `bs:ready` with the instance.
   */
  protected instantiate() {
    const Shepherd = (globalThis as { Shepherd?: { Tour: new (opts: unknown) => { start: () => void; complete: () => void; addStep: (s: unknown) => void } } }).Shepherd;
    if (!Shepherd?.Tour) return console.warn('[bs-tour] Shepherd global not found.');
    const opts = (this.options as { steps?: unknown[] }) ?? {};
    const tour = new Shepherd.Tour(opts);
    if (Array.isArray(opts.steps)) {
      for (const step of opts.steps) tour.addStep(step);
    }
    this.instance = tour;
    (this as unknown as { start?: () => void }).start = () => tour.start();
    this.dispatchEvent(new CustomEvent('bs:ready', {
      bubbles: true,
      detail: { instance: this.instance, target: this.target },
    }));
  }

  /** Tear down the upstream instance. */
  protected dispose() {
    const inst = this.instance as { complete?: () => void } | null;
    if (inst?.complete) inst.complete();
    this.instance = null;
    this.dispatchEvent(new CustomEvent('bs:destroy', { bubbles: true }));
  }

  override render() {
    return html`<slot></slot>`;
  }
}
