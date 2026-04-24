import { LitElement } from 'lit';
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
 * Design notes:
 * - The host itself renders into light DOM (no shadow root, no slot) so
 *   the inner `<form>` and the mirror `<input>`s are visible to the
 *   browser's autofill predictor.
 * - Mirror inputs are visually hidden via an off-screen clip rectangle,
 *   NOT `display:none` (which would exclude them from autofill).
 * - The mirror is placed as an immediate sibling of the `<bs-*>` it
 *   mirrors so the browser's "best-name-guess" heuristics pick up any
 *   nearby `<bs-form-label>` context.
 *
 * Attributes:
 * - `action`, `method`, `target`, `enctype` — passed through to the
 *   inner `<form>`.
 * - `novalidate` — disable native constraint validation before submit.
 * - `validated` — applies Bootstrap's `.was-validated` state for
 *   validation styling. Set automatically after the first submit unless
 *   `novalidate` is present.
 * - `no-autofill-mirror` — opt out of the mirror `<input>` injection
 *   (useful in tests or when you've manually wired autofill).
 *
 * Events:
 * - `bs-submit` — fires on submit with `{ detail: { formData, form,
 *   originalEvent } }`. Cancellable — `preventDefault()` stops the
 *   underlying form submission.
 */
export class BsForm extends LitElement {
  static override properties = {
    action: { type: String },
    method: { type: String },
    target: { type: String },
    enctype: { type: String },
    novalidate: { type: Boolean },
    validated: { type: Boolean, reflect: true },
    noAutofillMirror: { type: Boolean, attribute: 'no-autofill-mirror' },
  };

  declare action?: string;
  declare method?: string;
  declare target?: string;
  declare enctype?: string;
  declare novalidate: boolean;
  declare validated: boolean;
  declare noAutofillMirror: boolean;

  private _form?: HTMLFormElement;
  private _observer?: MutationObserver;
  private _mirrors = new Map<Element, HTMLInputElement>();
  private _listeners = new Map<Element, (ev: Event) => void>();
  private _propListeners = new Map<Element, { dispose(): void }>();

  constructor() {
    super();
    this.novalidate = false;
    this.validated = false;
    this.noAutofillMirror = false;
  }

  /** Render into light DOM so browser autofill can see the inner form. */
  protected override createRenderRoot(): HTMLElement {
    return this;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._ensureForm();
    this._syncFormAttrs();
    this._form!.addEventListener('submit', this._onSubmit);
    this._observer = new MutationObserver((records) => this._onMutate(records));
    this._observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['name', 'autocomplete', 'type', 'autocapitalize', 'inputmode'],
    });
    this._syncMirrors();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._form?.removeEventListener('submit', this._onSubmit);
    this._observer?.disconnect();
    this._observer = undefined;
    for (const { dispose } of this._propListeners.values()) dispose();
    this._propListeners.clear();
    this._listeners.clear();
  }

  override update(changed: Map<string, unknown>): void {
    super.update(changed);
    this._syncFormAttrs();
  }

  /** Resets the inner form and clears the `validated` state. */
  reset(): void {
    this._form?.reset();
    this.validated = false;
  }

  /** Runs constraint validation on the inner form. */
  checkValidity(): boolean {
    return this._form?.checkValidity() ?? true;
  }

  reportValidity(): boolean {
    return this._form?.reportValidity() ?? true;
  }

  /** Returns a fresh FormData snapshot (includes form-associated CEs). */
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
    // Move current children into the new form. Skip if the child IS the form
    // itself (shouldn't happen here because we just created it).
    while (this.firstChild) {
      form.appendChild(this.firstChild);
    }
    this.appendChild(form);
    this._form = form;
  }

  private _syncFormAttrs(): void {
    const f = this._form;
    if (!f) return;
    if (this.action !== undefined) f.action = this.action;
    else f.removeAttribute('action');
    if (this.method !== undefined) f.method = this.method;
    else f.removeAttribute('method');
    if (this.target !== undefined) f.target = this.target;
    else f.removeAttribute('target');
    if (this.enctype !== undefined) f.enctype = this.enctype;
    else f.removeAttribute('enctype');
    f.noValidate = !!this.novalidate;
    f.classList.toggle('needs-validation', !this.novalidate);
    f.classList.toggle('was-validated', !!this.validated);
  }

  private _onMutate(records: MutationRecord[]): void {
    // Move any direct children that landed outside the inner form into it,
    // so authors can keep appending children to <bs-form> naturally.
    if (this._form) {
      for (const r of records) {
        if (r.type !== 'childList' || r.target !== this) continue;
        for (const node of Array.from(r.addedNodes)) {
          if (node === this._form) continue;
          if (node.nodeType === Node.ELEMENT_NODE && (node as Element).hasAttribute?.('data-bs-form-mirror')) {
            // Mirrors are managed internally; if one shows up as a direct
            // child of the host for some reason, move it into the form.
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
      for (const { dispose } of this._propListeners.values()) dispose();
      this._mirrors.clear();
      this._listeners.clear();
      this._propListeners.clear();
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
    // Drop mirrors for controls that are gone.
    for (const [ctl, mirror] of this._mirrors) {
      if (!seen.has(ctl)) {
        mirror.remove();
        this._mirrors.delete(ctl);
        const lis = this._listeners.get(ctl);
        if (lis) ctl.removeEventListener('bs-input', lis);
        this._listeners.delete(ctl);
        this._propListeners.get(ctl)?.dispose();
        this._propListeners.delete(ctl);
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
      // Off-screen clip — NOT display:none (hidden inputs are skipped by
      // autofill in Chrome). This preserves focus / autofill eligibility
      // without taking layout space.
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

      // Autofill → component
      const onMirrorInput = () => this._applyMirrorValue(ctl, mirror!);
      mirror.addEventListener('input', onMirrorInput);
      mirror.addEventListener('change', onMirrorInput);

      // Component → mirror (keep them in sync when user types in the real control)
      const onControlInput = () => this._readFromControl(ctl, mirror!);
      ctl.addEventListener('bs-input', onControlInput as EventListener);
      ctl.addEventListener('bs-change', onControlInput as EventListener);
      this._listeners.set(ctl, onControlInput as (ev: Event) => void);

      // Initial copy from component → mirror
      this._readFromControl(ctl, mirror);

      this._propListeners.set(ctl, {
        dispose: () => {
          mirror?.removeEventListener('input', onMirrorInput);
          mirror?.removeEventListener('change', onMirrorInput);
          ctl.removeEventListener('bs-input', onControlInput as EventListener);
          ctl.removeEventListener('bs-change', onControlInput as EventListener);
        },
      });
    }

    if (mirror.name !== name) mirror.name = name;
    if (mirror.autocomplete !== autocomplete) mirror.setAttribute('autocomplete', autocomplete);
    if (mirror.type !== type) mirror.type = type;
  }

  private _mirrorTypeFor(ctl: HTMLElement): string {
    if (ctl.tagName === 'BS-INPUT') {
      const t = ctl.getAttribute('type');
      return t || 'text';
    }
    if (ctl.tagName === 'BS-TEXTAREA') return 'text';
    if (ctl.tagName === 'BS-SELECT') return 'text';
    return 'text';
  }

  private _applyMirrorValue(ctl: Element, mirror: HTMLInputElement): void {
    const v = mirror.value;
    // Use property assignment so Lit reflects to the shadow input.
    (ctl as unknown as { value: string }).value = v;
    // Let the component dispatch its usual bs-input for author code.
    ctl.dispatchEvent(
      new CustomEvent('bs-input', { bubbles: true, composed: true, detail: { value: v, autofilled: true } }),
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
      cancelable: true,
      detail: { formData: fd, form: this._form, originalEvent: ev },
    });
    const allowed = this.dispatchEvent(bsEvent);
    if (!allowed) ev.preventDefault();
  };

  // Lit requires render(); keep it cheap — everything we need is the moved
  // light-DOM children, no shadow template.
  protected override render() {
    return null;
  }
}

defineElement('bs-form', BsForm);

declare global {
  interface HTMLElementTagNameMap {
    'bs-form': BsForm;
  }
}
