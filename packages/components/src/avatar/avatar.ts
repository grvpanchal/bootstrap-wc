import { css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement, type Variant } from '@bootstrap-wc/core';

/**
 * Numeric avatar size (matches the bootstrap-essentials `.avatar-{N}` scale).
 * Custom sizes can be set via the `size` attribute as a number (e.g. `40`)
 * or via the `width` / `height` attributes (any CSS length).
 */
export type AvatarSize = 16 | 24 | 32 | 48 | 64 | 96 | 128 | number;

export type AvatarShape = 'circle' | 'rounded' | 'square';

/**
 * `<bs-avatar>` — display a user's profile picture, initials, or icon
 * inside a sized, optionally-rounded box.
 *
 * The component matches the avatar size scale from bootstrap-essentials
 * (`16/24/32/48/64/96/128`) plus arbitrary numeric sizes, and the three
 * BS5 shape variants (`circle`/`rounded`/`square`). When `src` is set the
 * image is rendered with `object-fit: cover`; otherwise the default slot
 * is shown (typically initials or a `<bs-icon>`).
 *
 * @slot default - Placeholder content (initials, icon) when no `src`.
 * @slot status  - A status indicator (e.g. online dot) absolutely positioned
 *                 in the bottom-right corner. Author can place a
 *                 `<bs-badge>` or any element here.
 *
 * @csspart wrapper - The host's inner box (sized via the `size` attribute).
 * @csspart image   - The `<img>` element when `src` is set.
 *
 * @example
 * <bs-avatar size="48" src="/img/u1.jpg" alt="Jane"></bs-avatar>
 * <bs-avatar size="64" shape="circle">JD</bs-avatar>
 * <bs-avatar size="32" variant="success">
 *   <span slot="status" class="bg-success rounded-circle"></span>
 * </bs-avatar>
 */
export class BsAvatar extends BootstrapElement {
  static override styles = css`
    :host {
      display: inline-block;
      vertical-align: middle;
      line-height: 1;
      position: relative;
    }
    [part='wrapper'] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      width: 100%;
      height: 100%;
      background: var(--bs-tertiary-bg, #e9ecef);
      color: var(--bs-body-color, #212529);
      font-weight: 600;
      user-select: none;
    }
    [part='image'] {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    [part='status'] {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 28%;
      height: 28%;
      min-width: 8px;
      min-height: 8px;
      border: 2px solid var(--bs-body-bg, #fff);
      border-radius: 50%;
      box-sizing: border-box;
    }
    /* Variant tinting for initial-only avatars (no image). */
    :host([variant]) [part='wrapper'] {
      background-color: var(--bs-tertiary-bg);
    }
  `;

  /** Size in pixels. Accepts the BSE numeric scale (16/24/32/48/64/96/128) or any number. */
  @property({ type: Number }) size: AvatarSize = 32;

  /** Shape: circle, rounded (4px corners), or square (no rounding). */
  @property({ type: String, reflect: true }) shape: AvatarShape = 'circle';

  /** Image URL. When set, the `<img>` is rendered instead of the default slot. */
  @property({ type: String }) src?: string;

  /** Alt text for the image (required when `src` is set; recommended otherwise via `aria-label`). */
  @property({ type: String }) alt = '';

  /** Tints the wrapper with `bg-{variant}-subtle` + `text-{variant}-emphasis`. */
  @property({ type: String }) variant?: Variant;

  /** Override the host's width (any CSS length). Takes precedence over `size`. */
  @property({ type: String }) width?: string;
  /** Override the host's height (any CSS length). Takes precedence over `size`. */
  @property({ type: String }) height?: string;

  /**
   * Apply size + shape directly to the host. We can't put dynamic values in
   * `static styles` (they're frozen at class-eval time), so write inline
   * styles on the host element via attributeChangedCallback / updated.
   */
  override updated(changed: Map<string, unknown>): void {
    super.updated(changed);
    if (changed.has('size') || changed.has('width') || changed.has('height')) {
      const px = `${this.size}px`;
      this.style.width = this.width ?? px;
      this.style.height = this.height ?? px;
    }
    if (changed.has('shape')) {
      this.style.borderRadius =
        this.shape === 'circle'
          ? '50%'
          : this.shape === 'square'
            ? '0'
            : 'var(--bs-border-radius, .375rem)';
    }
  }

  override render() {
    const wrapperClasses = classMap({
      [`bg-${this.variant}-subtle`]: !!this.variant,
      [`text-${this.variant}-emphasis`]: !!this.variant,
    });

    return html`
      <span part="wrapper" class=${wrapperClasses}>
        ${this.src
          ? html`<img part="image" src=${this.src} alt=${this.alt} loading="lazy" />`
          : html`<slot></slot>`}
      </span>
      <slot name="status"></slot>
    `;
  }
}

defineElement('bs-avatar', BsAvatar);

declare global {
  interface HTMLElementTagNameMap {
    'bs-avatar': BsAvatar;
  }
}
