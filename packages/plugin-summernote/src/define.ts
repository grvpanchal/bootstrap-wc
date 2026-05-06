import { BsRichText } from './bs-rich-text.js';

if (!customElements.get('bs-rich-text')) {
  customElements.define('bs-rich-text', BsRichText);
}
