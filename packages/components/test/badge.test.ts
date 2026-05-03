import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import '../src/badge/index.js';
import type { BsBadge } from '../src/badge/badge.js';

const tick = () => new Promise((r) => requestAnimationFrame(r));

describe('bs-badge', () => {
  it('applies .badge and .text-bg-{variant} on the host (solid tone)', async () => {
    const el = await fixture<BsBadge>(html`<bs-badge variant="success">2</bs-badge>`);
    await tick();
    expect(el.classList.contains('badge')).to.equal(true);
    expect(el.classList.contains('text-bg-success')).to.equal(true);
  });

  it('subtle tone swaps to bg-*-subtle + text-*-emphasis', async () => {
    const el = await fixture<BsBadge>(html`<bs-badge variant="primary" tone="subtle">x</bs-badge>`);
    await tick();
    expect(el.classList.contains('bg-primary-subtle')).to.equal(true);
    expect(el.classList.contains('text-primary-emphasis')).to.equal(true);
    expect(el.classList.contains('text-bg-primary')).to.equal(false);
  });

  it('bordered tone adds .border .border-*-subtle', async () => {
    const el = await fixture<BsBadge>(html`<bs-badge variant="danger" tone="bordered">x</bs-badge>`);
    await tick();
    expect(el.classList.contains('bg-danger-subtle')).to.equal(true);
    expect(el.classList.contains('border')).to.equal(true);
    expect(el.classList.contains('border-danger-subtle')).to.equal(true);
  });

  it('pill attribute adds .rounded-pill', async () => {
    const el = await fixture<BsBadge>(html`<bs-badge variant="info" pill>x</bs-badge>`);
    await tick();
    expect(el.classList.contains('rounded-pill')).to.equal(true);
  });

  it('dismissible renders a .btn-close in shadow', async () => {
    const el = await fixture<BsBadge>(html`<bs-badge variant="primary" dismissible>x</bs-badge>`);
    await tick();
    const btn = el.shadowRoot!.querySelector('.btn-close');
    expect(btn).to.exist;
  });

  it('clicking the dismissible close button fires bs-dismiss and removes host', async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div><bs-badge variant="primary" dismissible>x</bs-badge></div>`);
    const el = wrap.querySelector('bs-badge') as BsBadge;
    await tick();
    const btn = el.shadowRoot!.querySelector('.btn-close') as HTMLButtonElement;
    const ev = oneEvent(el, 'bs-dismiss');
    btn.click();
    await ev;
    expect(wrap.contains(el)).to.equal(false);
  });

  it('preventDefault on bs-dismiss keeps the badge mounted', async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div><bs-badge variant="primary" dismissible>x</bs-badge></div>`);
    const el = wrap.querySelector('bs-badge') as BsBadge;
    await tick();
    el.addEventListener('bs-dismiss', (e) => e.preventDefault());
    const btn = el.shadowRoot!.querySelector('.btn-close') as HTMLButtonElement;
    btn.click();
    await tick();
    expect(wrap.contains(el)).to.equal(true);
  });
});
