import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement, type Size } from '@bootstrap-wc/core';

/**
 * `<bs-input-group>` — wraps inputs with addons (text, buttons, icons).
 *
 * Use `<bs-input-text>` slotted children for text addons, or pass raw Bootstrap
 * markup (`<span class="input-group-text">`).
 */
export class BsInputGroup extends BootstrapElement {
  @property({ type: String }) size?: Size;
  @property({ type: Boolean, attribute: 'has-validation' }) hasValidation = false;

  override render() {
    const classes = classMap({
      'input-group': true,
      [`input-group-${this.size}`]: !!this.size && this.size !== 'md',
      'has-validation': this.hasValidation,
    });
    return html`<div part="group" class=${classes}><slot></slot></div>`;
  }
}

defineElement('bs-input-group', BsInputGroup);

/** `<bs-input-text>` — a `.input-group-text` span wrapper. */
export class BsInputText extends BootstrapElement {
  override render() {
    return html`<span part="text" class="input-group-text"><slot></slot></span>`;
  }
}

defineElement('bs-input-text', BsInputText);

declare global {
  interface HTMLElementTagNameMap {
    'bs-input-group': BsInputGroup;
    'bs-input-text': BsInputText;
  }
}
