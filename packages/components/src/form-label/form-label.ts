import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

/**
 * `<bs-form-label>` — `.form-label` wrapper. Pair with `<bs-input>` via `for`.
 *
 * Use `column` (and optionally `size="sm" | "lg"`) to render the
 * `.col-form-label` variant used in horizontal form layouts. Column sizing
 * classes (`col-form-label-sm`, `col-form-label-lg`) are only emitted when
 * the label is in column mode, matching Bootstrap.
 */
export class BsFormLabel extends BootstrapElement {
  @property({ type: String, attribute: 'for' }) htmlFor?: string;
  @property({ type: Boolean }) required = false;
  /**
   * Render as a `.col-form-label` for use inside a horizontal `.row` form
   * layout. Automatically enabled when `size` is set, since Bootstrap only
   * exposes the `col-form-label-sm` / `col-form-label-lg` sizing classes.
   */
  @property({ type: Boolean }) column = false;
  /** Column label sizing: `sm` → `col-form-label-sm`, `lg` → `col-form-label-lg`. */
  @property({ type: String }) size?: 'sm' | 'lg';

  private get labelClasses(): string {
    const isColumn = this.column || !!this.size;
    const parts = [isColumn ? 'col-form-label' : 'form-label'];
    if (isColumn && (this.size === 'sm' || this.size === 'lg')) {
      parts.push(`col-form-label-${this.size}`);
    }
    return parts.join(' ');
  }

  override render() {
    return html`<label part="label" class=${this.labelClasses} for=${this.htmlFor ?? ''}>
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
