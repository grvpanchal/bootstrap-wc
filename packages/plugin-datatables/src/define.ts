import { BSdatatable } from './bs-datatable.js';

if (!customElements.get('bs-datatable')) {
  customElements.define('bs-datatable', BSdatatable);
}
