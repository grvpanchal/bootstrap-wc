import { BsSwal } from './bs-swal.js';

if (!customElements.get('bs-swal')) {
  customElements.define('bs-swal', BsSwal);
}
