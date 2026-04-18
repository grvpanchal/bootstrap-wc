import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, FloatingController, defineElement, type Placement } from '@bootstrap-wc/core';

export type PopoverTrigger = 'hover' | 'focus' | 'click' | 'manual';

/**
 * `<bs-popover>` — richer floating panel (supports title + body + arbitrary content).
 */
export class BsPopover extends BootstrapElement {
  @property({ type: String, attribute: 'heading' }) heading = '';
  @property({ type: String }) content = '';
  @property({ type: String }) placement: Placement = 'right';
  @property({ type: String }) trigger: PopoverTrigger = 'click';
  @property({ type: Boolean, reflect: true }) open = false;

  @state() private _mounted = false;
  @query('.popover') private _popEl!: HTMLElement;
  @query('.bs-popover-ref') private _refEl!: HTMLElement;

  private _floating = new FloatingController(this);

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('mouseenter', this._onMouseEnter);
    this.addEventListener('mouseleave', this._onMouseLeave);
    this.addEventListener('focusin', this._onFocusIn);
    this.addEventListener('focusout', this._onFocusOut);
    this.addEventListener('click', this._onClick);
    document.addEventListener('click', this._onDocClick, true);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._onDocClick, true);
    this._floating.stop();
  }

  override updated(changed: Map<string, unknown>) {
    if (changed.has('open')) {
      if (this.open && this._popEl && this._refEl) {
        this._mounted = true;
        queueMicrotask(() => {
          this._floating.setOptions({ placement: this.placement, offset: 8 });
          this._floating.start(this._refEl, this._popEl);
        });
      } else {
        this._floating.stop();
        this._mounted = false;
      }
    }
  }

  show() {
    this.open = true;
  }
  hide() {
    this.open = false;
  }
  toggle() {
    this.open = !this.open;
  }

  private _onMouseEnter = () => {
    if (this.trigger === 'hover') this.open = true;
  };
  private _onMouseLeave = () => {
    if (this.trigger === 'hover') this.open = false;
  };
  private _onFocusIn = () => {
    if (this.trigger === 'focus') this.open = true;
  };
  private _onFocusOut = () => {
    if (this.trigger === 'focus') this.open = false;
  };
  private _onClick = (ev: Event) => {
    if (this.trigger === 'click') {
      ev.stopPropagation();
      this.open = !this.open;
    }
  };
  private _onDocClick = (ev: Event) => {
    if (this.trigger !== 'click' || !this.open) return;
    if (!ev.composedPath().includes(this)) this.open = false;
  };

  override render() {
    const classes = classMap({
      popover: true,
      'bs-popover-auto': true,
      fade: true,
      show: this.open,
    });
    return html`
      <span class="bs-popover-ref d-inline-block" part="reference"><slot name="trigger"></slot><slot></slot></span>
      ${this._mounted || this.open
        ? html`<div part="popover" class=${classes} role="tooltip" style="position:absolute;top:0;left:0">
            <div class="popover-arrow"></div>
            ${this.title
              ? html`<h3 part="header" class="popover-header">${this.title}</h3>`
              : html`<slot name="heading"></slot>`}
            <div part="body" class="popover-body">
              ${this.content || nothing}
              <slot name="content"></slot>
            </div>
          </div>`
        : nothing}
    `;
  }
}

defineElement('bs-popover', BsPopover);

declare global {
  interface HTMLElementTagNameMap {
    'bs-popover': BsPopover;
  }
}
