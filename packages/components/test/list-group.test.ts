import { expect, fixture, html } from '@open-wc/testing';
import '../src/list-group/index.js';
import type { BsListGroup } from '../src/list-group/list-group.js';
import type { BsListGroupItem } from '../src/list-group/list-group-item.js';

const tick = () => new Promise((r) => requestAnimationFrame(r));

describe('bs-list-group', () => {
  it('host carries .list-group + flush / numbered modifiers', async () => {
    const el = await fixture<BsListGroup>(html`<bs-list-group flush numbered></bs-list-group>`);
    await tick();
    expect(el.classList.contains('list-group')).to.equal(true);
    expect(el.classList.contains('list-group-flush')).to.equal(true);
    expect(el.classList.contains('list-group-numbered')).to.equal(true);
  });

  it('default as="ul" — items announce as listitem', async () => {
    const el = await fixture<BsListGroup>(html`<bs-list-group>
      <bs-list-group-item>One</bs-list-group-item>
    </bs-list-group>`);
    await tick();
    const item = el.querySelector('bs-list-group-item') as BsListGroupItem;
    expect(item.getAttribute('role')).to.equal('listitem');
    expect(item.classList.contains('list-group-item-action')).to.equal(false);
  });

  it('as="div" — items announce as link with .list-group-item-action and tabindex', async () => {
    const el = await fixture<BsListGroup>(html`<bs-list-group as="div">
      <bs-list-group-item>One</bs-list-group-item>
    </bs-list-group>`);
    await tick();
    const item = el.querySelector('bs-list-group-item') as BsListGroupItem;
    expect(item.getAttribute('role')).to.equal('link');
    expect(item.classList.contains('list-group-item-action')).to.equal(true);
    expect(item.tabIndex).to.equal(0);
  });

  it('href on item adds .list-group-item-action and link role even with default as="ul"', async () => {
    const el = await fixture<BsListGroup>(html`<bs-list-group>
      <bs-list-group-item href="#">Link</bs-list-group-item>
    </bs-list-group>`);
    await tick();
    const item = el.querySelector('bs-list-group-item') as BsListGroupItem;
    expect(item.getAttribute('role')).to.equal('link');
    expect(item.classList.contains('list-group-item-action')).to.equal(true);
  });

  it('active item sets aria-current=true', async () => {
    const el = await fixture<BsListGroup>(html`<bs-list-group>
      <bs-list-group-item active>Active</bs-list-group-item>
    </bs-list-group>`);
    await tick();
    const item = el.querySelector('bs-list-group-item') as BsListGroupItem;
    expect(item.classList.contains('active')).to.equal(true);
    expect(item.getAttribute('aria-current')).to.equal('true');
  });

  it('preserves author-set aria-current when active is never toggled true', async () => {
    const el = await fixture<BsListGroup>(html`<bs-list-group as="div">
      <bs-list-group-item href="#" aria-current="true">Current</bs-list-group-item>
    </bs-list-group>`);
    await tick();
    const item = el.querySelector('bs-list-group-item') as BsListGroupItem;
    expect(item.getAttribute('aria-current')).to.equal('true');
    expect(item.classList.contains('active')).to.equal(false);
  });

  it('href item navigates when a nested non-interactive element is clicked', async () => {
    // Regression: previously the item only navigated when ev.target === host,
    // so clicks on inner `<div>` content (e.g. search-result titles) were
    // ignored.
    const el = await fixture<BsListGroup>(html`<bs-list-group as="div">
      <bs-list-group-item href="/some-page">
        <div class="fw-semibold">Title</div>
        <div class="small">Subtitle</div>
      </bs-list-group-item>
    </bs-list-group>`);
    await tick();
    const item = el.querySelector('bs-list-group-item') as BsListGroupItem;
    let captured: string | null = null;
    (item as unknown as { _navigate: (h: string) => void })._navigate = (h) => {
      captured = h;
    };
    const inner = item.querySelector('.fw-semibold') as HTMLElement;
    inner.click();
    expect(captured).to.equal('/some-page');
  });

  it('href item does NOT navigate when a nested <a> handled the click', async () => {
    const el = await fixture<BsListGroup>(html`<bs-list-group as="div">
      <bs-list-group-item href="/outer">
        <a id="inner" href="/inner">Inner link</a>
      </bs-list-group-item>
    </bs-list-group>`);
    await tick();
    const item = el.querySelector('bs-list-group-item') as BsListGroupItem;
    let captured: string | null = null;
    (item as unknown as { _navigate: (h: string) => void })._navigate = (h) => {
      captured = h;
    };
    const inner = el.querySelector('#inner') as HTMLElement;
    // Dispatch a synthetic click instead of `inner.click()`. Chromium's
    // synthetic-click activation steps navigate real anchors, which races
    // with web-test-runner's teardown page.goto("about:blank") and aborts
    // the whole run under newer Chromium (v1217+). The outer handler only
    // cares about `ev.target` closest-matching an interactive element —
    // dispatching a bubbling MouseEvent from the inner anchor exercises
    // the same guard without triggering navigation.
    inner.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(captured).to.equal(null);
  });
});
