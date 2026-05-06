import { BSchart } from './bs-chart.js';

if (!customElements.get('bs-chart')) {
  customElements.define('bs-chart', BSchart);
}
