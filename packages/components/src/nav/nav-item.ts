import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

/**
 * `<bs-nav-item>` — nav link / tab item.
 */
export class BsNavItem extends BootstrapElement {
  @property({ type: Boolean, reflect: true }) active = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: String }) href = '#';
  @property({ type: String, attribute: 'controls' }) controls?: string;

  override render() {
    const classes = classMap({
      'nav-link': true,
      active: this.active,
      disabled: this.disabled,
    });
    return html`<li class="nav-item" role="presentation">
      <a
        part="link"
        class=${classes}
        href=${this.href}
        role="tab"
        aria-selected=${this.active ? 'true' : 'false'}
        aria-controls=${this.controls ?? ''}
        aria-disabled=${this.disabled ? 'true' : 'false'}
        tabindex=${this.active ? '0' : '-1'}
      ><slot></slot></a>
    </li>`;
  }
}

defineElement('bs-nav-item', BsNavItem);

declare global {
  interface HTMLElementTagNameMap {
    'bs-nav-item': BsNavItem;
  }
}
