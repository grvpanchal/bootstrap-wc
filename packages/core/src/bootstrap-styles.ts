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
