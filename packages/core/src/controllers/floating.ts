import type { ReactiveController, ReactiveControllerHost } from 'lit';
import {
  computePosition,
  autoUpdate,
  flip,
  shift,
  offset,
  arrow,
  type Placement,
  type Middleware,
  type ComputePositionConfig,
} from '@floating-ui/dom';

export type { Placement };

export interface FloatingOptions {
  placement?: Placement;
  offset?: number;
  shift?: boolean;
  flip?: boolean;
  arrow?: HTMLElement | null;
}

/**
 * Wraps @floating-ui/dom to position a floating element (tooltip, popover,
 * dropdown menu) relative to a reference element. Automatically updates
 * on scroll/resize via `autoUpdate`.
 */
export class FloatingController implements ReactiveController {
  private host: ReactiveControllerHost & HTMLElement;
  private _cleanup?: () => void;
  private _reference?: HTMLElement;
  private _floating?: HTMLElement;
  private _options: FloatingOptions = { placement: 'top', offset: 8, shift: true, flip: true };

  constructor(host: ReactiveControllerHost & HTMLElement) {
    this.host = host;
    host.addController(this);
  }

  hostDisconnected(): void {
    this.stop();
  }

  setOptions(options: FloatingOptions): void {
    this._options = { ...this._options, ...options };
    if (this._cleanup) this._schedule();
  }

  start(reference: HTMLElement, floating: HTMLElement): void {
    this.stop();
    this._reference = reference;
    this._floating = floating;
    this._cleanup = autoUpdate(reference, floating, () => this._compute());
  }

  stop(): void {
    this._cleanup?.();
    this._cleanup = undefined;
    this._reference = undefined;
    this._floating = undefined;
  }

  private _schedule(): void {
    if (this._reference && this._floating) this._compute();
  }

  private async _compute(): Promise<void> {
    if (!this._reference || !this._floating) return;
    const middleware: Middleware[] = [];
    if (typeof this._options.offset === 'number') middleware.push(offset(this._options.offset));
    if (this._options.flip !== false) middleware.push(flip());
    if (this._options.shift !== false) middleware.push(shift({ padding: 8 }));
    if (this._options.arrow) middleware.push(arrow({ element: this._options.arrow }));

    const config: Partial<ComputePositionConfig> = {
      placement: this._options.placement ?? 'top',
      middleware,
    };
    const { x, y, placement, middlewareData } = await computePosition(
      this._reference,
      this._floating,
      config,
    );
    Object.assign(this._floating.style, {
      left: `${x}px`,
      top: `${y}px`,
      position: 'absolute',
    });
    this._floating.dataset.placement = placement;

    if (this._options.arrow && middlewareData.arrow) {
      const { x: ax, y: ay } = middlewareData.arrow;
      Object.assign(this._options.arrow.style, {
        left: ax != null ? `${ax}px` : '',
        top: ay != null ? `${ay}px` : '',
      });
    }
  }
}
