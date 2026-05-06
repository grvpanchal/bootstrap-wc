import { BsTree } from './bs-tree.js';

if (!customElements.get('bs-tree')) {
  customElements.define('bs-tree', BsTree);
}
