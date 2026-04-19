import { html } from 'lit';
import { property, query } from 'lit/decorators.js';
import { BootstrapElement, FormAssociated, defineElement } from '@bootstrap-wc/core';

/**
 * `<bs-range>` — form-associated Bootstrap range slider.
 */
export class BsRange extends FormAssociated(BootstrapElement) {
  @property({ type: String }) value = '50';
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 100;
  @property({ type: Number }) step = 1;
  @property({ type: String }) name = '';
  @property({ type: Boolean, reflect: true }) disabled = false;

  @query('input') private _input!: HTMLInputElement;

  override focus() {
    this._input?.focus();
  }

  override willUpdate(changed: Map<string, unknown>) {
    if (changed.has('value')) this._setValue(this.value);
  }

  private _onInput = (ev: InputEvent) => {
    const target = ev.target as HTMLInputElement;
    this.value = target.value;
    this._setValue(this.value);
    this.dispatchEvent(new CustomEvent('bs-input', { bubbles: true, composed: true, detail: { value: this.value } }));
  };

  override render() {
    return html`
      <input
        part="input"
        class="form-range"
        type="range"
        name=${this.name}
        min=${this.min}
        max=${this.max}
        step=${this.step}
        .value=${this.value}
        ?disabled=${this.disabled}
        @input=${this._onInput}
      />
    `;
  }
}

defineElement('bs-range', BsRange);

declare global {
  interface HTMLElementTagNameMap {
    'bs-range': BsRange;
  }
}
