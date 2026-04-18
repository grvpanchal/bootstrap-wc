import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, FloatingController, defineElement, type Placement } from '@bootstrap-wc/core';

export type TooltipTrigger = 'hover' | 'focus' | 'click' | 'manual';

/**
 * `<bs-tooltip>` — text-only floating tooltip using @floating-ui/dom.
 *
 * Slot the trigger in the default slot. Tooltip text goes in the `content`
 * property (or `title` attribute for Bootstrap parity).
 */
export class BsTooltip extends BootstrapElement {
  @property({ type: String }) content = '';
  @property({ type: String }) placement: Placement = 'top';
  @property({ type: String }) trigger: TooltipTrigger = 'hover';
  @property({ type: Number, attribute: 'show-delay' }) showDelay = 0;
  @property({ type: Number, attribute: 'hide-delay' }) hideDelay = 0;
  @property({ type: Boolean, reflect: true }) open = false;

  @state() private _mounted = false;

  @query('.tooltip') private _tipEl!: HTMLElement;
  @query('.bs-tooltip-ref') private _refEl!: HTMLElement;

  private _floating = new FloatingController(this);
  private _showTimer?: number;
  private _hideTimer?: number;

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('mouseenter', this._onMouseEnter);
    this.addEventListener('mouseleave', this._onMouseLeave);
    this.addEventListener('focusin', this._onFocusIn);
    this.addEventListener('focusout', this._onFocusOut);
    this.addEventListener('click', this._onClick);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._floating.stop();
  }

  override updated(changed: Map<string, unknown>) {
    if (changed.has('open')) {
      if (this.open && this._tipEl && this._refEl) {
        this._mounted = true;
        queueMicrotask(() => {
          this._floating.setOptions({ placement: this.placement, offset: 6 });
          this._floating.start(this._refEl, this._tipEl);
        });
      } else {
        this._floating.stop();
        this._mounted = false;
      }
    }
  }

  show() {
    window.clearTimeout(this._hideTimer);
    this._showTimer = window.setTimeout(() => {
      this.open = true;
    }, this.showDelay);
  }

  hide() {
    window.clearTimeout(this._showTimer);
    this._hideTimer = window.setTimeout(() => {
      this.open = false;
    }, this.hideDelay);
  }

  private _onMouseEnter = () => {
    if (this.trigger === 'hover') this.show();
  };
  private _onMouseLeave = () => {
    if (this.trigger === 'hover') this.hide();
  };
  private _onFocusIn = () => {
    if (this.trigger === 'focus' || this.trigger === 'hover') this.show();
  };
  private _onFocusOut = () => {
    if (this.trigger === 'focus' || this.trigger === 'hover') this.hide();
  };
  private _onClick = () => {
    if (this.trigger === 'click') this.open = !this.open;
  };

  override render() {
    const tipClasses = classMap({
      tooltip: true,
      'bs-tooltip-auto': true,
      fade: true,
      show: this.open,
    });
    return html`
      <span class="bs-tooltip-ref d-inline-block" part="reference"><slot></slot></span>
      ${this._mounted || this.open
        ? html`<div part="tooltip" class=${tipClasses} role="tooltip" style="position:absolute;top:0;left:0">
            <div class="tooltip-arrow"></div>
            <div class="tooltip-inner">${this.content || nothing}</div>
          </div>`
        : nothing}
    `;
  }
}

defineElement('bs-tooltip', BsTooltip);

declare global {
  interface HTMLElementTagNameMap {
    'bs-tooltip': BsTooltip;
  }
}
