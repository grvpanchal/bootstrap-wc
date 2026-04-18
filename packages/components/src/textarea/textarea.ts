import { html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, FormAssociated, defineElement, type Size } from '@bootstrap-wc/core';

/**
 * `<bs-textarea>` — form-associated Bootstrap textarea.
 */
export class BsTextarea extends FormAssociated(BootstrapElement) {
  @property({ type: String }) value = '';
  @property({ type: String }) placeholder = '';
  @property({ type: String }) name = '';
  @property({ type: Number }) rows = 3;
  @property({ type: String }) size?: Size;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) readonly = false;
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean }) invalid = false;
  @property({ type: Boolean }) valid = false;
  @property({ type: Number }) minlength?: number;
  @property({ type: Number }) maxlength?: number;

  @query('textarea') private _textarea!: HTMLTextAreaElement;

  override focus() {
    this._textarea?.focus();
  }

  private _onInput = (ev: InputEvent) => {
    const target = ev.target as HTMLTextAreaElement;
    this.value = target.value;
    this._setValue(this.value);
    this.dispatchEvent(new CustomEvent('bs-input', { bubbles: true, composed: true, detail: { value: this.value } }));
  };

  private _onChange = () => {
    this.dispatchEvent(new CustomEvent('bs-change', { bubbles: true, composed: true, detail: { value: this.value } }));
  };

  override render() {
    const classes = classMap({
      'form-control': true,
      [`form-control-${this.size}`]: !!this.size && this.size !== 'md',
      'is-invalid': this.invalid,
      'is-valid': this.valid,
    });
    return html`
      <textarea
        part="textarea"
        class=${classes}
        rows=${this.rows}
        placeholder=${this.placeholder}
        name=${this.name}
        minlength=${this.minlength ?? nothing}
        maxlength=${this.maxlength ?? nothing}
        ?disabled=${this.disabled}
        ?readonly=${this.readonly}
        ?required=${this.required}
        aria-invalid=${this.invalid ? 'true' : 'false'}
        @input=${this._onInput}
        @change=${this._onChange}
        .value=${this.value}
      ></textarea>
    `;
  }
}

defineElement('bs-textarea', BsTextarea);

declare global {
  interface HTMLElementTagNameMap {
    'bs-textarea': BsTextarea;
  }
}
