import { html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, FormAssociated, defineElement, type Size } from '@bootstrap-wc/core';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * `<bs-select>` — form-associated Bootstrap `.form-select`.
 *
 * Use `options` for data-driven rendering, or slot `<option>` children
 * directly (they will be moved into the internal `<select>`).
 */
export class BsSelect extends FormAssociated(BootstrapElement) {
  @property({ type: String }) value = '';
  @property({ type: String }) name = '';
  @property({ type: Array }) options: SelectOption[] = [];
  @property({ type: String }) size?: Size;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean }) multiple = false;
  @property({ type: Boolean }) invalid = false;
  @property({ type: Boolean }) valid = false;

  @query('select') private _select!: HTMLSelectElement;

  override focus() {
    this._select?.focus();
  }

  override willUpdate(changed: Map<string, unknown>) {
    if (changed.has('value')) this._setValue(this.value);
  }

  private _onChange = (ev: Event) => {
    const target = ev.target as HTMLSelectElement;
    this.value = target.value;
    this._setValue(this.value);
    this.dispatchEvent(new CustomEvent('bs-change', { bubbles: true, composed: true, detail: { value: this.value } }));
  };

  override render() {
    const classes = classMap({
      'form-select': true,
      [`form-select-${this.size}`]: !!this.size && this.size !== 'md',
      'is-invalid': this.invalid,
      'is-valid': this.valid,
    });
    return html`
      <select
        part="select"
        class=${classes}
        name=${this.name}
        ?disabled=${this.disabled}
        ?required=${this.required}
        ?multiple=${this.multiple}
        aria-invalid=${this.invalid ? 'true' : 'false'}
        @change=${this._onChange}
        .value=${this.value}
      >
        ${this.options.length
          ? this.options.map(
              (o) => html`<option value=${o.value} ?disabled=${o.disabled ?? false} ?selected=${o.value === this.value}>
                ${o.label}
              </option>`,
            )
          : nothing}
        <slot></slot>
      </select>
    `;
  }
}

defineElement('bs-select', BsSelect);

declare global {
  interface HTMLElementTagNameMap {
    'bs-select': BsSelect;
  }
}
