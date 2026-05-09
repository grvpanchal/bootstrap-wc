import { expect, fixture, html } from '@open-wc/testing';
import '../src/select/index.js';
import type { BsSelect } from '../src/select/select.js';

const tick = () => new Promise((r) => requestAnimationFrame(r));

describe('bs-select', () => {
  it('reads native <option> children into the internal <select>', async () => {
    const el = await fixture<BsSelect>(html`<bs-select>
      <option value="a">Apple</option>
      <option value="b" selected>Banana</option>
      <option value="c">Cherry</option>
    </bs-select>`);
    await tick();
    const native = el.querySelector('select');
    expect(native, 'native <select> rendered').to.exist;
    const opts = Array.from(native!.querySelectorAll('option'));
    expect(opts.map((o) => o.value)).to.deep.equal(['a', 'b', 'c']);
    expect(native!.value).to.equal('b');
  });

  it('warns about unknown-tag children that aren\'t <option> / <optgroup> / <hr>', async () => {
    const warnings: string[] = [];
    const orig = console.warn;
    console.warn = (...args: unknown[]) => warnings.push(args.map(String).join(' '));
    try {
      await fixture<BsSelect>(html`<bs-select>
        <bs-option value="x">X</bs-option>
        <span>nope</span>
        <option value="ok">OK</option>
      </bs-select>`);
      await tick();
    } finally {
      console.warn = orig;
    }
    expect(warnings.length, 'one warning emitted').to.be.greaterThan(0);
    const msg = warnings.join('\n');
    expect(msg).to.include('[bs-select]');
    expect(msg).to.include('<bs-option>');
    expect(msg).to.include('<span>');
    expect(msg).to.include('Did you mean <option>');
  });

  it('does NOT warn when only <option> / <optgroup> / <hr> are slotted', async () => {
    const warnings: string[] = [];
    const orig = console.warn;
    console.warn = (...args: unknown[]) => warnings.push(args.map(String).join(' '));
    try {
      await fixture<BsSelect>(html`<bs-select>
        <option value="a">A</option>
        <optgroup label="Group">
          <option value="b">B</option>
        </optgroup>
        <hr />
        <option value="c">C</option>
      </bs-select>`);
      await tick();
    } finally {
      console.warn = orig;
    }
    const ours = warnings.filter((w) => w.includes('[bs-select]'));
    expect(ours, 'no [bs-select] warnings').to.deep.equal([]);
  });
});
