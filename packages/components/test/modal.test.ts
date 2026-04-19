import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import '../src/modal/index.js';
import type { BsModal } from '../src/modal/modal.js';

describe('bs-modal', () => {
  it('opens and closes via show()/hide()', async () => {
    const el = await fixture<BsModal>(html`<bs-modal heading="Hi">Body</bs-modal>`);
    expect(el.open).to.equal(false);
    const shown = oneEvent(el, 'bs-shown');
    el.show();
    await shown;
    expect(el.open).to.equal(true);
    expect(el.shadowRoot?.querySelector('.modal-dialog')).to.exist;
    const hidden = oneEvent(el, 'bs-hidden');
    el.hide();
    await hidden;
    expect(el.open).to.equal(false);
  });

  it('closes on ESC key when not disabled', async () => {
    const el = await fixture<BsModal>(html`<bs-modal open heading="x">body</bs-modal>`);
    await new Promise((r) => setTimeout(r, 50));
    const hidden = oneEvent(el, 'bs-hidden');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await hidden;
    expect(el.open).to.equal(false);
  });
});
