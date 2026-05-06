import { BsC3Chart } from './bs-c3-chart.js';

if (!customElements.get('bs-c3-chart')) {
  customElements.define('bs-c3-chart', BsC3Chart);
}
