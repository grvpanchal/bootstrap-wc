import { html } from 'lit';
import { property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';

/**
 * `<bs-collapse>` — Bootstrap collapse (height-animated show/hide).
 *
 * @fires bs-show - before opening.
 * @fires bs-shown - after open animation.
 * @fires bs-hide - before closing.
 * @fires bs-hidden - after close animation.
 */
export class BsCollapse extends BootstrapElement {
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: Boolean }) horizontal = false;

  @query('.collapse-inner') private _inner!: HTMLElement;

  private _busy = false;

  override updated(changed: Map<string, unknown>) {
    if (changed.has('open') && !this._busy) {
      void this._animate(this.open, changed.get('open') === undefined);
    }
  }

  /** Toggle open state. */
  toggle() {
    this.open = !this.open;
  }

  /** Show (open). */
  show() {
    this.open = true;
  }

  /** Hide (close). */
  hide() {
    this.open = false;
  }

  private async _animate(opening: boolean, isFirst: boolean) {
    if (!this._inner) return;
    if (isFirst) {
      // Skip animation on initial render.
      this._inner.style.removeProperty(this.horizontal ? 'width' : 'height');
      return;
    }
    this._busy = true;
    const el = this._inner;
    const dimension = this.horizontal ? 'width' : 'height';
    const scrollDim = this.horizontal ? el.scrollWidth : el.scrollHeight;
    this.dispatchEvent(
      new CustomEvent(opening ? 'bs-show' : 'bs-hide', { bubbles: true, composed: true }),
    );
    el.classList.remove('collapse', 'show');
    el.classList.add('collapsing');
    if (this.horizontal) el.classList.add('collapse-horizontal');
    if (opening) {
      el.style[dimension] = '0px';
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      el.offsetHeight; // reflow
      el.style[dimension] = `${scrollDim}px`;
    } else {
      el.style[dimension] = `${scrollDim}px`;
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      el.offsetHeight;
      el.style[dimension] = '0px';
    }
    await new Promise<void>((resolve) => {
      const done = () => {
        el.removeEventListener('transitionend', done);
        resolve();
      };
      el.addEventListener('transitionend', done);
      setTimeout(done, 400);
    });
    el.classList.remove('collapsing');
    el.classList.add('collapse');
    if (opening) el.classList.add('show');
    el.style[dimension] = '';
    this._busy = false;
    this.dispatchEvent(
      new CustomEvent(opening ? 'bs-shown' : 'bs-hidden', { bubbles: true, composed: true }),
    );
  }

  override render() {
    const classes = classMap({
      'collapse-inner': true,
      collapse: !this._busy,
      'collapse-horizontal': this.horizontal,
      show: this.open && !this._busy,
    });
    return html`<div part="collapse" class=${classes}><slot></slot></div>`;
  }
}

defineElement('bs-collapse', BsCollapse);

declare global {
  interface HTMLElementTagNameMap {
    'bs-collapse': BsCollapse;
  }
}
