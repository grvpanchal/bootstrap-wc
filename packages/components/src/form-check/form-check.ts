import { html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, FormAssociated, defineElement } from '@bootstrap-wc/core';

export type CheckType = 'checkbox' | 'radio' | 'switch';

/**
 * `<bs-form-check>` — unified checkbox / radio / switch form control.
 *
 * Use `type="switch"` for the toggle style. `type="radio"` requires a `name`
 * attribute to group with sibling radios.
 */
export class BsFormCheck extends FormAssociated(BootstrapElement) {
  @property({ type: String }) type: CheckType = 'checkbox';
  @property({ type: Boolean, reflect: true }) checked = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: String }) name = '';
  @property({ type: String }) value = 'on';
  @property({ type: String }) label?: string;
  @property({ type: Boolean }) inline = false;
  @property({ type: Boolean }) reverse = false;
  @property({ type: Boolean }) invalid = false;
  @property({ type: Boolean }) valid = false;

  @query('input') private _input!: HTMLInputElement;

  override focus() {
    this._input?.focus();
  }

  override willUpdate(changed: Map<string, unknown>) {
    if (changed.has('checked') || changed.has('value')) {
      this._setValue(this.checked ? this.value : '');
    }
  }

  private _onChange = (ev: Event) => {
    const target = ev.target as HTMLInputElement;
    this.checked = target.checked;
    this._setValue(this.checked ? this.value : '');
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
    return html`
      <div part="wrapper" class=${wrapperClasses}>
        <input
          part="input"
          id=${id}
          class=${inputClasses}
          type=${nativeType}
          name=${this.name}
          value=${this.value}
          role=${this.type === 'switch' ? 'switch' : nothing}
          ?checked=${this.checked}
          ?disabled=${this.disabled}
          ?required=${this.required}
          aria-invalid=${this.invalid ? 'true' : 'false'}
          @change=${this._onChange}
        />
        ${this.label !== undefined
          ? html`<label part="label" class="form-check-label" for=${id}>${this.label}<slot></slot></label>`
          : html`<label part="label" class="form-check-label" for=${id}><slot></slot></label>`}
      </div>
    `;
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
