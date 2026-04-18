import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement, type Size, type Variant } from '@bootstrap-wc/core';

export type ButtonType = 'button' | 'submit' | 'reset';
export type ButtonStyle = 'solid' | 'outline' | 'link';

/**
 * `<bs-button>` — Bootstrap button as a web component.
 *
 * @slot - Button content (text and/or icon).
 * @csspart button - The native `<button>` or `<a>` element.
 * @fires bs-click - Bubbles on user activation (except when disabled).
 */
export class BsButton extends BootstrapElement {
  @property({ type: String }) variant: Variant = 'primary';
  @property({ type: String, attribute: 'button-style' }) buttonStyle: ButtonStyle = 'solid';
  @property({ type: String }) size?: Size;
  @property({ type: String }) type: ButtonType = 'button';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean }) active = false;
  @property({ type: String }) href?: string;
  @property({ type: String }) target?: string;
  @property({ type: String }) rel?: string;

  private _onClick = (ev: MouseEvent) => {
    if (this.disabled) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      return;
    }
    this.dispatchEvent(
      new CustomEvent('bs-click', {
        bubbles: true,
        composed: true,
        detail: { originalEvent: ev },
      }),
    );
  };

  private _classes() {
    return {
      btn: true,
      [`btn-${this.buttonStyle === 'outline' ? 'outline-' : ''}${this.variant}`]:
        this.buttonStyle !== 'link',
      'btn-link': this.buttonStyle === 'link',
      [`btn-${this.size}`]: !!this.size && this.size !== 'md',
      active: this.active,
      disabled: this.disabled && !!this.href,
    };
  }

  override render() {
    const classes = classMap(this._classes());
    if (this.href) {
      return html`
        <a
          part="button"
          class=${classes}
          href=${this.disabled ? nothing : this.href}
          target=${this.target ?? nothing}
          rel=${this.rel ?? nothing}
          role="button"
          aria-disabled=${this.disabled ? 'true' : 'false'}
          @click=${this._onClick}
        >
          <slot></slot>
        </a>
      `;
    }
    return html`
      <button
        part="button"
        class=${classes}
        type=${this.type}
        ?disabled=${this.disabled}
        aria-pressed=${this.active ? 'true' : 'false'}
        @click=${this._onClick}
      >
        <slot></slot>
      </button>
    `;
  }
}

defineElement('bs-button', BsButton);

declare global {
  interface HTMLElementTagNameMap {
    'bs-button': BsButton;
  }
}
