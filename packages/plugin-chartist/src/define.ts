import { BSchartistChart } from './bs-chartist-chart.js';

if (!customElements.get('bs-chartist-chart')) {
  customElements.define('bs-chartist-chart', BSchartistChart);
}
