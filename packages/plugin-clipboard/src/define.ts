import { BsClipboard } from './bs-clipboard.js';

if (!customElements.get('bs-clipboard')) {
  customElements.define('bs-clipboard', BsClipboard);
}
