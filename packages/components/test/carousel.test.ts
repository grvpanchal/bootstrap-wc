import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import '../src/carousel/index.js';
import type { BsCarousel } from '../src/carousel/carousel.js';
import type { BsCarouselItem } from '../src/carousel/carousel-item.js';

const tick = () => new Promise((r) => requestAnimationFrame(r));
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('bs-carousel', () => {
  it('host carries .carousel.slide and renders chrome', async () => {
    const el = await fixture<BsCarousel>(html`<bs-carousel interval="0">
      <bs-carousel-item active>One</bs-carousel-item>
      <bs-carousel-item>Two</bs-carousel-item>
    </bs-carousel>`);
    await tick();
    expect(el.classList.contains('carousel')).to.equal(true);
    expect(el.classList.contains('slide')).to.equal(true);
    expect(el.shadowRoot!.querySelector('.carousel-indicators')).to.exist;
    expect(el.shadowRoot!.querySelector('.carousel-control-prev')).to.exist;
    expect(el.shadowRoot!.querySelector('.carousel-control-next')).to.exist;
  });

  it('fade adds .carousel-fade', async () => {
    const el = await fixture<BsCarousel>(html`<bs-carousel interval="0" fade></bs-carousel>`);
    await tick();
    expect(el.classList.contains('carousel-fade')).to.equal(true);
  });

  it('controls=false hides prev/next buttons', async () => {
    const el = await fixture<BsCarousel>(html`<bs-carousel interval="0" .controls=${false}>
      <bs-carousel-item active>One</bs-carousel-item>
      <bs-carousel-item>Two</bs-carousel-item>
    </bs-carousel>`);
    await tick();
    expect(el.shadowRoot!.querySelector('.carousel-control-prev')).to.equal(null);
  });

  it('first item auto-actives if none marked active', async () => {
    const el = await fixture<BsCarousel>(html`<bs-carousel interval="0">
      <bs-carousel-item>One</bs-carousel-item>
      <bs-carousel-item>Two</bs-carousel-item>
    </bs-carousel>`);
    await tick();
    await wait(20);
    const items = el.querySelectorAll('bs-carousel-item');
    expect((items[0] as BsCarouselItem).active).to.equal(true);
    expect((items[1] as BsCarouselItem).active).to.equal(false);
  });

  it('next() advances and fires bs-slide / bs-slid', async () => {
    const el = await fixture<BsCarousel>(html`<bs-carousel interval="0">
      <bs-carousel-item active>One</bs-carousel-item>
      <bs-carousel-item>Two</bs-carousel-item>
      <bs-carousel-item>Three</bs-carousel-item>
    </bs-carousel>`);
    await tick();
    await wait(20);
    const slid = oneEvent(el, 'bs-slid');
    el.next();
    const ev = (await slid) as CustomEvent;
    expect(ev.detail.from).to.equal(0);
    expect(ev.detail.to).to.equal(1);
    expect(ev.detail.direction).to.equal('next');
    const items = el.querySelectorAll('bs-carousel-item');
    expect((items[1] as BsCarouselItem).active).to.equal(true);
  });

  it('to(2) jumps directly', async () => {
    const el = await fixture<BsCarousel>(html`<bs-carousel interval="0">
      <bs-carousel-item active>One</bs-carousel-item>
      <bs-carousel-item>Two</bs-carousel-item>
      <bs-carousel-item>Three</bs-carousel-item>
    </bs-carousel>`);
    await tick();
    await wait(20);
    el.to(2);
    await wait(700);
    const items = el.querySelectorAll('bs-carousel-item');
    expect((items[2] as BsCarouselItem).active).to.equal(true);
  });

  it('arrow keys navigate', async () => {
    const el = await fixture<BsCarousel>(html`<bs-carousel interval="0">
      <bs-carousel-item active>One</bs-carousel-item>
      <bs-carousel-item>Two</bs-carousel-item>
    </bs-carousel>`);
    await tick();
    await wait(20);
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await wait(700);
    const items = el.querySelectorAll('bs-carousel-item');
    expect((items[1] as BsCarouselItem).active).to.equal(true);
  });
});

describe('bs-carousel-item', () => {
  it('host carries .carousel-item + .active', async () => {
    const item = await fixture<BsCarouselItem>(html`<bs-carousel-item active>x</bs-carousel-item>`);
    await tick();
    expect(item.classList.contains('carousel-item')).to.equal(true);
    expect(item.classList.contains('active')).to.equal(true);
  });

  it('transition-state maps to next/prev/start/end host classes', async () => {
    const item = await fixture<BsCarouselItem>(html`<bs-carousel-item></bs-carousel-item>`);
    item.transitionState = 'next-start';
    await item.updateComplete;
    expect(item.classList.contains('carousel-item-next')).to.equal(true);
    expect(item.classList.contains('carousel-item-start')).to.equal(true);
    item.transitionState = 'prev-end';
    await item.updateComplete;
    expect(item.classList.contains('carousel-item-prev')).to.equal(true);
    expect(item.classList.contains('carousel-item-end')).to.equal(true);
  });
});
