import { BsSparkline } from './bs-sparkline.js';

if (!customElements.get('bs-sparkline')) {
  customElements.define('bs-sparkline', BsSparkline);
}
