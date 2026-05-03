import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, FocusTrapController, defineElement } from '@bootstrap-wc/core';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';
export type ModalFullscreen =
  | boolean
  | ''
  | 'sm-down'
  | 'md-down'
  | 'lg-down'
  | 'xl-down'
  | 'xxl-down';

// Accepts: absent → false, empty string / "true" → true, breakpoint token
// (e.g. "sm-down") → string. Mirrors Bootstrap's `.modal-fullscreen` vs
// `.modal-fullscreen-sm-down` class set.
const fullscreenConverter = {
  fromAttribute(value: string | null): ModalFullscreen {
    if (value === null) return false;
    if (value === '' || value === 'true') return true;
    if (value === 'false') return false;
    return value as ModalFullscreen;
  },
  toAttribute(value: ModalFullscreen): string | null {
    if (value === false || value == null) return null;
    if (value === true) return '';
    return String(value);
  },
};

/**
 * `<bs-modal>` — Bootstrap modal dialog with backdrop, focus trap, and ESC close.
 *
 * @slot - Modal body.
 * @slot title - Rendered inside `.modal-title`.
 * @slot footer - Rendered inside `.modal-footer`.
 * @fires bs-show / bs-shown / bs-hide / bs-hidden
 */
export class BsModal extends BootstrapElement {
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: String, attribute: 'heading' }) heading?: string;
  @property({ type: String }) size: ModalSize = 'md';
  @property({ type: Boolean }) centered = false;
  @property({ type: Boolean }) scrollable = false;
  @property({ type: Boolean, attribute: 'static-backdrop' }) staticBackdrop = false;
  @property({ type: Boolean, attribute: 'no-backdrop' }) noBackdrop = false;
  @property({ type: Boolean, attribute: 'no-close-on-escape' }) noCloseOnEscape = false;
  @property({ type: Boolean, attribute: 'no-close-button' }) noCloseButton = false;
  /**
   * Fullscreen mode.
   *   - `true`            → `.modal-fullscreen` (always fullscreen)
   *   - `"sm-down"` etc.  → `.modal-fullscreen-{breakpoint}-down`
   *   - `false`/absent    → regular modal
   */
  @property({ converter: fullscreenConverter, reflect: true }) fullscreen: ModalFullscreen = false;
  /**
   * Render the dialog inline (not fixed-positioned) for static docs previews.
   * Adds `.position-static .d-block` and suppresses the backdrop so the
   * markup can sit in normal document flow. Has no effect on focus trap or
   * show/hide lifecycle.
   */
  @property({ type: Boolean, attribute: 'static-preview' }) staticPreview = false;
  /**
   * Alias for `static-preview`. Both `static-display` and `static-preview`
   * map to the same internal state — the static, no-backdrop, no-focus-trap
   * render mode.
   */
  @property({ type: Boolean, attribute: 'static-display' }) staticDisplay = false;
  /** Extra classes for the outer `.modal` element (e.g. `modal-sheet bg-body-secondary p-4`). */
  @property({ type: String, attribute: 'modal-class' }) modalClass = '';
  /** Extra classes for the `.modal-content` wrapper (e.g. `rounded-4 shadow`). */
  @property({ type: String, attribute: 'content-class' }) contentClass = '';
  /** Extra classes for the `.modal-header` (e.g. `border-bottom-0`). */
  @property({ type: String, attribute: 'header-class' }) headerClass = '';
  /** Extra classes for the `.modal-body` (e.g. `py-0 p-4 text-center`). */
  @property({ type: String, attribute: 'body-class' }) bodyClass = '';
  /** Extra classes for the `.modal-footer` (e.g. `flex-column gap-2 border-top-0`). */
  @property({ type: String, attribute: 'footer-class' }) footerClass = '';

  @state() private _animating = false;

  @query('.modal') private _modal!: HTMLElement;
  @query('.modal-dialog') private _dialog!: HTMLElement;

  private _focusTrap = new FocusTrapController(this);
  private _prevOverflow = '';
  private _originalParent: Node | null = null;
  private _originalNextSibling: Node | null = null;

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this._onKeydown);
    if (this.staticPreview) this._applyStaticAttrs();
  }

  private _applyStaticAttrs(): void {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'dialog');
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '-1');
    this.setAttribute('aria-modal', 'false');
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._onKeydown);
    this._focusTrap.deactivate();
    // NB: don't reset `_originalParent` here — a teleport-to-body triggers a
    // disconnect → reconnect pair while we're mid-move, and we still want to
    // be able to restore the original location on close.
    if (!this._teleporting) this._restoreBody();
  }

  private _teleporting = false;

  /**
   * Move the host into `document.body` so the `.modal` overlay escapes every
   * ancestor stacking context (Starlight's `.main-pane` uses `isolation:
   * isolate`, for example, which otherwise caps the z-index of a modal
   * rendered in-place). Static-preview modals intentionally stay inline.
   */
  private _teleportToBody(): void {
    if (this.staticPreview) return;
    if (this.parentElement === document.body) return;
    this._originalParent = this.parentNode;
    this._originalNextSibling = this.nextSibling;
    this._teleporting = true;
    document.body.appendChild(this);
    this._teleporting = false;
  }

  /** Restore the host to its author-placed position in the DOM. */
  private _restoreFromBody(): void {
    if (!this._originalParent) return;
    const parent = this._originalParent;
    const next = this._originalNextSibling;
    this._originalParent = null;
    this._originalNextSibling = null;
    this._teleporting = true;
    if (next && next.parentNode === parent) parent.insertBefore(this, next);
    else parent.appendChild(this);
    this._teleporting = false;
  }

  override willUpdate(changed: Map<string, unknown>) {
    super.willUpdate(changed);
    // Mirror the static-display alias onto staticPreview (and vice versa)
    // so authors can use either attribute interchangeably.
    if (changed.has('staticDisplay') && this.staticDisplay !== this.staticPreview) {
      this.staticPreview = this.staticDisplay;
    } else if (changed.has('staticPreview') && this.staticPreview !== this.staticDisplay) {
      this.staticDisplay = this.staticPreview;
    }
  }

  override updated(changed: Map<string, unknown>) {
    super.updated(changed);
    if (changed.has('open')) {
      if (this.open) void this._onOpen();
      else void this._onClose();
    }
  }

  show() {
    this.open = true;
  }
  hide() {
    this.open = false;
  }
  toggle() {
    this.open = !this.open;
  }

  private async _onOpen() {
    this.dispatchEvent(new CustomEvent('bs-show', { bubbles: true, composed: true, cancelable: true }));
    this._animating = true;
    this._prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    this._teleportToBody();
    await this.updateComplete;
    await new Promise((r) => requestAnimationFrame(r));
    this._animating = false;
    this.requestUpdate();
    await this.updateComplete;
    if (this._dialog) this._focusTrap.activate(this._dialog);
    this.dispatchEvent(new CustomEvent('bs-shown', { bubbles: true, composed: true }));
  }

  private async _onClose() {
    this.dispatchEvent(new CustomEvent('bs-hide', { bubbles: true, composed: true, cancelable: true }));
    this._focusTrap.deactivate();
    this._animating = true;
    await this.updateComplete;
    await new Promise((r) => setTimeout(r, 150));
    this._animating = false;
    this._restoreBody();
    this._restoreFromBody();
    this.dispatchEvent(new CustomEvent('bs-hidden', { bubbles: true, composed: true }));
  }

  private _restoreBody() {
    document.body.style.overflow = this._prevOverflow;
    document.body.classList.remove('modal-open');
  }

  private _onKeydown = (ev: KeyboardEvent) => {
    if (!this.open || this.noCloseOnEscape) return;
    if (ev.key === 'Escape') this.hide();
  };

  /** Convert a `"foo bar"` string into a `{foo: true, bar: true}` map. */
  private _extraClasses(s: string): Record<string, boolean> {
    const out: Record<string, boolean> = {};
    if (!s) return out;
    for (const c of s.split(/\s+/)) if (c) out[c] = true;
    return out;
  }

  /**
   * In `static-display` mode the host IS the visible `.modal` chrome — mirror
   * `.modal.show.position-static.d-block` (plus any `modal-class` extras)
   * onto the host so layout rules in the page can target it.
   */
  protected override hostClasses(): string {
    if (!this.staticPreview) return '';
    const parts = ['modal', 'show', 'position-static', 'd-block'];
    if (this.modalClass) parts.push(this.modalClass);
    return parts.join(' ');
  }

  private _onBackdropClick = (ev: MouseEvent) => {
    if (this.staticPreview) return;
    if (ev.target === this._modal && !this.staticBackdrop) this.hide();
  };

  override render() {
    const fullscreenClass =
      this.fullscreen === true
        ? 'modal-fullscreen'
        : typeof this.fullscreen === 'string' && this.fullscreen
          ? `modal-fullscreen-${this.fullscreen}`
          : '';
    const dialogClasses = classMap({
      'modal-dialog': true,
      [`modal-${this.size}`]: this.size !== 'md',
      'modal-dialog-centered': this.centered,
      'modal-dialog-scrollable': this.scrollable,
      [fullscreenClass]: !!fullscreenClass,
    });
    const isShown = this.staticPreview || (this.open && !this._animating);
    const modalClasses = classMap({
      modal: true,
      fade: !this.staticPreview,
      show: isShown,
      'position-static': this.staticPreview,
      'd-block': this.staticPreview,
      ...this._extraClasses(this.modalClass),
    });
    const hasHeader = !!this.heading || this.querySelector('[slot="title"]') !== null || !this.noCloseButton;
    const hasFooter = this.querySelector('[slot="footer"]') !== null;
    const showBackdrop =
      !this.noBackdrop && !this.staticPreview && (this.open || this._animating);
    // Only force `display: block` when the modal is actually visible; otherwise
    // leave it to Bootstrap's default (`.modal { display: none; }`) so closed
    // modals don't render an invisible full-viewport overlay.
    const modalStyle = isShown || this._animating ? 'display: block' : 'display: none';
    // Inline shadow stylesheet that replays Bootstrap's `.modal-footer > *`
    // gap rule for slotted children — Bootstrap's selector targets direct
    // children of the shadow `.modal-footer` and so only sees the `<slot>`,
    // not the light-DOM buttons projected through it.
    const slottedFooterMargin = html`<style>
      .modal-footer > slot::slotted(*) {
        margin: calc(var(--bs-modal-footer-gap, 0.5rem) * 0.5);
      }
    </style>`;
    const dialogTree = html`${slottedFooterMargin}<div part="dialog" class=${dialogClasses} role="document">
      <div part="content" class=${classMap({ 'modal-content': true, ...this._extraClasses(this.contentClass) })}>
        ${hasHeader
          ? html`<div part="header" class=${classMap({ 'modal-header': true, ...this._extraClasses(this.headerClass) })}>
              <h1 class="modal-title fs-5">${this.heading ?? html`<slot name="title"></slot>`}</h1>
              ${this.noCloseButton
                ? nothing
                : html`<button
                    type="button"
                    class="btn-close"
                    aria-label="Close"
                    @click=${() => this.hide()}
                  ></button>`}
            </div>`
          : nothing}
        <div part="body" class=${classMap({ 'modal-body': true, ...this._extraClasses(this.bodyClass) })}><slot></slot></div>
        ${hasFooter
          ? html`<div part="footer" class=${classMap({ 'modal-footer': true, ...this._extraClasses(this.footerClass) })}><slot name="footer"></slot></div>`
          : nothing}
      </div>
    </div>`;
    if (this.staticPreview) {
      // Host already carries `.modal.show.position-static.d-block` (+ modalClass)
      // via hostClasses() — render only the inner dialog tree to avoid a
      // duplicated `.modal` wrapper in shadow.
      return dialogTree;
    }
    return html`
      ${showBackdrop
        ? html`<div part="backdrop" class="modal-backdrop fade ${this.open && !this._animating ? 'show' : ''}"></div>`
        : nothing}
      <div
        part="modal"
        class=${modalClasses}
        tabindex="-1"
        role="dialog"
        aria-modal=${this.staticPreview ? 'false' : 'true'}
        aria-hidden=${!isShown ? 'true' : 'false'}
        style=${modalStyle}
        @click=${this._onBackdropClick}
      >
        ${dialogTree}
      </div>
    `;
  }
}

defineElement('bs-modal', BsModal);

declare global {
  interface HTMLElementTagNameMap {
    'bs-modal': BsModal;
  }
}
