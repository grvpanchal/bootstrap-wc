import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement, type Variant } from '@bootstrap-wc/core';

/**
 * `<bs-toast>` — Bootstrap toast notification.
 */
export class BsToast extends BootstrapElement {
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: Boolean }) autohide = true;
  @property({ type: Number }) delay = 5000;
  @property({ type: String }) variant?: Variant;
  @property({ type: String, attribute: 'heading' }) heading?: string;
  @property({ type: String }) timestamp?: string;
  @property({ type: Boolean, attribute: 'no-close-button' }) noCloseButton = false;

  private _timer?: number;

  override updated(changed: Map<string, unknown>) {
    if (changed.has('open')) {
      if (this.open && this.autohide) {
        window.clearTimeout(this._timer);
        this._timer = window.setTimeout(() => this.hide(), this.delay);
      }
      this.dispatchEvent(new CustomEvent(this.open ? 'bs-show' : 'bs-hide', { bubbles: true }));
    }
  }

  show() {
    this.open = true;
  }

  hide() {
    this.open = false;
  }

  override render() {
    const classes = classMap({
      toast: true,
      fade: true,
      show: this.open,
      [`text-bg-${this.variant}`]: !!this.variant,
    });
    return html`
      <div
        part="toast"
        class=${classes}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        ${this.heading
          ? html`<div part="header" class="toast-header">
              <strong class="me-auto">${this.heading}</strong>
              ${this.timestamp ? html`<small>${this.timestamp}</small>` : nothing}
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
        <div part="body" class="toast-body"><slot></slot></div>
      </div>
    `;
  }
}

defineElement('bs-toast', BsToast);

export type ToastContainerPosition =
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'middle-start'
  | 'middle-center'
  | 'middle-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end';

/** `<bs-toast-container>` — positions stacked toasts. */
export class BsToastContainer extends BootstrapElement {
  @property({ type: String }) placement: ToastContainerPosition = 'top-end';

  private _positionClass(): string {
    const map: Record<ToastContainerPosition, string> = {
      'top-start': 'top-0 start-0',
      'top-center': 'top-0 start-50 translate-middle-x',
      'top-end': 'top-0 end-0',
      'middle-start': 'top-50 start-0 translate-middle-y',
      'middle-center': 'top-50 start-50 translate-middle',
      'middle-end': 'top-50 end-0 translate-middle-y',
      'bottom-start': 'bottom-0 start-0',
      'bottom-center': 'bottom-0 start-50 translate-middle-x',
      'bottom-end': 'bottom-0 end-0',
    };
    return map[this.placement];
  }

  override render() {
    return html`<div
      part="container"
      class="toast-container position-fixed p-3 ${this._positionClass()}"
      style="z-index: 1090"
    >
      <slot></slot>
    </div>`;
  }
}

defineElement('bs-toast-container', BsToastContainer);

declare global {
  interface HTMLElementTagNameMap {
    'bs-toast': BsToast;
    'bs-toast-container': BsToastContainer;
  }
}
