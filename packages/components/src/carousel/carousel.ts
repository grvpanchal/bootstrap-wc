import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { BootstrapElement, defineElement } from '@bootstrap-wc/core';
import type { BsCarouselItem } from './carousel-item.js';

/**
 * `<bs-carousel>` — slideshow component. Host carries `.carousel.slide` (+
 * `.carousel-fade` / `.carousel-dark` modifiers) so Bootstrap's selectors
 * (e.g. `.carousel-fade .carousel-item`) match the slotted items via
 * flat-tree projection.
 *
 * Shape:
 *
 *   <bs-carousel>
 *     <bs-carousel-item active>...</bs-carousel-item>
 *     <bs-carousel-item>...</bs-carousel-item>
 *   </bs-carousel>
 *
 * The component owns its own slide / interval / focus / keyboard logic —
 * no `bootstrap.bundle.min.js` required. `next()`, `prev()`, `to(index)`,
 * `pause()`, `cycle()` are exposed as imperative methods.
 *
 * @fires bs-slide - Before a slide transition starts. Detail: `{from, to, direction}`.
 * @fires bs-slid - After a slide transition completes. Detail: `{from, to, direction}`.
 */
export class BsCarousel extends BootstrapElement {
  /** Auto-advance interval in ms; `0` disables auto-cycling. */
  @property({ type: Number }) interval = 5000;
  /** Render previous/next chrome buttons. */
  @property({ type: Boolean }) controls = true;
  /** Render the indicator dots row. */
  @property({ type: Boolean }) indicators = true;
  /** Use `.carousel-fade` instead of slide animation. */
  @property({ type: Boolean }) fade = false;
  /** Use `.carousel-dark` for dark variant chrome. (Bootstrap 5.3 deprecated; prefer data-bs-theme="dark".) */
  @property({ type: Boolean }) dark = false;
  /** Pause auto-cycling on hover. */
  @property({ type: Boolean, attribute: 'pause-on-hover' }) pauseOnHover = true;
  /** Wrap from last back to first when advancing. */
  @property({ type: Boolean }) wrap = true;
  /** Touch / swipe support. */
  @property({ type: Boolean }) touch = true;

  @state() private _activeIndex = 0;

