import { html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

/**
 * `<bs-range>` — Bootstrap range slider. Renders the native
 * `<input type="range">` into LIGHT DOM so form participation is
 * automatic. See `bs-input` for the rationale.
 */
export class BsRange extends BootstrapElement {
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

  get nativeInput(): HTMLInputElement | null {
    return this._input ?? null;
  }

  protected override createRenderRoot(): HTMLElement {
    return this;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.style.display = this.style.display || 'contents';
  }

  private _onInput = (ev: InputEvent) => {
    const target = ev.target as HTMLInputElement;
    this.value = target.value;
    this.dispatchEvent(
      new CustomEvent('bs-input', { bubbles: true, composed: true, detail: { value: this.value } }),
    );
  };

  override render() {
    return html`<input
      part="input"
      class="form-range"
      type="range"
      name=${this.name}
      id=${this.id ? `${this.id}__native` : nothing}
      min=${this.min}
      max=${this.max}
      step=${this.step}
      .value=${this.value}
      ?disabled=${this.disabled}
      @input=${this._onInput}
    />`;
  }
}

defineElement('bs-range', BsRange);

declare global {
  interface HTMLElementTagNameMap {
    'bs-range': BsRange;
  }
}
