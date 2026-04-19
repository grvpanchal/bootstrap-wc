import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

/**
 * `<bs-nav-item>` — nav link / tab item. Host carries `.nav-link` (and
 * `.active` / `.disabled`) so Bootstrap's `.nav-tabs .nav-link.active`
 * descendant selectors match across the slot boundary.
 */
export class BsNavItem extends BootstrapElement {
  @property({ type: Boolean, reflect: true }) active = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: String }) href = '#';
  @property({ type: String, attribute: 'controls' }) controls?: string;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'tab');
    this.addEventListener('click', this._onClick);
    this.addEventListener('keydown', this._onKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('click', this._onClick);
    this.removeEventListener('keydown', this._onKeydown);
  }

  override updated(changed: Map<string, unknown>): void {
    super.updated(changed);
    if (changed.has('active')) {
      this.setAttribute('aria-selected', this.active ? 'true' : 'false');
      this.tabIndex = this.active ? 0 : -1;
    }
    if (changed.has('disabled')) this.setAttribute('aria-disabled', this.disabled ? 'true' : 'false');
    if (changed.has('controls')) {
      if (this.controls) this.setAttribute('aria-controls', this.controls);
      else this.removeAttribute('aria-controls');
    }
  }

  protected override hostClasses(): string {
    const parts = ['nav-link'];
    if (this.active) parts.push('active');
    if (this.disabled) parts.push('disabled');
    return parts.join(' ');
  }

  private _onClick = (ev: MouseEvent) => {
    if (this.disabled) {
      ev.preventDefault();
      return;
    }
    if (this.href && this.href !== '#' && ev.target === this) window.location.href = this.href;
  };

  private _onKeydown = (ev: KeyboardEvent) => {
    if (this.disabled) return;
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      this.click();
    }
  };

  override render() {
    return html`<slot></slot>${nothing}`;
  }
}

defineElement('bs-nav-item', BsNavItem);

declare global {
  interface HTMLElementTagNameMap {
    'bs-nav-item': BsNavItem;
  }
}
