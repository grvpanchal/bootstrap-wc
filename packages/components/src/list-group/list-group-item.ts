import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { BootstrapElement, defineElement, type Variant } from '@bootstrap-wc/core';

/**
 * `<bs-list-group-item>` — item inside `<bs-list-group>`. The host carries
 * `.list-group-item` (+ variant / active / disabled modifiers) so Bootstrap's
 * sibling selectors like `.list-group-item + .list-group-item` match across
 * the slot boundary. When `href` is set the host acts as a link.
 */
export class BsListGroupItem extends BootstrapElement {
  @property({ type: Boolean, reflect: true }) active = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: String }) variant?: Variant;
  @property({ type: String }) href?: string;
  @property({ type: Boolean }) action = false;

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.href && !this.hasAttribute('role')) this.setAttribute('role', 'link');
    this.addEventListener('click', this._onClick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('click', this._onClick);
  }

  override updated(changed: Map<string, unknown>): void {
    super.updated(changed);
    if (changed.has('active')) this.setAttribute('aria-current', this.active ? 'true' : 'false');
    if (changed.has('disabled')) this.setAttribute('aria-disabled', this.disabled ? 'true' : 'false');
  }

  protected override hostClasses(): string {
    const parts = ['list-group-item'];
    if (this.action || this.href) parts.push('list-group-item-action');
    if (this.active) parts.push('active');
    if (this.disabled) parts.push('disabled');
    if (this.variant) parts.push(`list-group-item-${this.variant}`);
    return parts.join(' ');
  }

  private _onClick = (ev: MouseEvent) => {
    if (this.disabled) {
      ev.preventDefault();
      return;
    }
    if (this.href && ev.target === this) window.location.href = this.href;
  };

  override render() {
    return html`<slot></slot>${nothing}`;
  }
}

defineElement('bs-list-group-item', BsListGroupItem);

declare global {
  interface HTMLElementTagNameMap {
    'bs-list-group-item': BsListGroupItem;
  }
}
