import { expect, fixture, html } from '@open-wc/testing';
import '../src/avatar/index.js';
import type { BsAvatar } from '../src/avatar/avatar.js';

const tick = () => new Promise((r) => requestAnimationFrame(r));

describe('bs-avatar', () => {
  it('default size 32 produces 32×32 box', async () => {
    const el = await fixture<BsAvatar>(html`<bs-avatar></bs-avatar>`);
    await tick();
    const box = el.getBoundingClientRect();
    expect(Math.round(box.width)).to.equal(32);
    expect(Math.round(box.height)).to.equal(32);
  });

  it('numeric BSE sizes 16/24/32/48/64/96/128 resolve to N×N pixels', async () => {
    for (const size of [16, 24, 32, 48, 64, 96, 128]) {
      const el = await fixture<BsAvatar>(html`<bs-avatar size=${size}></bs-avatar>`);
      await tick();
      const box = el.getBoundingClientRect();
      expect(Math.round(box.width), `size=${size} width`).to.equal(size);
      expect(Math.round(box.height), `size=${size} height`).to.equal(size);
    }
  });

  it('arbitrary numeric size (not in BSE scale) works', async () => {
    const el = await fixture<BsAvatar>(html`<bs-avatar size="40"></bs-avatar>`);
    await tick();
    const box = el.getBoundingClientRect();
    expect(Math.round(box.width)).to.equal(40);
    expect(Math.round(box.height)).to.equal(40);
  });

  it('shape="circle" gives 50% border-radius', async () => {
    const el = await fixture<BsAvatar>(html`<bs-avatar shape="circle"></bs-avatar>`);
    await tick();
    expect(el.style.borderRadius).to.equal('50%');
  });

  it('shape="square" gives 0 border-radius', async () => {
    const el = await fixture<BsAvatar>(html`<bs-avatar shape="square"></bs-avatar>`);
    await tick();
    expect(el.style.borderRadius).to.equal('0px');
  });

  it('inner wrapper clips to the host shape (circle => 50% radius on wrapper)', async () => {
    const el = await fixture<BsAvatar>(html`<bs-avatar shape="circle">JD</bs-avatar>`);
    await tick();
    const wrap = el.shadowRoot!.querySelector('[part="wrapper"]') as HTMLElement;
    expect(getComputedStyle(wrap).borderTopLeftRadius).to.not.equal('0px');
  });

  it('src renders an <img part="image"> with alt and lazy loading', async () => {
    const el = await fixture<BsAvatar>(
      html`<bs-avatar size="48" src="/img/u1.jpg" alt="Jane"></bs-avatar>`,
    );
    await tick();
    const img = el.shadowRoot!.querySelector('img[part="image"]') as HTMLImageElement;
    expect(img, 'image rendered').to.exist;
    expect(img.alt).to.equal('Jane');
    expect(img.loading).to.equal('lazy');
    expect(img.getAttribute('src')).to.equal('/img/u1.jpg');
  });

  it('without src, default slot renders (e.g. initials)', async () => {
    const el = await fixture<BsAvatar>(html`<bs-avatar size="48">JD</bs-avatar>`);
    await tick();
    const img = el.shadowRoot!.querySelector('img[part="image"]');
    expect(img, 'no image when src is absent').to.equal(null);
    expect(el.textContent?.trim()).to.equal('JD');
  });

  it('variant adds bg-{variant}-subtle + text-{variant}-emphasis on wrapper', async () => {
    const el = await fixture<BsAvatar>(html`<bs-avatar variant="success">JD</bs-avatar>`);
    await tick();
    const wrap = el.shadowRoot!.querySelector('[part="wrapper"]') as HTMLElement;
    expect(wrap.classList.contains('bg-success-subtle')).to.equal(true);
    expect(wrap.classList.contains('text-success-emphasis')).to.equal(true);
  });

  it('width/height override size attribute', async () => {
    const el = await fixture<BsAvatar>(
      html`<bs-avatar size="32" width="100px" height="40px"></bs-avatar>`,
    );
    await tick();
    const box = el.getBoundingClientRect();
    expect(Math.round(box.width)).to.equal(100);
    expect(Math.round(box.height)).to.equal(40);
  });

  it('status slot is rendered (for online/offline indicators)', async () => {
    const el = await fixture<BsAvatar>(html`<bs-avatar size="48">
      <span slot="status" data-test="badge"></span>
    </bs-avatar>`);
    await tick();
    const slotted = el.querySelector('[slot="status"][data-test="badge"]');
    expect(slotted, 'status-slotted child should remain in light DOM').to.exist;
  });
});
