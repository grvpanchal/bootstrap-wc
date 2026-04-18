import { html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, FormAssociated, defineElement, type Size } from '@bootstrap-wc/core';

export type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'search'
  | 'tel'
  | 'url'
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'month'
  | 'week'
  | 'color';

/**
 * `<bs-input>` — form-associated Bootstrap text input.
 *
 * @fires bs-input - Mirrors native `input`.
 * @fires bs-change - Mirrors native `change`.
 */
export class BsInput extends FormAssociated(BootstrapElement) {
  @property({ type: String }) type: InputType = 'text';
  @property({ type: String }) value = '';
  @property({ type: String }) placeholder = '';
  @property({ type: String }) name = '';
  @property({ type: String }) autocomplete?: string;
  @property({ type: String }) size?: Size;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) readonly = false;
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean }) invalid = false;
  @property({ type: Boolean }) valid = false;
  @property({ type: Boolean }) plaintext = false;
  @property({ type: String }) pattern?: string;
  @property({ type: String }) min?: string;
  @property({ type: String }) max?: string;
  @property({ type: String }) step?: string;
  @property({ type: Number }) minlength?: number;
  @property({ type: Number }) maxlength?: number;

  @query('input') private _input!: HTMLInputElement;

  override focus() {
    this._input?.focus();
  }

  private _onInput = (ev: InputEvent) => {
    const target = ev.target as HTMLInputElement;
    this.value = target.value;
    this._setValue(this.value);
    this.dispatchEvent(new CustomEvent('bs-input', { bubbles: true, composed: true, detail: { value: this.value } }));
  };

  private _onChange = () => {
    this.dispatchEvent(new CustomEvent('bs-change', { bubbles: true, composed: true, detail: { value: this.value } }));
  };

  override render() {
    const classes = classMap({
      'form-control': !this.plaintext,
      'form-control-plaintext': this.plaintext,
      [`form-control-${this.size}`]: !!this.size && this.size !== 'md',
      'is-invalid': this.invalid,
      'is-valid': this.valid,
    });
    return html`
      <input
        part="input"
        class=${classes}
        type=${this.type}
        .value=${this.value}
        placeholder=${this.placeholder}
        name=${this.name}
        autocomplete=${this.autocomplete ?? nothing}
        pattern=${this.pattern ?? nothing}
        min=${this.min ?? nothing}
        max=${this.max ?? nothing}
        step=${this.step ?? nothing}
        minlength=${this.minlength ?? nothing}
        maxlength=${this.maxlength ?? nothing}
        ?disabled=${this.disabled}
        ?readonly=${this.readonly}
        ?required=${this.required}
        aria-invalid=${this.invalid ? 'true' : 'false'}
        @input=${this._onInput}
        @change=${this._onChange}
      />
    `;
  }
}

defineElement('bs-input', BsInput);

declare global {
  interface HTMLElementTagNameMap {
    'bs-input': BsInput;
  }
}
