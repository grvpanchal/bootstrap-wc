import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement, TransitionController, type Variant } from '@bootstrap-wc/core';

/**
 * `<bs-alert>` — Bootstrap alert with optional dismiss button and fade-out transition.
 *
 * @slot - Alert content.
 * @slot heading - Optional heading block (rendered with `alert-heading`).
 * @fires bs-dismiss - Fired after the alert closes.
 */
export class BsAlert extends BootstrapElement {
  @property({ type: String }) variant: Variant = 'primary';
  @property({ type: Boolean }) dismissible = false;
  @property({ type: Boolean, reflect: true }) open = true;
  @property({ type: String, attribute: 'dismiss-label' }) dismissLabel = 'Close';

  @state() private _closing = false;

  private _transition = new TransitionController(this);

  private _onDismiss = async () => {
    if (!this.open) return;
    const root = this.renderRoot.querySelector('.alert') as HTMLElement | null;
    if (root) {
      this._closing = true;
      await this._transition.run(root, () => root.classList.remove('show'), 200);
    }
    this._closing = false;
    this.open = false;
    this.dispatchEvent(new CustomEvent('bs-dismiss', { bubbles: true, composed: true }));
  };

  /** Programmatic close (same effect as clicking the dismiss button). */
  close() {
    void this._onDismiss();
  }

  override render() {
    if (!this.open) return nothing;
    const classes = classMap({
      alert: true,
      [`alert-${this.variant}`]: true,
      'alert-dismissible': this.dismissible,
      fade: true,
      show: !this._closing,
    });
    return html`
      <div part="alert" class=${classes} role="alert">
        <slot name="heading"></slot>
        <slot></slot>
        ${this.dismissible
          ? html`<button
              part="close"
              type="button"
              class="btn-close"
              aria-label=${this.dismissLabel}
              @click=${this._onDismiss}
            ></button>`
          : nothing}
      </div>
    `;
  }
}

defineElement('bs-alert', BsAlert);

declare global {
  interface HTMLElementTagNameMap {
    'bs-alert': BsAlert;
  }
}
