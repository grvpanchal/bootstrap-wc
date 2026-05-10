import { LitElement, html } from 'lit';

/**
 * <bs-form-validator> — wraps the upstream jQuery Validation library inside a Lit element.
 *
 * Renders in LIGHT DOM (no shadow root) so the plugin's stylesheet selectors
 * reach the rendered DOM. Loading the upstream library itself is left to the
 * host page (e.g. via a CDN <script> tag); this wrapper reads
 * `globalThis.jQuery.fn.validate` at instantiation time.
 *
 * Common attributes:
 *   - `options`  JSON-stringified options object passed to the upstream library.
 *   - `auto`     If false, suppresses automatic instantiation on connect.
 *
 * Common events emitted:
 *   - `bs:ready`     after instantiation (`detail.instance` is the upstream instance).
 *   - `bs:destroy`   before disposal.
 */
export class BsFormValidator extends LitElement {
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
   * Create the upstream jQuery Validation instance against the slotted target element
   * and dispatch `bs:ready` with the instance.
   */
  protected instantiate() {
    const $ = (globalThis as { jQuery?: ((sel: HTMLElement | string) => { validate: (opts: unknown) => unknown }) & { fn?: { validate?: unknown } } }).jQuery;
    if (!$?.fn?.validate) return console.warn('[bs-form-validator] jQuery + jquery-validation not found.');
    const opts = ((this.options as { selector?: string } | undefined) ?? {}) as { selector?: string } & Record<string, unknown>;
    const sel = opts.selector;
    const target = (sel ? document.querySelector(sel) as HTMLFormElement | null : (this.previousElementSibling as HTMLFormElement | null));
    if (!target) return console.warn('[bs-form-validator] target form not found.');
    this.target = target;
    this.instance = $(target).validate(opts);
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