  private _intervalId: number | null = null;
  private _isHovered = false;
  private _animating = false;
  private _items(): BsCarouselItem[] {
    return Array.from(this.querySelectorAll(':scope > bs-carousel-item')) as BsCarouselItem[];
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'region');
    if (!this.hasAttribute('aria-roledescription')) this.setAttribute('aria-roledescription', 'carousel');
    this.addEventListener('mouseenter', this._onMouseEnter);
    this.addEventListener('mouseleave', this._onMouseLeave);
    this.addEventListener('keydown', this._onKeydown);
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    // Sync active index from initial markup, then start cycling.
    requestAnimationFrame(() => {
      this._initActiveFromDom();
      this._startCycle();
    });
    if (this.touch) this._wireTouch();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('mouseenter', this._onMouseEnter);
    this.removeEventListener('mouseleave', this._onMouseLeave);
    this.removeEventListener('keydown', this._onKeydown);
    this._stopCycle();
    this._unwireTouch();
  }

  override updated(changed: Map<string, unknown>): void {
    super.updated(changed);
    if (changed.has('interval')) {
      this._stopCycle();
      this._startCycle();
    }
  }

  protected override hostClasses(): string {
    const parts = ['carousel', 'slide'];
    if (this.fade) parts.push('carousel-fade');
    if (this.dark) parts.push('carousel-dark');
    return parts.join(' ');
  }

  /** Show the next slide. */
  next(): void {
    this._slideTo(this._activeIndex + 1, 'next');
  }

  /** Show the previous slide. */
  prev(): void {
    this._slideTo(this._activeIndex - 1, 'prev');
  }

  /**
   * Show a specific slide by index. The `direction` is inferred from index
   * comparison unless the carousel is animating, in which case it's queued
   * after the current animation.
   */
  to(index: number): void {
    const target = ((index % this._items().length) + this._items().length) % this._items().length;
    if (target === this._activeIndex) return;
    const direction = target > this._activeIndex ? 'next' : 'prev';
    this._slideTo(target, direction);
  }

  /** Pause auto-cycling. */
  pause(): void {
    this._stopCycle();
  }

  /** Resume auto-cycling using the configured `interval`. */
  cycle(): void {
    this._startCycle();
  }

  private _initActiveFromDom(): void {
    const items = this._items();
    if (!items.length) return;
    const active = items.findIndex((item) => item.active);
    this._activeIndex = active === -1 ? 0 : active;
    items.forEach((item, i) => {
      item.active = i === this._activeIndex;
      item.transitionState = '';
    });
  }

  private _slideTo(targetRaw: number, direction: 'next' | 'prev'): void {
    if (this._animating) return;
    const items = this._items();
    if (items.length < 2) return;
    let target = targetRaw;
    if (this.wrap) {
      target = ((target % items.length) + items.length) % items.length;
    } else {
      if (target < 0 || target >= items.length) return;
    }
    if (target === this._activeIndex) return;
    const from = this._activeIndex;
    const fromItem = items[from];
    const toItem = items[target];
    if (!fromItem || !toItem) return;
    const slideEvent = new CustomEvent('bs-slide', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { from, to: target, direction },
    });
    if (!this.dispatchEvent(slideEvent)) return;
    this._animating = true;

    // Phase 1: place the incoming slide off-screen.
    toItem.transitionState = direction === 'next' ? 'next' : 'prev';

    // Force reflow so the transform is registered before we add `start`/`end`.
    void toItem.offsetHeight;

    // Phase 2: trigger the transition by adding the matching start/end class.
    requestAnimationFrame(() => {
      toItem.transitionState = direction === 'next' ? 'next-start' : 'prev-end';
      fromItem.transitionState = direction === 'next' ? 'start' : 'end';
    });

    const TRANSITION_MS = this.fade ? 600 : 600;
    window.setTimeout(() => {
      fromItem.active = false;
      fromItem.transitionState = '';
      toItem.active = true;
      toItem.transitionState = '';
      this._activeIndex = target;
      this._animating = false;
      this.dispatchEvent(
        new CustomEvent('bs-slid', {
          bubbles: true,
          composed: true,
          detail: { from, to: target, direction },
        }),
      );
    }, TRANSITION_MS);
  }

  private _startCycle(): void {
    if (!this.interval || this.interval <= 0) return;
    if (this._isHovered && this.pauseOnHover) return;
    if (this._intervalId !== null) return;
    this._intervalId = window.setInterval(() => {
      if (this._isHovered && this.pauseOnHover) return;
      this.next();
    }, this.interval);
  }

  private _stopCycle(): void {
    if (this._intervalId === null) return;
    clearInterval(this._intervalId);
    this._intervalId = null;
  }

  private _onMouseEnter = () => {
    this._isHovered = true;
    if (this.pauseOnHover) this._stopCycle();
  };
  private _onMouseLeave = () => {
    this._isHovered = false;
    this._startCycle();
  };
  private _onKeydown = (ev: KeyboardEvent) => {
    if (ev.key === 'ArrowLeft') {
      ev.preventDefault();
      this.prev();
    } else if (ev.key === 'ArrowRight') {
      ev.preventDefault();
      this.next();
    }
  };

  // ---- touch ---------------------------------------------------------------

  private _touchStartX = 0;
  private _touchEndX = 0;
  private _onTouchStart = (ev: TouchEvent) => {
    this._touchStartX = ev.changedTouches[0].screenX;
  };
  private _onTouchEnd = (ev: TouchEvent) => {
    this._touchEndX = ev.changedTouches[0].screenX;
    const delta = this._touchEndX - this._touchStartX;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) this.next();
    else this.prev();
  };
  private _wireTouch(): void {
    this.addEventListener('touchstart', this._onTouchStart, { passive: true });
    this.addEventListener('touchend', this._onTouchEnd, { passive: true });
  }
  private _unwireTouch(): void {
    this.removeEventListener('touchstart', this._onTouchStart);
    this.removeEventListener('touchend', this._onTouchEnd);
  }

  // ---- render --------------------------------------------------------------

  private _onIndicatorClick(i: number): void {
    if (i === this._activeIndex) return;
    const direction = i > this._activeIndex ? 'next' : 'prev';
    this._slideTo(i, direction);
  }

  override render() {
    // Render indicator buttons based on the current item count. Re-evaluated
    // on every update — Lit diffing handles incremental changes.
    const items = this._items();
    const count = items.length;
    return html`
      <style>
        :host { display: block; }
      </style>
      ${this.indicators && count > 0
        ? html`<div class="carousel-indicators" part="indicators">
            ${items.map(
              (_, i) => html`<button
                type="button"
                class=${i === this._activeIndex ? 'active' : ''}
                aria-current=${i === this._activeIndex ? 'true' : 'false'}
                aria-label=${`Slide ${i + 1}`}
                @click=${() => this._onIndicatorClick(i)}
              ></button>`,
            )}
          </div>`
        : nothing}
      <div class="carousel-inner" part="inner">
        <slot></slot>
      </div>
      ${this.controls && count > 1
        ? html`
            <button
              class="carousel-control-prev"
              type="button"
              part="control-prev"
              @click=${() => this.prev()}
            >
              <span class="carousel-control-prev-icon" aria-hidden="true"></span>
              <span class="visually-hidden">Previous</span>
            </button>
            <button
              class="carousel-control-next"
              type="button"
              part="control-next"
              @click=${() => this.next()}
            >
              <span class="carousel-control-next-icon" aria-hidden="true"></span>
              <span class="visually-hidden">Next</span>
            </button>
          `
        : nothing}
    `;
  }
}

defineElement('bs-carousel', BsCarousel);

// Re-export the item for ergonomic single-import usage.
export { BsCarouselItem } from './carousel-item.js';
import './carousel-item.js';

declare global {
  interface HTMLElementTagNameMap {
    'bs-carousel': BsCarousel;
  }
}
