import { css, html, nothing } from 'lit';
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
  | 'default'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | 'xxl'
  | 'none';

/**
 * `<bs-navbar>` — Bootstrap navbar with responsive collapse.
 *
 * The host IS the `.navbar`. `.navbar`, `.navbar-expand-{x}`, `bg-{x}`, and
 * the placement class (`fixed-top` etc.) are mirrored onto the host via
 * `hostClasses()`, so:
 *   1. The host fills its row like a native `<nav class="navbar">` and
 *      author classes like `mb-4` apply normally.
 *   2. Bootstrap's descendant selectors (`.navbar-expand-lg .navbar-nav`,
 *      `.navbar > .container-fluid`) match against slotted children and the
 *      single shadow `[part="container"]` directly.
 *
 * @slot brand - Brand area (logo/title) rendered inside `.navbar-brand`.
 * @slot - Nav content (rendered inside the collapsible container).
 * @slot end - Content aligned to the end (e.g. auth actions, search).
 *
 * @csspart container - The `.container-fluid` (or sized container) wrapper.
 * @csspart toggler - The hamburger toggle button.
 * @csspart collapse - The `.collapse.navbar-collapse` wrapper.
 */
export class BsNavbar extends BootstrapElement {
  // Shadow-scoped reproductions of Bootstrap navbar selectors that can't
  // reach across the shadow boundary from the document-scope stylesheet:
  //   1. `.navbar > .container-fluid { display: flex; ... }`
  //   2. `.navbar-expand-{x} .navbar-toggler { display: none; }` at the
  //      breakpoint
  //   3. `.navbar-expand-{x} .navbar-collapse { display: flex !important;
  //      flex-basis: auto; }` at the breakpoint
  static override styles = [
    css`
      :host > [part='container'] {
        display: flex;
        flex-wrap: inherit;
        align-items: center;
        justify-content: space-between;
      }
      :host(.navbar-expand) [part='toggler'] {
        display: none;
      }
      :host(.navbar-expand) [part='collapse'] {
        display: flex !important;
        flex-basis: auto;
      }
      @media (min-width: 576px) {
        :host(.navbar-expand-sm) [part='toggler'] {
          display: none;
        }
        :host(.navbar-expand-sm) [part='collapse'] {
          display: flex !important;
          flex-basis: auto;
        }
      }
      @media (min-width: 768px) {
        :host(.navbar-expand-md) [part='toggler'] {
          display: none;
        }
        :host(.navbar-expand-md) [part='collapse'] {
          display: flex !important;
          flex-basis: auto;
        }
      }
      @media (min-width: 992px) {
        :host(.navbar-expand-lg) [part='toggler'] {
          display: none;
        }
        :host(.navbar-expand-lg) [part='collapse'] {
          display: flex !important;
          flex-basis: auto;
        }
      }
      @media (min-width: 1200px) {
        :host(.navbar-expand-xl) [part='toggler'] {
          display: none;
        }
        :host(.navbar-expand-xl) [part='collapse'] {
          display: flex !important;
          flex-basis: auto;
        }
      }
      @media (min-width: 1400px) {
        :host(.navbar-expand-xxl) [part='toggler'] {
          display: none;
        }
        :host(.navbar-expand-xxl) [part='collapse'] {
          display: flex !important;
          flex-basis: auto;
        }
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
  @property({ type: String, attribute: 'brand-href' }) brandHref = '#';

  @property({ type: Boolean, reflect: true }) expanded = false;

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
    const placement = this._resolvedPlacement();
    if (placement !== 'static') parts.push(placement);
    return parts.join(' ');
  }

  override updated(changed: Map<string, unknown>) {
    super.updated(changed);
    if (changed.has('theme')) {
      if (this.theme === 'auto') this.removeAttribute('data-bs-theme');
      else this.setAttribute('data-bs-theme', this.theme);
    }
  }

  private _toggle = () => {
    this.expanded = !this.expanded;
  };

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
    const collapseClasses = classMap({
      'navbar-collapse': true,
      collapse: true,
      show: this.expanded,
    });
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
    return containerClass
      ? html`<div part="container" class=${containerClass}>${inner}</div>`
      : inner;
  }
}

defineElement('bs-navbar', BsNavbar);

declare global {
  interface HTMLElementTagNameMap {
    'bs-navbar': BsNavbar;
  }
}
