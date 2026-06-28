import { expect, fixture, html } from '@open-wc/testing';
import '../src/table/index.js';
import type { BsTable } from '../src/table/table.js';

const tick = () => new Promise((r) => requestAnimationFrame(r));

describe('bs-table', () => {
  describe('class management on the inner <table>', () => {
    it('applies `.table` by default', async () => {
      const el = await fixture<BsTable>(
        html`<bs-table><table><tbody><tr><td>x</td></tr></tbody></table></bs-table>`,
      );
      await tick();
      const t = el.querySelector('table')!;
      expect(t.classList.contains('table')).to.equal(true);
    });

    it('applies color variant via `variant`', async () => {
      const el = await fixture<BsTable>(
        html`<bs-table variant="dark"><table><tbody><tr><td>x</td></tr></tbody></table></bs-table>`,
      );
      await tick();
      expect(el.querySelector('table')!.classList.contains('table-dark')).to.equal(true);
    });

    it('toggles modifier classes', async () => {
      const el = await fixture<BsTable>(
        html`<bs-table striped striped-columns bordered hover>
          <table><tbody><tr><td>x</td></tr></tbody></table>
        </bs-table>`,
      );
      await tick();
      const t = el.querySelector('table')!;
      expect(t.classList.contains('table-striped')).to.equal(true);
      expect(t.classList.contains('table-striped-columns')).to.equal(true);
      expect(t.classList.contains('table-bordered')).to.equal(true);
      expect(t.classList.contains('table-hover')).to.equal(true);
    });

    it('`borderless` adds .table-borderless', async () => {
      const el = await fixture<BsTable>(
        html`<bs-table borderless><table><tbody><tr><td>x</td></tr></tbody></table></bs-table>`,
      );
      await tick();
      expect(el.querySelector('table')!.classList.contains('table-borderless')).to.equal(true);
    });

    it('`border-variant` adds border-{variant} (paired with bordered)', async () => {
      const el = await fixture<BsTable>(
        html`<bs-table bordered border-variant="primary">
          <table><tbody><tr><td>x</td></tr></tbody></table>
        </bs-table>`,
      );
      await tick();
      const t = el.querySelector('table')!;
      expect(t.classList.contains('table-bordered')).to.equal(true);
      expect(t.classList.contains('border-primary')).to.equal(true);
    });

    it('`size="sm"` adds .table-sm', async () => {
      const el = await fixture<BsTable>(
        html`<bs-table size="sm"><table><tbody><tr><td>x</td></tr></tbody></table></bs-table>`,
      );
      await tick();
      expect(el.querySelector('table')!.classList.contains('table-sm')).to.equal(true);
    });

    it('`caption-top` adds .caption-top', async () => {
      const el = await fixture<BsTable>(
        html`<bs-table caption-top>
          <table>
            <caption>Hello</caption>
            <tbody><tr><td>x</td></tr></tbody>
          </table>
        </bs-table>`,
      );
      await tick();
      expect(el.querySelector('table')!.classList.contains('caption-top')).to.equal(true);
    });

    it('`group-divider` adds .table-group-divider to <tbody>', async () => {
      const el = await fixture<BsTable>(
        html`<bs-table group-divider>
          <table><tbody><tr><td>x</td></tr></tbody></table>
        </bs-table>`,
      );
      await tick();
      const tbody = el.querySelector('tbody')!;
      expect(tbody.classList.contains('table-group-divider')).to.equal(true);
    });

    it('swaps variant cleanly when changed', async () => {
      const el = await fixture<BsTable>(
        html`<bs-table variant="dark"><table><tbody><tr><td>x</td></tr></tbody></table></bs-table>`,
      );
      await tick();
      el.variant = 'primary';
      await el.updateComplete;
      await tick();
      const t = el.querySelector('table')!;
      expect(t.classList.contains('table-primary')).to.equal(true);
      expect(t.classList.contains('table-dark')).to.equal(false);
    });

    it('toggling a boolean modifier removes the class', async () => {
      const el = await fixture<BsTable>(
        html`<bs-table striped><table><tbody><tr><td>x</td></tr></tbody></table></bs-table>`,
      );
      await tick();
      el.striped = false;
      await el.updateComplete;
      await tick();
      expect(el.querySelector('table')!.classList.contains('table-striped')).to.equal(false);
    });
  });

  describe('responsive wrapping on the host', () => {
    it('no `responsive` attribute → no wrapper class', async () => {
      const el = await fixture<BsTable>(
        html`<bs-table><table><tbody><tr><td>x</td></tr></tbody></table></bs-table>`,
      );
      await tick();
      expect(el.classList.contains('table-responsive')).to.equal(false);
    });

    it('bare `responsive` → .table-responsive on the host', async () => {
      const el = await fixture<BsTable>(
        html`<bs-table responsive><table><tbody><tr><td>x</td></tr></tbody></table></bs-table>`,
      );
      await tick();
      expect(el.classList.contains('table-responsive')).to.equal(true);
    });

    it('`responsive="md"` → .table-responsive-md on the host', async () => {
      const el = await fixture<BsTable>(
        html`<bs-table responsive="md"><table><tbody><tr><td>x</td></tr></tbody></table></bs-table>`,
      );
      await tick();
      expect(el.classList.contains('table-responsive-md')).to.equal(true);
      expect(el.classList.contains('table-responsive')).to.equal(false);
    });

    it('toggling responsive at runtime swaps the host class', async () => {
      const el = await fixture<BsTable>(
        html`<bs-table responsive="sm"><table><tbody><tr><td>x</td></tr></tbody></table></bs-table>`,
      );
      await tick();
      el.responsive = 'lg';
      await el.updateComplete;
      await tick();
      expect(el.classList.contains('table-responsive-lg')).to.equal(true);
      expect(el.classList.contains('table-responsive-sm')).to.equal(false);
    });
  });

  describe('mutation observer', () => {
    it('applies classes to an inner <table> inserted after connect', async () => {
      const el = await fixture<BsTable>(html`<bs-table striped hover></bs-table>`);
      await tick();
      const t = document.createElement('table');
      const tbody = document.createElement('tbody');
      t.appendChild(tbody);
      el.appendChild(t);
      // Wait one frame for the mutation observer + updated() to catch up.
      await new Promise((r) => setTimeout(r, 10));
      expect(t.classList.contains('table')).to.equal(true);
      expect(t.classList.contains('table-striped')).to.equal(true);
      expect(t.classList.contains('table-hover')).to.equal(true);
    });
  });

  describe('csspart marker', () => {
    it('inner table gets part="table" so consumers can address it', async () => {
      const el = await fixture<BsTable>(
        html`<bs-table><table><tbody><tr><td>x</td></tr></tbody></table></bs-table>`,
      );
      await tick();
      expect(el.querySelector('table')!.getAttribute('part')).to.equal('table');
    });
  });
});
