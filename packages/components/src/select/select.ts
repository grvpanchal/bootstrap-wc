import { html, nothing, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, FormAssociated, defineElement, type Size } from '@bootstrap-wc/core';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  selected?: boolean;
}

type SlottedOption = {
  kind: 'option';
  value: string;
  label: string;
  disabled: boolean;
  selected: boolean;
};
type SlottedGroup = {
  kind: 'group';
  label: string;
  disabled: boolean;
  children: SlottedOption[];
};
type SlottedHr = { kind: 'hr' };
type SlottedNode = SlottedOption | SlottedGroup | SlottedHr;

/**
 * `<bs-select>` — form-associated Bootstrap `.form-select`.
 *
 * Use the `options` property for data-driven rendering, or author
 * `<option>` / `<optgroup>` children directly — they are mirrored into
 * the internal native `<select>`.
 */
export class BsSelect extends FormAssociated(BootstrapElement) {
  @property({ type: String }) value = '';
  @property({ type: String }) name = '';
  @property({ type: Array }) options: SelectOption[] = [];
  @property({ type: String }) size?: Size;
  @property({ type: Number }) rows?: number;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean }) multiple = false;
  @property({ type: Boolean }) invalid = false;
  @property({ type: Boolean }) valid = false;

  @query('select') private _select!: HTMLSelectElement;
  @state() private _slotted: SlottedNode[] = [];

  private _mo?: MutationObserver;

  override connectedCallback() {
    super.connectedCallback();
    this._syncSlotted();
    this._mo = new MutationObserver(() => this._syncSlotted());
    this._mo.observe(this, { childList: true, subtree: true, attributes: true, characterData: true });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._mo?.disconnect();
    this._mo = undefined;
  }

  override focus() {
    this._select?.focus();
  }

  /**
   * Mirror light-DOM `<option>` / `<optgroup>` / `<hr>` children into
   * shadow state. A `<slot>` inside `<select>` does not actually project
   * options — form controls ignore flattened slot content — so we copy
   * the data across on every mutation.
   */
  private _syncSlotted() {
    const nodes: SlottedNode[] = [];
    let firstSelected: string | null = null;
    const readOption = (el: HTMLOptionElement): SlottedOption => {
      const value = el.hasAttribute('value') ? (el.getAttribute('value') ?? '') : (el.textContent ?? '').trim();
      const selected = el.hasAttribute('selected');
      if (selected && firstSelected === null) firstSelected = value;
      return {
        kind: 'option',
        value,
        label: (el.textContent ?? '').trim(),
        disabled: el.hasAttribute('disabled'),
        selected,
      };
    };
    for (const node of Array.from(this.children)) {
      const tag = node.tagName;
      if (tag === 'OPTION') {
        nodes.push(readOption(node as HTMLOptionElement));
      } else if (tag === 'OPTGROUP') {
        const group: SlottedGroup = {
          kind: 'group',
          label: node.getAttribute('label') ?? '',
          disabled: node.hasAttribute('disabled'),
          children: Array.from(node.children)
            .filter((c) => c.tagName === 'OPTION')
            .map((c) => readOption(c as HTMLOptionElement)),
        };
        nodes.push(group);
      } else if (tag === 'HR') {
        nodes.push({ kind: 'hr' });
      }
    }
    const changed = JSON.stringify(nodes) !== JSON.stringify(this._slotted);
    if (changed) this._slotted = nodes;
    // If no explicit `value` was set but a light-DOM option is `selected`,
    // adopt that as initial form state.
    if (!this.value && !this.options.length && firstSelected !== null) {
      this.value = firstSelected;
    }
  }

  override willUpdate(changed: Map<string, unknown>) {
    if (changed.has('value')) this._setValue(this.value);
  }

  override updated(changed: Map<string, unknown>) {
    super.updated?.(changed);
    // After any render, make sure the native <select>'s value reflects
    // our property (the mirrored options may have just been created).
    if (this._select && this.value && this._select.value !== this.value) {
      this._select.value = this.value;
    }
  }

  private _onChange = (ev: Event) => {
    const target = ev.target as HTMLSelectElement;
    this.value = target.value;
    this._setValue(this.value);
    this.dispatchEvent(new CustomEvent('bs-change', { bubbles: true, composed: true, detail: { value: this.value } }));
  };

  private _renderOption(o: SlottedOption): TemplateResult {
    return html`<option value=${o.value} ?disabled=${o.disabled} ?selected=${o.selected}>${o.label}</option>`;
  }

  override render() {
    const classes = classMap({
      'form-select': true,
      [`form-select-${this.size}`]: !!this.size && this.size !== 'md',
      'is-invalid': this.invalid,
      'is-valid': this.valid,
    });
    return html`
      <select
        part="select"
        class=${classes}
        name=${this.name}
        ?disabled=${this.disabled}
        ?required=${this.required}
        ?multiple=${this.multiple}
        size=${this.rows ?? nothing}
        aria-invalid=${this.invalid ? 'true' : 'false'}
        @change=${this._onChange}
        .value=${this.value}
      >
        ${this.options.length
          ? this.options.map(
              (o) => html`<option
                value=${o.value}
                ?disabled=${o.disabled ?? false}
                ?selected=${o.selected ?? o.value === this.value}
              >
                ${o.label}
              </option>`,
            )
          : nothing}
        ${this._slotted.map((n) => {
          if (n.kind === 'option') return this._renderOption(n);
          if (n.kind === 'hr') return html`<hr />`;
          return html`<optgroup label=${n.label} ?disabled=${n.disabled}>
            ${n.children.map((c) => this._renderOption(c))}
          </optgroup>`;
        })}
      </select>
    `;
  }
}

defineElement('bs-select', BsSelect);

declare global {
  interface HTMLElementTagNameMap {
    'bs-select': BsSelect;
  }
}
