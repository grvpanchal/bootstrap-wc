import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

export type FormTextKind = 'help' | 'valid' | 'invalid';

/**
 * `<bs-form-text>` — `.form-text`, `.valid-feedback`, or `.invalid-feedback`.
 */
export class BsFormText extends BootstrapElement {
  @property({ type: String }) kind: FormTextKind = 'help';

  override render() {
    const classes = classMap({
      'form-text': this.kind === 'help',
      'valid-feedback': this.kind === 'valid',
      'invalid-feedback': this.kind === 'invalid',
    });
    return html`<div part="text" class=${classes}><slot></slot></div>`;
  }
}

defineElement('bs-form-text', BsFormText);

declare global {
  interface HTMLElementTagNameMap {
    'bs-form-text': BsFormText;
  }
}
