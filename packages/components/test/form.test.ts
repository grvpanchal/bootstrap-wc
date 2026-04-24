import { expect, fixture, html } from '@open-wc/testing';
import '../src/form/index.js';
import '../src/input/index.js';
import type { BsForm } from '../src/form/form.js';
import type { BsInput } from '../src/input/input.js';

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

  it('injects a hidden autofill mirror for every name+autocomplete control', async () => {
    const el = await fixture<BsForm>(html`
      <bs-form>
        <bs-input name="email" autocomplete="email" type="email"></bs-input>
        <bs-input name="no-autocomplete"></bs-input>
      </bs-form>
    `);
    await new Promise((r) => requestAnimationFrame(r));
    const mirrors = el.querySelectorAll('input[data-bs-form-mirror]');
    expect(mirrors.length, 'one mirror for the autocomplete control only').to.equal(1);
    const mirror = mirrors[0] as HTMLInputElement;
    expect(mirror.name).to.equal('email');
    expect(mirror.autocomplete).to.equal('email');
    expect(mirror.type).to.equal('email');
    expect(mirror.tabIndex).to.equal(-1);
    expect(mirror.getAttribute('aria-hidden')).to.equal('true');
    // Not display:none — autofill engines skip hidden inputs
    expect(getComputedStyle(mirror).display).to.not.equal('none');
  });

  it('propagates autofilled mirror value into the bs-input', async () => {
    const el = await fixture<BsForm>(html`
      <bs-form>
        <bs-input name="email" autocomplete="email" type="email"></bs-input>
      </bs-form>
    `);
    await new Promise((r) => requestAnimationFrame(r));
    const input = el.querySelector('bs-input') as BsInput;
    const mirror = el.querySelector('input[data-bs-form-mirror]') as HTMLInputElement;
    mirror.value = 'ada@example.com';
    mirror.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => requestAnimationFrame(r));
    expect(input.value).to.equal('ada@example.com');
  });

  it('fires bs-submit with a FormData that includes form-associated CEs', async () => {
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
