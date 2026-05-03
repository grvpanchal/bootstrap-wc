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
  /**
   * When set, the shadow renders `<nav aria-label=...><ol class="breadcrumb"
   * part="list"><slot/></ol></nav>` and the host carries no Bootstrap
   * classes itself. Use this when you need a true `<nav>` landmark wrapper
   * (e.g. for the `breadcrumb-chevron` / `breadcrumb-custom` patterns whose
   * CSS lives _outside_ of `<bs-breadcrumb>`'s shadow). Otherwise, the host
   * itself is the `.breadcrumb` container and announces as a navigation
   * landmark via `role="navigation"`.
   */
  @property({ type: Boolean, attribute: 'wrap-in-nav' }) wrapInNav = false;
  /**
   * In `wrap-in-nav` mode, extra classes added to the inner `<ol class=
   * "breadcrumb">`. Use this for chevron / custom variants whose CSS lives
   * outside the shadow but which must live on the `.breadcrumb` element
   * (e.g. `breadcrumb-chevron p-3 bg-body-tertiary rounded-3`). Ignored
   * when `wrap-in-nav` is unset.
   */
  @property({ type: String, attribute: 'list-class' }) listClass = '';

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', this.label);
    if (!this.hasAttribute('role')) this.setAttribute('role', 'navigation');
  }

  override updated(changed: Map<string, unknown>): void {
    super.updated(changed);
    if (changed.has('label')) this.setAttribute('aria-label', this.label);
    if (changed.has('divider')) {
      if (this.divider == null) {
        this.style.removeProperty('--bs-breadcrumb-divider');
      } else {
        // Accept raw CSS values for `--bs-breadcrumb-divider`:
        //  - `url(...)` SVG dividers pass through unquoted
        //  - empty string / `none` renders no divider
        //  - anything else is treated as a literal string and wrapped in quotes
        const v = this.divider;
        const trimmed = v.trim();
        let css: string;
        if (trimmed === '' || trimmed.toLowerCase() === 'none') css = `''`;
        else if (/^url\s*\(/i.test(trimmed)) css = trimmed;
        else if (/^['"].*['"]$/.test(trimmed)) css = trimmed;
        else css = `'${v.replace(/'/g, "\\'")}'`;
        this.style.setProperty('--bs-breadcrumb-divider', css);
      }
    }
  }

  protected override hostClasses(): string {
    return this.wrapInNav ? '' : 'breadcrumb';
  }

  override render() {
    const itemsContent = this.items.length
      ? html`${this.items.map(
          (item) =>
            html`<bs-breadcrumb-item
              ?active=${!!item.active}
              href=${item.href ?? ''}
            >${item.label}</bs-breadcrumb-item>`,
        )}`
      : html`<slot></slot>`;
    if (this.wrapInNav) {
      const listClasses = ['breadcrumb', this.listClass].filter(Boolean).join(' ');
      return html`<ol part="list" class=${listClasses}>${itemsContent}</ol>`;
    }
    return itemsContent;
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
