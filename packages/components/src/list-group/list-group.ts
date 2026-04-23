import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

export type ListGroupHorizontalBreakpoint = '' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

/**
 * `<bs-list-group>` — container for `<bs-list-group-item>` children. Host
 * carries `.list-group` so Bootstrap's `.list-group > .list-group-item`
 * selectors match the flattened slot tree.
 *
 * The `horizontal` attribute may be set as a boolean (stacks items
 * horizontally at every breakpoint, producing `.list-group-horizontal`) or
 * to a Bootstrap breakpoint value (`sm` / `md` / `lg` / `xl` / `xxl`) to
 * stack horizontally only above that breakpoint.
 */
export class BsListGroup extends BootstrapElement {
  @property({ type: Boolean }) flush = false;
  @property({ type: Boolean }) numbered = false;
  @property({ type: String }) horizontal?: ListGroupHorizontalBreakpoint | boolean;

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
    return html`<slot></slot>`;
  }
}

defineElement('bs-list-group', BsListGroup);

declare global {
  interface HTMLElementTagNameMap {
    'bs-list-group': BsListGroup;
  }
}
