import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

/**
 * `<bs-list-group>` — container for `<bs-list-group-item>` elements.
 */
export class BsListGroup extends BootstrapElement {
  @property({ type: Boolean }) flush = false;
  @property({ type: Boolean }) numbered = false;
  @property({ type: Boolean }) horizontal = false;

  override render() {
    const classes = classMap({
      'list-group': true,
      'list-group-flush': this.flush,
      'list-group-numbered': this.numbered,
      'list-group-horizontal': this.horizontal,
    });
    return this.numbered
      ? html`<ol part="list" class=${classes}><slot></slot></ol>`
      : html`<ul part="list" class=${classes}><slot></slot></ul>`;
  }
}

defineElement('bs-list-group', BsListGroup);

declare global {
  interface HTMLElementTagNameMap {
    'bs-list-group': BsListGroup;
  }
}
