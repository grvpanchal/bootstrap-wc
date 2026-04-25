import { expect, fixture, html } from '@open-wc/testing';
import '../src/form/index.js';
import '../src/input/index.js';
import type { BsForm } from '../src/form/form.js';

describe('bs-form', () => {
  it('wraps its children in a light-DOM form', async () => {
    const el = await fixture<BsForm>(html`
      <bs-form action="/submit" method="post">
        <bs-input name="email" autocomplete="email" type="email"></bs-input>
      </bs-form>
    `);
    await new Promise((r) => requestAnimationFrame(r));
    const inner = el.querySelector(':scope > form[data-bs-form-root]');
    expect(inner, 'inner form exists').to.exist;
    expect((inner as HTMLFormElement).action).to.include('/submit');
    expect((inner as HTMLFormElement).method).to.equal('post');
    expect(inner!.querySelector('bs-input'), 'bs-input moved into inner form').to.exist;
  });

  it('makes the bs-input native <input> visible to the form', async () => {
    const el = await fixture<BsForm>(html`
      <bs-form>
        <bs-input name="email" autocomplete="email" type="email" value="ada@example.com"></bs-input>
      </bs-form>
    `);
    await new Promise((r) => requestAnimationFrame(r));
    const inner = el.querySelector('form[data-bs-form-root]') as HTMLFormElement;
    // Light-DOM <input> means autofill predictors and FormData see it directly.
    const native = inner.querySelector('bs-input input') as HTMLInputElement;
    expect(native, 'native input is a light-DOM descendant of the form').to.exist;
    expect(native.autocomplete).to.equal('email');
    expect(native.type).to.equal('email');
    expect(native.name).to.equal('email');
    const fd = new FormData(inner);
    expect(fd.get('email')).to.equal('ada@example.com');
  });

  it('fires bs-submit with a FormData snapshot', async () => {
    const el = await fixture<BsForm>(html`
      <bs-form novalidate>
        <bs-input name="name" value="Ada" type="text"></bs-input>
      </bs-form>
    `);
    await new Promise((r) => requestAnimationFrame(r));
    const form = el.querySelector('form[data-bs-form-root]') as HTMLFormElement;
    let captured: FormData | null = null;
    el.addEventListener('bs-submit', (ev: Event) => {
      captured = (ev as CustomEvent<{ formData: FormData }>).detail.formData;
      ev.preventDefault();
    });
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    expect(captured, 'bs-submit fired').to.not.equal(null);
    expect(captured!.get('name')).to.equal('Ada');
  });
});
