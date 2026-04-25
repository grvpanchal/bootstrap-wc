import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import '../src/input/index.js';
import type { BsInput } from '../src/input/input.js';

describe('bs-input', () => {
  it('updates value on user input and fires bs-input', async () => {
    const el = await fixture<BsInput>(html`<bs-input></bs-input>`);
    // Native <input> renders into light DOM (so browser autofill picks it up).
    const native = el.querySelector('input') as HTMLInputElement;
    expect(native, 'native <input> rendered as light-DOM child').to.exist;
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

  it('exposes name + autocomplete on the light-DOM <input> for browser autofill', async () => {
    const el = await fixture<BsInput>(
      html`<bs-input name="email" type="email" autocomplete="email"></bs-input>`,
    );
    const native = el.querySelector('input') as HTMLInputElement;
    expect(native).to.exist;
    expect(native.name).to.equal('email');
    expect(native.type).to.equal('email');
    expect(native.autocomplete).to.equal('email');
    // The host should NOT carry a shadow root — light-DOM rendering only.
    expect(el.shadowRoot).to.equal(null);
  });
});
