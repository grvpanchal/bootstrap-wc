import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement, type Size } from '@bootstrap-wc/core';

export type PaginationAlign = 'start' | 'center' | 'end';

/**
 * `<bs-pagination>` — Bootstrap pagination.
 *
 * @slot prev - Custom content for the "Previous" control (e.g. an icon). When
 *   used, `prev-label` is applied as the `aria-label` on the link for a11y.
 * @slot next - Custom content for the "Next" control (e.g. an icon). When
 *   used, `next-label` is applied as the `aria-label` on the link for a11y.
 *
 * @fires bs-page-change - `{detail: {page: number}}` when the user selects a page.
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

  override render() {
    const ulClasses = classMap({
      pagination: true,
      [`pagination-${this.size}`]: !!this.size && this.size !== 'md',
      [`justify-content-${this.align}`]: this.align === 'center' || this.align === 'end',
    });
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
