import { html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, FocusTrapController, defineElement } from '@bootstrap-wc/core';

export type OffcanvasPlacement = 'start' | 'end' | 'top' | 'bottom';
export type OffcanvasResponsiveBreakpoint = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

/**
 * `<bs-offcanvas>` — Bootstrap offcanvas (side drawer).
 *
 * @fires bs-show / bs-shown / bs-hide / bs-hidden
 */
export class BsOffcanvas extends BootstrapElement {
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: String }) placement: OffcanvasPlacement = 'start';
  @property({ type: String, attribute: 'heading' }) heading?: string;
  @property({ type: Boolean, attribute: 'body-scroll' }) bodyScroll = false;
  @property({ type: Boolean, attribute: 'no-backdrop' }) noBackdrop = false;
  @property({ type: Boolean, attribute: 'static-backdrop' }) staticBackdrop = false;
  @property({ type: Boolean, attribute: 'no-close-button' }) noCloseButton = false;
  @property({ type: Boolean }) dark = false;
  /**
   * When set to one of `sm|md|lg|xl|xxl`, renders `.offcanvas-{bp}` so the
   * panel is hidden as an offcanvas only below that breakpoint and becomes
   * an inline column at/above it (Bootstrap "Responsive" variant).
   */
  @property({ type: String }) responsive?: OffcanvasResponsiveBreakpoint;

  @query('[part="panel"]') private _panel!: HTMLElement;
  private _trap = new FocusTrapController(this);

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this._onKeydown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._onKeydown);
    this._trap.deactivate();
  }

  override updated(changed: Map<string, unknown>) {
    super.updated(changed);
    if (changed.has('open')) {
      if (this.open) {
        this.dispatchEvent(new CustomEvent('bs-show', { bubbles: true, composed: true }));
        queueMicrotask(() => this._panel && this._trap.activate(this._panel));
        setTimeout(
          () => this.dispatchEvent(new CustomEvent('bs-shown', { bubbles: true, composed: true })),
          300,
        );
      } else {
        this._trap.deactivate();
        this.dispatchEvent(new CustomEvent('bs-hide', { bubbles: true, composed: true }));
        setTimeout(
          () => this.dispatchEvent(new CustomEvent('bs-hidden', { bubbles: true, composed: true })),
          300,
        );
      }
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

  private _onKeydown = (ev: KeyboardEvent) => {
    if (!this.open) return;
    if (ev.key === 'Escape') this.hide();
  };

  private _onBackdropClick = () => {
    if (!this.staticBackdrop) this.hide();
  };

  override render() {
    const base = this.responsive ? `offcanvas-${this.responsive}` : 'offcanvas';
    const panelClasses = classMap({
      [base]: true,
      [`offcanvas-${this.placement}`]: true,
      'text-bg-dark': this.dark,
      show: this.open,
    });
    const showBackdrop = !this.noBackdrop && !this.responsive && this.open;
    return html`
      ${showBackdrop
        ? html`<div part="backdrop" class="offcanvas-backdrop fade show" @click=${this._onBackdropClick}></div>`
        : nothing}
      <div
        part="panel"
        class=${panelClasses}
        tabindex="-1"
        role="dialog"
        aria-modal=${this.responsive ? 'false' : 'true'}
        style=${this.open || this.responsive ? 'visibility: visible' : ''}
      >
        ${this.heading || !this.noCloseButton
          ? html`<div part="header" class="offcanvas-header">
              ${this.heading
                ? html`<h5 class="offcanvas-title">${this.heading}</h5>`
                : html`<h5 class="offcanvas-title"><slot name="title"></slot></h5>`}
              ${this.noCloseButton
                ? nothing
                : html`<button
                    type="button"
                    class=${classMap({ 'btn-close': true, 'btn-close-white': this.dark })}
                    aria-label="Close"
                    @click=${() => this.hide()}
                  ></button>`}
            </div>`
          : nothing}
        <div part="body" class="offcanvas-body"><slot></slot></div>
      </div>
    `;
  }
}

defineElement('bs-offcanvas', BsOffcanvas);

declare global {
  interface HTMLElementTagNameMap {
    'bs-offcanvas': BsOffcanvas;
  }
}
