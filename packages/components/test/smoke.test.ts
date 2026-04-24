import { expect, fixture, html } from '@open-wc/testing';
import '../src/index.js';

const TAGS = [
  'bs-accordion',
  'bs-accordion-item',
  'bs-alert',
  'bs-badge',
  'bs-breadcrumb',
  'bs-button',
  'bs-button-group',
  'bs-card',
  'bs-close-button',
  'bs-collapse',
  'bs-dropdown',
  'bs-dropdown-item',
  'bs-form',
  'bs-form-check',
  'bs-form-label',
  'bs-form-text',
  'bs-input',
  'bs-input-group',
  'bs-input-text',
  'bs-list-group',
  'bs-list-group-item',
  'bs-modal',
  'bs-nav',
  'bs-nav-item',
  'bs-navbar',
  'bs-offcanvas',
  'bs-pagination',
  'bs-popover',
  'bs-progress',
  'bs-progress-stacked',
  'bs-range',
  'bs-select',
  'bs-spinner',
  'bs-tabs',
  'bs-tab-panel',
  'bs-textarea',
  'bs-toast',
  'bs-toast-container',
  'bs-tooltip',
];

describe('smoke: every component registers and renders', () => {
  for (const tag of TAGS) {
    it(`<${tag}> registers`, () => {
      expect(customElements.get(tag)).to.exist;
    });
  }
});

describe('smoke: selected components reflect attributes', () => {
  it('bs-button reflects disabled', async () => {
    const el = await fixture<HTMLElement>(html`<bs-button disabled>Hi</bs-button>`);
    await new Promise((r) => requestAnimationFrame(r));
    expect(el.hasAttribute('disabled')).to.equal(true);
    expect(el.classList.contains('btn')).to.equal(true);
    expect(el.classList.contains('disabled')).to.equal(true);
    expect(el.getAttribute('aria-disabled')).to.equal('true');
  });

  it('bs-badge applies text-bg-{variant}', async () => {
    const el = await fixture<HTMLElement>(html`<bs-badge variant="success">2</bs-badge>`);
    await new Promise((r) => requestAnimationFrame(r));
    const span = el.shadowRoot!.querySelector('span')!;
    expect(span.classList.contains('text-bg-success')).to.equal(true);
  });

  it('bs-progress computes percentage', async () => {
    const el = await fixture<HTMLElement>(html`<bs-progress value="25"></bs-progress>`);
    await new Promise((r) => requestAnimationFrame(r));
    const bar = el.shadowRoot!.querySelector('.progress-bar') as HTMLElement;
    expect(bar.style.width).to.equal('25%');
  });
});
