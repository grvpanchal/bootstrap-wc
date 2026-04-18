# @bootstrap-wc/components

Bootstrap 5 as framework-agnostic **Web Components**. Think `react-bootstrap` without the React dependency — works in React, Vue, Angular, Svelte, Astro, HTMX, Rails, or plain HTML.

```sh
npm install @bootstrap-wc/components lit
```

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3/dist/css/bootstrap.min.css" />
<script type="module">import '@bootstrap-wc/components';</script>

<bs-button variant="primary">Click me</bs-button>
<bs-modal heading="Hello">Modal body</bs-modal>
```

## Tree-shaking

Import only what you use:

```ts
import '@bootstrap-wc/components/button';
import '@bootstrap-wc/components/modal';
```

## Included components

30+ components across forms, navigation, overlays, feedback, disclosure, and content. See the [full docs](https://bootstrap-wc.dev) for each component's API, events, and examples.

## Prefer to own the source?

Use the [`bwc` CLI](https://bootstrap-wc.dev/getting-started/cli/) to copy the TypeScript source into your project (shadcn-style):

```sh
npx @bootstrap-wc/cli init
npx @bootstrap-wc/cli add button modal input
```
