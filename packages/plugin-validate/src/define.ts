import { BSformValidator } from './bs-form-validator.js';

if (!customElements.get('bs-form-validator')) {
  customElements.define('bs-form-validator', BSformValidator);
}
