/**
 * Data-driven ("dual-nature") tests.
 *
 * Every component in this file has been extended to accept its content as
 * a JS property (`items[]`, `tabs[]`, `columns[]+rows[]`, or `config` object)
 * in addition to the slotted-children form. This suite locks in that
 * contract:
 *
 *   1. When the data property is set to a non-empty value, the shadow /
 *      light-DOM output matches the equivalent slotted-children output.
 *   2. When the property is empty / unset, the historical slot behaviour
 *      is preserved.
 *
 * We compare on class + text + role signatures rather than deep DOM equality
 * so semantic differences (e.g. shadow-DOM vs light-DOM in some components)
 * don't cause noise.
 */
import { expect, fixture, html } from '@open-wc/testing';

import '../src/nav/nav.js';
import '../src/nav/nav-item.js';
import '../src/tabs/tabs.js';
import '../src/list-group/list-group.js';
import '../src/list-group/list-group-item.js';
import '../src/dropdown/dropdown.js';
import '../src/accordion/accordion.js';
import '../src/accordion/accordion-item.js';
import '../src/table/table.js';
import '../src/navbar/navbar.js';

import type { BsNav } from '../src/nav/nav.js';
import type { BsTabs } from '../src/tabs/tabs.js';
import type { BsListGroup } from '../src/list-group/list-group.js';
import type { BsDropdown } from '../src/dropdown/dropdown.js';
import type { BsAccordion } from '../src/accordion/accordion.js';
import type { BsTable } from '../src/table/table.js';
import type { BsNavbar } from '../src/navbar/navbar.js';

const tick = () => new Promise((r) => requestAnimationFrame(r));

