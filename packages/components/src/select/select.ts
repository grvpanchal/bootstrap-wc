import { html, nothing, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement, type Size } from '@bootstrap-wc/core';

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
 * `<bs-select>` — Bootstrap `.form-select`. Renders the native `<select>`
 * into LIGHT DOM so browser autofill picks up `name + autocomplete`
 * tokens like every other native form control. See `bs-input` for the
 * full rationale.
 *
 * Use the `options` property for data-driven rendering, or author
 * `<option>` / `<optgroup>` children directly — they're snapshotted on
 * first connect and rendered inside the native `<select>`.
 */
export class BsSelect extends BootstrapElement {
  @property({ type: String }) value = '';
  @property({ type: String }) name = '';
  @property({ type: String }) autocomplete?: string;
  @property({ type: Array }) options: SelectOption[] = [];
  @property({ type: String }) size?: Size;
  @property({ type: Number }) rows?: number;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean }) multiple = false;
  @property({ type: Boolean }) invalid = false;
  @property({ type: Boolean }) valid = false;

  @query('select') private _select!: HTMLSelectElement;
  @state() private _initialSlotted: SlottedNode[] = [];

  protected override createRenderRoot(): HTMLElement {
    return this;
  }

  override connectedCallback() {
    // Snapshot author-provided option/optgroup/hr children BEFORE Lit's
    // light-DOM render replaces them.
    if (!this._initialSlotted.length) {
      this._initialSlotted = this._readUserOptions();
      // Remove the user's option/optgroup/hr nodes; the render template
      // re-emits them inside the native <select>.
      for (const child of Array.from(this.children)) {
        const tag = child.tagName;
        if (tag === 'OPTION' || tag === 'OPTGROUP' || tag === 'HR') child.remove();
      }
    }
    super.connectedCallback();
    this.style.display = this.style.display || 'contents';
  }

  override focus() {
    this._select?.focus();
  }

  /** Native `<select>` reference. */
  get nativeSelect(): HTMLSelectElement | null {
    return this._select ?? null;
  }

  private _readUserOptions(): SlottedNode[] {
    const nodes: SlottedNode[] = [];
    let firstSelected: string | null = null;
    const readOption = (el: HTMLOptionElement): SlottedOption => {
      const value = el.hasAttribute('value')
        ? (el.getAttribute('value') ?? '')
        : (el.textContent ?? '').trim();
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
      if (tag === 'OPTION') nodes.push(readOption(node as HTMLOptionElement));
      else if (tag === 'OPTGROUP') {
        nodes.push({
          kind: 'group',
          label: node.getAttribute('label') ?? '',
          disabled: node.hasAttribute('disabled'),
          children: Array.from(node.children)
            .filter((c) => c.tagName === 'OPTION')
            .map((c) => readOption(c as HTMLOptionElement)),
        });
      } else if (tag === 'HR') {
        nodes.push({ kind: 'hr' });
      }
    }
    if (!this.value && !this.options.length && firstSelected !== null) {
      this.value = firstSelected;
    }
    return nodes;
  }

  override updated(changed: Map<string, unknown>) {
    super.updated?.(changed);
    if (this._select && this.value && this._select.value !== this.value) {
      this._select.value = this.value;
    }
  }

  private _onChange = (ev: Event) => {
    const target = ev.target as HTMLSelectElement;
    this.value = target.value;
    this.dispatchEvent(
      new CustomEvent('bs-change', { bubbles: true, composed: true, detail: { value: this.value } }),
    );
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
    return html`<select
      part="select"
      class=${classes}
      name=${this.name}
      id=${this.id ? `${this.id}__native` : nothing}
      autocomplete=${this.autocomplete ?? nothing}
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
      ${this._initialSlotted.map((n) => {
        if (n.kind === 'option') return this._renderOption(n);
        if (n.kind === 'hr') return html`<hr />`;
        return html`<optgroup label=${n.label} ?disabled=${n.disabled}>
          ${n.children.map((c) => this._renderOption(c))}
        </optgroup>`;
      })}
    </select>`;
  }
}

defineElement('bs-select', BsSelect);

declare global {
  interface HTMLElementTagNameMap {
    'bs-select': BsSelect;
  }
}
