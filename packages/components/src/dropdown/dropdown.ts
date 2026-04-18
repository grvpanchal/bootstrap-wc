import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  BootstrapElement,
  FloatingController,
  defineElement,
  type Placement,
  type Variant,
} from '@bootstrap-wc/core';

/**
 * `<bs-dropdown>` — Bootstrap dropdown menu with floating-ui positioning.
 *
 * Slot the trigger as a default child (e.g. `<bs-button>`) and menu items via
 * `slot="menu"`.
 *
 * @fires bs-show - before opening.
 * @fires bs-shown - after opening.
 * @fires bs-hide - before closing.
 * @fires bs-hidden - after closing.
 */
export class BsDropdown extends BootstrapElement {
  @property({ type: String }) label = 'Dropdown';
  @property({ type: String }) variant: Variant = 'secondary';
  @property({ type: String }) placement: Placement = 'bottom-start';
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: Boolean, attribute: 'no-caret' }) noCaret = false;
  @property({ type: Boolean, attribute: 'auto-close' }) autoClose = true;
  @property({ type: Boolean }) split = false;

  @state() private _slottedTrigger = false;

  @query('.dropdown-toggle') private _toggleEl!: HTMLElement;
  @query('.dropdown-menu') private _menuEl!: HTMLElement;

  private _floating = new FloatingController(this);

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._onDocClick, true);
    document.addEventListener('keydown', this._onKeydown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._onDocClick, true);
    document.removeEventListener('keydown', this._onKeydown);
    this._floating.stop();
  }

  override updated(changed: Map<string, unknown>) {
    if (changed.has('open')) {
      if (this.open && this._toggleEl && this._menuEl) {
        this._floating.setOptions({ placement: this.placement, offset: 2, flip: true, shift: true });
        this._floating.start(this._toggleEl, this._menuEl);
        this.dispatchEvent(new CustomEvent('bs-shown', { bubbles: true }));
      } else {
        this._floating.stop();
        this.dispatchEvent(new CustomEvent('bs-hidden', { bubbles: true }));
      }
    }
  }

  /** Show the menu. */
  show() {
    if (this.open) return;
    this.dispatchEvent(new CustomEvent('bs-show', { bubbles: true, cancelable: true }));
    this.open = true;
  }

  /** Hide the menu. */
  hide() {
    if (!this.open) return;
    this.dispatchEvent(new CustomEvent('bs-hide', { bubbles: true, cancelable: true }));
    this.open = false;
  }

  /** Toggle the menu. */
  toggle() {
    this.open ? this.hide() : this.show();
  }

  private _onToggleClick = (ev: Event) => {
    ev.stopPropagation();
    this.toggle();
  };

  private _onDocClick = (ev: Event) => {
    if (!this.open || !this.autoClose) return;
    const path = ev.composedPath();
    if (!path.includes(this)) this.hide();
  };

  private _onKeydown = (ev: KeyboardEvent) => {
    if (!this.open) return;
    if (ev.key === 'Escape') {
      this.hide();
      (this._toggleEl as HTMLElement)?.focus();
    }
  };

  override render() {
    const toggleClasses = classMap({
      btn: true,
      [`btn-${this.variant}`]: true,
      'dropdown-toggle': !this.noCaret && !this.split,
      'dropdown-toggle-split': this.split,
    });
    const menuClasses = classMap({
      'dropdown-menu': true,
      show: this.open,
    });
    return html`
      <div part="wrapper" class="dropdown">
        ${this.split
          ? html`
              <button type="button" class="btn btn-${this.variant}"><slot name="label">${this.label}</slot></button>
              <button
                part="toggle"
                type="button"
                class=${toggleClasses}
                aria-expanded=${this.open ? 'true' : 'false'}
                @click=${this._onToggleClick}
              >
                <span class="visually-hidden">Toggle Dropdown</span>
              </button>
            `
          : html`<button
              part="toggle"
              type="button"
              class=${toggleClasses}
              aria-expanded=${this.open ? 'true' : 'false'}
              @click=${this._onToggleClick}
            >
              <slot name="label">${this.label}</slot>
            </button>`}
        <ul part="menu" class=${menuClasses} role="menu">
          <slot name="menu"></slot>
          ${this._slottedTrigger ? nothing : html``}
        </ul>
      </div>
    `;
  }
}

defineElement('bs-dropdown', BsDropdown);

/** `<bs-dropdown-item>` — single item inside a dropdown. */
export class BsDropdownItem extends BootstrapElement {
  @property({ type: String }) href?: string;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) active = false;
  @property({ type: Boolean }) divider = false;
  @property({ type: Boolean }) header = false;

  private _onClick = (ev: MouseEvent) => {
    if (this.disabled) {
      ev.preventDefault();
      return;
    }
    // Close parent dropdown unless it has auto-close disabled.
    const parent = this.closest('bs-dropdown') as HTMLElement & { autoClose?: boolean; hide?: () => void };
    if (parent?.autoClose) parent.hide?.();
  };

  override render() {
    if (this.divider) return html`<li><hr class="dropdown-divider" /></li>`;
    if (this.header) return html`<li><h6 class="dropdown-header"><slot></slot></h6></li>`;
    const classes = classMap({
      'dropdown-item': true,
      active: this.active,
      disabled: this.disabled,
    });
    return html`<li>
      <a
        part="item"
        class=${classes}
        href=${this.href ?? '#'}
        aria-disabled=${this.disabled ? 'true' : 'false'}
        @click=${this._onClick}
      ><slot></slot></a>
    </li>`;
  }
}

defineElement('bs-dropdown-item', BsDropdownItem);

declare global {
  interface HTMLElementTagNameMap {
    'bs-dropdown': BsDropdown;
    'bs-dropdown-item': BsDropdownItem;
  }
}
