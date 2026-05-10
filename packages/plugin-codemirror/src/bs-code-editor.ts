import { LitElement, html } from 'lit';

/**
 * <bs-code-editor> — wraps the upstream CodeMirror library inside a Lit element.
 *
 * Renders in LIGHT DOM (no shadow root) so the plugin's stylesheet selectors
 * reach the rendered DOM. Loading the upstream library itself is left to the
 * host page (e.g. via a CDN <script> tag); this wrapper reads
 * `globalThis.CodeMirror` at instantiation time.
 *
 * Common attributes:
 *   - `options`  JSON-stringified options object passed to the upstream library.
 *   - `auto`     If false, suppresses automatic instantiation on connect.
 *
 * Common events emitted:
 *   - `bs:ready`     after instantiation (`detail.instance` is the upstream instance).
 *   - `bs:destroy`   before disposal.
 */
export class BsCodeEditor extends LitElement {
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
   * Create the upstream CodeMirror instance against the slotted target element
   * and dispatch `bs:ready` with the instance.
   */
  protected instantiate() {
    const CM = (globalThis as { CodeMirror?: { fromTextArea: (el: HTMLTextAreaElement, opts: unknown) => unknown } }).CodeMirror;
    if (!CM?.fromTextArea) return console.warn('[bs-code-editor] CodeMirror global not found.');
    this.target = (this.querySelector('textarea') as HTMLTextAreaElement) ?? (this.firstElementChild as HTMLElement);
    if (!this.target || !(this.target instanceof HTMLTextAreaElement)) return;
    this.instance = CM.fromTextArea(this.target, this.options ?? {});
    this.dispatchEvent(new CustomEvent('bs:ready', {
      bubbles: true,
      detail: { instance: this.instance, target: this.target },
    }));
  }

  /** Tear down the upstream instance. */
  protected dispose() {
    const inst = this.instance as { toTextArea?: () => void } | null;
    if (inst?.toTextArea) inst.toTextArea();
    this.instance = null;
    this.dispatchEvent(new CustomEvent('bs:destroy', { bubbles: true }));
  }

  override render() {
    return html`<slot></slot>`;
  }
}
