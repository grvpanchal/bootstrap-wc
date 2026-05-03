import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { BootstrapElement, defineElement, type Variant } from '@bootstrap-wc/core';

/**
 * `<bs-list-group-item>` — item inside `<bs-list-group>`. The host carries
 * `.list-group-item` (+ variant / active / disabled modifiers) so Bootstrap's
 * sibling selectors like `.list-group-item + .list-group-item` match across
 * the slot boundary.
 *
 * Semantics adapt to the parent `<bs-list-group as="ul" | "div">`:
 *   - `as="ul"` (default): host announces as a list item / link if `href`.
 *   - `as="div"` (rich link list): host announces as a link by default
 *     (matches `<a class="list-group-item">`) and is focusable.
 *
 * When `href` is set the host navigates on click.
 */
export class BsListGroupItem extends BootstrapElement {
  @property({ type: Boolean, reflect: true }) active = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: String }) variant?: Variant;
  @property({ type: String }) href?: string;
  @property({ type: Boolean }) action = false;

  /** Resolved from the closest `<bs-list-group>` parent (cached for render). */
  private _isDivMode(): boolean {
    const parent = this.closest('bs-list-group') as (HTMLElement & { as?: string }) | null;
    return parent?.as === 'div';
  }

  override connectedCallback(): void {
    super.connectedCallback();
    const isLink = !!this.href || this._isDivMode() || this.action;
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', isLink ? 'link' : 'listitem');
    }
    if (isLink && !this.hasAttribute('tabindex')) {
      this.tabIndex = this.disabled ? -1 : 0;
    }
    this.addEventListener('click', this._onClick);
    this.addEventListener('keydown', this._onKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('click', this._onClick);
    this.removeEventListener('keydown', this._onKeydown);
  }

  override updated(changed: Map<string, unknown>): void {
    super.updated(changed);
    if (changed.has('active')) {
      // Only manage aria-current when `active` toggled — don't stomp an
      // author-set aria-current value when active was never true.
      if (this.active) this.setAttribute('aria-current', 'true');
      else if (changed.get('active') === true) this.removeAttribute('aria-current');
    }
    if (changed.has('disabled')) {
      this.setAttribute('aria-disabled', this.disabled ? 'true' : 'false');
      if (this.hasAttribute('tabindex')) this.tabIndex = this.disabled ? -1 : 0;
    }
  }

  protected override hostClasses(): string {
    const parts = ['list-group-item'];
    if (this.action || this.href || this._isDivMode()) parts.push('list-group-item-action');
    if (this.active) parts.push('active');
    if (this.disabled) parts.push('disabled');
    if (this.variant) parts.push(`list-group-item-${this.variant}`);
    return parts.join(' ');
  }

  private _onClick = (ev: MouseEvent) => {
    if (this.disabled) {
      ev.preventDefault();
      return;
    }
    if (this.href && ev.target === this) window.location.href = this.href;
  };

  private _onKeydown = (ev: KeyboardEvent) => {
    if (this.disabled) return;
    if ((ev.key === 'Enter' || ev.key === ' ') && this.href) {
      ev.preventDefault();
      this.click();
    }
  };

  override render() {
    return html`<slot></slot>${nothing}`;
  }
}

defineElement('bs-list-group-item', BsListGroupItem);

declare global {
  interface HTMLElementTagNameMap {
    'bs-list-group-item': BsListGroupItem;
  }
}
