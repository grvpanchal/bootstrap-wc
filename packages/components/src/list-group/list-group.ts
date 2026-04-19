import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

/**
 * `<bs-list-group>` — container for `<bs-list-group-item>` children. Host
 * carries `.list-group` so Bootstrap's `.list-group > .list-group-item`
 * selectors match the flattened slot tree.
 */
export class BsListGroup extends BootstrapElement {
  @property({ type: Boolean }) flush = false;
  @property({ type: Boolean }) numbered = false;
  @property({ type: Boolean }) horizontal = false;

  protected override hostClasses(): string {
    const parts = ['list-group'];
    if (this.flush) parts.push('list-group-flush');
    if (this.numbered) parts.push('list-group-numbered');
    if (this.horizontal) parts.push('list-group-horizontal');
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
