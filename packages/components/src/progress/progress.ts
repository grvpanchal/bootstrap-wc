import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement, type Variant } from '@bootstrap-wc/core';

/**
 * `<bs-progress>` — Bootstrap progress bar. The host carries `.progress` so
 * Bootstrap's `.progress-stacked > .progress` selector can match when the
 * element is slotted inside `<bs-progress-stacked>` through shadow-DOM
 * flattening.
 *
 * @slot - Optional content rendered inside the bar (e.g. label text).
 */
export class BsProgress extends BootstrapElement {
  @property({ type: Number }) value = 0;
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 100;
  @property({ type: String }) variant?: Variant;
  /** Applies `.bg-{variant}` (solid) when set — Bootstrap's default background. */
  @property({ type: String, attribute: 'bar-bg' }) barBg?: Variant;
  /** Applies `.text-bg-{variant}` so text and background are paired (Bootstrap's labels demo). */
  @property({ type: String, attribute: 'bar-text-bg' }) barTextBg?: Variant;
  @property({ type: Boolean }) striped = false;
  @property({ type: Boolean }) animated = false;
  @property({ type: String }) label?: string;
  /** Accessible label for screen readers, applied as `aria-label` on the host. */
  @property({ type: String, attribute: 'aria-label', reflect: true })
  ariaLabelAttr?: string;

  private _pct(): number {
    const range = this.max - this.min;
    if (range <= 0) return 0;
    return Math.max(0, Math.min(100, ((this.value - this.min) / range) * 100));
  }

  /**
   * True when this element is a direct child of `<bs-progress-stacked>`. In
   * that case the host carries the width style, the inner `.progress-bar`
   * fills 100% of it, and Bootstrap's stacked container handles layout.
   */
  private _isStackedSegment(): boolean {
    const parent = this.parentElement;
    return !!parent && parent.tagName === 'BS-PROGRESS-STACKED';
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'progressbar');
  }

  override updated(changed: Map<string, unknown>): void {
    super.updated(changed);
    this.setAttribute('aria-valuenow', String(this.value));
    this.setAttribute('aria-valuemin', String(this.min));
    this.setAttribute('aria-valuemax', String(this.max));
    if (this._isStackedSegment()) {
      // Stacked: segment width goes on the host so siblings add up correctly.
      this.style.width = `${this._pct()}%`;
    } else if (this.style.width) {
      this.style.removeProperty('width');
    }
  }

  protected override hostClasses(): string {
    return 'progress';
  }

  override render() {
    const stacked = this._isStackedSegment();
    // Prefer the explicit bar-bg / bar-text-bg attrs when set, fall back to
    // `variant` for backwards compat (pre-0.4 it mapped to `.bg-{variant}`).
    const solidBg = this.barBg ?? this.variant;
    const textBg = this.barTextBg;
    const barClasses = classMap({
      'progress-bar': true,
      [`bg-${solidBg}`]: !!solidBg && !textBg,
      [`text-bg-${textBg}`]: !!textBg,
      'progress-bar-striped': this.striped || this.animated,
      'progress-bar-animated': this.animated,
    });
    // In stacked mode the outer width lives on the host; bar fills 100%
    // (which is also Bootstrap's stacked CSS default — we mirror it inline so
    // the rule resolves even though it can't pierce our shadow boundary).
    const barStyle = stacked ? 'width: 100%' : `width: ${this._pct()}%`;
    return html`
      <div part="bar" class=${barClasses} style=${barStyle}>
        ${this.label ?? html`<slot></slot>`}
      </div>
    `;
  }
}

/**
 * `<bs-progress-stacked>` — container for multiple `<bs-progress>` segments.
 * Host carries `.progress-stacked` so Bootstrap's `.progress-stacked > .progress`
 * selectors match slotted `<bs-progress>` children (whose hosts carry
 * `.progress`).
 */
export class BsProgressStacked extends BootstrapElement {
  protected override hostClasses(): string {
    return 'progress-stacked';
  }

  override render() {
    return html`<slot></slot>`;
  }
}

defineElement('bs-progress', BsProgress);
defineElement('bs-progress-stacked', BsProgressStacked);

declare global {
  interface HTMLElementTagNameMap {
    'bs-progress': BsProgress;
    'bs-progress-stacked': BsProgressStacked;
  }
}
