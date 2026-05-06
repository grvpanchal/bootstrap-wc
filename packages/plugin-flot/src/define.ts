import { BSflotChart } from './bs-flot-chart.js';

if (!customElements.get('bs-flot-chart')) {
  customElements.define('bs-flot-chart', BSflotChart);
}
