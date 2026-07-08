import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement, type Size } from '@bootstrap-wc/core';

export type PaginationAlign = 'start' | 'center' | 'end';

/**
 * A single entry in `<bs-pagination>`'s explicit `items` array. Use this
 * when the pagination doesn't fit the "N total pages" numeric model —
 * cursor-based pages, labelled pages (`«`, `»`, "First", "Last"), or
 * bespoke labels + ellipses.
 */
export interface PaginationItemData {
  /** Visible text (page number or a label like `« Previous`). */
  label: string;
  /** `href` for the anchor. Defaults to `#`. */
  href?: string;
  active?: boolean;
  disabled?: boolean;
  /**
   * Render as an ellipsis placeholder (`<span class="page-link">…</span>`) —
   * a non-clickable, disabled cell.
   */
  ellipsis?: boolean;
  /**
   * `aria-label` on the anchor. Handy for icon-only labels ("Next",
   * "Previous", "Go to page 5").
   */
  ariaLabel?: string;
}

/**
 * `<bs-pagination>` — Bootstrap pagination.
 *
 * **Two data models:**
 *
 * 1. **Numeric (default)**: set `total`, `current`, `window` and the
 *    component computes the visible page numbers (with automatic `…`
 *    ellipses) plus prev/next arrows.
 * 2. **Explicit `items` array**: set `items` to a `PaginationItemData[]`
 *    to render bespoke labels (cursor pagination, `« First`, `Last »`,
 *    labelled ranges). When `items` is non-empty, `total` / `current` /
 *    `window` are ignored — and by default so are `prev` / `next` (the
 *    array is the whole nav). Fires `bs-page-change` with the item index.
 *
 * @slot prev - Custom content for the "Previous" control (numeric mode
 *   only). When used, `prev-label` is applied as the `aria-label` on the
 *   link for a11y.
 * @slot next - Custom content for the "Next" control (numeric mode only).
 *   When used, `next-label` is applied as the `aria-label` on the link
 *   for a11y.
 *
 * @fires bs-page-change - `{detail: {page: number}}`. In numeric mode `page`
 *   is 1-based. In `items` mode `page` is the 0-based index into `items`.
 */
export class BsPagination extends BootstrapElement {
  @property({ type: Number }) total = 1;
  @property({ type: Number }) current = 1;
  @property({ type: Number }) window = 2;
  @property({ type: String }) size?: Size;
  @property({ type: String }) align: PaginationAlign = 'start';
  @property({ type: Boolean, attribute: 'no-nav' }) noNav = false;
  @property({ type: String, attribute: 'prev-label' }) prevLabel = 'Previous';
  @property({ type: String, attribute: 'next-label' }) nextLabel = 'Next';
  /**
   * Explicit page-item array override. When non-empty, `total` /
   * `current` / `window` are ignored and the component renders each item
   * exactly as described (including bespoke labels, ellipses, and
   * per-item `active` / `disabled` states).
   */
  @property({ type: Array }) items: PaginationItemData[] = [];

  private _hasPrevSlot = false;
  private _hasNextSlot = false;

  private _go = (page: number) => (ev: Event) => {
    ev.preventDefault();
    if (page < 1 || page > this.total || page === this.current) return;
    this.current = page;
    this.dispatchEvent(
      new CustomEvent('bs-page-change', { bubbles: true, composed: true, detail: { page } }),
    );
  };

  private _pagesToShow(): (number | '...')[] {
    const out: (number | '...')[] = [];
    const w = this.window;
    const last = this.total;
    const cur = this.current;
    const start = Math.max(1, cur - w);
    const end = Math.min(last, cur + w);
    if (start > 1) {
      out.push(1);
      if (start > 2) out.push('...');
    }
    for (let i = start; i <= end; i++) out.push(i);
    if (end < last) {
      if (end < last - 1) out.push('...');
      out.push(last);
    }
    return out;
  }

