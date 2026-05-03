import { css, html } from 'lit';
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
 * The toggle behavior (collapse / offcanvas / external collapse) is left to
 * the author's markup so the full set of Bootstrap navbar patterns work as
 * documented — wire the toggler with `data-bs-toggle` / `data-bs-target`
 * and load `bootstrap.bundle.min.js` (or use `<bs-collapse>` /
 * `<bs-offcanvas>` directly).
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
    return containerClass
      ? html`<div part="container" class=${containerClass}><slot></slot></div>`
      : html`<slot></slot>`;
  }
}

defineElement('bs-navbar', BsNavbar);

declare global {
  interface HTMLElementTagNameMap {
    'bs-navbar': BsNavbar;
  }
}
