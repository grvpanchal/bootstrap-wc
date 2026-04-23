import { css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { BootstrapElement, defineElement, type Variant } from '@bootstrap-wc/core';

export type SpinnerType = 'border' | 'grow';
export type SpinnerSize = 'sm' | 'md';

/**
 * `<bs-spinner>` — Bootstrap spinner (border or grow variant).
 *
 * For a custom size, set the `width` and `height` attributes (any CSS
 * length, e.g. `width="3rem" height="3rem"`). These are forwarded as
 * inline styles on the inner spinner element and override the
 * `spinner-{type}` defaults.
 */
export class BsSpinner extends BootstrapElement {
  // The inner `.spinner-*` element is `display: inline-block` with its own
  // intrinsic size. Without a host display value, the host collapses to a
  // line-height of the surrounding inline context and the inner spinner
  // overflows. Match `.spinner-border`'s default layout on the host.
  static override styles = css`
    :host {
      display: inline-block;
      vertical-align: var(--bs-spinner-vertical-align, -0.125em);
    }
  `;

  @property({ type: String }) type: SpinnerType = 'border';
  @property({ type: String }) variant?: Variant;
  @property({ type: String }) size: SpinnerSize = 'md';
  @property({ type: String }) label = 'Loading...';
  @property({ type: String }) width?: string;
  @property({ type: String }) height?: string;

  override render() {
    const classes = classMap({
      [`spinner-${this.type}`]: true,
      [`spinner-${this.type}-sm`]: this.size === 'sm',
      [`text-${this.variant}`]: !!this.variant,
    });
    const styles = styleMap({
      ...(this.width ? { width: this.width } : {}),
      ...(this.height ? { height: this.height } : {}),
    });
    return html`
      <div part="spinner" class=${classes} style=${styles} role="status">
        <span class="visually-hidden">${this.label}</span>
      </div>
    `;
  }
}

defineElement('bs-spinner', BsSpinner);

declare global {
  interface HTMLElementTagNameMap {
    'bs-spinner': BsSpinner;
  }
}
