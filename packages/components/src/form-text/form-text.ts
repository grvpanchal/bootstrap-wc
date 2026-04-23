import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

export type FormTextKind = 'help' | 'valid' | 'invalid';

/**
 * `<bs-form-text>` — `.form-text`, `.valid-feedback`, or `.invalid-feedback`.
 *
 * The host element IS the form text. Bootstrap's `.form-text` /
 * `.valid-feedback` / `.invalid-feedback` classes are applied to the host so
 * that authors can reference it via `aria-describedby` using the host's `id`,
 * and so that parent layouts (e.g. `.row > .col-auto`) can size it correctly
 * across the shadow boundary. By default the host renders as a block (matching
 * Bootstrap's block-level help-text example). Set `inline` to keep it inline
 * for layouts that place it next to an input (e.g. inside a flex row).
 *
 * @slot - Form text content.
 */
export class BsFormText extends BootstrapElement {
  @property({ type: String }) kind: FormTextKind = 'help';
  @property({ type: Boolean, reflect: true }) inline = false;

  protected override hostClasses(): string {
    if (this.kind === 'valid') return 'valid-feedback';
    if (this.kind === 'invalid') return 'invalid-feedback';
    return 'form-text';
  }

  override render() {
    return html`<style>
        :host {
          display: block;
        }
        :host([inline]) {
          display: inline;
        }
      </style>
      <slot></slot>`;
  }
}

defineElement('bs-form-text', BsFormText);

declare global {
  interface HTMLElementTagNameMap {
    'bs-form-text': BsFormText;
  }
}
