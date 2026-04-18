import { expect, fixture, html } from '@open-wc/testing';
import '../src/accordion/index.js';
import type { BsAccordionItem } from '../src/accordion/accordion-item.js';

describe('bs-accordion', () => {
  it('enforces single-open by default', async () => {
    const el = await fixture(html`<bs-accordion>
      <bs-accordion-item heading="A" open></bs-accordion-item>
      <bs-accordion-item heading="B"></bs-accordion-item>
    </bs-accordion>`);
    const items = el.querySelectorAll<BsAccordionItem>('bs-accordion-item');
    items[1].shadowRoot?.querySelector<HTMLButtonElement>('.accordion-button')?.click();
    // Force the toggle directly since no shadow root.
    items[1].open = true;
    items[1].dispatchEvent(
      new CustomEvent('bs-accordion-item-toggle', { bubbles: true, composed: true, detail: { open: true } }),
    );
    await new Promise((r) => setTimeout(r, 10));
    expect(items[0].hasAttribute('open')).to.equal(false);
  });

  it('always-open keeps both open', async () => {
    const el = await fixture(html`<bs-accordion always-open>
      <bs-accordion-item heading="A" open></bs-accordion-item>
      <bs-accordion-item heading="B"></bs-accordion-item>
    </bs-accordion>`);
    const items = el.querySelectorAll<BsAccordionItem>('bs-accordion-item');
    items[1].open = true;
    items[1].dispatchEvent(
      new CustomEvent('bs-accordion-item-toggle', { bubbles: true, composed: true, detail: { open: true } }),
    );
    await new Promise((r) => setTimeout(r, 10));
    expect(items[0].hasAttribute('open')).to.equal(true);
  });
});
