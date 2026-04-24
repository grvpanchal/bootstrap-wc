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
  /**
   * When present, disables auto-hide — equivalent to setting
   * `autohide = false` in JS. Useful as an attribute escape hatch since
   * Lit's Boolean attribute converter treats any value (including
   * `"false"`) as truthy.
   */
  @property({ type: Boolean, attribute: 'no-autohide' }) noAutohide = false;
  @property({ type: Number }) delay = 5000;
  @property({ type: String }) variant?: Variant;
  @property({ type: String, attribute: 'heading' }) heading?: string;
  @property({ type: String }) timestamp?: string;
  @property({ type: Boolean, attribute: 'no-close-button' }) noCloseButton = false;
  /**
   * When true AND no `heading` is set, renders the body + close button in a
   * flex layout matching Bootstrap's "Custom content" / "Color schemes"
   * examples. Ignored when a header is present — the header already owns
   * the close button in that case.
   */
  @property({ type: Boolean }) dismissible = false;

  private _timer?: number;

  override updated(changed: Map<string, unknown>) {
    if (changed.has('open')) {
      if (this.open && this.autohide && !this.noAutohide) {
        window.clearTimeout(this._timer);
        this._timer = window.setTimeout(() => this.hide(), this.delay);
      }
      this.dispatchEvent(
        new CustomEvent(this.open ? 'bs-show' : 'bs-hide', { bubbles: true, composed: true }),
      );
    }
  }

  show() {
    this.open = true;
  }

  hide() {
    this.open = false;
  }

  override render() {
    const hasHeader = !!this.heading;
    // When there's no header but a close button is requested, render in the
    // "align-items-center + d-flex" layout Bootstrap uses for custom content
    // and color-scheme examples.
    const headerless = !hasHeader && this.dismissible && !this.noCloseButton;
    const classes = classMap({
      toast: true,
      fade: true,
      show: this.open,
      [`text-bg-${this.variant}`]: !!this.variant,
      // Bootstrap color-scheme examples drop the border when a variant is used.
      'border-0': !!this.variant,
      'align-items-center': headerless,
    });
    const closeBtnClass = this.variant ? 'btn-close btn-close-white' : 'btn-close';

    const header = hasHeader
      ? html`<div part="header" class="toast-header">
          <slot name="icon"></slot>
          <strong class="me-auto">${this.heading}</strong>
          ${this.timestamp ? html`<small>${this.timestamp}</small>` : nothing}
          ${this.noCloseButton
            ? nothing
            : html`<button
                type="button"
                class=${closeBtnClass}
                aria-label="Close"
                @click=${() => this.hide()}
              ></button>`}
        </div>`
      : nothing;

    const body = headerless
      ? html`<div class="d-flex">
          <div part="body" class="toast-body"><slot></slot></div>
          <button
            type="button"
            class="${closeBtnClass} me-2 m-auto"
            aria-label="Close"
            @click=${() => this.hide()}
          ></button>
        </div>`
      : html`<div part="body" class="toast-body"><slot></slot></div>`;

    return html`
      <div
        part="toast"
        class=${classes}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        ${header}${body}
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
  /**
   * When true, skips `position-fixed` + placement classes and uses
   * `position-static` — matches Bootstrap's "Stacking" example where toasts
   * flow in normal document order.
   */
  @property({ type: Boolean }) static = false;
  /**
   * When true, uses `position-absolute` instead of `position-fixed` so the
   * container can be pinned inside a relatively-positioned ancestor
   * (useful for demoing placement within a bounded area).
   */
  @property({ type: Boolean }) absolute = false;

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
    if (this.static) {
      return html`<div part="container" class="toast-container position-static">
        <slot></slot>
      </div>`;
    }
    const positionMode = this.absolute ? 'position-absolute' : 'position-fixed';
    return html`<div
      part="container"
      class="toast-container ${positionMode} p-3 ${this._positionClass()}"
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
