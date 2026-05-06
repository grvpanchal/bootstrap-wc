import { BsLightbox } from './bs-lightbox.js';

if (!customElements.get('bs-lightbox')) {
  customElements.define('bs-lightbox', BsLightbox);
}
