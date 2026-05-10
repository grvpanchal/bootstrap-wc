import { LitElement, html } from 'lit';

/**
 * <bs-i18n> — wraps the upstream i18next library inside a Lit element.
 *
 * Renders in LIGHT DOM (no shadow root) so the plugin's stylesheet selectors
 * reach the rendered DOM. Loading the upstream library itself is left to the
 * host page (e.g. via a CDN <script> tag); this wrapper reads
 * `globalThis.i18next` at instantiation time.
 *
 * Common attributes:
 *   - `options`  JSON-stringified options object passed to the upstream library.
 *   - `auto`     If false, suppresses automatic instantiation on connect.
 *
 * Common events emitted:
 *   - `bs:ready`     after instantiation (`detail.instance` is the upstream instance).
 *   - `bs:destroy`   before disposal.
 */
export class BsI18n extends LitElement {
  static override properties = {
    options: { type: Object },
    auto: { type: Boolean, reflect: true },
    key: { type: String, reflect: true },
  };

  declare options?: Record<string, unknown>;
  declare auto: boolean;
  declare key?: string;

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
   * Create the upstream i18next instance against the slotted target element
   * and dispatch `bs:ready` with the instance.
   */
  protected instantiate() {
    const i18n = (globalThis as { i18next?: { t: (k: string, o?: unknown) => string; on: (e: string, fn: () => void) => void; isInitialized?: boolean } }).i18next;
    if (!i18n) return console.warn('[bs-i18n] i18next global not found.');
    this.instance = i18n;
    const refresh = () => {
      if (this.key) this.textContent = i18n.t(this.key, this.options ?? {});
    };
    if (i18n.isInitialized) {
      refresh();
    } else {
      i18n.on('initialized', refresh);
    }
    i18n.on('languageChanged', refresh);
    (this as unknown as { __refresh?: () => void }).__refresh = refresh;
    this.dispatchEvent(new CustomEvent('bs:ready', {
      bubbles: true,
      detail: { instance: this.instance, target: this.target },
    }));
  }

  /** Tear down the upstream instance. */
  protected dispose() {this.textContent = '';
    this.instance = null;
    this.dispatchEvent(new CustomEvent('bs:destroy', { bubbles: true }));
  }

  override render() {
    return html`<slot></slot>`;
  }
}
