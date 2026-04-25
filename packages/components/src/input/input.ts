import { html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement, type Size } from '@bootstrap-wc/core';

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
 * `<bs-input>` — Bootstrap text input.
 *
 * **Renders the native `<input>` into LIGHT DOM**, not into a shadow root.
 * This is the same approach Ionic, Adobe Spectrum, Lion, and Carbon's
 * web components take for form controls and is the only way to make
 * browser autofill (Chrome / Safari / Firefox) and password managers
 * (1Password, Bitwarden, …) work reliably for shadow-DOM-based component
 * libraries: their predictors walk the light-DOM tree, and their UI
 * popovers anchor to the focused light-DOM input. A hidden mirror in a
 * sibling never receives focus, so the autofill chip never appears.
 *
 * Form participation is handled natively — the `<input>` lives inside the
 * nearest `<form>` (typically a `<bs-form>`) and is included in
 * `FormData` automatically. No `ElementInternals` plumbing required.
 *
 * @fires bs-input - Mirrors native `input`.
 * @fires bs-change - Mirrors native `change`.
 */
export class BsInput extends BootstrapElement {
  /**
   * Mark as form-associated so the host is a labelable element. When the
   * user clicks `<label for="my-input">` Chrome / Safari look up
   * `#my-input` and call `.focus()` on it; the override below forwards
   * focus to the actual native `<input>` inside.
   */
  static formAssociated = true;

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
  @property({ type: String, attribute: 'inputmode' }) override inputMode = '';

  @query('input') private _input!: HTMLInputElement;

  override focus() {
    this._input?.focus();
  }

  /** Native `<input>` reference, useful for form-validity APIs. */
  get nativeInput(): HTMLInputElement | null {
    return this._input ?? null;
  }

  /** Render into LIGHT DOM so browser autofill predictors see the input. */
  protected override createRenderRoot(): HTMLElement {
    return this;
  }

  /** Make the host invisible to layout — the native input is the visible thing. */
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

  private _onChange = () => {
    this.dispatchEvent(
      new CustomEvent('bs-change', { bubbles: true, composed: true, detail: { value: this.value } }),
    );
  };

  override render() {
    const classes = classMap({
      'form-control': !this.plaintext,
      'form-control-plaintext': this.plaintext,
      'form-control-color': !this.plaintext && this.type === 'color',
      [`form-control-${this.size}`]: !!this.size && this.size !== 'md',
      'is-invalid': this.invalid,
      'is-valid': this.valid,
    });
    return html`<input
      part="input"
      class=${classes}
      type=${this.type}
      .value=${this.value}
      placeholder=${this.placeholder}
      name=${this.name}
      id=${this.id ? `${this.id}__native` : nothing}
      autocomplete=${this.autocomplete ?? nothing}
      inputmode=${this.inputMode || nothing}
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
    />`;
  }
}

defineElement('bs-input', BsInput);

declare global {
  interface HTMLElementTagNameMap {
    'bs-input': BsInput;
  }
}
