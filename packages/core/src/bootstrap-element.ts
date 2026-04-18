import { LitElement } from 'lit';

export type Direction = 'ltr' | 'rtl';

/**
 * Base class for every Bootstrap Web Component.
 *
 * Renders into **light DOM** so Bootstrap's document-level CSS applies directly
 * (this mirrors react-bootstrap's model — components are behavior wrappers around
 * standard Bootstrap markup, not style-in-a-box shadow components).
 *
 * Responsibilities:
 * - Light-DOM render root (no shadow DOM encapsulation).
 * - Observe `document.dir` and reflect it to the host for RTL support.
 * - Provide a safe `defineElement` helper that survives double-registration.
 */
export class BootstrapElement extends LitElement {
  private _dirObserver?: MutationObserver;

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._applyDirection();
    this._dirObserver = new MutationObserver(() => this._applyDirection());
    this._dirObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir'],
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._dirObserver?.disconnect();
    this._dirObserver = undefined;
  }

  private _applyDirection(): void {
    const dir = (document.documentElement.getAttribute('dir') as Direction) || 'ltr';
    if (this.getAttribute('dir') !== dir) this.setAttribute('dir', dir);
  }
}

/**
 * Defines a custom element idempotently.
 * Logs a warning instead of throwing when the tag is already registered
 * (common when multiple consumers import the same component bundle).
 */
export function defineElement(tag: string, ctor: CustomElementConstructor): void {
  if (typeof customElements === 'undefined') return;
  const existing = customElements.get(tag);
  if (existing && existing !== ctor) {
    console.warn(
      `[bootstrap-wc] <${tag}> is already registered by a different constructor. Skipping.`,
    );
    return;
  }
  if (!existing) {
    customElements.define(tag, ctor);
  }
}
