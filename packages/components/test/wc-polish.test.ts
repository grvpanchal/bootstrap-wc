import { expect, fixture, html } from '@open-wc/testing';
import '../src/input/index.js';
import '../src/textarea/index.js';
import '../src/select/index.js';
import '../src/collapse/index.js';

describe('WC polish: delegatesFocus', () => {
  it('bs-input shadow root delegates focus to the inner <input>', async () => {
    const wrap = await fixture<HTMLElement>(html`<div>
      <label for="ctl">Label</label>
      <bs-input id="ctl"></bs-input>
    </div>`);
    await new Promise((r) => requestAnimationFrame(r));
    const host = wrap.querySelector('bs-input') as HTMLElement;
    expect(host.shadowRoot!.delegatesFocus, 'shadow root opts into delegatesFocus').to.equal(true);
    // Label click should focus through the shadow boundary to the inner input.
    wrap.querySelector('label')!.click();
    // activeElement from the document's perspective is the host (focus delegates
    // inward, but document.activeElement reports the shadow host).
    expect(document.activeElement).to.equal(host);
    // Inside the shadow, the native input should actually be focused.
    const nativeInput = host.shadowRoot!.querySelector('input');
    expect(host.shadowRoot!.activeElement).to.equal(nativeInput);
  });

  it('bs-textarea shadow root delegates focus', async () => {
    const el = await fixture<HTMLElement>(html`<bs-textarea></bs-textarea>`);
    await new Promise((r) => requestAnimationFrame(r));
    expect(el.shadowRoot!.delegatesFocus).to.equal(true);
  });

  it('bs-select shadow root delegates focus', async () => {
    const el = await fixture<HTMLElement>(html`<bs-select></bs-select>`);
    await new Promise((r) => requestAnimationFrame(r));
    expect(el.shadowRoot!.delegatesFocus).to.equal(true);
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
