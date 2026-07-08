# Data-driven (dual-nature) `<bs-*>` components

Every container-style `<bs-*>` component in `@bootstrap-wc/components` now
supports **dual-nature content**: build it from slotted children, OR pass a
plain JS object / array as a property. When the data property is set to a
non-empty value, the component ignores its slot and renders from the data
instead.

The intent is faster adoption in framework-based apps. Web-component
attributes only carry primitives — objects and arrays have to be assigned
via JS property (`el.items = […]`) or via a JSON-encoded attribute
(`items='[…]'`). Lit's `@property({ type: Array })` / `@property({ type:
Object })` decorators wire both channels automatically, so a store like
zustand can drive Bootstrap chrome directly:

```ts
// zustand store
const useNavStore = create((set) => ({
  brand: { label: 'Site', href: '/' },
  links: [
    { label: 'Home', href: '/', active: true },
    { label: 'Docs', href: '/docs' },
  ],
  setActive: (label) => set((s) => ({
    links: s.links.map((l) => ({ ...l, active: l.label === label })),
  })),
}));

// Inside a lit-element app-shell
@customElement('app-shell')
class AppShell extends LitElement {
  @state() private nav = useNavStore.getState();
  private _unsub = useNavStore.subscribe((s) => { this.nav = s; this.requestUpdate(); });
  disconnectedCallback() { this._unsub(); super.disconnectedCallback(); }
  render() {
    const config = {
      brand: this.nav.brand,
      links: this.nav.links,
    };
    return html`
      <bs-navbar theme="dark" background="dark" .config=${config}></bs-navbar>
      <slot></slot>
    `;
  }
}
```

## Contract

For every dual-nature component the rule is the same:

* If the data property is defined AND non-empty (array with `length > 0`,
  or object with at least one own key), it drives rendering. The slot is
  ignored.
* Otherwise, the default `<slot>` is rendered — the existing behaviour.
* A JSON attribute (`items='[…]'`, `config='{…}'`) is a valid channel for
  HTML-authored data. Lit's built-in converter takes care of parsing.

## Reference

| Component | Property | Shape | Slot fallback |
|---|---|---|---|
| `<bs-breadcrumb>` | `items` | `{ label, href?, active? }[]` | `<bs-breadcrumb-item>` children |
| `<bs-nav>` | `items` | `{ label, href?, active?, disabled?, controls? }[]` | `<bs-nav-item>` children |
| `<bs-tabs>` | `tabs` | `{ name, label, content?, active?, disabled? }[]` | `<bs-tab-panel>` children |
| `<bs-list-group>` | `items` | `{ text? \| html?, href?, active?, action?, disabled?, variant? }[]` | `<bs-list-group-item>` children |
| `<bs-dropdown>` | `items` | `{ label \| html, href?, divider?, header?, disabled?, active? }[]` | `slot="menu"` children |
| `<bs-accordion>` | `items` | `{ heading, body \| html, open? }[]` | `<bs-accordion-item>` children |
| `<bs-select>` | `options` | `{ value, label, disabled?, selected? }[]` | `<option>` / `<optgroup>` children |
| `<bs-pagination>` | `total` + `current` + `window` OR explicit `items` | numeric (auto-computed) OR `{ label, href?, active?, disabled?, ellipsis?, ariaLabel? }[]` | (n/a) |
| `<bs-button-group>` | `buttons` | `{ label \| html, variant?, buttonStyle?, size?, href?, target?, active?, disabled?, type? }[]` | `<bs-button>` children |
| `<bs-offcanvas>` | `config` | `{ title?, titleHtml?, body?, bodyHtml?, footerHtml? }` | Header + body children (with `slot="title"` for a custom title) |
| `<bs-table>` | `columns` + `rows` | `Column[]` + `Record<string, unknown>[]` | Author-provided `<table>` child |
| `<bs-navbar>` | `config` | `{ brand?, links?, right?, collapseId? }` | Brand + toggler + collapse markup as children |

## Notes

* The `.html` escape hatch (present on several item shapes) inserts raw HTML
  via `.innerHTML`. Sanitise on the store side if the data isn't trusted.
* `<bs-navbar>` config: top-level `links[]` entries with a `children` array
  produce nested `<bs-dropdown nav>` menus automatically.
* `<bs-table>` in data-driven mode renders its own `<table>` inside the host
  and still applies all the `striped` / `hover` / `bordered` etc. modifier
  classes to it.
* `<bs-tabs>` panel bodies are inserted via `.innerHTML` from the `content`
  key — cell-level authoring of interactive controls should still use the
  slotted `<bs-tab-panel>` form.
* When state changes (e.g. a zustand subscribe fires and re-emits the
  array), Lit shallow-compares the property and re-renders. Push new
  references for the change to register — mutating in place will NOT
  trigger an update.

## Framework integration

* **React**: use `dangerouslySetInnerHTML` for JSON-encoded attribute form,
  or `useRef` + `useEffect` to assign the object channel:
  ```tsx
  const ref = useRef<BsNavbar>(null);
  useEffect(() => { if (ref.current) ref.current.config = config; }, [config]);
  return <bs-navbar ref={ref} theme="dark" background="dark" />;
  ```
* **Lit / vanilla web components**: use the `.property` bindings shown
  above.
* **Vue**: prefix with `.prop:` (Vue 3) — `<bs-navbar :config.prop="cfg">`.
* **Svelte**: bind directly with `<bs-navbar {config}>`.
* **Alpine**: use `x-effect` to assign properties reactively.

## Testing

See `test/data-driven.test.ts` for the full contract test.
