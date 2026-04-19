import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { BootstrapElement, defineElement, type Size } from '@bootstrap-wc/core';

/**
 * `<bs-button-group>` — groups buttons horizontally or vertically. The host
 * element carries `.btn-group` / `.btn-group-vertical` so Bootstrap's
 * `.btn-group > .btn + .btn` sibling selectors match the slotted `<bs-button>`
 * children (whose hosts also carry `.btn`).
 */
export class BsButtonGroup extends BootstrapElement {
  @property({ type: Boolean }) vertical = false;
  @property({ type: String }) size?: Size;
  @property({ type: String }) label = 'Button group';

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'group');
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', this.label);
  }

  override updated(changed: Map<string, unknown>): void {
    super.updated(changed);
    if (changed.has('label')) this.setAttribute('aria-label', this.label);
  }

  protected override hostClasses(): string {
    const parts = [this.vertical ? 'btn-group-vertical' : 'btn-group'];
    if (this.size && this.size !== 'md') parts.push(`btn-group-${this.size}`);
    return parts.join(' ');
  }

  override render() {
    return html`<slot></slot>`;
  }
}

defineElement('bs-button-group', BsButtonGroup);

declare global {
  interface HTMLElementTagNameMap {
    'bs-button-group': BsButtonGroup;
  }
}
