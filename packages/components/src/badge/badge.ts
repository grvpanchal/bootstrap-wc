import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { BootstrapElement, defineElement, type Variant } from '@bootstrap-wc/core';

export type BadgeTone = 'solid' | 'subtle' | 'bordered';

/**
 * `<bs-badge>` — Bootstrap badge for labels and counts.
 *
 * The host carries `.badge` plus the variant / tone classes (so descendant
 * Bootstrap selectors apply across the shadow boundary). Set `tone="subtle"`
 * for the `.bg-{variant}-subtle.text-{variant}-emphasis` look, or
 * `tone="bordered"` to add `.border .border-{variant}-subtle` on top of the
 * subtle treatment. Set `dismissible` to render an inline close button that
 * fires `bs-dismiss` and removes the host on activation.
 *
 * @slot - Badge content. May include images / icons.
 * @fires bs-dismiss - Fired when a `dismissible` badge is closed.
 */
export class BsBadge extends BootstrapElement {
  @property({ type: String }) variant: Variant = 'secondary';
  @property({ type: Boolean, reflect: true }) pill = false;
  @property({ type: String }) shape: 'default' | 'pill' = 'default';
  @property({ type: String }) tone: BadgeTone = 'solid';
  @property({ type: Boolean, reflect: true }) dismissible = false;
  @property({ type: String, attribute: 'dismiss-label' }) dismissLabel = 'Close';

  protected override hostClasses(): string {
    const parts = ['badge'];
    if (this.tone === 'subtle' || this.tone === 'bordered') {
      parts.push(`bg-${this.variant}-subtle`);
      parts.push(`text-${this.variant}-emphasis`);
      if (this.tone === 'bordered') {
        parts.push('border');
        parts.push(`border-${this.variant}-subtle`);
      }
    } else {
      parts.push(`text-bg-${this.variant}`);
    }
    if (this.pill || this.shape === 'pill') parts.push('rounded-pill');
    return parts.join(' ');
  }

  private _onDismiss = (ev: Event) => {
    ev.preventDefault();
    ev.stopPropagation();
    const evt = new CustomEvent('bs-dismiss', {
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    if (this.dispatchEvent(evt)) this.remove();
  };

  override render() {
    return html`<slot></slot>${this.dismissible
      ? html`<button
          part="close"
          type="button"
          class="btn-close ms-2"
          aria-label=${this.dismissLabel}
          @click=${this._onDismiss}
        ></button>`
      : nothing}`;
  }
}

defineElement('bs-badge', BsBadge);

declare global {
  interface HTMLElementTagNameMap {
    'bs-badge': BsBadge;
  }
}
