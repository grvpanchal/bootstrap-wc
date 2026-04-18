import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

/**
 * `<bs-accordion>` — container for `<bs-accordion-item>` children.
 * Enforces single-open behavior unless `always-open` is set.
 */
export class BsAccordion extends BootstrapElement {
  @property({ type: Boolean }) flush = false;
  @property({ type: Boolean, attribute: 'always-open' }) alwaysOpen = false;

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('bs-accordion-item-toggle', this._onItemToggle as EventListener);
  }

  private _onItemToggle = (ev: CustomEvent) => {
    if (this.alwaysOpen) return;
    const source = ev.target as HTMLElement;
    if (!(ev.detail as { open?: boolean })?.open) return;
    this.querySelectorAll<HTMLElement>('bs-accordion-item').forEach((item) => {
      if (item !== source) item.removeAttribute('open');
    });
  };

  override render() {
    const classes = classMap({ accordion: true, 'accordion-flush': this.flush });
    return html`<div part="accordion" class=${classes}><slot></slot></div>`;
  }
}

defineElement('bs-accordion', BsAccordion);

declare global {
  interface HTMLElementTagNameMap {
    'bs-accordion': BsAccordion;
  }
}
