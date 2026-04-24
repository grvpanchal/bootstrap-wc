import { defineElement } from '@bootstrap-wc/core';

const CONTROL_TAGS = new Set(['BS-INPUT', 'BS-TEXTAREA', 'BS-SELECT']);

/**
 * `<bs-form>` — a thin wrapper around a native `<form>` that solves the
 * browser-autofill gap for shadow-DOM form controls.
 *
 * Browsers' autofill heuristics walk the light-DOM tree looking for
 * `<input name="…" autocomplete="…">` elements inside a `<form>`. Because
 * our `bs-input` / `bs-textarea` / `bs-select` render their native inputs
 * *inside* a shadow root, Chrome / Safari / Firefox never see them and
 * never offer to autofill. `bs-form` patches that by:
 *
 * 1. Hosting a real light-DOM `<form>` around its slotted children (it
 *    moves initial children into the form on first connect and maintains
 *    membership via a MutationObserver).
 * 2. Scanning for every form-associated `<bs-*>` that declares `name` +
 *    `autocomplete` and injecting a **hidden mirror `<input>`** into the
 *    form for each. The mirror carries the same `name`, `autocomplete`,
 *    and `type` so browser autofill prediction runs normally. When the
 *    browser fills the mirror, its value is piped back into the real
 *    `<bs-*>` via its `value` / `checked` property.
 * 3. Hoisting submit into a single custom `bs-submit` event whose
 *    `detail.formData` already includes every form-associated CE via
 *    `ElementInternals`, plus the author's native `<input>`s.
 *
 * Implementation notes:
 * - Extends `HTMLElement` directly (not `LitElement`). We need complete
 *   control of light-DOM children — Lit's render pipeline replaces the
 *   host's contents when rendering into light DOM, which would blow away
 *   the `<form>` we create. Since the component's DOM is structurally
 *   trivial (just a form wrapper + mirror inputs), hand-rolling is both
 *   simpler and correct.
 * - Mirror inputs are visually hidden via an off-screen clip rectangle,
 *   NOT `display:none` (which would exclude them from autofill).
 */
export class BsForm extends HTMLElement {
  static observedAttributes = [
    'action',
    'method',
    'target',
    'enctype',
    'novalidate',
    'validated',
    'no-autofill-mirror',
  ];

  private _form?: HTMLFormElement;
  private _observer?: MutationObserver;
  private _mirrors = new Map<Element, HTMLInputElement>();
  private _listenerDisposers = new Map<Element, () => void>();
  private _upgraded = false;

