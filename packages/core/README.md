# @bootstrap-wc/core

Base class, controllers, and shared SCSS for [Bootstrap Web Components](https://bootstrap-wc.dev).

- `BootstrapElement` — light-DOM Lit base class with RTL observer.
- `TransitionController` — CSS-class transition coordinator.
- `FloatingController` — wraps `@floating-ui/dom` for tooltips, popovers, dropdowns.
- `FocusTrapController` — wraps `focus-trap` for modals and offcanvas.
- `FormAssociated` — mixin that turns a LitElement into a form-associated custom element via `ElementInternals`.

Normally imported transitively by `@bootstrap-wc/components`. Install directly only if you're building your own components on top of this foundation.
