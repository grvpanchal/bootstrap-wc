import { BsMarkdownEditor } from './bs-markdown-editor.js';

if (!customElements.get('bs-markdown-editor')) {
  customElements.define('bs-markdown-editor', BsMarkdownEditor);
}
