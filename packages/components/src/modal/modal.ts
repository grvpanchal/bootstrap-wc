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

  @state() private _animating = false;

  @query('.modal') private _modal!: HTMLElement;
  @query('.modal-dialog') private _dialog!: HTMLElement;

  private _focusTrap = new FocusTrapController(this);
  private _prevOverflow = '';

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this._onKeydown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._onKeydown);
    this._focusTrap.deactivate();
    this._restoreBody();
  }

  override updated(changed: Map<string, unknown>) {
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
    this.dispatchEvent(new CustomEvent('bs-show', { bubbles: true, cancelable: true }));
    this._animating = true;
    this._prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    await this.updateComplete;
    await new Promise((r) => requestAnimationFrame(r));
    this._animating = false;
    this.requestUpdate();
    await this.updateComplete;
    if (this._dialog) this._focusTrap.activate(this._dialog);
    this.dispatchEvent(new CustomEvent('bs-shown', { bubbles: true }));
  }

  private async _onClose() {
    this.dispatchEvent(new CustomEvent('bs-hide', { bubbles: true, cancelable: true }));
    this._focusTrap.deactivate();
    this._animating = true;
    await this.updateComplete;
    await new Promise((r) => setTimeout(r, 150));
    this._animating = false;
    this._restoreBody();
    this.dispatchEvent(new CustomEvent('bs-hidden', { bubbles: true }));
  }

  private _restoreBody() {
    document.body.style.overflow = this._prevOverflow;
    document.body.classList.remove('modal-open');
  }

  private _onKeydown = (ev: KeyboardEvent) => {
    if (!this.open || this.noCloseOnEscape) return;
    if (ev.key === 'Escape') this.hide();
  };

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
    });
    const hasHeader = !!this.heading || this.querySelector('[slot="title"]') !== null || !this.noCloseButton;
    const hasFooter = this.querySelector('[slot="footer"]') !== null;
    const showBackdrop =
      !this.noBackdrop && !this.staticPreview && (this.open || this._animating);
    // Only force `display: block` when the modal is actually visible; otherwise
    // leave it to Bootstrap's default (`.modal { display: none; }`) so closed
    // modals don't render an invisible full-viewport overlay.
    const modalStyle = isShown || this._animating ? 'display: block' : 'display: none';
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
        <div part="dialog" class=${dialogClasses} role="document">
          <div part="content" class="modal-content">
            ${hasHeader
              ? html`<div part="header" class="modal-header">
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
            <div part="body" class="modal-body"><slot></slot></div>
            ${hasFooter
              ? html`<div part="footer" class="modal-footer"><slot name="footer"></slot></div>`
              : nothing}
          </div>
        </div>
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
