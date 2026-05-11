---
"@bootstrap-wc/components": minor
---

`<bs-dropdown nav>` — render the trigger as a flat `<a class="nav-link dropdown-toggle">` instead of `<button class="btn btn-secondary dropdown-toggle">`.

Use this attribute when the dropdown lives inside a `.navbar-nav`. The default button-pill styling (gray rounded background) is correct for stand-alone buttons but produces an out-of-place pill in a navbar. The new attribute swaps in the navbar-link styling and forces an anchor trigger to match Bootstrap 5's canonical navbar dropdown markup. `split` still wins when both are set, since split-buttons aren't a navbar pattern.

```html
<nav class="navbar navbar-expand">
  <ul class="navbar-nav">
    <bs-dropdown nav label="Pages">
      <bs-dropdown-item slot="menu" href="/login">Login</bs-dropdown-item>
      <bs-dropdown-item slot="menu" href="/register">Register</bs-dropdown-item>
    </bs-dropdown>
  </ul>
</nav>
```
