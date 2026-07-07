import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { BootstrapElement, defineElement, type Variant } from '@bootstrap-wc/core';

export type ListGroupHorizontalBreakpoint = '' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

/**
 * A single entry in `<bs-list-group>`'s data-driven `items` array. Mirrors
 * `<bs-list-group-item>`'s public API so callers can move between
 * slot-driven and prop-driven authoring without changing anything else.
 */
export interface ListGroupItemData {
  /** Plain text content. Ignored if `html` is provided. */
  text?: string;
  /** Escape hatch for rich content (headings, badges, images). Uses `.innerHTML` — trust your inputs. */
  html?: string;
  href?: string;
  active?: boolean;
  disabled?: boolean;
  action?: boolean;
  variant?: Variant;
}

/**
 * `<bs-list-group>` — container for `<bs-list-group-item>` children. Host
 * carries `.list-group` so Bootstrap's `.list-group > .list-group-item`
 * selectors match the flattened slot tree.
 *
 * The `horizontal` attribute may be set as a boolean (stacks items
 * horizontally at every breakpoint, producing `.list-group-horizontal`) or
 * to a Bootstrap breakpoint value (`sm` / `md` / `lg` / `xl` / `xxl`) to
 * stack horizontally only above that breakpoint.
 *
 * **Dual-nature content:** author `<bs-list-group-item>` children directly,
 * OR set the `items` property (or an `items='[…]'` JSON attribute) to
 * build the list from data. When both are provided, `items` wins.
 *
 * ```html
 * <!-- Slot form -->
 * <bs-list-group>
 *   <bs-list-group-item active>Item 1</bs-list-group-item>
 *   <bs-list-group-item>Item 2</bs-list-group-item>
 * </bs-list-group>
 *
 * <!-- Data form -->
 * <bs-list-group
 *   items='[
 *     {"text":"Item 1","active":true},
 *     {"text":"Item 2"}
 *   ]'
 * ></bs-list-group>
 * ```
 */
export class BsListGroup extends BootstrapElement {
  @property({ type: Boolean }) flush = false;
  @property({ type: Boolean }) numbered = false;
  @property({ type: String }) horizontal?: ListGroupHorizontalBreakpoint | boolean;
  /**
   * Underlying list semantics. `"ul"` (default) keeps the existing
   * `<ul>` / `<li>` shape — items announce as list items. `"div"` switches
   * to the `<div>` / `<a>` shape Bootstrap shows for rich link lists; child
   * `<bs-list-group-item>` hosts pick this up via property inheritance and
   * adapt their semantics (role="link", focusable). The visual `.list-group`
   * styling is identical in either mode.
   */
  @property({ type: String }) as: 'ul' | 'div' = 'ul';
  /**
   * Data-driven items. When set to a non-empty array, `<bs-list-group-item>`
   * children are rendered from this array and the default slot is ignored.
   */
  @property({ type: Array }) items: ListGroupItemData[] = [];

  protected override hostClasses(): string {
    const parts = ['list-group'];
    if (this.flush) parts.push('list-group-flush');
    if (this.numbered) parts.push('list-group-numbered');
    const h = this.horizontal;
    if (h === true || h === '') {
      parts.push('list-group-horizontal');
    } else if (typeof h === 'string' && h.length > 0) {
      parts.push(`list-group-horizontal-${h}`);
    }
    return parts.join(' ');
  }

  override render() {
    if (this.items && this.items.length) {
      return html`${this.items.map(
        (item) =>
          html`<bs-list-group-item
            ?active=${!!item.active}
            ?disabled=${!!item.disabled}
            ?action=${!!item.action}
            href=${item.href ?? ''}
            variant=${item.variant ?? ''}
            >${item.html
              ? html`<span .innerHTML=${item.html}></span>`
              : (item.text ?? '')}</bs-list-group-item
          >`,
      )}`;
    }
    return html`<slot></slot>`;
  }
}

defineElement('bs-list-group', BsListGroup);

declare global {
  interface HTMLElementTagNameMap {
    'bs-list-group': BsListGroup;
  }
}
