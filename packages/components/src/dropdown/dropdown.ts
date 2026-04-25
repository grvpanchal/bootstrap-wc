import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  BootstrapElement,
  FloatingController,
  defineElement,
  type Placement,
  type Size,
  type Variant,
} from '@bootstrap-wc/core';

export type DropDirection = 'down' | 'up' | 'end' | 'start' | 'center' | 'up-center';

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
  @property({ type: String }) size?: Size;
  @property({ type: String }) placement?: Placement;
  @property({ type: String }) drop: DropDirection = 'down';
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: Boolean, attribute: 'no-caret' }) noCaret = false;
  @property({ type: Boolean, attribute: 'auto-close' }) autoClose = true;
  @property({ type: Boolean }) split = false;
  @property({ type: Boolean, attribute: 'menu-end' }) menuEnd = false;
  @property({ type: Boolean, attribute: 'menu-dark' }) menuDark = false;
  @property({ type: String, attribute: 'toggle-tag' }) toggleTag: 'button' | 'a' = 'button';

  @state() private _slottedTrigger = false;

  @query('.dropdown-toggle') private _toggleEl!: HTMLElement;
  @query('.dropdown-menu') private _menuEl!: HTMLElement;

  private _floating = new FloatingController(this);

  /** Resolve the effective placement based on `placement` (explicit) or `drop`. */
  private _effectivePlacement(): Placement {
    if (this.placement) return this.placement;
    const endAlign = this.menuEnd;
    switch (this.drop) {
      case 'up':
        return endAlign ? 'top-end' : 'top-start';
      case 'up-center':
        return 'top';
      case 'end':
        return endAlign ? 'right-end' : 'right-start';
      case 'start':
        return endAlign ? 'left-end' : 'left-start';
      case 'center':
        return 'bottom';
      case 'down':
      default:
        return endAlign ? 'bottom-end' : 'bottom-start';
    }
  }

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
        this._floating.setOptions({
          placement: this._effectivePlacement(),
          offset: 2,
          flip: true,
          shift: true,
        });
        this._floating.start(this._toggleEl, this._menuEl);
        this.dispatchEvent(new CustomEvent('bs-shown', { bubbles: true, composed: true }));
      } else {
        this._floating.stop();
        this.dispatchEvent(new CustomEvent('bs-hidden', { bubbles: true, composed: true }));
      }
    }
  }

  /** Show the menu. */
  show() {
    if (this.open) return;
    this.dispatchEvent(new CustomEvent('bs-show', { bubbles: true, composed: true, cancelable: true }));
    this.open = true;
  }

  /** Hide the menu. */
  hide() {
    if (!this.open) return;
    this.dispatchEvent(new CustomEvent('bs-hide', { bubbles: true, composed: true, cancelable: true }));
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

  private _wrapperClasses() {
    // When `split` is set we use `.btn-group` so Bootstrap's split-button
    // sibling combinators apply (`.btn-group > .btn + .btn`). Direction
    // modifiers (`dropup`, `dropend`, `dropstart`, `dropup-center`) live on
    // the wrapper alongside either `.dropdown`, `.btn-group`, or the
    // centered variants (`dropdown-center`, `dropup-center`).
    const direction = this.drop;
    const needsCenter = direction === 'center';
    const needsUpCenter = direction === 'up-center';
    const base = this.split ? 'btn-group' : needsCenter ? 'dropdown-center' : needsUpCenter ? 'dropup-center' : 'dropdown';
    const modifier =
      direction === 'up' || direction === 'up-center'
        ? 'dropup'
        : direction === 'end'
          ? 'dropend'
          : direction === 'start'
            ? 'dropstart'
            : '';
    return { [base]: true, [modifier]: !!modifier };
  }

  override render() {
    const sizeClass = this.size ? `btn-${this.size}` : '';
    const toggleClasses = classMap({
      btn: true,
      [`btn-${this.variant}`]: true,
      [sizeClass]: !!sizeClass,
      'dropdown-toggle': !this.noCaret || this.split,
      'dropdown-toggle-split': this.split,
    });
    const menuClasses = classMap({
      'dropdown-menu': true,
      'dropdown-menu-end': this.menuEnd,
      'dropdown-menu-dark': this.menuDark,
      show: this.open,
    });
    const wrapperClasses = classMap(this._wrapperClasses());
    const ariaExpanded = this.open ? 'true' : 'false';

    const renderToggle = () => {
      if (this.toggleTag === 'a') {
        return html`<a
          part="toggle"
          role="button"
          href="#"
          class=${toggleClasses}
          aria-expanded=${ariaExpanded}
          @click=${this._onToggleClick}
        >
          <slot name="label">${this.label}</slot>
        </a>`;
      }
      return html`<button
        part="toggle"
        type="button"
        class=${toggleClasses}
        aria-expanded=${ariaExpanded}
        @click=${this._onToggleClick}
      >
        <slot name="label">${this.label}</slot>
      </button>`;
    };

    const renderSplitToggle = () => html`
      <button type="button" class=${classMap({ btn: true, [`btn-${this.variant}`]: true, [sizeClass]: !!sizeClass })}>
        <slot name="label">${this.label}</slot>
      </button>
      <button
        part="toggle"
        type="button"
        class=${toggleClasses}
        aria-expanded=${ariaExpanded}
        @click=${this._onToggleClick}
      >
        <span class="visually-hidden">Toggle Dropdown</span>
      </button>
    `;

    return html`
      <div part="wrapper" class=${wrapperClasses}>
        ${this.split ? renderSplitToggle() : renderToggle()}
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
  @property({ type: Boolean }) text = false;
  @property({ type: String, attribute: 'as' }) as: 'a' | 'button' = 'a';

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
    if (this.text)
      return html`<li><span class="dropdown-item-text"><slot></slot></span></li>`;
    const classes = classMap({
      'dropdown-item': true,
      active: this.active,
      disabled: this.disabled,
    });
    if (this.as === 'button') {
      return html`<li>
        <button
          part="item"
          type="button"
          class=${classes}
          ?disabled=${this.disabled}
          aria-disabled=${this.disabled ? 'true' : 'false'}
          @click=${this._onClick}
        ><slot></slot></button>
      </li>`;
    }
    return html`<li>
      <a
        part="item"
        class=${classes}
        href=${this.href ?? '#'}
        aria-current=${this.active ? 'true' : (nothing as unknown as string)}
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
