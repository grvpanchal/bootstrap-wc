import { css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

export type NavbarExpand = 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'always' | 'never';
export type NavbarTheme = 'light' | 'dark' | 'auto';
export type NavbarPlacement =
  | 'static'
  | 'fixed-top'
  | 'fixed-bottom'
  | 'sticky-top'
  | 'sticky-bottom';
export type NavbarContainer =
  | 'fluid'
  | 'default'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | 'xxl'
  | 'none';

/**
 * A single link entry in `<bs-navbar>`'s data-driven config. `children`
 * turns a top-level entry into a dropdown; nested `children` beyond one
 * level become dropdown submenus (a `.dropdown-submenu` on the inner
 * dropdown host).
 */
export interface NavbarLink {
  label: string;
  href?: string;
  active?: boolean;
  disabled?: boolean;
  children?: NavbarLink[];
}

/**
 * `<bs-navbar>`'s data-driven config object. When set, the component
 * emits its own brand + toggler + collapse + left/right link lists from
 * this data — no children required. Set the object via JS (`el.config = …`)
 * or via a JSON attribute (`config='{…}'`).
 */
export interface NavbarConfig {
  brand?: {
    label?: string;
    href?: string;
    /** URL of an icon rendered before the label. */
    logoSrc?: string;
  };
  /** Left-aligned nav (`.me-auto`). */
  links?: NavbarLink[];
  /** Right-aligned nav (`.ms-auto`). Optional. */
  right?: NavbarLink[];
  /** Id assigned to the collapse element. Defaults to `bs-navbar-collapse`. */
  collapseId?: string;
}

/**
 * `<bs-navbar>` — Bootstrap navbar chrome.
 *
 * The host IS the `.navbar`. Bootstrap's `.navbar`, `.navbar-expand-{x}`,
 * `bg-{x}`, the placement class (`fixed-top` etc.), and the legacy
 * `.navbar-dark` / `.navbar-light` (for `theme="dark"` / `"light"`) are
 * mirrored onto the host via `hostClasses()`. Children rendered in light DOM
 * — typically `<a class="navbar-brand">`, `<button class="navbar-toggler">`,
 * `<div class="collapse navbar-collapse">`, `<bs-offcanvas>`, or anything
 * else — are projected through the inner `[part="container"]` wrapper so
 * Bootstrap's `.navbar > .container-fluid { display: flex; ... }` rule
 * still applies.
 *
 * **Dual-nature content:** either author the brand / toggler / links as
 * children, OR set the `config` property to build the whole navbar from
 * data (brand, left links, right links, dropdowns w/ nested submenus).
 * When both are provided, `config` wins and the slot is ignored — makes it
 * easy to hop between a static markup version and a
 * store-driven (zustand / redux / signals) version without changing
 * anything around the `<bs-navbar>`.
 *
 * ```html
 * <!-- Slot form -->
 * <bs-navbar theme="dark" background="dark">
 *   <a class="navbar-brand" href="/">Site</a>
 *   <button class="navbar-toggler" data-bs-toggle="collapse"
 *           data-bs-target="#nav">…</button>
 *   <div id="nav" class="collapse navbar-collapse">
 *     <bs-nav>…</bs-nav>
 *   </div>
 * </bs-navbar>
 *
 * <!-- Data form -->
 * <bs-navbar theme="dark" background="dark"
 *   config='{
 *     "brand": {"label":"Site","href":"/"},
 *     "links": [
 *       {"label":"Home","href":"/","active":true},
 *       {"label":"Docs","children":[
 *         {"label":"Getting started","href":"/docs"},
 *         {"label":"API","href":"/api"}
 *       ]}
 *     ],
 *     "right": [{"label":"Sign in","href":"/login"}]
 *   }'
 * ></bs-navbar>
 * ```
 *
 * @csspart container - The `.container-fluid` (or sized container) wrapper.
 *                      Suppress with `container="none"` to project content
 *                      directly into the host.
 */
export class BsNavbar extends BootstrapElement {
  // The shadow `[part="container"]` mirrors Bootstrap's
  // `.navbar > .container-fluid { display: flex; ... }` rule, which can't
  // reach across the shadow boundary from the document-scope stylesheet.
  static override styles = [
    css`
      :host > [part='container'] {
        display: flex;
        flex-wrap: inherit;
        align-items: center;
        justify-content: space-between;
      }
    `,
  ];

  @property({ type: String }) expand: NavbarExpand = 'lg';
  @property({ type: String }) theme: NavbarTheme = 'auto';
  @property({ type: String }) background?: string;
  @property({ type: Boolean }) fluid = true;
  @property({ type: String }) container?: NavbarContainer;
  @property({ type: String }) placement: NavbarPlacement = 'static';
  @property({ type: Boolean }) sticky = false;
  @property({ type: Boolean }) fixed = false;
  /**
   * Data-driven config. When set, the navbar renders its own brand,
   * toggler, and left/right nav lists from this object; the default slot
   * is ignored.
   */
  @property({ type: Object }) config?: NavbarConfig;

  private _resolvedPlacement(): NavbarPlacement {
    if (this.placement !== 'static') return this.placement;
    if (this.fixed) return 'fixed-top';
    if (this.sticky) return 'sticky-top';
    return 'static';
  }

  protected override hostClasses(): string {
    const parts: string[] = ['navbar'];
    if (this.expand === 'always') parts.push('navbar-expand');
    else if (this.expand !== 'never') parts.push(`navbar-expand-${this.expand}`);
    if (this.background) parts.push(`bg-${this.background}`);
    if (this.theme === 'dark') parts.push('navbar-dark');
    else if (this.theme === 'light') parts.push('navbar-light');
    const placement = this._resolvedPlacement();
    if (placement !== 'static') parts.push(placement);
    return parts.join(' ');
  }

  private _renderLink(link: NavbarLink, submenu = false) {
    if (link.children && link.children.length) {
      // Recurse: turn every level of children into a nested <bs-dropdown>.
      // Top-level uses `nav` mode (flat nav-link trigger); nested submenus
      // add `.dropdown-submenu` so the shim CSS opens them to the right.
      const submenuItems = link.children.map((c) =>
        c.children && c.children.length
          ? { html: `<span class="dropdown-item">${c.label}</span>` } // downgrade deeply-nested to plain items
          : { label: c.label, href: c.href, active: c.active, disabled: c.disabled },
      );
      return html`<bs-dropdown
        ?nav=${!submenu}
        class=${submenu ? 'dropdown-submenu' : nothing}
        label=${link.label}
        .items=${submenuItems}
      ></bs-dropdown>`;
    }
    const classes = ['nav-link'];
    if (link.active) classes.push('active');
    if (link.disabled) classes.push('disabled');
    return html`<li class="nav-item">
      <a class=${classes.join(' ')} href=${link.href ?? '#'} aria-current=${link.active ? 'page' : nothing}>${link.label}</a>
    </li>`;
  }

  private _renderConfigDriven() {
    const cfg = this.config!;
    const collapseId = cfg.collapseId ?? 'bs-navbar-collapse';
    const brand = cfg.brand
      ? html`<a class="navbar-brand" href=${cfg.brand.href ?? '#'}>
          ${cfg.brand.logoSrc
            ? html`<img
                src=${cfg.brand.logoSrc}
                alt=""
                width="24"
                height="24"
                class="me-2"
              />`
            : nothing}${cfg.brand.label ?? ''}
        </a>`
      : nothing;
    const toggler = html`<button
      class="navbar-toggler"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target=${'#' + collapseId}
      aria-controls=${collapseId}
      aria-expanded="false"
      aria-label="Toggle navigation"
    >
      <span class="navbar-toggler-icon"></span>
    </button>`;
    const leftUl = (cfg.links ?? []).length
      ? html`<ul class="navbar-nav me-auto">
          ${(cfg.links ?? []).map((l) => this._renderLink(l))}
        </ul>`
      : nothing;
    const rightUl = (cfg.right ?? []).length
      ? html`<ul class="navbar-nav ms-auto">
          ${(cfg.right ?? []).map((l) => this._renderLink(l))}
        </ul>`
      : nothing;
    return html`${brand}${toggler}
      <div id=${collapseId} class="collapse navbar-collapse">
        ${leftUl}${rightUl}
      </div>`;
  }

  override render() {
    const containerClass =
      this.container === 'none'
        ? null
        : this.container === 'default'
          ? 'container'
          : this.container === 'fluid' || (!this.container && this.fluid)
            ? 'container-fluid'
            : this.container
              ? `container-${this.container}`
              : 'container';
    const dataDriven = !!this.config;
    const body = dataDriven ? this._renderConfigDriven() : html`<slot></slot>`;
    return containerClass
      ? html`<div part="container" class=${containerClass}>${body}</div>`
      : body;
  }
}

defineElement('bs-navbar', BsNavbar);

declare global {
  interface HTMLElementTagNameMap {
    'bs-navbar': BsNavbar;
  }
}
