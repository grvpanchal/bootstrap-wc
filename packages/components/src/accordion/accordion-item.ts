import { html } from 'lit';
import { property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

let _id = 0;

/**
 * `<bs-accordion-item>` — a single accordion panel. Slot `header` for the
 * collapsed-state label; the default slot is the panel body.
 *
 * @fires bs-accordion-item-toggle - `{detail: {open}}` on state change.
 */
export class BsAccordionItem extends BootstrapElement {
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: String }) heading?: string;

  @query('.accordion-collapse') private _panel!: HTMLElement;

  private _uid = `bs-ai-${++_id}`;

  private _toggle = () => {
    this.open = !this.open;
    this.dispatchEvent(
      new CustomEvent('bs-accordion-item-toggle', {
        bubbles: true,
        composed: true,
        detail: { open: this.open },
      }),
    );
  };

  override updated(changed: Map<string, unknown>) {
    if (changed.has('open') && this._panel) {
      if (this.open) {
        this._panel.style.height = `${this._panel.scrollHeight}px`;
        this._panel.addEventListener(
          'transitionend',
          () => {
            this._panel.style.height = '';
          },
          { once: true },
        );
      } else {
        this._panel.style.height = `${this._panel.scrollHeight}px`;
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this._panel.offsetHeight;
        this._panel.style.height = '0px';
      }
    }
  }

  override render() {
    const buttonClasses = classMap({
      'accordion-button': true,
      collapsed: !this.open,
    });
    const collapseClasses = classMap({
      'accordion-collapse': true,
      collapse: true,
      show: this.open,
    });
    const bodyId = `${this._uid}-body`;
    const headId = `${this._uid}-head`;
    return html`
      <div part="item" class="accordion-item">
        <h2 class="accordion-header" id=${headId}>
          <button
            part="button"
            class=${buttonClasses}
            type="button"
            aria-expanded=${this.open ? 'true' : 'false'}
            aria-controls=${bodyId}
            @click=${this._toggle}
          >
            ${this.heading ?? html`<slot name="header"></slot>`}
          </button>
        </h2>
        <div
          part="panel"
          id=${bodyId}
          class=${collapseClasses}
          role="region"
          aria-labelledby=${headId}
        >
          <div class="accordion-body"><slot></slot></div>
        </div>
      </div>
    `;
  }
}

defineElement('bs-accordion-item', BsAccordionItem);

declare global {
  interface HTMLElementTagNameMap {
    'bs-accordion-item': BsAccordionItem;
  }
}
