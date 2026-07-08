import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { BootstrapElement, defineElement, type Size, type Variant } from '@bootstrap-wc/core';

/**
 * A single entry in `<bs-button-group>`'s data-driven `buttons` array.
 * Mirrors `<bs-button>`'s public API so callers can hop between
 * slot-driven and prop-driven authoring without changing anything else.
 */
export interface ButtonGroupItemData {
  /** Visible label. Ignored if `html` is provided. */
  label?: string;
  /** Escape hatch for rich label markup. Uses `.innerHTML` — trust your inputs. */
  html?: string;
  variant?: Variant | 'none';
  buttonStyle?: 'solid' | 'outline' | 'link';
  size?: Size;
  href?: string;
  target?: string;
  active?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * `<bs-button-group>` — groups buttons horizontally or vertically. The host
 * element carries `.btn-group` / `.btn-group-vertical` so Bootstrap's
 * `.btn-group > .btn + .btn` sibling selectors match the slotted `<bs-button>`
 * children (whose hosts also carry `.btn`).
 *
 * **Dual-nature content:** author `<bs-button>` children directly, OR set
 * the `buttons` property (or a `buttons='[…]'` JSON attribute) to build
 * the group from data. When both are provided, `buttons` wins.
 *
 * ```html
 * <!-- Slot form -->
 * <bs-button-group>
 *   <bs-button variant="secondary">Left</bs-button>
 *   <bs-button variant="secondary" active>Middle</bs-button>
 *   <bs-button variant="secondary">Right</bs-button>
 * </bs-button-group>
 *
 * <!-- Data form -->
 * <bs-button-group
 *   buttons='[
 *     {"label":"Left","variant":"secondary"},
 *     {"label":"Middle","variant":"secondary","active":true},
 *     {"label":"Right","variant":"secondary"}
 *   ]'
 * ></bs-button-group>
 * ```
 */
export class BsButtonGroup extends BootstrapElement {
  @property({ type: Boolean }) vertical = false;
  @property({ type: String }) size?: Size;
  @property({ type: String }) label = 'Button group';
  /**
   * Data-driven buttons. When set to a non-empty array, `<bs-button>`
   * children are rendered from this array and the default slot is ignored.
   * Each item's `size` defaults to the group's `size` when unset.
   */
  @property({ type: Array }) buttons: ButtonGroupItemData[] = [];

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'group');
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', this.label);
  }

  override updated(changed: Map<string, unknown>): void {
    super.updated(changed);
    if (changed.has('label')) this.setAttribute('aria-label', this.label);
  }

  protected override hostClasses(): string {
    const parts = [this.vertical ? 'btn-group-vertical' : 'btn-group'];
    if (this.size && this.size !== 'md') parts.push(`btn-group-${this.size}`);
    return parts.join(' ');
  }

  override render() {
    if (this.buttons && this.buttons.length) {
      return html`${this.buttons.map((b) => {
        const size = b.size ?? this.size;
        return html`<bs-button
          variant=${b.variant ?? 'primary'}
          button-style=${b.buttonStyle ?? 'solid'}
          size=${size ?? ''}
          type=${b.type ?? 'button'}
          href=${b.href ?? ''}
          target=${b.target ?? ''}
          ?active=${!!b.active}
          ?disabled=${!!b.disabled}
          >${b.html
            ? html`<span .innerHTML=${b.html}></span>`
            : (b.label ?? '')}</bs-button
        >`;
      })}`;
    }
    return html`<slot></slot>`;
  }
}

defineElement('bs-button-group', BsButtonGroup);

declare global {
  interface HTMLElementTagNameMap {
    'bs-button-group': BsButtonGroup;
  }
}
