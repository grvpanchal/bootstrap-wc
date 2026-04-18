import type { LitElement } from 'lit';

type Constructor<T = object> = new (...args: any[]) => T;

export interface FormAssociatedInterface {
  readonly form: HTMLFormElement | null;
  readonly validity: ValidityState;
  readonly validationMessage: string;
  readonly willValidate: boolean;
  checkValidity(): boolean;
  reportValidity(): boolean;
  /** @internal */
  _setValue(value: string): void;
  /** @internal */
  _setValidity(flags: ValidityStateFlags, message?: string, anchor?: HTMLElement): void;
}

/**
 * Mixin that turns a LitElement into a form-associated custom element.
 * Requires the host to set `static formAssociated = true` and call
 * `this._internals = this.attachInternals()` in its constructor.
 *
 * Usage:
 *   class MyInput extends FormAssociated(BootstrapElement) {
 *     static formAssociated = true;
 *     ...
 *   }
 */
export const FormAssociated = <T extends Constructor<LitElement>>(superClass: T) => {
  class FormAssociatedElement extends superClass {
    static readonly formAssociated: boolean = true;

    protected _internals!: ElementInternals;
    protected _value = '';

    constructor(...args: any[]) {
      super(...args);
      if (typeof this.attachInternals === 'function') {
        this._internals = this.attachInternals();
      }
    }

    get form(): HTMLFormElement | null {
      return this._internals?.form ?? null;
    }

    get validity(): ValidityState {
      return this._internals?.validity ?? ({} as ValidityState);
    }

    get validationMessage(): string {
      return this._internals?.validationMessage ?? '';
    }

    get willValidate(): boolean {
      return this._internals?.willValidate ?? false;
    }

    checkValidity(): boolean {
      return this._internals?.checkValidity() ?? true;
    }

    reportValidity(): boolean {
      return this._internals?.reportValidity() ?? true;
    }

    _setValue(value: string): void {
      this._value = value;
      this._internals?.setFormValue(value);
    }

    _setValidity(flags: ValidityStateFlags, message?: string, anchor?: HTMLElement): void {
      this._internals?.setValidity(flags, message, anchor);
    }

    formResetCallback(): void {
      this._value = '';
      this._internals?.setFormValue('');
    }
  }
  return FormAssociatedElement as unknown as T & Constructor<FormAssociatedInterface>;
};