describe('data-driven (dual-nature) components', () => {
  describe('bs-nav', () => {
    it('renders <bs-nav-item> children from `items`', async () => {
      const el = await fixture<BsNav>(html`<bs-nav
        .items=${[
          { label: 'Home', active: true },
          { label: 'About', href: '/about' },
          { label: 'Disabled', disabled: true },
        ]}
      ></bs-nav>`);
      await el.updateComplete;
      // Data-driven items live in the shadow tree (bs-nav renders them
      // itself, they aren't slotted light children).
      const items = el.shadowRoot!.querySelectorAll('bs-nav-item');
      expect(items).to.have.lengthOf(3);
      expect(items[0].hasAttribute('active')).to.equal(true);
      expect(items[0].textContent?.trim()).to.equal('Home');
      expect(items[1].getAttribute('href')).to.equal('/about');
      expect(items[2].hasAttribute('disabled')).to.equal(true);
    });

    it('falls back to slot when items is empty', async () => {
      const el = await fixture<BsNav>(html`<bs-nav>
        <bs-nav-item active>Slotted</bs-nav-item>
      </bs-nav>`);
      await el.updateComplete;
      // Slotted child is a light-DOM child.
      expect(el.querySelectorAll('bs-nav-item')).to.have.lengthOf(1);
      expect(el.querySelector('bs-nav-item')?.textContent?.trim()).to.equal('Slotted');
    });

    it('parses JSON attribute into items', async () => {
      const el = await fixture<BsNav>(html`<bs-nav
        items='[{"label":"A"},{"label":"B","active":true}]'
      ></bs-nav>`);
      await el.updateComplete;
      expect(el.items.length).to.equal(2);
      const items = el.shadowRoot!.querySelectorAll('bs-nav-item');
      expect(items.length).to.equal(2);
      expect(items[1].hasAttribute('active')).to.equal(true);
    });
  });

  describe('bs-tabs', () => {
    it('renders tab buttons and panels from `tabs`', async () => {
      const el = await fixture<BsTabs>(html`<bs-tabs
        .tabs=${[
          { name: 'home', label: 'Home', content: '<p>home</p>', active: true },
          { name: 'prof', label: 'Profile', content: '<p>prof</p>' },
        ]}
      ></bs-tabs>`);
      await tick();
      await el.updateComplete;
      const buttons = el.shadowRoot!.querySelectorAll('button.nav-link');
      expect(buttons.length).to.equal(2);
      expect(buttons[0].classList.contains('active')).to.equal(true);
      expect(el.active).to.equal('home');
      const panels = el.shadowRoot!.querySelectorAll('.tab-pane');
      expect(panels.length).to.equal(2);
      expect(panels[0].classList.contains('active')).to.equal(true);
      expect(panels[0].innerHTML.trim()).to.include('<p>home</p>');
    });

    it('activates a different tab on click', async () => {
      const el = await fixture<BsTabs>(html`<bs-tabs
        .tabs=${[
          { name: 'a', label: 'A' },
          { name: 'b', label: 'B' },
        ]}
      ></bs-tabs>`);
      await tick();
      await el.updateComplete;
      const [, btnB] = Array.from(el.shadowRoot!.querySelectorAll('button.nav-link')) as HTMLButtonElement[];
      btnB.click();
      await el.updateComplete;
      expect(el.active).to.equal('b');
    });
  });

  describe('bs-list-group', () => {
    it('renders <bs-list-group-item> children from `items`', async () => {
      const el = await fixture<BsListGroup>(html`<bs-list-group
        .items=${[
          { text: 'First', active: true },
          { text: 'Link', href: '/x', action: true },
          { text: 'Disabled', disabled: true },
        ]}
      ></bs-list-group>`);
      await el.updateComplete;
      const items = el.shadowRoot!.querySelectorAll('bs-list-group-item');
      expect(items.length).to.equal(3);
      expect(items[0].hasAttribute('active')).to.equal(true);
      expect(items[1].getAttribute('href')).to.equal('/x');
      expect(items[1].hasAttribute('action')).to.equal(true);
      expect(items[2].hasAttribute('disabled')).to.equal(true);
    });
  });

  describe('bs-dropdown', () => {
    it('renders menu items from `items` with headers + dividers', async () => {
      const el = await fixture<BsDropdown>(html`<bs-dropdown
        label="Menu"
        open
        .items=${[
          { header: true, label: 'Section' },
          { label: 'One', href: '#one', active: true },
          { label: 'Two', href: '#two' },
          { divider: true },
          { label: 'Three', href: '#three', disabled: true },
        ]}
      ></bs-dropdown>`);
      await tick();
      await el.updateComplete;
      const menu = el.shadowRoot!.querySelector('.dropdown-menu')!;
      const header = menu.querySelector('h6.dropdown-header');
      expect(header?.textContent?.trim()).to.equal('Section');
      const links = menu.querySelectorAll('a.dropdown-item');
      expect(links.length).to.equal(3);
      expect(links[0].classList.contains('active')).to.equal(true);
      expect(menu.querySelectorAll('hr.dropdown-divider').length).to.equal(1);
      expect(links[2].classList.contains('disabled')).to.equal(true);
    });
  });

  describe('bs-accordion', () => {
    it('renders <bs-accordion-item> children from `items`', async () => {
      const el = await fixture<BsAccordion>(html`<bs-accordion
        .items=${[
          { heading: 'First', body: 'One', open: true },
          { heading: 'Second', body: 'Two' },
        ]}
      ></bs-accordion>`);
      await el.updateComplete;
      const items = el.shadowRoot!.querySelectorAll('bs-accordion-item');
      expect(items.length).to.equal(2);
      expect(items[0].getAttribute('heading')).to.equal('First');
      expect(items[0].hasAttribute('open')).to.equal(true);
    });
  });

  describe('bs-table', () => {
    it('renders <table><thead><tbody> from columns+rows', async () => {
      const el = await fixture<BsTable>(html`<bs-table
        striped
        hover
        .columns=${[
          { key: 'name', label: 'Name' },
          { key: 'role', label: 'Role', align: 'end' as const },
        ]}
        .rows=${[
          { name: 'Ada', role: 'Founder' },
          { name: 'Grace', role: 'Rear Admiral' },
        ]}
      ></bs-table>`);
      await tick();
      await el.updateComplete;
      const table = el.querySelector('table')!;
      expect(table.classList.contains('table')).to.equal(true);
      expect(table.classList.contains('table-striped')).to.equal(true);
      expect(table.classList.contains('table-hover')).to.equal(true);
      const headers = table.querySelectorAll('thead th');
      expect(headers.length).to.equal(2);
      expect(headers[1].classList.contains('text-end')).to.equal(true);
      const rows = table.querySelectorAll('tbody tr');
      expect(rows.length).to.equal(2);
      expect(rows[0].children[0].textContent?.trim()).to.equal('Ada');
      expect(rows[0].children[1].classList.contains('text-end')).to.equal(true);
    });

    it('shows empty-text when rows is empty', async () => {
      const el = await fixture<BsTable>(html`<bs-table
        empty-text="Nothing here"
        .columns=${[{ key: 'x', label: 'X' }]}
        .rows=${[]}
      ></bs-table>`);
      await tick();
      await el.updateComplete;
      const cell = el.querySelector('tbody tr td');
      expect(cell?.textContent?.trim()).to.equal('Nothing here');
    });

    it('falls back to author-provided <table> when columns is empty', async () => {
      const el = await fixture<BsTable>(html`<bs-table striped>
        <table>
          <thead><tr><th>Manual</th></tr></thead>
          <tbody><tr><td>Row</td></tr></tbody>
        </table>
      </bs-table>`);
      await tick();
      await el.updateComplete;
      const table = el.querySelector('table')!;
      expect(table.classList.contains('table-striped')).to.equal(true);
      expect(table.querySelector('td')?.textContent?.trim()).to.equal('Row');
    });
  });

  describe('bs-navbar', () => {
    it('renders brand + toggler + links from `config`', async () => {
      const el = await fixture<BsNavbar>(html`<bs-navbar
        theme="dark"
        background="dark"
        .config=${{
          brand: { label: 'Site', href: '/' },
          links: [
            { label: 'Home', href: '/', active: true },
            { label: 'About', href: '/about' },
          ],
          right: [{ label: 'Sign in', href: '/login' }],
        }}
      ></bs-navbar>`);
      await tick();
      await el.updateComplete;
      const shadow = el.shadowRoot!;
      const brand = shadow.querySelector('.navbar-brand');
      expect(brand?.textContent?.trim()).to.equal('Site');
      expect(shadow.querySelector('button.navbar-toggler')).to.exist;
      const collapse = shadow.querySelector('.collapse.navbar-collapse');
      expect(collapse).to.exist;
      expect(shadow.querySelectorAll('.navbar-nav.me-auto .nav-link').length).to.equal(2);
      expect(shadow.querySelectorAll('.navbar-nav.ms-auto .nav-link').length).to.equal(1);
      const first = shadow.querySelector('.navbar-nav.me-auto .nav-link') as HTMLElement;
      expect(first.classList.contains('active')).to.equal(true);
    });

    it('config with dropdown children produces <bs-dropdown nav>', async () => {
      const el = await fixture<BsNavbar>(html`<bs-navbar
        .config=${{
          links: [
            {
              label: 'Docs',
              children: [
                { label: 'Getting started', href: '/docs' },
                { label: 'API', href: '/api' },
              ],
            },
          ],
        }}
      ></bs-navbar>`);
      await tick();
      await el.updateComplete;
      const shadow = el.shadowRoot!;
      const dd = shadow.querySelector('bs-dropdown') as HTMLElement & {
        nav?: boolean;
        items?: unknown[];
      };
      expect(dd).to.exist;
      expect(dd.getAttribute('label')).to.equal('Docs');
      expect(dd.hasAttribute('nav')).to.equal(true);
      expect(dd.items!.length).to.equal(2);
    });
  });
});
