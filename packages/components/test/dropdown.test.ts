import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import '../src/dropdown/index.js';
import type { BsDropdown } from '../src/dropdown/dropdown.js';

describe('bs-dropdown', () => {
  it('toggles on trigger click', async () => {
    const el = await fixture<BsDropdown>(html`<bs-dropdown label="Menu">
      <bs-dropdown-item slot="menu">One</bs-dropdown-item>
    </bs-dropdown>`);
    expect(el.open).to.equal(false);
    (el.shadowRoot!.querySelector('.dropdown-toggle') as HTMLElement).click();
    await el.updateComplete;
    expect(el.open).to.equal(true);
  });

  it('closes on outside click', async () => {
    const el = await fixture<BsDropdown>(html`<bs-dropdown label="Menu" open></bs-dropdown>`);
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 10));
    document.body.click();
    await new Promise((r) => setTimeout(r, 10));
    expect(el.open).to.equal(false);
  });
});
