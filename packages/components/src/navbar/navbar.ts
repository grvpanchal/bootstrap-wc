import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

export type NavbarExpand = 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'always' | 'never';
export type NavbarTheme = 'light' | 'dark' | 'auto';

/**
 * `<bs-navbar>` — Bootstrap navbar with responsive collapse.
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
  @property({ type: Boolean }) sticky = false;
  @property({ type: Boolean }) fixed = false;
  @property({ type: String, attribute: 'brand-href' }) brandHref = '#';

  @property({ type: Boolean, reflect: true }) expanded = false;

  private _toggle = () => {
    this.expanded = !this.expanded;
  };

  override render() {
    const classes = classMap({
      navbar: true,
      [`navbar-expand-${this.expand}`]: this.expand !== 'always' && this.expand !== 'never',
      'navbar-expand': this.expand === 'always',
      [`bg-${this.background}`]: !!this.background,
      'sticky-top': this.sticky,
      'fixed-top': this.fixed,
    });
    const containerClass = this.fluid ? 'container-fluid' : 'container';
    const collapseClasses = classMap({
      'navbar-collapse': true,
      collapse: true,
      show: this.expanded,
    });
    const dataTheme = this.theme === 'auto' ? undefined : this.theme;
    return html`
      <nav part="nav" class=${classes} data-bs-theme=${dataTheme ?? ''}>
        <div class="${containerClass}">
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
        </div>
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
