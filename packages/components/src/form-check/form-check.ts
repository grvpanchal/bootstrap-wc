import { html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

export type CheckType = 'checkbox' | 'radio' | 'switch';

/**
 * `<bs-form-check>` — unified checkbox / radio / switch.
 *
 * Renders the native `<input type="checkbox|radio">` into LIGHT DOM so
 * browser autofill, password-manager autofill, and form-association all
 * work the same way they do for plain HTML. See `bs-input` for
 * background on the light-DOM rendering choice.
 *
 * Use `type="switch"` for the toggle style. `type="radio"` requires a
 * `name` attribute to group with sibling radios. Author label content
 * either via the `label` attribute or by placing inline children inside
 * the element.
 */
export class BsFormCheck extends BootstrapElement {
  static formAssociated = true;

  @property({ type: String }) type: CheckType = 'checkbox';
  @property({ type: Boolean, reflect: true }) checked = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean, reflect: true }) indeterminate = false;
  @property({ type: String }) name = '';
  @property({ type: String }) value = 'on';
  @property({ type: String }) autocomplete?: string;
  @property({ type: String }) label?: string;
  @property({ type: String, attribute: 'aria-label' }) override ariaLabel: string | null = null;
  @property({ type: Boolean }) inline = false;
  @property({ type: Boolean }) reverse = false;
  @property({ type: Boolean }) invalid = false;
  @property({ type: Boolean }) valid = false;

  @query('input') private _input!: HTMLInputElement;
  @query('label[part="label"]') private _label!: HTMLLabelElement | null;

  /** Snapshot of author-provided label children, taken before Lit's
   *  light-DOM render replaces them. Re-inserted into the rendered
   *  `<label>` after each render. */
  private _labelContent: Node[] = [];

  protected override createRenderRoot(): HTMLElement {
    return this;
  }

  override connectedCallback(): void {
    if (!this._labelContent.length) {
      this._labelContent = Array.from(this.childNodes).map((n) => n.cloneNode(true));
      // Clear children so Lit's render starts from a known state.
      while (this.firstChild) this.firstChild.remove();
    }
    super.connectedCallback();
    this.style.display = this.style.display || 'contents';
  }

  override focus() {
    this._input?.focus();
  }

  get nativeInput(): HTMLInputElement | null {
    return this._input ?? null;
  }

  override updated(changed: Map<string, unknown>) {
    super.updated?.(changed);
    // `indeterminate` is a DOM property only — no HTML attribute.
    if (this._input && changed.has('indeterminate')) {
      this._input.indeterminate = this.indeterminate;
    } else if (this._input && this.indeterminate && this._input.indeterminate !== true) {
      this._input.indeterminate = true;
    }
    // Re-attach the author's label children after each render.
    if (this._label && this.label === undefined && this._labelContent.length) {
      // Only repopulate if it's currently empty (Lit's render leaves it
      // empty when there's no `${this.label}` text).
      if (!this._label.firstChild) {
        for (const node of this._labelContent) this._label.appendChild(node.cloneNode(true));
      }
    }
  }

  private _onChange = (ev: Event) => {
    const target = ev.target as HTMLInputElement;
    this.checked = target.checked;
    if (this.indeterminate) this.indeterminate = false;
    this.dispatchEvent(
      new CustomEvent('bs-change', {
        bubbles: true,
        composed: true,
        detail: { checked: this.checked, value: this.value },
      }),
    );
  };

  override render() {
    const nativeType = this.type === 'radio' ? 'radio' : 'checkbox';
    const wrapperClasses = classMap({
      'form-check': true,
      'form-switch': this.type === 'switch',
      'form-check-inline': this.inline,
      'form-check-reverse': this.reverse,
    });
    const inputClasses = classMap({
      'form-check-input': true,
      'is-invalid': this.invalid,
      'is-valid': this.valid,
    });
    const id = this.id || `bs-check-${Math.random().toString(36).slice(2, 9)}`;
    const hasLabel = this.label !== undefined || !this.ariaLabel;
    return html`<div part="wrapper" class=${wrapperClasses}>
      <input
        part="input"
        id=${id}
        class=${inputClasses}
        type=${nativeType}
        name=${this.name}
        value=${this.value}
        autocomplete=${this.autocomplete ?? nothing}
        role=${this.type === 'switch' ? 'switch' : nothing}
        ?checked=${this.checked}
        ?disabled=${this.disabled}
        ?required=${this.required}
        aria-invalid=${this.invalid ? 'true' : 'false'}
        aria-label=${this.ariaLabel ?? nothing}
        @change=${this._onChange}
      />
      ${hasLabel
        ? this.label !== undefined
          ? html`<label part="label" class="form-check-label" for=${id}>${this.label}</label>`
          : html`<label part="label" class="form-check-label" for=${id}></label>`
        : nothing}
    </div>`;
  }
}

defineElement('bs-form-check', BsFormCheck);

// Aliases for ergonomics.
export class BsCheckbox extends BsFormCheck {
  override type: CheckType = 'checkbox';
}
defineElement('bs-checkbox', BsCheckbox);

export class BsRadio extends BsFormCheck {
  override type: CheckType = 'radio';
}
defineElement('bs-radio', BsRadio);

export class BsSwitch extends BsFormCheck {
  override type: CheckType = 'switch';
}
defineElement('bs-switch', BsSwitch);

declare global {
  interface HTMLElementTagNameMap {
    'bs-form-check': BsFormCheck;
    'bs-checkbox': BsCheckbox;
    'bs-radio': BsRadio;
    'bs-switch': BsSwitch;
  }
}
