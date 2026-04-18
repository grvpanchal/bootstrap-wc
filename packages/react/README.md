# @bootstrap-wc/react (preview)

Typed React wrappers for [Bootstrap Web Components](https://bootstrap-wc.dev), generated via [`@lit/react`](https://lit.dev/docs/frameworks/react/).

```sh
npm install @bootstrap-wc/react @bootstrap-wc/components react
```

```tsx
import { Button, Modal } from '@bootstrap-wc/react';

export default function Demo() {
  return (
    <>
      <Button variant="primary" onBsClick={() => console.log('clicked')}>Open</Button>
      <Modal heading="Hello">Body</Modal>
    </>
  );
}
```

All custom events (`bs-click`, `bs-show`, `bs-hide`, …) are exposed as `onBs*` React props.

> Preview. Breaking changes may land before `1.0`.
