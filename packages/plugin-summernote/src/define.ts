import { BSrichText } from './bs-rich-text.js';

if (!customElements.get('bs-rich-text')) {
  customElements.define('bs-rich-text', BSrichText);
}
