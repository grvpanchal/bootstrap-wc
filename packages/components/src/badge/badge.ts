import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement, type Variant } from '@bootstrap-wc/core';

/**
 * `<bs-badge>` — Bootstrap badge for labels and counts.
 *
 * @slot - Badge content.
 */
export class BsBadge extends BootstrapElement {
  @property({ type: String }) variant: Variant = 'secondary';
  @property({ type: Boolean }) pill = false;
  @property({ type: String }) shape: 'default' | 'pill' = 'default';

  override render() {
    const classes = classMap({
      badge: true,
      [`text-bg-${this.variant}`]: true,
      'rounded-pill': this.pill || this.shape === 'pill',
    });
    return html`<span part="badge" class=${classes}><slot></slot></span>`;
  }
}

defineElement('bs-badge', BsBadge);

declare global {
  interface HTMLElementTagNameMap {
    'bs-badge': BsBadge;
  }
}
