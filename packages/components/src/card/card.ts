import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { BootstrapElement, defineElement, type Variant } from '@bootstrap-wc/core';

/**
 * `<bs-card>` — Bootstrap card container.
 *
 * The host IS the `.card`. Bootstrap's `.card`, `.border-{variant}`, and
 * `.text-bg-{variant}` classes are mirrored onto the host (via `hostClasses`)
 * so that:
 *   1. The host fills its grid cell / parent like a native `<div class="card">`
 *      would (display, background, border, radius all picked up from
 *      Bootstrap's own selectors).
 *   2. Bootstrap's `.card > .card-body`, `.card > .card-img-top`, etc.
 *      child-combinator selectors continue to match across the shadow
 *      boundary, because the shadow root has no wrapping element — every
 *      shadow node and every projected child is a flat-tree child of the
 *      host.
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

  protected override hostClasses(): string {
    const parts = ['card'];
    if (this.variant) {
      parts.push(`border-${this.variant}`);
      parts.push(`text-bg-${this.variant}`);
    }
    if (this.textVariant) parts.push(`text-${this.textVariant}`);
    return parts.join(' ');
  }

  override render() {
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
      `;
    }
    return html`
      ${hasImg ? html`<slot name="image"></slot>` : nothing}
      ${hasOverlay
        ? html`<div part="img-overlay" class="card-img-overlay"><slot name="img-overlay"></slot></div>`
        : nothing}
      ${hasHeader ? html`<div part="header" class="card-header"><slot name="header"></slot></div>` : nothing}
      ${body}
      ${hasFooter ? html`<div part="footer" class="card-footer"><slot name="footer"></slot></div>` : nothing}
      ${hasImgBottom ? html`<slot name="image-bottom"></slot>` : nothing}
    `;
  }
}

defineElement('bs-card', BsCard);

declare global {
  interface HTMLElementTagNameMap {
    'bs-card': BsCard;
  }
}
