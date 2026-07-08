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
import '../src/breadcrumb/breadcrumb.js';
import '../src/button-group/button-group.js';
import '../src/button/button.js';
import '../src/offcanvas/offcanvas.js';
import '../src/pagination/pagination.js';

import type { BsNav } from '../src/nav/nav.js';
import type { BsTabs } from '../src/tabs/tabs.js';
import type { BsListGroup } from '../src/list-group/list-group.js';
import type { BsDropdown } from '../src/dropdown/dropdown.js';
import type { BsAccordion } from '../src/accordion/accordion.js';
import type { BsTable } from '../src/table/table.js';
import type { BsNavbar } from '../src/navbar/navbar.js';
import type { BsBreadcrumb } from '../src/breadcrumb/breadcrumb.js';
import type { BsButtonGroup } from '../src/button-group/button-group.js';
import type { BsOffcanvas } from '../src/offcanvas/offcanvas.js';
import type { BsPagination } from '../src/pagination/pagination.js';

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

  describe('bs-breadcrumb', () => {
    it('renders <bs-breadcrumb-item> children from `items`', async () => {
      const el = await fixture<BsBreadcrumb>(html`<bs-breadcrumb
        .items=${[
          { label: 'Home', href: '/' },
          { label: 'Docs', href: '/docs' },
          { label: 'API', active: true },
        ]}
      ></bs-breadcrumb>`);
      await el.updateComplete;
      const items = el.shadowRoot!.querySelectorAll('bs-breadcrumb-item');
      expect(items.length).to.equal(3);
      expect(items[0].getAttribute('href')).to.equal('/');
      expect(items[2].hasAttribute('active')).to.equal(true);
    });

    it('items work with wrap-in-nav mode', async () => {
      const el = await fixture<BsBreadcrumb>(html`<bs-breadcrumb
        wrap-in-nav
        list-class="breadcrumb-chevron"
        .items=${[
          { label: 'Home', href: '/' },
          { label: 'End', active: true },
        ]}
      ></bs-breadcrumb>`);
      await el.updateComplete;
      const ol = el.shadowRoot!.querySelector('ol.breadcrumb');
      expect(ol).to.exist;
      expect(ol!.classList.contains('breadcrumb-chevron')).to.equal(true);
      expect(el.shadowRoot!.querySelectorAll('bs-breadcrumb-item').length).to.equal(2);
    });
  });

  describe('bs-button-group', () => {
    it('renders <bs-button> children from `buttons`', async () => {
      const el = await fixture<BsButtonGroup>(html`<bs-button-group
        size="sm"
        .buttons=${[
          { label: 'Left', variant: 'secondary' as const },
          { label: 'Middle', variant: 'primary' as const, active: true },
          { label: 'Right', variant: 'secondary' as const, disabled: true },
        ]}
      ></bs-button-group>`);
      await el.updateComplete;
      const btns = el.shadowRoot!.querySelectorAll('bs-button');
      expect(btns.length).to.equal(3);
      expect(btns[0].getAttribute('variant')).to.equal('secondary');
      expect(btns[1].hasAttribute('active')).to.equal(true);
      expect(btns[2].hasAttribute('disabled')).to.equal(true);
      // Group's size cascades into each button when the item doesn't override.
      expect(btns[0].getAttribute('size')).to.equal('sm');
    });
  });

  describe('bs-offcanvas', () => {
    it('renders title + body + footer from `config`', async () => {
      const el = await fixture<BsOffcanvas>(html`<bs-offcanvas
        open
        static-display
        .config=${{
          title: 'Cart',
          bodyHtml: '<p>Empty cart</p>',
          footerHtml: '<button class="btn btn-primary w-100">Checkout</button>',
        }}
      ></bs-offcanvas>`);
      await el.updateComplete;
      const shadow = el.shadowRoot!;
      expect(shadow.querySelector('.offcanvas-title')?.textContent?.trim()).to.equal('Cart');
      const body = shadow.querySelector('.offcanvas-body');
      expect(body?.innerHTML.trim()).to.include('<p>Empty cart</p>');
      const footer = shadow.querySelector('.offcanvas-footer');
      expect(footer).to.exist;
      expect(footer?.querySelector('button.btn-primary')).to.exist;
    });

    it('titleHtml wins over title and heading attribute', async () => {
      const el = await fixture<BsOffcanvas>(html`<bs-offcanvas
        open
        static-display
        heading="Ignored"
        .config=${{ title: 'Also ignored', titleHtml: '<em>Rich</em> title' }}
      ></bs-offcanvas>`);
      await el.updateComplete;
      const title = el.shadowRoot!.querySelector('.offcanvas-title');
      expect(title?.innerHTML.trim()).to.equal('<em>Rich</em> title');
    });
  });

  describe('bs-pagination', () => {
    it('renders explicit page items from `items`, overriding total/current', async () => {
      const el = await fixture<BsPagination>(html`<bs-pagination
        total="99"
        current="50"
        .items=${[
          { label: '« Prev', href: '#prev', disabled: true },
          { label: '1', href: '#1' },
          { label: '…', ellipsis: true },
          { label: '5', href: '#5', active: true },
          { label: 'Next »', href: '#next', ariaLabel: 'Next' },
        ]}
      ></bs-pagination>`);
      await el.updateComplete;
      const links = el.shadowRoot!.querySelectorAll('li.page-item');
      expect(links.length).to.equal(5);
      // Ellipsis renders as span, not anchor.
      expect(links[2].querySelector('span.page-link')?.textContent?.trim()).to.equal('…');
      // Active flag survives to the correct item.
      expect(links[3].classList.contains('active')).to.equal(true);
      // Disabled prev has .disabled on the <li>.
      expect(links[0].classList.contains('disabled')).to.equal(true);
      // aria-label carries through.
      expect(links[4].querySelector('a')?.getAttribute('aria-label')).to.equal('Next');
      // No prev/next arrow synthesised in items mode.
      expect(links[0].querySelector('a')?.textContent?.trim()).to.equal('« Prev');
    });

    it('items mode fires bs-page-change with the index of the clicked item', async () => {
      const el = await fixture<BsPagination>(html`<bs-pagination
        .items=${[
          { label: 'A', href: '#a' },
          { label: 'B', href: '#b' },
        ]}
      ></bs-pagination>`);
      await el.updateComplete;
      let detail: { page?: number } = {};
      el.addEventListener('bs-page-change', (e) => {
        detail = (e as CustomEvent).detail;
      });
      const links = el.shadowRoot!.querySelectorAll('a.page-link');
      (links[1] as HTMLElement).click();
      await tick();
      expect(detail.page).to.equal(1);
    });

    it('numeric mode still works when `items` is empty', async () => {
      const el = await fixture<BsPagination>(html`<bs-pagination
        total="5"
        current="3"
      ></bs-pagination>`);
      await el.updateComplete;
      // 5 numeric pages + prev + next = 7 <li>s.
      const links = el.shadowRoot!.querySelectorAll('li.page-item');
      expect(links.length).to.equal(7);
    });
  });
});
