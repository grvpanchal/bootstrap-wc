export { BootstrapElement, defineElement } from './bootstrap-element.js';
export type { Direction } from './bootstrap-element.js';

export { TransitionController } from './controllers/transition.js';
export type { TransitionOptions } from './controllers/transition.js';

export { FloatingController } from './controllers/floating.js';
export type { FloatingOptions, Placement } from './controllers/floating.js';

export { FocusTrapController } from './controllers/focus-trap.js';
export type { FocusTrapOptions } from './controllers/focus-trap.js';

export { FormAssociated } from './mixins/form-associated.js';
export type { FormAssociatedInterface } from './mixins/form-associated.js';

export type Variant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark';

export type Size = 'sm' | 'md' | 'lg';
