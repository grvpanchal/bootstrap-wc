import { BsFileUpload } from './bs-file-upload.js';

if (!customElements.get('bs-file-upload')) {
  customElements.define('bs-file-upload', BsFileUpload);
}
