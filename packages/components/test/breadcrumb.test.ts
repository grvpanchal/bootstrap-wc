import { expect, fixture, html } from '@open-wc/testing';
import '../src/breadcrumb/index.js';
import type { BsBreadcrumb } from '../src/breadcrumb/breadcrumb.js';

const tick = () => new Promise((r) => requestAnimationFrame(r));

describe('bs-breadcrumb', () => {
  it('host carries .breadcrumb by default', async () => {
    const el = await fixture<BsBreadcrumb>(html`<bs-breadcrumb>
      <bs-breadcrumb-item href="#">Home</bs-breadcrumb-item>
      <bs-breadcrumb-item active>Data</bs-breadcrumb-item>
    </bs-breadcrumb>`);
    await tick();
    expect(el.classList.contains('breadcrumb')).to.equal(true);
    expect(el.getAttribute('role')).to.equal('navigation');
    expect(el.getAttribute('aria-label')).to.equal('breadcrumb');
  });

  it('wrap-in-nav drops .breadcrumb from host and renders shadow ol.breadcrumb', async () => {
    const el = await fixture<BsBreadcrumb>(html`<bs-breadcrumb wrap-in-nav>
      <bs-breadcrumb-item href="#">Home</bs-breadcrumb-item>
      <bs-breadcrumb-item active>Data</bs-breadcrumb-item>
    </bs-breadcrumb>`);
    await tick();
    expect(el.classList.contains('breadcrumb')).to.equal(false);
    const ol = el.shadowRoot!.querySelector('ol');
    expect(ol).to.exist;
    expect(ol!.classList.contains('breadcrumb')).to.equal(true);
  });

  it('list-class adds extra classes to the inner ol in wrap-in-nav mode', async () => {
    const el = await fixture<BsBreadcrumb>(html`<bs-breadcrumb wrap-in-nav list-class="breadcrumb-chevron p-3">
      <bs-breadcrumb-item active>Home</bs-breadcrumb-item>
    </bs-breadcrumb>`);
    await tick();
    const ol = el.shadowRoot!.querySelector('ol')!;
    expect(ol.classList.contains('breadcrumb-chevron')).to.equal(true);
    expect(ol.classList.contains('p-3')).to.equal(true);
  });

  it('item active sets aria-current=page', async () => {
    const el = await fixture<HTMLElement>(html`<bs-breadcrumb>
      <bs-breadcrumb-item active>Data</bs-breadcrumb-item>
    </bs-breadcrumb>`);
    await tick();
    const item = el.querySelector('bs-breadcrumb-item')!;
    expect(item.getAttribute('aria-current')).to.equal('page');
    expect(item.classList.contains('breadcrumb-item')).to.equal(true);
    expect(item.classList.contains('active')).to.equal(true);
  });
});
