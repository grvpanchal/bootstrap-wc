import { LitElement } from 'lit';
import {
  getSharedSheets,
  getBootstrapCssText,
  getBootstrapSheet,
} from './bootstrap-styles.js';

export type Direction = 'ltr' | 'rtl';

/**
 * Base class for every Bootstrap Web Component.
 *
 * Each instance renders into a **shadow root** and adopts the shared Bootstrap
 * stylesheet via `adoptedStyleSheets`, so `<slot>`s, `::part`s, and style
 * encapsulation all behave the way the Web Components spec intends. The
 * stylesheet is constructed once in the document and shared across every
 * component — there is no per-instance CSS cost.
 *
 * Responsibilities:
 * - Open shadow-DOM render root with Bootstrap styles adopted.
 * - Observe `document.dir` so RTL utilities resolve correctly inside the root.
 */
export class BootstrapElement extends LitElement {
  private _dirObserver?: MutationObserver;

  protected override createRenderRoot(): ShadowRoot {
    const root = super.createRenderRoot() as ShadowRoot;
    const shared = getSharedSheets();
    if (getBootstrapSheet()) {
      // Adopt shared sheets *before* Lit's own `static styles` so component
      // overrides win specificity ties.
      root.adoptedStyleSheets = [...shared, ...root.adoptedStyleSheets];
    } else {
      // Legacy browsers without constructable stylesheets: inline once.
      const style = document.createElement('style');
      style.textContent = getBootstrapCssText();
      root.prepend(style);
    }
    return root;
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
 * Defines a custom element idempotently. Logs a warning instead of throwing
 * when the tag is already registered by a different constructor (common when
 * multiple consumers import the same component bundle).
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