  connectedCallback(): void {
    if (!this._upgraded) {
      this._ensureForm();
      this._upgraded = true;
    }
    this._syncFormAttrs();
    this._form!.addEventListener('submit', this._onSubmit);
    this._observer = new MutationObserver((records) => this._onMutate(records));
    this._observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['name', 'autocomplete', 'type'],
    });
    this._syncMirrors();
  }

  disconnectedCallback(): void {
    this._form?.removeEventListener('submit', this._onSubmit);
    this._observer?.disconnect();
    this._observer = undefined;
    for (const dispose of this._listenerDisposers.values()) dispose();
    this._listenerDisposers.clear();
  }

  attributeChangedCallback(name: string, _old: string | null, _next: string | null): void {
    if (!this._form) return;
    this._syncFormAttrs();
    if (name === 'no-autofill-mirror') this._syncMirrors();
  }

  // ---------------------------------------------------------------------------
  // Public API (method / property accessors)
  // ---------------------------------------------------------------------------

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

  get noAutofillMirror(): boolean { return this.hasAttribute('no-autofill-mirror'); }
  set noAutofillMirror(v: boolean) { this.toggleAttribute('no-autofill-mirror', !!v); }

  reset(): void {
    this._form?.reset();
    this.validated = false;
  }

  checkValidity(): boolean {
    return this._form?.checkValidity() ?? true;
  }

  reportValidity(): boolean {
    return this._form?.reportValidity() ?? true;
  }

  get formData(): FormData {
    return this._form ? new FormData(this._form) : new FormData();
  }

  // ---------------------------------------------------------------------------
  // Light-DOM form maintenance
  // ---------------------------------------------------------------------------

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
    if (this._form) {
      for (const r of records) {
        if (r.type !== 'childList' || r.target !== this) continue;
        for (const node of Array.from(r.addedNodes)) {
          if (node === this._form) continue;
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            (node as Element).hasAttribute?.('data-bs-form-mirror')
          ) {
            this._form.appendChild(node);
            continue;
          }
          if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
            this._form.appendChild(node);
          }
        }
      }
    }
    this._syncMirrors();
  }

  // ---------------------------------------------------------------------------
  // Autofill mirror inputs
  // ---------------------------------------------------------------------------

  private _syncMirrors(): void {
    if (!this._form) return;
    if (this.noAutofillMirror) {
      for (const mirror of this._mirrors.values()) mirror.remove();
      for (const dispose of this._listenerDisposers.values()) dispose();
      this._mirrors.clear();
      this._listenerDisposers.clear();
      return;
    }

    const seen = new Set<Element>();
    const controls = this._form.querySelectorAll(
      'bs-input[autocomplete], bs-textarea[autocomplete], bs-select[autocomplete]',
    );
    for (const ctl of Array.from(controls)) {
      if (!CONTROL_TAGS.has(ctl.tagName)) continue;
      if (!ctl.getAttribute('name')) continue;
      seen.add(ctl);
      this._ensureMirrorFor(ctl as HTMLElement);
    }
    for (const [ctl, mirror] of this._mirrors) {
      if (!seen.has(ctl)) {
        mirror.remove();
        this._mirrors.delete(ctl);
        this._listenerDisposers.get(ctl)?.();
        this._listenerDisposers.delete(ctl);
      }
    }
  }

  private _ensureMirrorFor(ctl: HTMLElement): void {
    let mirror = this._mirrors.get(ctl);
    const name = ctl.getAttribute('name') || '';
    const autocomplete = ctl.getAttribute('autocomplete') || '';
    const type = this._mirrorTypeFor(ctl);

    if (!mirror) {
      mirror = document.createElement('input');
      mirror.setAttribute('data-bs-form-mirror', '');
      mirror.tabIndex = -1;
      mirror.setAttribute('aria-hidden', 'true');
      mirror.style.position = 'absolute';
      mirror.style.width = '1px';
      mirror.style.height = '1px';
      mirror.style.padding = '0';
      mirror.style.margin = '-1px';
      mirror.style.overflow = 'hidden';
      mirror.style.clip = 'rect(0, 0, 0, 0)';
      mirror.style.whiteSpace = 'nowrap';
      mirror.style.border = '0';
      ctl.after(mirror);
      this._mirrors.set(ctl, mirror);

      const onMirrorInput = () => this._applyMirrorValue(ctl, mirror!);
      mirror.addEventListener('input', onMirrorInput);
      mirror.addEventListener('change', onMirrorInput);

      const onControlInput = () => this._readFromControl(ctl, mirror!);
      ctl.addEventListener('bs-input', onControlInput as EventListener);
      ctl.addEventListener('bs-change', onControlInput as EventListener);

      this._readFromControl(ctl, mirror);

      this._listenerDisposers.set(ctl, () => {
        mirror!.removeEventListener('input', onMirrorInput);
        mirror!.removeEventListener('change', onMirrorInput);
        ctl.removeEventListener('bs-input', onControlInput as EventListener);
        ctl.removeEventListener('bs-change', onControlInput as EventListener);
      });
    }

    if (mirror.name !== name) mirror.name = name;
    if (mirror.getAttribute('autocomplete') !== autocomplete) {
      mirror.setAttribute('autocomplete', autocomplete);
    }
    if (mirror.type !== type) mirror.type = type;
  }

  private _mirrorTypeFor(ctl: HTMLElement): string {
    if (ctl.tagName === 'BS-INPUT') {
      const t = ctl.getAttribute('type');
      return t || 'text';
    }
    return 'text';
  }

  private _applyMirrorValue(ctl: Element, mirror: HTMLInputElement): void {
    const v = mirror.value;
    (ctl as unknown as { value: string }).value = v;
    ctl.dispatchEvent(
      new CustomEvent('bs-input', {
        bubbles: true,
        composed: true,
        detail: { value: v, autofilled: true },
      }),
    );
  }

  private _readFromControl(ctl: Element, mirror: HTMLInputElement): void {
    const v = (ctl as unknown as { value?: string }).value;
    if (typeof v === 'string' && mirror.value !== v) mirror.value = v;
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

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
