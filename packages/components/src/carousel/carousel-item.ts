import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

/**
 * `<bs-carousel-item>` — single slide inside `<bs-carousel>`. Host carries
 * `.carousel-item` (+ `.active` and the transient `.carousel-item-next`,
 * `.carousel-item-prev`, `.carousel-item-start`, `.carousel-item-end`
 * classes during animation) so Bootstrap's transform / opacity selectors
 * match across the slot boundary.
 *
 * @slot - Slide content. Pass an `<img class="d-block w-100">` (or freeform
 *        layout) and optionally a `<div class="carousel-caption d-none
 *        d-md-block">…</div>` at the end matching Bootstrap's structure.
 *        If you slot anything into the optional `caption` slot, it is
 *        wrapped in a default `.carousel-caption d-none d-md-block` div for
 *        convenience.
 * @slot caption - Optional caption shorthand: wraps the slot content in
 *        `.carousel-caption d-none d-md-block` automatically.
 */
export class BsCarouselItem extends BootstrapElement {
  @property({ type: Boolean, reflect: true }) active = false;
  /** Internal: applied by parent carousel during animation. */
  @property({ type: String, attribute: 'transition-state', reflect: true })
  transitionState: '' | 'next' | 'prev' | 'start' | 'end' | 'next-start' | 'prev-end' = '';

  protected override hostClasses(): string {
    const parts = ['carousel-item'];
    if (this.active) parts.push('active');
    switch (this.transitionState) {
      case 'next':
        parts.push('carousel-item-next');
        break;
      case 'prev':
        parts.push('carousel-item-prev');
        break;
      case 'next-start':
        parts.push('carousel-item-next', 'carousel-item-start');
        break;
      case 'prev-end':
        parts.push('carousel-item-prev', 'carousel-item-end');
        break;
      case 'start':
        parts.push('carousel-item-start');
        break;
      case 'end':
        parts.push('carousel-item-end');
        break;
    }
    return parts.join(' ');
  }

  override render() {
    const hasCaption = !!this.querySelector('[slot="caption"]');
    return html`<slot></slot>${hasCaption
      ? html`<div class="carousel-caption d-none d-md-block"><slot name="caption"></slot></div>`
      : nothing}`;
  }
}

defineElement('bs-carousel-item', BsCarouselItem);

declare global {
  interface HTMLElementTagNameMap {
    'bs-carousel-item': BsCarouselItem;
  }
}
