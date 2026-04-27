import { css, html } from 'lit';
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
  /**
   * Bootstrap's accordion radius rules use `:first-of-type` /
   * `:last-of-type` against the `.accordion-item` div — but our
   * `.accordion-item` lives inside this component's shadow root, so it's
   * always the only `.accordion-item` in its scope and every item ends up
   * matching both pseudo-classes (every corner rounded, every border-top
   * present → doubled borders, no flush join, no shared corners).
   *
   * Override the inside-shadow rules so they're inert, then re-apply the
   * radius and border-collapse based on the HOST's position via
   * `:host(:first-child)` / `:host(:last-child)`. The host IS a sibling
   * of other `<bs-accordion-item>` elements inside `<bs-accordion>`, so
   * those structural pseudo-classes resolve correctly.
   */
  static override styles = css`
    /* Disarm Bootstrap's intra-shadow first/last-of-type radius and
     * border-top rules. Each shadow root has exactly one .accordion-item
     * so :first-of-type and :last-of-type both match it, and every item
     * ends up rounded on every corner with its own top border. */
    .accordion-item,
    .accordion-item:first-of-type,
    .accordion-item:last-of-type {
      border-radius: 0;
    }
    .accordion-item {
      /* No border-top by default — restored on the first host below. The
       * border-bottom stays so adjacent items share a single divider. */
      border-top: 0;
    }
    .accordion-item:first-of-type > .accordion-header .accordion-button,
    .accordion-item:last-of-type > .accordion-header .accordion-button.collapsed,
    .accordion-item:last-of-type .accordion-collapse {
      border-radius: 0;
    }

    /* First item: top border + top corners rounded on the .accordion-item
     * box; the button echoes the inner radius on top. Specificity bumped
     * with the duplicated .accordion-item selector segment so these win
     * over Bootstrap's .accordion-item:first-of-type rules. */
    :host(:first-child) .accordion-item {
      border-top: var(--bs-accordion-border-width) solid
        var(--bs-accordion-border-color);
      border-top-left-radius: var(--bs-accordion-border-radius);
      border-top-right-radius: var(--bs-accordion-border-radius);
    }
    :host(:first-child) .accordion-item .accordion-header .accordion-button {
      border-top-left-radius: var(--bs-accordion-inner-border-radius);
      border-top-right-radius: var(--bs-accordion-inner-border-radius);
    }

    /* Last item: bottom corners rounded on the .accordion-item, the
     * .accordion-collapse, and (when collapsed) the button. */
    :host(:last-child) .accordion-item {
      border-bottom-left-radius: var(--bs-accordion-border-radius);
      border-bottom-right-radius: var(--bs-accordion-border-radius);
    }
    :host(:last-child) .accordion-item .accordion-collapse {
      border-bottom-left-radius: var(--bs-accordion-border-radius);
      border-bottom-right-radius: var(--bs-accordion-border-radius);
    }
    :host(:last-child:not([open]))
      .accordion-item
      .accordion-header
      .accordion-button.collapsed {
      border-bottom-left-radius: var(--bs-accordion-inner-border-radius);
      border-bottom-right-radius: var(--bs-accordion-inner-border-radius);
    }
  `;

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
