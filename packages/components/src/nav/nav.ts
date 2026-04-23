import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

export type NavStyle = 'default' | 'tabs' | 'pills' | 'underline';
export type NavFill = 'none' | 'fill' | 'justified';

/**
 * `<bs-nav>` — Bootstrap nav container (tabs, pills, underline, or plain).
 * Host carries `.nav` + variant classes so `.nav-tabs .nav-link.active`
 * selectors resolve against slotted `<bs-nav-item>` children.
 */
export class BsNav extends BootstrapElement {
  @property({ type: String, attribute: 'nav-style' }) navStyle: NavStyle = 'default';
  @property({ type: String }) fill: NavFill = 'none';
  @property({ type: Boolean }) vertical = false;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'tablist');
  }

  protected override hostClasses(): string {
    const parts = ['nav'];
    // When used inside a <bs-navbar>, also emit `.navbar-nav` so
    // Bootstrap's `.navbar .navbar-nav .nav-link` selectors apply
    // across the slot boundary.
    if (this.closest('bs-navbar')) parts.push('navbar-nav');
    if (this.navStyle === 'tabs') parts.push('nav-tabs');
    if (this.navStyle === 'pills') parts.push('nav-pills');
    if (this.navStyle === 'underline') parts.push('nav-underline');
    if (this.fill === 'fill') parts.push('nav-fill');
    if (this.fill === 'justified') parts.push('nav-justified');
    if (this.vertical) parts.push('flex-column');
    return parts.join(' ');
  }

  override render() {
    return html`<slot></slot>`;
  }
}

defineElement('bs-nav', BsNav);

declare global {
  interface HTMLElementTagNameMap {
    'bs-nav': BsNav;
  }
}
