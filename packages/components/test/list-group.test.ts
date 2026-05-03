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
});
