import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

/**
 * `<bs-breadcrumb>` — Bootstrap breadcrumb nav.
 *
 * Pass items via the `items` property or place `<bs-breadcrumb-item>` / `<li>` children in the default slot.
 */
export class BsBreadcrumb extends BootstrapElement {
  @property({ type: Array }) items: BreadcrumbItem[] = [];
  @property({ type: String }) label = 'breadcrumb';
  @property({ type: String }) divider?: string;

  override render() {
    const style = this.divider ? `--bs-breadcrumb-divider: '${this.divider}';` : '';
    if (this.items.length) {
      return html`
        <nav part="nav" aria-label=${this.label} style=${style}>
          <ol class="breadcrumb">
            ${this.items.map(
              (item) => html`<li
                class="breadcrumb-item ${item.active ? 'active' : ''}"
                aria-current=${item.active ? 'page' : 'false'}
              >
                ${item.active || !item.href ? item.label : html`<a href=${item.href}>${item.label}</a>`}
              </li>`,
            )}
          </ol>
        </nav>
      `;
    }
    return html`
      <nav part="nav" aria-label=${this.label} style=${style}>
        <ol class="breadcrumb"><slot></slot></ol>
      </nav>
    `;
  }
}

defineElement('bs-breadcrumb', BsBreadcrumb);

declare global {
  interface HTMLElementTagNameMap {
    'bs-breadcrumb': BsBreadcrumb;
  }
}
