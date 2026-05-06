import { BSclipboard } from './bs-clipboard.js';

if (!customElements.get('bs-clipboard')) {
  customElements.define('bs-clipboard', BSclipboard);
}
