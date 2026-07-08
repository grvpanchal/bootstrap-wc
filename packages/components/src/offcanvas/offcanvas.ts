import { html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, FocusTrapController, defineElement } from '@bootstrap-wc/core';

export type OffcanvasPlacement = 'start' | 'end' | 'top' | 'bottom';
export type OffcanvasResponsiveBreakpoint = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

/**
 * `<bs-offcanvas>`'s data-driven config. When set, the component populates
 * its header title, body, and footer from this object; slotted children
 * are ignored. Set the object via JS (`el.config = …`) or via a JSON
 * attribute (`config='{…}'`).
 */
export interface OffcanvasConfig {
  /** Header title. Overrides `heading` attribute when both are set. */
  title?: string;
  /** Escape hatch for rich header markup. Uses `.innerHTML` — trust your inputs. */
  titleHtml?: string;
  /** Body plain text. Ignored when `bodyHtml` is set. */
  body?: string;
  /** Body HTML markup. Uses `.innerHTML` — trust your inputs. */
  bodyHtml?: string;
  /** Optional footer HTML block. Uses `.innerHTML` — trust your inputs. */
  footerHtml?: string;
}

/**
 * `<bs-offcanvas>` — Bootstrap offcanvas (side drawer).
 *
 * **Dual-nature content:** author the drawer body / header / footer as
 * children (slotted, with `slot="title"` for a custom title), OR set the
 * `config` property to build the whole drawer from data. When both are
 * provided, `config` wins.
 *
 * ```html
 * <bs-offcanvas
 *   id="drawer"
 *   placement="end"
 *   config='{
 *     "title":"Cart",
 *     "bodyHtml":"<p>Empty cart</p>",
 *     "footerHtml":"<button class=\"btn btn-primary w-100\">Checkout</button>"
 *   }'
 * ></bs-offcanvas>
 * ```
 *
 * @fires bs-show / bs-shown / bs-hide / bs-hidden
 */
export class BsOffcanvas extends BootstrapElement {
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: String }) placement: OffcanvasPlacement = 'start';
  @property({ type: String, attribute: 'heading' }) heading?: string;
  @property({ type: Boolean, attribute: 'body-scroll' }) bodyScroll = false;
  @property({ type: Boolean, attribute: 'no-backdrop' }) noBackdrop = false;
  @property({ type: Boolean, attribute: 'static-backdrop' }) staticBackdrop = false;
  @property({ type: Boolean, attribute: 'no-close-button' }) noCloseButton = false;
  @property({ type: Boolean }) dark = false;
  /**
   * Data-driven config object. When set, header title, body, and footer
   * come from `config` and slotted children are ignored.
   */
  @property({ type: Object }) config?: OffcanvasConfig;
  /**
   * When set to one of `sm|md|lg|xl|xxl`, renders `.offcanvas-{bp}` so the
   * panel is hidden as an offcanvas only below that breakpoint and becomes
   * an inline column at/above it (Bootstrap "Responsive" variant).
   */
  @property({ type: String }) responsive?: OffcanvasResponsiveBreakpoint;
  /**
   * Render the panel inline (`position: static`) instead of as a fixed
   * drawer. Suppresses the backdrop and the focus trap. Use for in-page
   * documentation / reference rendering of the panel chrome — Bootstrap's
   * "Offcanvas components" docs use the same pattern.
   */
  @property({ type: Boolean, attribute: 'static-display' }) staticDisplay = false;

  @query('[part="panel"]') private _panel!: HTMLElement;
  private _trap = new FocusTrapController(this);

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this._onKeydown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._onKeydown);
    this._trap.deactivate();
  }

  override updated(changed: Map<string, unknown>) {
    super.updated(changed);
    if (changed.has('open')) {
      if (this.open) {
        this.dispatchEvent(new CustomEvent('bs-show', { bubbles: true, composed: true }));
        queueMicrotask(() => this._panel && this._trap.activate(this._panel));
        setTimeout(
          () => this.dispatchEvent(new CustomEvent('bs-shown', { bubbles: true, composed: true })),
          300,
        );
      } else {
        this._trap.deactivate();
        this.dispatchEvent(new CustomEvent('bs-hide', { bubbles: true, composed: true }));
        setTimeout(
          () => this.dispatchEvent(new CustomEvent('bs-hidden', { bubbles: true, composed: true })),
          300,
        );
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

  private _onKeydown = (ev: KeyboardEvent) => {
    if (!this.open) return;
    if (ev.key === 'Escape') this.hide();
  };

  private _onBackdropClick = () => {
    if (!this.staticBackdrop) this.hide();
  };

  override render() {
    const base = this.responsive ? `offcanvas-${this.responsive}` : 'offcanvas';
    const panelClasses = classMap({
      [base]: true,
      [`offcanvas-${this.placement}`]: true,
      'text-bg-dark': this.dark,
      show: this.open || this.staticDisplay,
    });
    const showBackdrop =
      !this.noBackdrop && !this.responsive && !this.staticDisplay && this.open;
    const panelStyle = this.staticDisplay
      ? 'position: static; visibility: visible; transform: none;'
      : this.open || this.responsive
        ? 'visibility: visible'
        : '';
    const cfg = this.config;
    const dataDriven = !!cfg;
    // Title source precedence: config.titleHtml > config.title > heading attr > slot.
    const configTitle = cfg?.title;
    const configTitleHtml = cfg?.titleHtml;
    const effectiveTitle = configTitle ?? this.heading;
    const hasHeader =
      dataDriven
        ? !!(configTitle || configTitleHtml || !this.noCloseButton)
        : !!(this.heading || !this.noCloseButton);
    return html`
      ${showBackdrop
        ? html`<div part="backdrop" class="offcanvas-backdrop fade show" @click=${this._onBackdropClick}></div>`
        : nothing}
      <div
        part="panel"
        class=${panelClasses}
        tabindex="-1"
        role="dialog"
        aria-modal=${this.responsive || this.staticDisplay ? 'false' : 'true'}
        style=${panelStyle}
      >
        ${hasHeader
          ? html`<div part="header" class="offcanvas-header">
              ${configTitleHtml
                ? html`<h5 class="offcanvas-title" .innerHTML=${configTitleHtml}></h5>`
                : effectiveTitle
                  ? html`<h5 class="offcanvas-title">${effectiveTitle}</h5>`
                  : html`<h5 class="offcanvas-title"><slot name="title"></slot></h5>`}
              ${this.noCloseButton
                ? nothing
                : html`<button
                    type="button"
                    class=${classMap({ 'btn-close': true, 'btn-close-white': this.dark })}
                    aria-label="Close"
                    @click=${() => this.hide()}
                  ></button>`}
            </div>`
          : nothing}
        ${dataDriven
          ? html`<div
              part="body"
              class="offcanvas-body"
              .innerHTML=${cfg!.bodyHtml ?? (cfg!.body != null ? String(cfg!.body) : '')}
            ></div>`
          : html`<div part="body" class="offcanvas-body"><slot></slot></div>`}
        ${dataDriven && cfg!.footerHtml
          ? html`<div part="footer" class="offcanvas-footer" .innerHTML=${cfg!.footerHtml}></div>`
          : nothing}
      </div>
    `;
  }
}

defineElement('bs-offcanvas', BsOffcanvas);

declare global {
  interface HTMLElementTagNameMap {
    'bs-offcanvas': BsOffcanvas;
  }
}
