import { defineElement } from '@bootstrap-wc/core';

/**
 * `<bs-form>` — a thin wrapper around a native `<form>`.
 *
 * Wraps its children in a real light-DOM `<form>` so they participate in
 * native form submission, validation, and FormData / `<input>` autofill
 * out of the box. Hoists submit into a single cancellable `bs-submit`
 * event whose `detail.formData` is a fresh snapshot.
 *
 * **Why a light-DOM `<form>`?** Browser autofill heuristics and password
 * managers (Chrome, Safari, Firefox, 1Password, Bitwarden, …) walk the
 * light-DOM tree looking for `<input name="…" autocomplete="…">` inside
 * a `<form>`. They also anchor their autofill UI to the focused
 * light-DOM control. Our `bs-input` / `bs-textarea` / `bs-select` /
 * `bs-range` / `bs-form-check` therefore render their native control
 * into light DOM (Ionic, Adobe Spectrum, Lion, Carbon all do the same)
 * — `bs-form` simply provides the `<form>` ancestor.
 *
 * Implementation detail: extends `HTMLElement` directly (not
 * `LitElement`). When `createRenderRoot()` returns the host (light DOM),
 * Lit's render pipeline replaces the host's contents on every render —
 * which would blow away the `<form>` we just created. The component's
 * DOM is trivial enough that hand-rolling on `HTMLElement` with
 * `attributeChangedCallback` is both simpler and correct.
 *
 * Attributes:
 * - `action`, `method`, `target`, `enctype` — passed through to the
 *   inner `<form>`.
 * - `novalidate` — disable native constraint validation before submit.
 * - `validated` — applies Bootstrap's `.was-validated` state for
 *   validation styling. Set automatically after the first submit unless
 *   `novalidate` is present.
 *
 * Events:
 * - `bs-submit` — fires on submit with `{ detail: { formData, form,
 *   originalEvent } }`. Cancellable — `preventDefault()` stops the
 *   underlying form submission.
 */
export class BsForm extends HTMLElement {
  static observedAttributes = [
    'action',
    'method',
    'target',
    'enctype',
    'novalidate',
    'validated',
  ];

  private _form?: HTMLFormElement;
  private _observer?: MutationObserver;
  private _upgraded = false;

  connectedCallback(): void {
    if (!this._upgraded) {
      this._ensureForm();
      this._upgraded = true;
    }
    this._syncFormAttrs();
    this._form!.addEventListener('submit', this._onSubmit);
    this._observer = new MutationObserver((records) => this._onMutate(records));
    this._observer.observe(this, { childList: true });
  }

  disconnectedCallback(): void {
    this._form?.removeEventListener('submit', this._onSubmit);
    this._observer?.disconnect();
    this._observer = undefined;
  }

  attributeChangedCallback(): void {
    if (this._form) this._syncFormAttrs();
  }

  // Public API ---------------------------------------------------------------

  get action(): string | null { return this.getAttribute('action'); }
  set action(v: string | null) { if (v == null) this.removeAttribute('action'); else this.setAttribute('action', v); }

  get method(): string | null { return this.getAttribute('method'); }
  set method(v: string | null) { if (v == null) this.removeAttribute('method'); else this.setAttribute('method', v); }

  get target(): string | null { return this.getAttribute('target'); }
  set target(v: string | null) { if (v == null) this.removeAttribute('target'); else this.setAttribute('target', v); }

  get enctype(): string | null { return this.getAttribute('enctype'); }
  set enctype(v: string | null) { if (v == null) this.removeAttribute('enctype'); else this.setAttribute('enctype', v); }

  get novalidate(): boolean { return this.hasAttribute('novalidate'); }
  set novalidate(v: boolean) { this.toggleAttribute('novalidate', !!v); }

  get validated(): boolean { return this.hasAttribute('validated'); }
  set validated(v: boolean) { this.toggleAttribute('validated', !!v); }

  /** Resets the inner form and clears the `validated` state. */
  reset(): void {
    this._form?.reset();
    this.validated = false;
  }

  checkValidity(): boolean { return this._form?.checkValidity() ?? true; }
  reportValidity(): boolean { return this._form?.reportValidity() ?? true; }

  /** Returns a fresh FormData snapshot. */
  get formData(): FormData {
    return this._form ? new FormData(this._form) : new FormData();
  }

  /** The native `<form>` instance (read-only after first connect). */
  get nativeForm(): HTMLFormElement | null {
    return this._form ?? null;
  }

  // Light-DOM form maintenance -----------------------------------------------

  private _ensureForm(): void {
    const existing = this.querySelector(':scope > form[data-bs-form-root]');
    if (existing instanceof HTMLFormElement) {
      this._form = existing;
      return;
    }
    const form = document.createElement('form');
    form.setAttribute('data-bs-form-root', '');
    while (this.firstChild) form.appendChild(this.firstChild);
    this.appendChild(form);
    this._form = form;
  }

  private _syncFormAttrs(): void {
    const f = this._form;
    if (!f) return;
    const action = this.getAttribute('action');
    if (action !== null) f.action = action;
    else f.removeAttribute('action');
    const method = this.getAttribute('method');
    if (method !== null) f.method = method;
    else f.removeAttribute('method');
    const target = this.getAttribute('target');
    if (target !== null) f.target = target;
    else f.removeAttribute('target');
    const enctype = this.getAttribute('enctype');
    if (enctype !== null) f.enctype = enctype;
    else f.removeAttribute('enctype');
    f.noValidate = this.novalidate;
    f.classList.toggle('needs-validation', !this.novalidate);
    f.classList.toggle('was-validated', this.validated);
  }

  private _onMutate(records: MutationRecord[]): void {
    if (!this._form) return;
    for (const r of records) {
      if (r.type !== 'childList' || r.target !== this) continue;
      for (const node of Array.from(r.addedNodes)) {
        if (node === this._form) continue;
        if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
          this._form.appendChild(node);
        }
      }
    }
  }

  // Submit -------------------------------------------------------------------

  private _onSubmit = (ev: SubmitEvent) => {
    if (!this.novalidate) {
      this.validated = true;
      this._syncFormAttrs();
      if (this._form && !this._form.checkValidity()) {
        ev.preventDefault();
        return;
      }
    }
    const fd = new FormData(this._form!);
    const bsEvent = new CustomEvent('bs-submit', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { formData: fd, form: this._form, originalEvent: ev },
    });
    const allowed = this.dispatchEvent(bsEvent);
    if (!allowed) ev.preventDefault();
  };
}

defineElement('bs-form', BsForm);

declare global {
  interface HTMLElementTagNameMap {
    'bs-form': BsForm;
  }
}
