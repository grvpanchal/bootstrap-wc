import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import '../src/tabs/index.js';
import type { BsTabs } from '../src/tabs/tabs.js';

describe('bs-tabs', () => {
  it('activates the first panel by default', async () => {
    const el = await fixture<BsTabs>(html`<bs-tabs>
      <bs-tab-panel name="a" label="A">A</bs-tab-panel>
      <bs-tab-panel name="b" label="B">B</bs-tab-panel>
    </bs-tabs>`);
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 20));
    expect(el.active).to.equal('a');
    expect(el.querySelector('bs-tab-panel[name="a"]')!.hasAttribute('active')).to.equal(true);
  });

  it('dispatches bs-tab-change on selection', async () => {
    const el = await fixture<BsTabs>(html`<bs-tabs active="a">
      <bs-tab-panel name="a" label="A">A</bs-tab-panel>
      <bs-tab-panel name="b" label="B">B</bs-tab-panel>
    </bs-tabs>`);
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 20));
    const changed = oneEvent(el, 'bs-tab-change');
    el.active = 'b';
    const ev = (await changed) as CustomEvent<{ active: string }>;
    expect(ev.detail.active).to.equal('b');
  });
});
