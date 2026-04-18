import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement, type Variant } from '@bootstrap-wc/core';

/**
 * `<bs-list-group-item>` — item inside `<bs-list-group>`. Can be a link via `href`.
 */
export class BsListGroupItem extends BootstrapElement {
  @property({ type: Boolean, reflect: true }) active = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: String }) variant?: Variant;
  @property({ type: String }) href?: string;
  @property({ type: Boolean }) action = false;

  override render() {
    const classes = classMap({
      'list-group-item': true,
      'list-group-item-action': this.action || !!this.href,
      active: this.active,
      disabled: this.disabled,
      [`list-group-item-${this.variant}`]: !!this.variant,
    });
    if (this.href) {
      return html`<li><a
        part="item"
        class=${classes}
        href=${this.href}
        aria-current=${this.active ? 'true' : 'false'}
        aria-disabled=${this.disabled ? 'true' : 'false'}
      ><slot></slot></a></li>`;
    }
    return html`<li
      part="item"
      class=${classes}
      aria-current=${this.active ? 'true' : 'false'}
      aria-disabled=${this.disabled ? 'true' : 'false'}
    ><slot></slot></li>`;
  }
}

defineElement('bs-list-group-item', BsListGroupItem);

declare global {
  interface HTMLElementTagNameMap {
    'bs-list-group-item': BsListGroupItem;
  }
}
