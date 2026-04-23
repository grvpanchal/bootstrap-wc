import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { BootstrapElement, defineElement, type Size } from '@bootstrap-wc/core';

/**
 * `<bs-input-group>` — wraps inputs with addons (text, buttons, icons).
 *
 * The host carries `.input-group` so Bootstrap's `.input-group > .form-control`,
 * `.input-group > .form-select`, `.input-group > .btn` and `.input-group-text`
 * sibling selectors resolve across shadow boundaries via slot flattening. The
 * shadow template is just a `<slot></slot>`; authors pass real form controls or
 * slotted `<bs-input-text>`, `<bs-button>`, `<bs-select>` children.
 */
export class BsInputGroup extends BootstrapElement {
  @property({ type: String }) size?: Size;
  @property({ type: Boolean, attribute: 'has-validation' }) hasValidation = false;

  protected override hostClasses(): string {
    const parts = ['input-group'];
    if (this.size && this.size !== 'md') parts.push(`input-group-${this.size}`);
    if (this.hasValidation) parts.push('has-validation');
    return parts.join(' ');
  }

  override render() {
    return html`<slot></slot>`;
  }
}

defineElement('bs-input-group', BsInputGroup);

/**
 * `<bs-input-text>` — an `.input-group-text` addon.
 *
 * The host carries `.input-group-text` so Bootstrap's parent/sibling
 * selectors (`.input-group > .input-group-text`, `.input-group-lg > ...`)
 * match the slotted child. Shadow template is a bare `<slot>`.
 */
export class BsInputText extends BootstrapElement {
  protected override hostClasses(): string {
    return 'input-group-text';
  }

  override render() {
    return html`<slot></slot>`;
  }
}

defineElement('bs-input-text', BsInputText);

declare global {
  interface HTMLElementTagNameMap {
    'bs-input-group': BsInputGroup;
    'bs-input-text': BsInputText;
  }
}
