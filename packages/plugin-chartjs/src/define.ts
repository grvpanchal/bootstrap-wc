import { BsChart } from './bs-chart.js';

if (!customElements.get('bs-chart')) {
  customElements.define('bs-chart', BsChart);
}
