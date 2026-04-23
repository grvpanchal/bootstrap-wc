import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
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
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | 'xxl'
  | 'none';

/**
 * `<bs-navbar>` — Bootstrap navbar with responsive collapse.
 *
 * Bootstrap's navbar selectors split across two scopes: descendant rules
 * like `.navbar-expand-lg .navbar-nav { flex-direction: row }` need to
 * match from the host down into light-DOM `<bs-nav>` children, while
 * shadow-internal rules (`.navbar > .container-fluid` layout) need to
 * match inside the shadow. So we apply `.navbar navbar-expand-*` BOTH on
 * the host (light DOM) AND on the inner `<nav>` in the shadow root.
 *
 * @slot brand - Brand area (logo/title).
 * @slot - Nav content (rendered inside the collapsible container).
 * @slot end - Content aligned to the end (e.g. auth actions).
 */
export class BsNavbar extends BootstrapElement {
  @property({ type: String }) expand: NavbarExpand = 'lg';
  @property({ type: String }) theme: NavbarTheme = 'auto';
  @property({ type: String }) background?: string;
  @property({ type: Boolean }) fluid = true;
  @property({ type: String }) container?: NavbarContainer;
  @property({ type: String }) placement: NavbarPlacement = 'static';
  @property({ type: Boolean }) sticky = false;
  @property({ type: Boolean }) fixed = false;
  @property({ type: String, attribute: 'brand-href' }) brandHref = '#';

  @property({ type: Boolean, reflect: true }) expanded = false;

  private _resolvedPlacement(): NavbarPlacement {
    if (this.placement !== 'static') return this.placement;
    if (this.fixed) return 'fixed-top';
    if (this.sticky) return 'sticky-top';
    return 'static';
  }

  /** Mirror the `.navbar-expand-*` class on the host so Bootstrap's
   *  descendant selectors (`.navbar-expand-lg .navbar-nav`) match slotted
   *  `<bs-nav>` children from the document scope. `.navbar` itself and
   *  the `bg-*` background stay on the inner shadow `<nav>` to avoid
   *  doubling padding/flex rules. */
  protected override hostClasses(): string {
    const parts: string[] = [];
    if (this.expand === 'always') parts.push('navbar-expand');
    else if (this.expand !== 'never') parts.push(`navbar-expand-${this.expand}`);
    return parts.join(' ');
  }

  private _toggle = () => {
    this.expanded = !this.expanded;
  };

  override render() {
    const placement = this._resolvedPlacement();
    // Same classes as host — shadow-scoped rules reach the inner <nav>
    // and its children; document-scoped rules reach slotted children via
    // the host.
    const classes = classMap({
      navbar: true,
      [`navbar-expand-${this.expand}`]: this.expand !== 'always' && this.expand !== 'never',
      'navbar-expand': this.expand === 'always',
      [`bg-${this.background}`]: !!this.background,
      [placement]: placement !== 'static',
    });
    const containerClass =
      this.container === 'none'
        ? null
        : this.container === 'fluid' || (!this.container && this.fluid)
          ? 'container-fluid'
          : this.container
            ? `container-${this.container}`
            : 'container';
    const collapseClasses = classMap({
      'navbar-collapse': true,
      collapse: true,
      show: this.expanded,
    });
    const dataTheme = this.theme === 'auto' ? undefined : this.theme;
    const inner = html`
      ${this.querySelector('[slot="brand"]')
        ? html`<a class="navbar-brand" href=${this.brandHref}><slot name="brand"></slot></a>`
        : nothing}
      <button
        part="toggler"
        class="navbar-toggler"
        type="button"
        aria-expanded=${this.expanded ? 'true' : 'false'}
        aria-label="Toggle navigation"
        @click=${this._toggle}
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div part="collapse" class=${collapseClasses}>
        <slot></slot>
        ${this.querySelector('[slot="end"]') ? html`<slot name="end"></slot>` : nothing}
      </div>
    `;
    return html`
      <nav part="nav" class=${classes} data-bs-theme=${dataTheme ?? ''}>
        ${containerClass
          ? html`<div part="container" class=${containerClass}>${inner}</div>`
          : inner}
      </nav>
    `;
  }
}

defineElement('bs-navbar', BsNavbar);

declare global {
  interface HTMLElementTagNameMap {
    'bs-navbar': BsNavbar;
  }
}
