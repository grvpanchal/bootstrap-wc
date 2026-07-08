import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

/**
 * A single entry in `<bs-accordion>`'s data-driven `items` array. Mirrors
 * `<bs-accordion-item>`'s public API so callers can move between
 * slot-driven and prop-driven authoring without changing anything else.
 */
export interface AccordionItemData {
  /** Header text shown in the collapsed-state button. */
  heading: string;
  /** Panel body text. Ignored if `html` is provided. */
  body?: string;
  /** Escape hatch for rich body markup. Uses `.innerHTML` — trust your inputs. */
  html?: string;
  open?: boolean;
}

/**
 * `<bs-accordion>` — container for `<bs-accordion-item>` children.
 * Enforces single-open behavior unless `always-open` is set.
 *
 * **Dual-nature content:** author `<bs-accordion-item>` children directly,
 * OR set the `items` property (or an `items='[…]'` JSON attribute) to
 * build the accordion from data. When both are provided, `items` wins.
 *
 * ```html
 * <bs-accordion
 *   items='[
 *     {"heading":"First","body":"First body","open":true},
 *     {"heading":"Second","body":"Second body"}
 *   ]'
 * ></bs-accordion>
 * ```
 */
export class BsAccordion extends BootstrapElement {
  @property({ type: Boolean }) flush = false;
  @property({ type: Boolean, attribute: 'always-open' }) alwaysOpen = false;
  /**
   * Data-driven items. When set to a non-empty array,
   * `<bs-accordion-item>` children are rendered from this array and the
   * default slot is ignored.
   */
  @property({ type: Array }) items: AccordionItemData[] = [];

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
    if (this.items && this.items.length) {
      return html`<div part="accordion" class=${classes}>
        ${this.items.map(
          (item) => html`<bs-accordion-item
            heading=${item.heading}
            ?open=${!!item.open}
          >${item.html
            ? html`<span .innerHTML=${item.html}></span>`
            : (item.body ?? '')}</bs-accordion-item>`,
        )}
      </div>`;
    }
    return html`<div part="accordion" class=${classes}><slot></slot></div>`;
  }
}

defineElement('bs-accordion', BsAccordion);

declare global {
  interface HTMLElementTagNameMap {
    'bs-accordion': BsAccordion;
  }
}
