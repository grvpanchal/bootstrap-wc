import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

/**
 * `<bs-close-button>` — Bootstrap close/dismiss button.
 *
 * @fires bs-close - Fired on user activation.
 */
export class BsCloseButton extends BootstrapElement {
  @property({ type: Boolean }) white = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: String }) label = 'Close';

  private _onClick = (ev: MouseEvent) => {
    if (this.disabled) {
      ev.preventDefault();
      return;
    }
    this.dispatchEvent(new CustomEvent('bs-close', { bubbles: true, composed: true }));
  };

  override render() {
    const classes = classMap({
      'btn-close': true,
      'btn-close-white': this.white,
    });
    return html`
      <button
        part="button"
        type="button"
        class=${classes}
        aria-label=${this.label}
        ?disabled=${this.disabled}
        @click=${this._onClick}
      ></button>
    `;
  }
}

defineElement('bs-close-button', BsCloseButton);

declare global {
  interface HTMLElementTagNameMap {
    'bs-close-button': BsCloseButton;
  }
}
