import { html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, FocusTrapController, defineElement } from '@bootstrap-wc/core';

export type OffcanvasPlacement = 'start' | 'end' | 'top' | 'bottom';

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

  @query('.offcanvas') private _panel!: HTMLElement;
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
    if (changed.has('open')) {
      if (this.open) {
        this.dispatchEvent(new CustomEvent('bs-show', { bubbles: true }));
        queueMicrotask(() => this._panel && this._trap.activate(this._panel));
        setTimeout(() => this.dispatchEvent(new CustomEvent('bs-shown', { bubbles: true })), 300);
      } else {
        this._trap.deactivate();
        this.dispatchEvent(new CustomEvent('bs-hide', { bubbles: true }));
        setTimeout(() => this.dispatchEvent(new CustomEvent('bs-hidden', { bubbles: true })), 300);
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
    const panelClasses = classMap({
      offcanvas: true,
      [`offcanvas-${this.placement}`]: true,
      show: this.open,
    });
    return html`
      ${this.noBackdrop || !this.open
        ? nothing
        : html`<div part="backdrop" class="offcanvas-backdrop fade show" @click=${this._onBackdropClick}></div>`}
      <div
        part="panel"
        class=${panelClasses}
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        style=${this.open ? 'visibility: visible' : ''}
      >
        ${this.heading
          ? html`<div part="header" class="offcanvas-header">
              <h5 class="offcanvas-title">${this.heading}</h5>
              <button type="button" class="btn-close" aria-label="Close" @click=${() => this.hide()}></button>
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
