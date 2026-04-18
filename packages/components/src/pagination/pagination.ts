import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement, type Size } from '@bootstrap-wc/core';

/**
 * `<bs-pagination>` — Bootstrap pagination.
 *
 * @fires bs-page-change - `{detail: {page: number}}` when the user selects a page.
 */
export class BsPagination extends BootstrapElement {
  @property({ type: Number }) total = 1;
  @property({ type: Number }) current = 1;
  @property({ type: Number }) window = 2;
  @property({ type: String }) size?: Size;
  @property({ type: Boolean, attribute: 'no-nav' }) noNav = false;
  @property({ type: String, attribute: 'prev-label' }) prevLabel = 'Previous';
  @property({ type: String, attribute: 'next-label' }) nextLabel = 'Next';

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

  override render() {
    const ulClasses = classMap({
      pagination: true,
      [`pagination-${this.size}`]: !!this.size && this.size !== 'md',
    });
    const pages = this._pagesToShow();
    return html`
      <nav part="nav" aria-label="pagination">
        <ul part="list" class=${ulClasses}>
          ${this.noNav
            ? nothing
            : html`<li class="page-item ${this.current === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" @click=${this._go(this.current - 1)}>${this.prevLabel}</a>
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
            : html`<li class="page-item ${this.current === this.total ? 'disabled' : ''}">
                <a class="page-link" href="#" @click=${this._go(this.current + 1)}>${this.nextLabel}</a>
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
