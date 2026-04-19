import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

/**
 * `<bs-breadcrumb>` — Bootstrap breadcrumb. Host carries `.breadcrumb` so
 * Bootstrap's `.breadcrumb > .breadcrumb-item` selectors match the slotted
 * items. Pass `items` for data-driven rendering, or place
 * `<bs-breadcrumb-item>` children directly.
 */
export class BsBreadcrumb extends BootstrapElement {
  @property({ type: Array }) items: BreadcrumbItem[] = [];
  @property({ type: String }) label = 'breadcrumb';
  @property({ type: String }) divider?: string;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', this.label);
  }

  override updated(changed: Map<string, unknown>): void {
    super.updated(changed);
    if (changed.has('label')) this.setAttribute('aria-label', this.label);
    if (changed.has('divider')) {
      if (this.divider) this.style.setProperty('--bs-breadcrumb-divider', `'${this.divider}'`);
      else this.style.removeProperty('--bs-breadcrumb-divider');
    }
  }

  protected override hostClasses(): string {
    return 'breadcrumb';
  }

  override render() {
    if (this.items.length) {
      return html`${this.items.map(
        (item) =>
          html`<bs-breadcrumb-item
            ?active=${!!item.active}
            href=${item.href ?? ''}
          >${item.label}</bs-breadcrumb-item>`,
      )}`;
    }
    return html`<slot></slot>`;
  }
}

/**
 * `<bs-breadcrumb-item>` — single crumb. Host carries `.breadcrumb-item`
 * so Bootstrap's divider rule (`.breadcrumb-item + .breadcrumb-item::before`)
 * applies across the slot boundary.
 */
export class BsBreadcrumbItem extends BootstrapElement {
  @property({ type: Boolean, reflect: true }) active = false;
  @property({ type: String }) href?: string;

  override updated(changed: Map<string, unknown>): void {
    super.updated(changed);
    if (changed.has('active')) this.setAttribute('aria-current', this.active ? 'page' : 'false');
  }

  protected override hostClasses(): string {
    return this.active ? 'breadcrumb-item active' : 'breadcrumb-item';
  }

  override render() {
    if (this.active || !this.href) return html`<slot></slot>`;
    return html`<a href=${this.href}><slot></slot></a>`;
  }
}

defineElement('bs-breadcrumb', BsBreadcrumb);
defineElement('bs-breadcrumb-item', BsBreadcrumbItem);

declare global {
  interface HTMLElementTagNameMap {
    'bs-breadcrumb': BsBreadcrumb;
    'bs-breadcrumb-item': BsBreadcrumbItem;
  }
}
