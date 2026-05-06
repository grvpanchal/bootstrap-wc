import { BSmorrisChart } from './bs-morris-chart.js';

if (!customElements.get('bs-morris-chart')) {
  customElements.define('bs-morris-chart', BSmorrisChart);
}
