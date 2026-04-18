import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

export type NavStyle = 'default' | 'tabs' | 'pills' | 'underline';
export type NavFill = 'none' | 'fill' | 'justified';

/**
 * `<bs-nav>` — Bootstrap nav container (tabs, pills, underline, or plain).
 */
export class BsNav extends BootstrapElement {
  @property({ type: String, attribute: 'nav-style' }) navStyle: NavStyle = 'default';
  @property({ type: String }) fill: NavFill = 'none';
  @property({ type: Boolean }) vertical = false;

  override render() {
    const classes = classMap({
      nav: true,
      'nav-tabs': this.navStyle === 'tabs',
      'nav-pills': this.navStyle === 'pills',
      'nav-underline': this.navStyle === 'underline',
      'nav-fill': this.fill === 'fill',
      'nav-justified': this.fill === 'justified',
      'flex-column': this.vertical,
    });
    return html`<ul part="nav" class=${classes} role="tablist"><slot></slot></ul>`;
  }
}

defineElement('bs-nav', BsNav);

declare global {
  interface HTMLElementTagNameMap {
    'bs-nav': BsNav;
  }
}
