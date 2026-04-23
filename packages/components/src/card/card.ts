import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement, type Variant } from '@bootstrap-wc/core';

/**
 * `<bs-card>` — Bootstrap card container.
 *
 * @slot - Card body content.
 * @slot header - Rendered in `.card-header`.
 * @slot footer - Rendered in `.card-footer`.
 * @slot image - Image rendered above the body (`.card-img-top`).
 * @slot image-bottom - Image rendered after the footer (`.card-img-bottom`).
 * @slot img-overlay - Content rendered inside `.card-img-overlay` on top of the image.
 */
export class BsCard extends BootstrapElement {
  @property({ type: String }) variant?: Variant;
  @property({ type: String, attribute: 'text-variant' }) textVariant?: Variant;
  @property({ type: String, attribute: 'heading' }) heading?: string;
  @property({ type: String }) subtitle?: string;
  @property({ type: Boolean, attribute: 'no-body' }) noBody = false;
  @property({ type: Boolean }) horizontal = false;

  override render() {
    const classes = classMap({
      card: true,
      [`border-${this.variant}`]: !!this.variant,
      [`bg-${this.variant}`]: !!this.variant,
      [`text-bg-${this.variant}`]: !!this.variant,
      [`text-${this.textVariant}`]: !!this.textVariant,
    });
    const hasImg = !!this.querySelector('[slot="image"]');
    const hasImgBottom = !!this.querySelector('[slot="image-bottom"]');
    const hasHeader = !!this.querySelector('[slot="header"]');
    const hasFooter = !!this.querySelector('[slot="footer"]');
    const hasOverlay = !!this.querySelector('[slot="img-overlay"]');
    const body = this.noBody
      ? html`<slot></slot>`
      : html`<div part="body" class="card-body">
          ${this.heading ? html`<h5 class="card-title">${this.heading}</h5>` : nothing}
          ${this.subtitle
            ? html`<h6 class="card-subtitle mb-2 text-body-secondary">${this.subtitle}</h6>`
            : nothing}
          <slot></slot>
        </div>`;
    if (this.horizontal) {
      // Row-based horizontal layout. Image slot becomes left column, body + header/footer stack on the right.
      return html`
        <div part="card" class=${classes}>
          <div class="row g-0">
            ${hasImg
              ? html`<div class="col-md-4"><slot name="image"></slot></div>`
              : nothing}
            <div class=${hasImg ? 'col-md-8' : 'col'}>
              ${hasHeader
                ? html`<div part="header" class="card-header"><slot name="header"></slot></div>`
                : nothing}
              ${body}
              ${hasFooter
                ? html`<div part="footer" class="card-footer"><slot name="footer"></slot></div>`
                : nothing}
            </div>
          </div>
        </div>
      `;
    }
    return html`
      <div part="card" class=${classes}>
        ${hasImg ? html`<slot name="image"></slot>` : nothing}
        ${hasOverlay
          ? html`<div part="img-overlay" class="card-img-overlay"><slot name="img-overlay"></slot></div>`
          : nothing}
        ${hasHeader ? html`<div part="header" class="card-header"><slot name="header"></slot></div>` : nothing}
        ${body}
        ${hasFooter ? html`<div part="footer" class="card-footer"><slot name="footer"></slot></div>` : nothing}
        ${hasImgBottom ? html`<slot name="image-bottom"></slot>` : nothing}
      </div>
    `;
  }
}

defineElement('bs-card', BsCard);

declare global {
  interface HTMLElementTagNameMap {
    'bs-card': BsCard;
  }
}
