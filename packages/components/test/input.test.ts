import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import '../src/input/index.js';
import type { BsInput } from '../src/input/input.js';

describe('bs-input', () => {
  it('updates value on user input and fires bs-input', async () => {
    const el = await fixture<BsInput>(html`<bs-input></bs-input>`);
    const native = el.querySelector('input') as HTMLInputElement;
    const event = oneEvent(el, 'bs-input');
    native.value = 'hello';
    native.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await event;
    expect(el.value).to.equal('hello');
  });

  it('participates in form submission', async () => {
    const form = await fixture<HTMLFormElement>(html`<form>
      <bs-input name="name" value="Ada"></bs-input>
    </form>`);
    const fd = new FormData(form);
    expect(fd.get('name')).to.equal('Ada');
  });
});
