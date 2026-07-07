import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

export type NavStyle = 'default' | 'tabs' | 'pills' | 'underline';
export type NavFill = 'none' | 'fill' | 'justified';

/**
 * A single entry in `<bs-nav>`'s data-driven `items` array. Mirrors the
 * public API of `<bs-nav-item>` so callers can hop between slot-driven and
 * prop-driven authoring with the same mental model.
 */
export interface NavItemData {
  /** Visible label. Ignored if `html` is provided. */
  label?: string;
  /** Escape hatch for rich label markup (icon + text, badge, etc.). Uses `.innerHTML` — trust your inputs. */
  html?: string;
  href?: string;
  active?: boolean;
  disabled?: boolean;
  /** `aria-controls` target id (tab pattern). */
  controls?: string;
}

/**
 * `<bs-nav>` — Bootstrap nav container (tabs, pills, underline, or plain).
 * Host carries `.nav` + variant classes so `.nav-tabs .nav-link.active`
 * selectors resolve against slotted `<bs-nav-item>` children.
 *
 * **Dual-nature content:** author children directly, OR set the `items`
 * property (or an `items='[…]'` JSON attribute) to build the nav from data.
 * When both are provided, `items` wins and the slot is ignored — makes it
 * easy to swap between static markup and a zustand/redux store without
 * changing the enclosing template.
 *
 * ```html
 * <!-- Slot form -->
 * <bs-nav nav-style="pills">
 *   <bs-nav-item active>Home</bs-nav-item>
 *   <bs-nav-item href="/about">About</bs-nav-item>
 * </bs-nav>
 *
 * <!-- Data form -->
 * <bs-nav
 *   nav-style="pills"
 *   items='[
 *     {"label":"Home","active":true},
 *     {"label":"About","href":"/about"}
 *   ]'
 * ></bs-nav>
 *
 * <!-- JS-set (typed) form -->
 * <bs-nav id="mainNav" nav-style="pills"></bs-nav>
 * <script>
 *   document.getElementById('mainNav').items = [
 *     { label: 'Home', active: true },
 *     { label: 'About', href: '/about' },
 *   ];
 * </script>
 * ```
 */
export class BsNav extends BootstrapElement {
  @property({ type: String, attribute: 'nav-style' }) navStyle: NavStyle = 'default';
  @property({ type: String }) fill: NavFill = 'none';
  @property({ type: Boolean }) vertical = false;
  /**
   * Data-driven items. When set to a non-empty array, `<bs-nav-item>`
   * children are rendered from this array and the default slot is ignored.
   * Accepts a JSON string via the `items` attribute (Lit's built-in Array
   * converter) or an array assigned to the property directly.
   */
  @property({ type: Array }) items: NavItemData[] = [];

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'tablist');
  }

  protected override hostClasses(): string {
    const parts = ['nav'];
    // When used inside a <bs-navbar>, also emit `.navbar-nav` so
    // Bootstrap's `.navbar .navbar-nav .nav-link` selectors apply
    // across the slot boundary.
    if (this.closest('bs-navbar')) parts.push('navbar-nav');
    if (this.navStyle === 'tabs') parts.push('nav-tabs');
    if (this.navStyle === 'pills') parts.push('nav-pills');
    if (this.navStyle === 'underline') parts.push('nav-underline');
    if (this.fill === 'fill') parts.push('nav-fill');
    if (this.fill === 'justified') parts.push('nav-justified');
    if (this.vertical) parts.push('flex-column');
    return parts.join(' ');
  }

  override render() {
    if (this.items && this.items.length) {
      return html`${this.items.map(
        (item) =>
          html`<bs-nav-item
            ?active=${!!item.active}
            ?disabled=${!!item.disabled}
            href=${item.href ?? '#'}
            controls=${item.controls ?? ''}
            >${item.html
              ? html`<span
                  .innerHTML=${item.html}
                ></span>`
              : (item.label ?? '')}</bs-nav-item
          >`,
      )}`;
    }
    return html`<slot></slot>`;
  }
}

defineElement('bs-nav', BsNav);

declare global {
  interface HTMLElementTagNameMap {
    'bs-nav': BsNav;
  }
}
