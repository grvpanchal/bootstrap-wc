import { LitElement, html } from 'lit';
import { property } from 'lit/decorators.js';

/**
 * <bs-peity-chart> — wraps the upstream `peity` library inside a Lit element.
 *
 * Renders in LIGHT DOM (no shadow root) so the plugin's stylesheet selectors
 * reach the rendered DOM. This is critical because most jQuery plugins were
 * written before web components and assume CSS in the page can target their
 * generated markup.
 *
 * Loading the plugin itself is left to the host page (e.g. via a CDN <script>
 * tag or an explicit `import 'plugin-name'`). This wrapper only orchestrates
 * its lifecycle.
 *
 * Common attributes:
 *   - `options`  JSON-stringified options object.
 *   - `auto`     If present, instantiate on connectedCallback (default: true).
 *
 * Common events emitted (re-dispatched from the underlying plugin):
 *   - `bs:ready`     after instantiation.
 *   - `bs:change`    on data/state change.
 *   - `bs:destroy`   before disposal.
 */
export class BSpeityChart extends LitElement {
  static properties = {
    options: { type: Object },
    auto: { type: Boolean, reflect: true },
  };

  declare options?: Record<string, unknown>;
  declare auto: boolean;

  protected instance: unknown = null;
  protected target: HTMLElement | null = null;

  // Light DOM render — required so the upstream plugin's CSS selectors apply.
  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.auto !== false) {
      // Defer one tick so slotted children are in the DOM.
      queueMicrotask(() => this.instantiate());
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.dispose();
  }

  /**
   * Subclass hook: instantiate the plugin against `this.target` (the first
   * element child by default) and store the instance on `this.instance`.
   * The base class only emits `bs:ready`. Override per-plugin.
   */
  protected instantiate() {
    this.target = (this.firstElementChild as HTMLElement) || this;
    this.dispatchEvent(new CustomEvent('bs:ready', { bubbles: true, detail: { instance: this.instance, target: this.target } }));
  }

  /**
   * Subclass hook: tear down the plugin instance.
   */
  protected dispose() {
    if (this.instance && typeof (this.instance as { destroy?: () => void }).destroy === 'function') {
      (this.instance as { destroy: () => void }).destroy();
    }
    this.instance = null;
    this.dispatchEvent(new CustomEvent('bs:destroy', { bubbles: true }));
  }

  render() {
    // Slotted content — the wrapper instantiates the plugin against children.
    return html`<slot></slot>`;
  }
}
