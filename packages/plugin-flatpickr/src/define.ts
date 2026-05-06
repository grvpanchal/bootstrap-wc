import { BsDatepicker } from './bs-datepicker.js';

if (!customElements.get('bs-datepicker')) {
  customElements.define('bs-datepicker', BsDatepicker);
}
