import { BsWizard } from './bs-wizard.js';

if (!customElements.get('bs-wizard')) {
  customElements.define('bs-wizard', BsWizard);
}
