import { LitElement } from 'lit';
import {
  getSharedSheets,
  getBootstrapCssText,
  getBootstrapSheet,
  injectBootstrapIntoDocument,
} from './bootstrap-styles.js';

export type Direction = 'ltr' | 'rtl';

/**
 * Base class for every Bootstrap Web Component.
 *
 * Renders into an open shadow root with Bootstrap's CSS adopted, AND applies
 * Bootstrap classes to the HOST element (via `hostClasses()` subclass hook)
 * so Bootstrap's parent/sibling selectors — e.g. `.btn-group > .btn + .btn`
 * or `.list-group-item + .list-group-item` — continue to match across shadow
 * boundaries through slot flattening. Bootstrap's stylesheet is also injected
 * into the host document once, so those document-scope selectors apply to
 * component hosts that live in light DOM.
 *
 * Responsibilities:
 * - Shadow-DOM render root (defaults to open).
 * - Adopted + document-level Bootstrap stylesheet.
 * - `hostClasses()` subclass hook for host-level Bootstrap class management.
 * - Direction observer so RTL utilities resolve.
 */
export class BootstrapElement extends LitElement {
  private _dirObserver?: MutationObserver;
  private _appliedHostClasses: string[] = [];

  protected override createRenderRoot(): ShadowRoot {
    const root = super.createRenderRoot() as ShadowRoot;
    const shared = getSharedSheets();
    if (getBootstrapSheet()) {
      root.adoptedStyleSheets = [...shared, ...root.adoptedStyleSheets];
    } else {
      const style = document.createElement('style');
      style.textContent = getBootstrapCssText();
      root.prepend(style);
    }
    return root;
  }

  /**
   * Subclasses override to return a space-separated list of Bootstrap classes
   * that should be mirrored onto the host element (`.btn`, `.btn-group`,
   * `.list-group-item`, etc.). Called during every update; classes added or
   * removed based on diff vs. the last call, so subclass reactive state
   * (variants, active flags) can be reflected cleanly without stomping any
   * classes the author put on the host manually.
   */
  protected hostClasses(): string {
    return '';
  }

  override connectedCallback(): void {
    super.connectedCallback();
    injectBootstrapIntoDocument();
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

  override updated(changed: Map<string, unknown>): void {
    super.updated(changed);
    this._reflectHostClasses();
  }

  private _reflectHostClasses(): void {
    const desired = this.hostClasses().split(/\s+/).filter(Boolean);
    for (const cls of this._appliedHostClasses) {
      if (!desired.includes(cls)) this.classList.remove(cls);
    }
    for (const cls of desired) this.classList.add(cls);
    this._appliedHostClasses = desired;
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
