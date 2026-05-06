import { BsCodeEditor } from './bs-code-editor.js';

if (!customElements.get('bs-code-editor')) {
  customElements.define('bs-code-editor', BsCodeEditor);
}
