import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface TransitionOptions {
  enterClass?: string;
  enterActiveClass?: string;
  leaveClass?: string;
  leaveActiveClass?: string;
  showClass?: string;
  timeout?: number;
}

/**
 * Drives Bootstrap-style CSS-class transitions.
 *
 * Bootstrap's pattern is:
 *   1. Add `.fade` (or `.collapsing`, etc.) — base class
 *   2. Add/remove `.show` — triggers the transition
 *   3. Wait for `transitionend` — cleanup
 *
 * This controller coordinates those transitions deterministically.
 */
export class TransitionController implements ReactiveController {
  private host: ReactiveControllerHost & HTMLElement;
  private _pending?: () => void;

  constructor(host: ReactiveControllerHost & HTMLElement) {
    this.host = host;
    host.addController(this);
  }

  hostDisconnected(): void {
    this._pending?.();
    this._pending = undefined;
  }

  /**
   * Run a transition on the target element. Resolves when `transitionend`
   * fires or the fallback timeout elapses.
   */
  run(target: HTMLElement, mutate: () => void, timeoutMs = 400): Promise<void> {
    return new Promise((resolve) => {
      this._pending?.();
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        target.removeEventListener('transitionend', onEnd);
        clearTimeout(timer);
        this._pending = undefined;
        resolve();
      };
      const onEnd = (ev: TransitionEvent) => {
        if (ev.target !== target) return;
        finish();
      };
      target.addEventListener('transitionend', onEnd);
      const timer = window.setTimeout(finish, timeoutMs);
      this._pending = finish;
      // Force reflow so the class change actually transitions.
      void target.offsetHeight;
      mutate();
    });
  }
}
