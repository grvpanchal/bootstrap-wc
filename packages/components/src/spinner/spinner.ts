import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement, type Variant } from '@bootstrap-wc/core';

export type SpinnerType = 'border' | 'grow';
export type SpinnerSize = 'sm' | 'md';

/**
 * `<bs-spinner>` — Bootstrap spinner (border or grow variant).
 */
export class BsSpinner extends BootstrapElement {
  @property({ type: String }) type: SpinnerType = 'border';
  @property({ type: String }) variant: Variant = 'primary';
  @property({ type: String }) size: SpinnerSize = 'md';
  @property({ type: String }) label = 'Loading...';

  override render() {
    const classes = classMap({
      [`spinner-${this.type}`]: true,
      [`spinner-${this.type}-sm`]: this.size === 'sm',
      [`text-${this.variant}`]: true,
    });
    return html`
      <div part="spinner" class=${classes} role="status">
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
