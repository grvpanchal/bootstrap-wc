import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import '../src/dropdown/index.js';
import type { BsDropdown } from '../src/dropdown/dropdown.js';
import type { BsDropdownMenu } from '../src/dropdown/dropdown-menu.js';

const tick = () => new Promise((r) => requestAnimationFrame(r));

describe('bs-dropdown-menu', () => {
  it('host carries .dropdown-menu .show .position-static by default', async () => {
    const el = await fixture<BsDropdownMenu>(html`<bs-dropdown-menu>
      <li><a class="dropdown-item" href="#">Action</a></li>
    </bs-dropdown-menu>`);
    await tick();
    expect(el.classList.contains('dropdown-menu')).to.equal(true);
    expect(el.classList.contains('show')).to.equal(true);
    expect(el.classList.contains('position-static')).to.equal(true);
    expect(el.classList.contains('d-block')).to.equal(false);
  });

  it('display-block adds .d-block', async () => {
    const el = await fixture<BsDropdownMenu>(html`<bs-dropdown-menu display-block></bs-dropdown-menu>`);
    await tick();
    expect(el.classList.contains('d-block')).to.equal(true);
  });

  it('menu-dark / menu-end add their classes', async () => {
    const el = await fixture<BsDropdownMenu>(html`<bs-dropdown-menu menu-dark menu-end></bs-dropdown-menu>`);
    await tick();
    expect(el.classList.contains('dropdown-menu-dark')).to.equal(true);
    expect(el.classList.contains('dropdown-menu-end')).to.equal(true);
  });
});

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

  it('auto-defaults unattributed children to slot="menu"', async () => {
    const el = await fixture<BsDropdown>(html`<bs-dropdown label="Menu">
      <bs-dropdown-item>One</bs-dropdown-item>
      <bs-dropdown-item>Two</bs-dropdown-item>
      <bs-dropdown-item slot="menu">Three (already slotted)</bs-dropdown-item>
      <span slot="label">Custom Label</span>
    </bs-dropdown>`);
    await el.updateComplete;
    const items = Array.from(el.querySelectorAll('bs-dropdown-item'));
    // All three items should now have slot="menu" — first two were defaulted,
    // third was already slotted explicitly.
    expect(items.map((i) => i.getAttribute('slot'))).to.deep.equal(['menu', 'menu', 'menu']);
    // The explicitly-slotted custom label trigger keeps slot="label".
    const label = el.querySelector('span[slot="label"]');
    expect(label?.getAttribute('slot')).to.equal('label');
  });

  it('auto-slots children added after connect (MutationObserver)', async () => {
    const el = await fixture<BsDropdown>(html`<bs-dropdown label="Menu"></bs-dropdown>`);
    const item = document.createElement('bs-dropdown-item');
    item.textContent = 'Late';
    el.appendChild(item);
    // MutationObserver fires asynchronously — yield once.
    await new Promise((r) => queueMicrotask(() => r(null)));
    await new Promise((r) => setTimeout(r, 0));
    expect(item.getAttribute('slot')).to.equal('menu');
  });
});
