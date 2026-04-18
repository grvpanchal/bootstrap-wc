import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement, type Variant } from '@bootstrap-wc/core';

/**
 * `<bs-progress>` — Bootstrap progress bar.
 *
 * @slot - Optional content rendered inside the bar (e.g. label).
 */
export class BsProgress extends BootstrapElement {
  @property({ type: Number }) value = 0;
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 100;
  @property({ type: String }) variant: Variant = 'primary';
  @property({ type: Boolean }) striped = false;
  @property({ type: Boolean }) animated = false;
  @property({ type: String }) label?: string;

  private _pct(): number {
    const range = this.max - this.min;
    if (range <= 0) return 0;
    return Math.max(0, Math.min(100, ((this.value - this.min) / range) * 100));
  }

  override render() {
    const pct = this._pct();
    const barClasses = classMap({
      'progress-bar': true,
      [`bg-${this.variant}`]: true,
      'progress-bar-striped': this.striped || this.animated,
      'progress-bar-animated': this.animated,
    });
    return html`
      <div
        part="progress"
        class="progress"
        role="progressbar"
        aria-valuenow=${this.value}
        aria-valuemin=${this.min}
        aria-valuemax=${this.max}
      >
        <div part="bar" class=${barClasses} style="width: ${pct}%">
          ${this.label ?? html`<slot></slot>`}
        </div>
      </div>
    `;
  }
}

defineElement('bs-progress', BsProgress);

declare global {
  interface HTMLElementTagNameMap {
    'bs-progress': BsProgress;
  }
}
