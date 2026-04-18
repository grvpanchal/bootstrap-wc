# Bootstrap Web Components

**Bootstrap 5 as framework-agnostic Web Components.** Install with `npm` — or copy the source into your project with a single CLI command and own every line.

Think `react-bootstrap`, minus the React dependency. Plus `shadcn/ui`, but for Web Components and Bootstrap.

```sh
# npm — drop-in package
npm install @bootstrap-wc/components lit

# shadcn-style — copy source into your project
npx @bootstrap-wc/cli init
npx @bootstrap-wc/cli add button modal input
```

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3/dist/css/bootstrap.min.css" />
<script type="module">import '@bootstrap-wc/components';</script>

<bs-button variant="primary">Click me</bs-button>
```

## Packages

| Package | Description |
| --- | --- |
| [`@bootstrap-wc/components`](packages/components) | 30 web components wrapping Bootstrap 5 (Button, Modal, Dropdown, Form controls, …) |
| [`@bootstrap-wc/core`](packages/core) | Base class, controllers (transition, floating-ui, focus-trap), form-associated mixin |
| [`@bootstrap-wc/cli`](packages/cli) | `bwc` CLI for shadcn-style copy-paste distribution |
| [`@bootstrap-wc/react`](packages/react) | Typed React wrappers (preview) |
| [`apps/docs`](apps/docs) | Astro + Starlight documentation site |

## Components

Layout & content: Card · ListGroup · Badge · Breadcrumb · Pagination · Nav · Navbar
Forms: Input · Textarea · Select · Checkbox · Radio · Switch · Range · InputGroup · FormCheck · FormLabel · FormText · Button · ButtonGroup · CloseButton
Feedback: Alert · Progress · Spinner · Toast
Disclosure: Accordion · Collapse · Dropdown · Tabs
Overlays: Modal · Offcanvas · Tooltip · Popover

## Why?

- **Framework agnostic** — works in React, Vue, Angular, Svelte, Astro, HTMX, Rails, or plain HTML.
- **Own your code** — the `bwc add` CLI copies TypeScript source into your project. No upstream lock-in.
- **Bootstrap-idiomatic** — every component renders standard Bootstrap markup. Your themes, overrides, and utility classes keep working.
- **Form-associated** — inputs participate in native `<form>` submission via `ElementInternals`.
- **Modern interactions** — tooltips, popovers, and dropdowns use `@floating-ui/dom`; modals and offcanvas use `focus-trap`.

## Development

```sh
npm install
npm run build          # build every package (core → components → cli → react → registry)
npm run dev:docs       # start the Astro docs site
npm run typecheck      # tsc -b across the workspace
npm test               # run component tests (@web/test-runner)
```

Repo layout:

```
packages/
  core/         # BootstrapElement, controllers, mixins, shared SCSS
  components/   # 30 <bs-*> components (TypeScript)
  cli/          # bwc init / add / list / diff
  react/        # React wrappers via @lit/react
registry/       # Builds registry JSON from component source
apps/
  docs/         # Astro + Starlight
```

## Documentation

Full docs at [bootstrap-wc.dev](https://bootstrap-wc.dev). Every component has its own page with live examples, API reference, and install instructions for both distribution modes.

## License

MIT © 2026 bootstrap-wc contributors
