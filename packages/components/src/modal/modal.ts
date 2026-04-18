import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, FocusTrapController, defineElement } from '@bootstrap-wc/core';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

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
  @property({ type: Boolean }) fullscreen = false;

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
    if (ev.target === this._modal && !this.staticBackdrop) this.hide();
  };

  override render() {
    if (!this.open && !this._animating) return nothing;
    const dialogClasses = classMap({
      'modal-dialog': true,
      [`modal-${this.size}`]: this.size !== 'md',
      'modal-dialog-centered': this.centered,
      'modal-dialog-scrollable': this.scrollable,
      'modal-fullscreen': this.fullscreen,
    });
    const modalClasses = classMap({
      modal: true,
      fade: true,
      show: this.open && !this._animating,
    });
    return html`
      ${this.noBackdrop
        ? nothing
        : html`<div part="backdrop" class="modal-backdrop fade ${this.open && !this._animating ? 'show' : ''}"></div>`}
      <div
        part="modal"
        class=${modalClasses}
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        style="display: block"
        @click=${this._onBackdropClick}
      >
        <div part="dialog" class=${dialogClasses} role="document">
          <div part="content" class="modal-content">
            ${this.heading || !this.noCloseButton
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
            ${this.querySelector('[slot="footer"]')
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
