import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement, type Size } from '@bootstrap-wc/core';

/**
 * `<bs-button-group>` — groups buttons (horizontally or vertically).
 */
export class BsButtonGroup extends BootstrapElement {
  @property({ type: Boolean }) vertical = false;
  @property({ type: String }) size?: Size;
  @property({ type: String }) label = 'Button group';

  override render() {
    const classes = classMap({
      'btn-group': !this.vertical,
      'btn-group-vertical': this.vertical,
      [`btn-group-${this.size}`]: !!this.size && this.size !== 'md',
    });
    return html`<div part="group" class=${classes} role="group" aria-label=${this.label}>
      <slot></slot>
    </div>`;
  }
}

defineElement('bs-button-group', BsButtonGroup);

declare global {
  interface HTMLElementTagNameMap {
    'bs-button-group': BsButtonGroup;
  }
}
