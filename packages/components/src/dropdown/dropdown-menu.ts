import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

/**
 * `<bs-dropdown-menu>` — the open menu shell ONLY (no toggle, no positioning,
 * no JS lifecycle). Use this when the menu should always be visible — e.g.
 * documentation pages, mega-menus, or composing your own toggleable surface.
 *
 * The host carries `.dropdown-menu` (so descendant Bootstrap selectors like
 * `.dropdown-menu > li > .dropdown-item` resolve through slot flattening) and,
 * optionally, position-static / display utilities to render the menu inline.
 *
 * Slot `<bs-dropdown-item>` children (or any `<li><a class="dropdown-item">`
 * markup) directly.
 *
 * For the toggleable button + menu pattern, use `<bs-dropdown>` instead.
 */
export class BsDropdownMenu extends BootstrapElement {
  /** When true, adds `.show` (and is the typical state for static usage). */
  @property({ type: Boolean, reflect: true }) show = true;
  /** When true (default), adds `.position-static` so the menu participates in normal flow. */
  @property({ type: Boolean, attribute: 'position-static' }) positionStatic = true;
  /**
   * When true, adds `.d-block` to force `display: block`. Off by default since
   * the `.show` class already pulls the menu out of `display: none`, and
   * authors may want a different display (e.g. `.d-grid`) via `class`.
   */
  @property({ type: Boolean, attribute: 'display-block' }) displayBlock = false;
  /** Right-align variant — adds `.dropdown-menu-end`. */
  @property({ type: Boolean, attribute: 'menu-end' }) menuEnd = false;
  /** Dark mode — adds `.dropdown-menu-dark`. */
  @property({ type: Boolean, attribute: 'menu-dark' }) menuDark = false;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'menu');
  }

  protected override hostClasses(): string {
    const parts = ['dropdown-menu'];
    if (this.show) parts.push('show');
    if (this.positionStatic) parts.push('position-static');
    if (this.displayBlock) parts.push('d-block');
    if (this.menuEnd) parts.push('dropdown-menu-end');
    if (this.menuDark) parts.push('dropdown-menu-dark');
    return parts.join(' ');
  }

  override render() {
    return html`<slot></slot>`;
  }
}

defineElement('bs-dropdown-menu', BsDropdownMenu);

declare global {
  interface HTMLElementTagNameMap {
    'bs-dropdown-menu': BsDropdownMenu;
  }
}
