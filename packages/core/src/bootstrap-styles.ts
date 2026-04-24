import { BOOTSTRAP_CSS } from './bootstrap-css.js';

let _bootstrapSheet: CSSStyleSheet | undefined;
const _extraSheets: CSSStyleSheet[] = [];

function supportsConstructable(): boolean {
  return (
    typeof CSSStyleSheet !== 'undefined' &&
    typeof (CSSStyleSheet.prototype as { replaceSync?: unknown }).replaceSync === 'function' &&
    'adoptedStyleSheets' in Document.prototype
  );
}

/**
 * Returns the shared Bootstrap {@link CSSStyleSheet} instance, constructing it
 * on first use. Every component's shadow root adopts this one sheet instead of
 * inlining Bootstrap's CSS per element.
 */
export function getBootstrapSheet(): CSSStyleSheet | undefined {
  if (!supportsConstructable()) return undefined;
  if (!_bootstrapSheet) {
    _bootstrapSheet = new CSSStyleSheet();
    _bootstrapSheet.replaceSync(BOOTSTRAP_CSS);
  }
  return _bootstrapSheet;
}

/**
 * Add an extra stylesheet (custom theme, Bootstrap Icons, etc.) that every
 * subsequently-connected component will adopt. Call once at startup.
 */
export function addGlobalStylesheet(cssText: string): void {
  if (!supportsConstructable()) return;
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(cssText);
  _extraSheets.push(sheet);
}

/** Internal — returns every shared sheet in adoption order. */
export function getSharedSheets(): CSSStyleSheet[] {
  const sheets: CSSStyleSheet[] = [];
  const base = getBootstrapSheet();
  if (base) sheets.push(base);
  sheets.push(..._extraSheets);
  return sheets;
}

/** Internal — for fallback <style> injection when constructable sheets are unsupported. */
export function getBootstrapCssText(): string {
  return BOOTSTRAP_CSS;
}

/**
 * Inject the bundled Bootstrap stylesheet into the host document once, so that
 * compound components whose hosts carry `.btn-group`, `.list-group`, `.nav`
 * etc. can be matched by Bootstrap's parent/sibling selectors (which live in
 * the document scope, not per-shadow). Idempotent — skips if another
 * Bootstrap stylesheet is already present or we've already injected.
 */
let _documentInjected = false;
export function injectBootstrapIntoDocument(): void {
  if (_documentInjected || typeof document === 'undefined') return;
  _documentInjected = true;
  // Always inject the FOUC preflight so unknown-but-upcoming `<bs-*>`
  // elements don't render as naked inline text before they upgrade. This
  // is orthogonal to whether Bootstrap's stylesheet is already present.
  if (!document.querySelector('style[data-bootstrap-wc="preflight"]')) {
    const preflight = document.createElement('style');
    preflight.setAttribute('data-bootstrap-wc', 'preflight');
    preflight.textContent = PREFLIGHT_CSS;
    document.head.prepend(preflight);
  }
  // Bootstrap stylesheet already present (user linked it, or another bs-wc
  // build injected it)? Don't duplicate.
  const existing = document.querySelector(
    'style[data-bootstrap-wc="injected"],link[rel="stylesheet"][data-bootstrap-wc],' +
      'link[rel="stylesheet"][href*="bootstrap"][href$=".css"],' +
      'link[rel="stylesheet"][href*="bootstrap.min"]',
  );
  if (existing) return;
  const style = document.createElement('style');
  style.setAttribute('data-bootstrap-wc', 'injected');
  style.textContent = BOOTSTRAP_CSS;
  document.head.prepend(style);
}

/**
 * Baseline `bs-*:not(:defined)` styling so unupgraded elements don't leak
 * unstyled text into the page during the brief window between HTML parse and
 * custom-element upgrade. Also sets the right `display` for each element so
 * the layout size is stable across the upgrade boundary (no flashes of
 * reflow).
 *
 * Rules are narrow and additive — they kick in only while the element has
 * no custom-element ctor registered; once upgraded, the element's own
 * styles (or host classes) take over.
 */
const PREFLIGHT_CSS = `
/* bootstrap-wc preflight — avoid FOUC / layout shift before custom elements upgrade. */
bs-button:not(:defined),
bs-badge:not(:defined),
bs-close-button:not(:defined),
bs-spinner:not(:defined),
bs-breadcrumb-item:not(:defined),
bs-nav-item:not(:defined),
bs-dropdown-item:not(:defined),
bs-list-group-item:not(:defined) {
  display: inline-block;
  visibility: hidden;
}
bs-accordion:not(:defined),
bs-accordion-item:not(:defined),
bs-alert:not(:defined),
bs-button-group:not(:defined),
bs-card:not(:defined),
bs-collapse:not(:defined),
bs-dropdown:not(:defined),
bs-form:not(:defined),
bs-form-check:not(:defined),
bs-form-label:not(:defined),
bs-form-text:not(:defined),
bs-input:not(:defined),
bs-input-group:not(:defined),
bs-input-text:not(:defined),
bs-list-group:not(:defined),
bs-modal:not(:defined),
bs-nav:not(:defined),
bs-navbar:not(:defined),
bs-offcanvas:not(:defined),
bs-pagination:not(:defined),
bs-progress:not(:defined),
bs-progress-stacked:not(:defined),
bs-range:not(:defined),
bs-select:not(:defined),
bs-tabs:not(:defined),
bs-tab-panel:not(:defined),
bs-textarea:not(:defined),
bs-toast:not(:defined),
bs-toast-container:not(:defined),
bs-breadcrumb:not(:defined) {
  display: block;
  visibility: hidden;
}
bs-popover:not(:defined),
bs-tooltip:not(:defined) {
  display: none;
}
bs-modal:not(:defined) {
  display: none;
}
`;
