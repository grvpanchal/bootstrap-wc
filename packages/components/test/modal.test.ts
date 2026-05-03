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

  it('static-display mirrors .modal classes onto the host (with modal-class extras)', async () => {
    const el = await fixture<BsModal>(html`<bs-modal
      static-display
      modal-class="modal-sheet bg-body-secondary"
      heading="Title">body</bs-modal>`);
    await new Promise((r) => requestAnimationFrame(r));
    expect(el.classList.contains('modal')).to.equal(true);
    expect(el.classList.contains('show')).to.equal(true);
    expect(el.classList.contains('position-static')).to.equal(true);
    expect(el.classList.contains('d-block')).to.equal(true);
    expect(el.classList.contains('modal-sheet')).to.equal(true);
    expect(el.classList.contains('bg-body-secondary')).to.equal(true);
  });

  it('static-display drops the inner .modal wrapper from shadow', async () => {
    const el = await fixture<BsModal>(html`<bs-modal static-display heading="X">body</bs-modal>`);
    await new Promise((r) => requestAnimationFrame(r));
    // No nested .modal div in shadow — host is the modal.
    const innerModal = el.shadowRoot!.querySelector('.modal');
    expect(innerModal).to.equal(null);
    // Dialog/content still rendered.
    expect(el.shadowRoot!.querySelector('.modal-dialog')).to.exist;
    expect(el.shadowRoot!.querySelector('.modal-content')).to.exist;
  });

  it('content-class / header-class / body-class / footer-class threadthrough', async () => {
    const el = await fixture<BsModal>(html`<bs-modal
      static-display
      heading="X"
      content-class="rounded-4 shadow"
      header-class="border-bottom-0"
      body-class="py-0"
      footer-class="gap-2"
    >Body
      <span slot="footer">Footer content</span>
    </bs-modal>`);
    await new Promise((r) => requestAnimationFrame(r));
    expect(el.shadowRoot!.querySelector('.modal-content.rounded-4.shadow')).to.exist;
    expect(el.shadowRoot!.querySelector('.modal-header.border-bottom-0')).to.exist;
    expect(el.shadowRoot!.querySelector('.modal-body.py-0')).to.exist;
    expect(el.shadowRoot!.querySelector('.modal-footer.gap-2')).to.exist;
  });

  it('static-display + static-preview alias agree', async () => {
    const el = await fixture<BsModal>(html`<bs-modal static-display heading="X">body</bs-modal>`);
    await new Promise((r) => requestAnimationFrame(r));
    expect(el.staticPreview).to.equal(true);
    expect(el.staticDisplay).to.equal(true);
    el.staticDisplay = false;
    await el.updateComplete;
    expect(el.staticPreview).to.equal(false);
  });
});
