import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { createFocusTrap, type FocusTrap } from 'focus-trap';

export interface FocusTrapOptions {
  escapeDeactivates?: boolean;
  clickOutsideDeactivates?: boolean;
  returnFocusOnDeactivate?: boolean;
  initialFocus?: HTMLElement | string | false;
}

/**
 * Wraps `focus-trap` for modal-style dialogs that must confine Tab
 * navigation to their content.
 */
export class FocusTrapController implements ReactiveController {
  private host: ReactiveControllerHost & HTMLElement;
  private _trap?: FocusTrap;

  constructor(host: ReactiveControllerHost & HTMLElement) {
    this.host = host;
    host.addController(this);
  }

  hostDisconnected(): void {
    this.deactivate();
  }

  activate(container: HTMLElement, options: FocusTrapOptions = {}): void {
    this.deactivate();
    this._trap = createFocusTrap(container, {
      escapeDeactivates: options.escapeDeactivates ?? true,
      clickOutsideDeactivates: options.clickOutsideDeactivates ?? false,
      returnFocusOnDeactivate: options.returnFocusOnDeactivate ?? true,
      initialFocus: options.initialFocus,
      allowOutsideClick: true,
      fallbackFocus: container,
    });
    try {
      this._trap.activate();
    } catch {
      // Focus trap can fail if container is not yet visible; ignore.
    }
  }

  deactivate(): void {
    try {
      this._trap?.deactivate();
    } catch {
      // no-op
    }
    this._trap = undefined;
  }
}
