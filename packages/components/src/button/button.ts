import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { BootstrapElement, defineElement, type Size, type Variant } from '@bootstrap-wc/core';

export type ButtonType = 'button' | 'submit' | 'reset';
export type ButtonStyle = 'solid' | 'outline' | 'link';

/**
 * `<bs-button>` — Bootstrap button as a web component.
 *
 * The host element IS the button. Bootstrap's `.btn`, `.btn-{variant}`, size
 * and state classes are applied to the host, so that container components
 * (`.btn-group > .btn + .btn`) can style it correctly across shadow
 * boundaries via slot flattening. A shadow slot simply projects the author's
 * content; form submission, activation, and link navigation are handled on
 * the host.
 *
 * Set `variant="none"` to render the bare `.btn` base class without a color
 * variant. Set `toggle` to have user activation flip the `active` state
 * (matches Bootstrap's `data-bs-toggle="button"` plugin behavior).
 *
 * @slot - Button content (text and/or icon).
 * @fires bs-click - Bubbles on user activation (suppressed when disabled).
 */
export class BsButton extends BootstrapElement {
  static formAssociated = true;

  @property({ type: String }) variant: Variant | 'none' = 'primary';
  @property({ type: String, attribute: 'button-style' }) buttonStyle: ButtonStyle = 'solid';
  @property({ type: String }) size?: Size;
  @property({ type: String }) type: ButtonType = 'button';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) active = false;
  @property({ type: Boolean, reflect: true }) toggle = false;
  @property({ type: String }) href?: string;
  @property({ type: String }) target?: string;
  @property({ type: String }) rel?: string;

  private _internals?: ElementInternals;

  constructor() {
    super();
    if (typeof this.attachInternals === 'function') this._internals = this.attachInternals();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', this.href ? 'link' : 'button');
    if (!this.hasAttribute('tabindex')) this.tabIndex = this.disabled ? -1 : 0;
    this.addEventListener('click', this._onClick);
    this.addEventListener('keydown', this._onKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('click', this._onClick);
    this.removeEventListener('keydown', this._onKeydown);
  }

  protected override hostClasses(): string {
    const parts = ['btn'];
    if (this.buttonStyle === 'link') {
      parts.push('btn-link');
    } else if (this.variant !== 'none') {
      const prefix = this.buttonStyle === 'outline' ? 'btn-outline-' : 'btn-';
      parts.push(`${prefix}${this.variant}`);
    }
    if (this.size && this.size !== 'md') parts.push(`btn-${this.size}`);
    if (this.active) parts.push('active');
    if (this.disabled) parts.push('disabled');
    return parts.join(' ');
  }

  override updated(changed: Map<string, unknown>): void {
    super.updated(changed);
    if (changed.has('disabled')) {
      this.tabIndex = this.disabled ? -1 : 0;
      this.setAttribute('aria-disabled', this.disabled ? 'true' : 'false');
    }
    if (changed.has('active')) {
      this.setAttribute('aria-pressed', this.active ? 'true' : 'false');
    }
    if (changed.has('href')) {
      this.setAttribute('role', this.href ? 'link' : 'button');
    }
  }

  private _onClick = (ev: MouseEvent) => {
    if (this.disabled) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      return;
    }
    if (this.toggle) {
      this.active = !this.active;
    }
    if (this.href && ev.target === this) {
      const target = this.target || '_self';
      if (target === '_self') window.location.href = this.href;
      else window.open(this.href, target, this.rel ?? '');
      return;
    }
    if (this.type === 'submit' && this._internals?.form) {
      this._internals.form.requestSubmit();
    } else if (this.type === 'reset' && this._internals?.form) {
      this._internals.form.reset();
    }
    this.dispatchEvent(
      new CustomEvent('bs-click', {
        bubbles: true,
        composed: true,
        detail: { originalEvent: ev },
      }),
    );
  };

  private _onKeydown = (ev: KeyboardEvent) => {
    if (this.disabled) return;
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      this.click();
    }
  };

  override render() {
    return html`<slot></slot>${nothing}`;
  }
}

defineElement('bs-button', BsButton);

declare global {
  interface HTMLElementTagNameMap {
    'bs-button': BsButton;
  }
}
