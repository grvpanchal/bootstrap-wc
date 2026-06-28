import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { BootstrapElement, defineElement, type Variant } from '@bootstrap-wc/core';

export type TableSize = 'sm';
/**
 * Responsive breakpoint values. The empty string (presence-only attribute,
 * e.g. `<bs-table responsive>`) means "always wrap" (`.table-responsive`).
 * A breakpoint name wraps only below that breakpoint
 * (`.table-responsive-{bp}`).
 */
export type TableResponsive = '' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

/**
 * `<bs-table>` — Bootstrap table styling wrapper.
 *
 * Because the HTML parser drops `<thead>` / `<tbody>` / `<tr>` outside a
 * `<table>` ancestor (HTML5 spec: "in body" mode ignores those start tags),
 * authors must nest a real `<table>` inside `<bs-table>`. The component
 * applies `.table` + all the configured modifier classes to that inner
 * table, and (when `responsive` is set) gives the host the
 * `.table-responsive[-{bp}]` class so the table scrolls horizontally
 * inside it.
 *
 * ```html
 * <bs-table responsive striped hover variant="dark">
 *   <table>
 *     <thead>
 *       <tr><th scope="col">#</th><th scope="col">Name</th></tr>
 *     </thead>
 *     <tbody>
 *       <tr><th scope="row">1</th><td>Mark</td></tr>
 *     </tbody>
 *   </table>
 * </bs-table>
 * ```
 *
 * Light-DOM render — Bootstrap's table CSS lives in the document scope and
 * applies directly to the inner `<table>` and the host.
 *
 * @csspart table - The inner `<table>` element after class management.
 */
export class BsTable extends BootstrapElement {
  /** Contextual color variant for the whole table (`primary`, `dark`, …). */
  @property({ type: String }) variant?: Variant;
  /** Zebra-striped rows (`.table-striped`). */
  @property({ type: Boolean }) striped = false;
  /** Striped columns (`.table-striped-columns`). */
  @property({ type: Boolean, attribute: 'striped-columns' }) stripedColumns = false;
  /** Borders on the table and every cell (`.table-bordered`). */
  @property({ type: Boolean }) bordered = false;
  /** Strip all borders (`.table-borderless`). */
  @property({ type: Boolean }) borderless = false;
  /**
   * Color the border via `border-{variant}` — typically paired with
   * `bordered`. e.g. `<bs-table bordered border-variant="primary">`.
   */
  @property({ type: String, attribute: 'border-variant' }) borderVariant?: Variant;
  /** Hoverable rows (`.table-hover`). */
  @property({ type: Boolean }) hover = false;
  /** Compact (`.table-sm`). */
  @property({ type: String }) size?: TableSize;
  /**
   * Wrap in a horizontally-scrollable container.
   *   - presence-only (`<bs-table responsive>`) → `.table-responsive` (always)
   *   - `responsive="sm"` … `"xxl"` → `.table-responsive-{bp}` (below bp)
   */
  @property({ type: String }) responsive?: TableResponsive;
  /** Move the caption to the top of the table (`.caption-top`). */
  @property({ type: Boolean, attribute: 'caption-top' }) captionTop = false;
  /**
   * Add `.table-group-divider` to the inner `<tbody>` for a thicker
   * divider between header and body — Bootstrap's recommended pattern
   * for separating the head from the body.
   */
  @property({ type: Boolean, attribute: 'group-divider' }) groupDivider = false;

  private _observer?: MutationObserver;

  /** Render into light DOM — the inner `<table>` is authored by the user
   *  and we just apply CSS classes; no shadow tree needed. */
  protected override createRenderRoot(): HTMLElement {
    return this;
  }

  protected override hostClasses(): string {
    if (this.responsive === undefined) return '';
    if (this.responsive === '' || this.responsive === null) return 'table-responsive';
    return `table-responsive-${this.responsive}`;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Watch for inner `<table>` (or its `<tbody>`) appearing late — e.g.
    // server-rendered rows, dynamic row insertion — so the class set
    // stays correct.
    this._observer = new MutationObserver(() => this._applyTableClasses());
    this._observer.observe(this, { childList: true, subtree: true });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._observer?.disconnect();
    this._observer = undefined;
  }

  override updated(changed: Map<string, unknown>): void {
    super.updated(changed);
    this._applyTableClasses();
  }

  /** Resolve `.table` + modifier classes on the inner `<table>` and
   *  `.table-group-divider` on its `<tbody>`. Idempotent — safe to call
   *  on every render and on every mutation. */
  private _applyTableClasses(): void {
    const table = this.querySelector(':scope > table') as HTMLTableElement | null;
    if (!table) return;
    table.classList.add('table');
    // Variant
    this._toggleVariantClass(table, 'table-', this.variant);
    // Modifier booleans
    table.classList.toggle('table-striped', this.striped);
    table.classList.toggle('table-striped-columns', this.stripedColumns);
    table.classList.toggle('table-bordered', this.bordered);
    table.classList.toggle('table-borderless', this.borderless);
    table.classList.toggle('table-hover', this.hover);
    table.classList.toggle('table-sm', this.size === 'sm');
    table.classList.toggle('caption-top', this.captionTop);
    // Border variant
    this._toggleVariantClass(table, 'border-', this.borderVariant);
    // tbody divider
    for (const tbody of Array.from(table.tBodies)) {
      tbody.classList.toggle('table-group-divider', this.groupDivider);
    }
    // Make the inner table addressable via ::part(table) — Lit's part
    // directive only works in shadow templates, so set the attribute
    // imperatively.
    if (!table.hasAttribute('part')) table.setAttribute('part', 'table');
  }

  /** Manage a prefix-N class group (e.g. `table-*`) so changing the
   *  variant strips the previous value before adding the new one. */
  private _toggleVariantClass(
    table: HTMLTableElement,
    prefix: string,
    next: string | undefined,
  ): void {
    for (const c of Array.from(table.classList)) {
      if (c.startsWith(prefix) && c !== 'table-striped' && c !== 'table-striped-columns'
          && c !== 'table-bordered' && c !== 'table-borderless' && c !== 'table-hover'
          && c !== 'table-sm' && c !== 'table-group-divider') {
        // Only strip the variant slot — leave the modifier classes alone.
        if (prefix === 'table-' && next !== undefined && c === `table-${next}`) continue;
        if (prefix === 'border-' && next !== undefined && c === `border-${next}`) continue;
        // For prefix === 'table-': only strip color-variant matches.
        if (prefix === 'table-' && !this._isColorVariant(c.slice('table-'.length))) continue;
        table.classList.remove(c);
      }
    }
    if (next) table.classList.add(`${prefix}${next}`);
  }

  private _isColorVariant(s: string): boolean {
    return [
      'primary', 'secondary', 'success', 'danger', 'warning', 'info',
      'light', 'dark',
    ].includes(s);
  }

  override render() {
    // Light DOM, no children-replacing template — the user's `<table>` is
    // the actual visible content. Returning `nothing` is intentional;
    // updated() handles class management.
    return nothing;
  }
}

defineElement('bs-table', BsTable);

declare global {
  interface HTMLElementTagNameMap {
    'bs-table': BsTable;
  }
}
