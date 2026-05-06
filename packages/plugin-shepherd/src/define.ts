import { BsTour } from './bs-tour.js';

if (!customElements.get('bs-tour')) {
  customElements.define('bs-tour', BsTour);
}