  private _onSlotChange(name: 'prev' | 'next') {
    return (ev: Event) => {
      const slot = ev.target as HTMLSlotElement;
      const hasContent = slot.assignedNodes({ flatten: true }).some((n) => {
        if (n.nodeType === Node.ELEMENT_NODE) return true;
        return !!(n.textContent && n.textContent.trim());
      });
      if (name === 'prev' && this._hasPrevSlot !== hasContent) {
        this._hasPrevSlot = hasContent;
        this.requestUpdate();
      } else if (name === 'next' && this._hasNextSlot !== hasContent) {
        this._hasNextSlot = hasContent;
        this.requestUpdate();
      }
    };
  }

  private _goIndex = (index: number, item: PaginationItemData) => (ev: Event) => {
    ev.preventDefault();
    if (item.disabled || item.ellipsis || item.active) return;
    this.dispatchEvent(
      new CustomEvent('bs-page-change', {
        bubbles: true,
        composed: true,
        detail: { page: index, item },
      }),
    );
  };

  override render() {
    const ulClasses = classMap({
      pagination: true,
      [`pagination-${this.size}`]: !!this.size && this.size !== 'md',
      [`justify-content-${this.align}`]: this.align === 'center' || this.align === 'end',
    });
    // Explicit items[] mode: the array IS the whole nav; no auto-computed
    // pages, no prev/next arrows (users can bake those into their items).
    if (this.items && this.items.length) {
      return html`
        <nav part="nav" aria-label="pagination">
          <ul part="list" class=${ulClasses}>
            ${this.items.map((item, i) => {
              const li = classMap({
                'page-item': true,
                active: !!item.active,
                disabled: !!item.disabled || !!item.ellipsis,
              });
              if (item.ellipsis) {
                return html`<li class=${li}>
                  <span class="page-link">${item.label || '…'}</span>
                </li>`;
              }
              return html`<li class=${li}>
                <a
                  class="page-link"
                  href=${item.href ?? '#'}
                  aria-current=${item.active ? 'page' : 'false'}
                  aria-label=${item.ariaLabel ?? nothing}
                  @click=${this._goIndex(i, item)}
                  >${item.label}</a
                >
              </li>`;
            })}
          </ul>
        </nav>
      `;
    }
    const pages = this._pagesToShow();
    const prevDisabled = this.current === 1;
    const nextDisabled = this.current === this.total;
    return html`
      <nav part="nav" aria-label="pagination">
        <ul part="list" class=${ulClasses}>
          ${this.noNav
            ? nothing
            : html`<li class="page-item ${prevDisabled ? 'disabled' : ''}">
                <a
                  class="page-link"
                  href="#"
                  aria-label=${this._hasPrevSlot ? this.prevLabel : nothing}
                  @click=${this._go(this.current - 1)}
                  ><slot name="prev" @slotchange=${this._onSlotChange('prev')}
                    >${this.prevLabel}</slot
                  ></a
                >
              </li>`}
          ${pages.map((p) =>
            p === '...'
              ? html`<li class="page-item disabled"><span class="page-link">…</span></li>`
              : html`<li class="page-item ${p === this.current ? 'active' : ''}">
                  <a
                    class="page-link"
                    href="#"
                    aria-current=${p === this.current ? 'page' : 'false'}
                    @click=${this._go(p)}
                  >${p}</a>
                </li>`,
          )}
          ${this.noNav
            ? nothing
            : html`<li class="page-item ${nextDisabled ? 'disabled' : ''}">
                <a
                  class="page-link"
                  href="#"
                  aria-label=${this._hasNextSlot ? this.nextLabel : nothing}
                  @click=${this._go(this.current + 1)}
                  ><slot name="next" @slotchange=${this._onSlotChange('next')}
                    >${this.nextLabel}</slot
                  ></a
                >
              </li>`}
        </ul>
      </nav>
    `;
  }
}

defineElement('bs-pagination', BsPagination);

declare global {
  interface HTMLElementTagNameMap {
    'bs-pagination': BsPagination;
  }
}
