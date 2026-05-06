import { BScalendar } from './bs-calendar.js';

if (!customElements.get('bs-calendar')) {
  customElements.define('bs-calendar', BScalendar);
}
