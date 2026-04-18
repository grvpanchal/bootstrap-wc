import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

/**
 * `<bs-form-label>` — `.form-label` wrapper. Pair with `<bs-input>` via `for`.
 */
export class BsFormLabel extends BootstrapElement {
  @property({ type: String, attribute: 'for' }) htmlFor?: string;
  @property({ type: Boolean }) required = false;

  override render() {
    return html`<label part="label" class="form-label" for=${this.htmlFor ?? ''}>
      <slot></slot>
      ${this.required ? html`<span class="text-danger" aria-hidden="true">*</span>` : ''}
    </label>`;
  }
}

defineElement('bs-form-label', BsFormLabel);

declare global {
  interface HTMLElementTagNameMap {
    'bs-form-label': BsFormLabel;
  }
}
