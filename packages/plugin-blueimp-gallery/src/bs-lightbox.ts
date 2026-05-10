import { LitElement, html } from 'lit';

/**
 * <bs-lightbox> — wraps the upstream blueimp Gallery library inside a Lit element.
 *
 * Renders in LIGHT DOM (no shadow root) so the plugin's stylesheet selectors
 * reach the rendered DOM. Loading the upstream library itself is left to the
 * host page (e.g. via a CDN <script> tag); this wrapper reads
 * `globalThis.blueimp` at instantiation time.
 *
 * Common attributes:
 *   - `options`  JSON-stringified options object passed to the upstream library.
 *   - `auto`     If false, suppresses automatic instantiation on connect.
 *
 * Common events emitted:
 *   - `bs:ready`     after instantiation (`detail.instance` is the upstream instance).
 *   - `bs:destroy`   before disposal.
 */
export class BsLightbox extends LitElement {
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
   * Create the upstream blueimp Gallery instance against the slotted target element
   * and dispatch `bs:ready` with the instance.
   */
  protected instantiate() {
    const blueimp = (globalThis as { blueimp?: { Gallery: (links: unknown[], opts?: unknown) => unknown } }).blueimp;
    if (!blueimp?.Gallery) return console.warn('[bs-lightbox] blueimp Gallery global not found.');
    // Delegate clicks on data-gallery anchors to open the gallery.
    const handler = (e: Event) => {
      const link = (e.target as Element)?.closest?.('[data-gallery]');
      if (!link) return;
      e.preventDefault();
      const links = Array.from(this.querySelectorAll('[data-gallery]'));
      blueimp.Gallery(links, { ...((this.options as Record<string, unknown>) ?? {}), index: links.indexOf(link) });
    };
    this.addEventListener('click', handler);
    this.instance = { handler };
    (this as unknown as { __handler?: typeof handler }).__handler = handler;
    this.dispatchEvent(new CustomEvent('bs:ready', {
      bubbles: true,
      detail: { instance: this.instance, target: this.target },
    }));
  }

  /** Tear down the upstream instance. */
  protected dispose() {
    const handler = (this as unknown as { __handler?: (e: Event) => void }).__handler;
    if (handler) this.removeEventListener('click', handler);
    this.instance = null;
    this.dispatchEvent(new CustomEvent('bs:destroy', { bubbles: true }));
  }

  override render() {
    return html`<slot></slot>`;
  }
}
