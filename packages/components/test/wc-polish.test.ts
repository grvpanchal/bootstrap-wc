import { expect, fixture, html } from '@open-wc/testing';
import '../src/input/index.js';
import '../src/textarea/index.js';
import '../src/select/index.js';
import '../src/collapse/index.js';

describe('WC polish: form controls render the native control in light DOM', () => {
  it('bs-input has no shadow root and exposes its native <input> as a child', async () => {
    const el = await fixture<HTMLElement>(html`<bs-input></bs-input>`);
    await new Promise((r) => requestAnimationFrame(r));
    expect(el.shadowRoot, 'no shadow root for form controls').to.equal(null);
    expect(el.querySelector('input'), 'native <input> in light DOM').to.exist;
  });

  it('bs-textarea renders <textarea> in light DOM', async () => {
    const el = await fixture<HTMLElement>(html`<bs-textarea></bs-textarea>`);
    await new Promise((r) => requestAnimationFrame(r));
    expect(el.shadowRoot).to.equal(null);
    expect(el.querySelector('textarea')).to.exist;
  });

  it('bs-select renders <select> in light DOM', async () => {
    const el = await fixture<HTMLElement>(html`<bs-select></bs-select>`);
    await new Promise((r) => requestAnimationFrame(r));
    expect(el.shadowRoot).to.equal(null);
    expect(el.querySelector('select')).to.exist;
  });

  it('bs-input host.focus() delegates to the native <input>', async () => {
    const el = await fixture<HTMLElement & { focus(): void }>(html`<bs-input></bs-input>`);
    await new Promise((r) => requestAnimationFrame(r));
    const native = el.querySelector('input') as HTMLInputElement;
    expect(native, 'native input rendered').to.exist;
    el.focus();
    expect(document.activeElement, 'native input ends up focused').to.equal(native);
  });
});

describe('WC polish: FOUC preflight', () => {
  it('document carries a preflight <style> with :not(:defined) rules', () => {
    const preflight = document.querySelector('style[data-bootstrap-wc="preflight"]');
    expect(preflight, 'preflight <style> present').to.exist;
    const css = (preflight as HTMLStyleElement).textContent || '';
    expect(css).to.match(/bs-modal:not\(:defined\)/);
    expect(css).to.match(/bs-button:not\(:defined\)/);
  });
});

describe('WC polish: composed cross-shadow events', () => {
  it('bs-show from bs-collapse reaches a document-level listener', async () => {
    const el = await fixture<HTMLElement>(html`<bs-collapse>body</bs-collapse>`);
    await new Promise((r) => requestAnimationFrame(r));
    let reached = false;
    const listener = () => (reached = true);
    document.addEventListener('bs-show', listener);
    try {
      (el as HTMLElement & { show: () => void }).show();
      await new Promise((r) => setTimeout(r, 0));
      expect(reached, 'document saw bs-show via composed path').to.equal(true);
    } finally {
      document.removeEventListener('bs-show', listener);
    }
  });
});
