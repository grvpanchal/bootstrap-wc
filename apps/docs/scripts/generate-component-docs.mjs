// Regenerates baseline component MDX pages from the registry index.
// Handwritten pages (containing `<!-- handwritten -->`) are preserved.
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..', '..');
const REGISTRY = join(ROOT, 'apps', 'docs', 'public', 'r');
const OUT = join(ROOT, 'apps', 'docs', 'src', 'content', 'docs', 'components');

const EXAMPLES = {
  badge: '<bs-badge variant="primary">New</bs-badge>',
  'button-group': '<bs-button-group><bs-button>Left</bs-button><bs-button>Middle</bs-button><bs-button>Right</bs-button></bs-button-group>',
  card: '<bs-card heading="Card title" subtitle="Subtitle">Some quick example text.</bs-card>',
  'close-button': '<bs-close-button></bs-close-button>',
  spinner: '<bs-spinner variant="primary"></bs-spinner>',
  progress: '<bs-progress value="65" variant="info"></bs-progress>',
  'list-group': '<bs-list-group>\n  <bs-list-group-item active>Active</bs-list-group-item>\n  <bs-list-group-item>Second</bs-list-group-item>\n  <bs-list-group-item disabled>Disabled</bs-list-group-item>\n</bs-list-group>',
  pagination: '<bs-pagination total="10" current="3"></bs-pagination>',
  nav: '<bs-nav nav-style="pills">\n  <bs-nav-item active href="#">Active</bs-nav-item>\n  <bs-nav-item href="#">Link</bs-nav-item>\n  <bs-nav-item disabled href="#">Disabled</bs-nav-item>\n</bs-nav>',
  textarea: '<bs-textarea placeholder="Your message" rows="4"></bs-textarea>',
  range: '<bs-range value="40"></bs-range>',
  'form-check': '<bs-form-check label="Check me" type="checkbox"></bs-form-check>\n<bs-form-check label="Switch on" type="switch"></bs-form-check>',
  'form-label': '<bs-form-label required>Email</bs-form-label>\n<bs-input type="email"></bs-input>',
  'form-text': '<bs-form-text>We never share your email.</bs-form-text>',
  'input-group': '<bs-input-group>\n  <bs-input-text>$</bs-input-text>\n  <bs-input placeholder="Amount"></bs-input>\n</bs-input-group>',
  collapse: '<bs-button onclick="this.nextElementSibling.toggle()">Toggle</bs-button>\n<bs-collapse>Hidden content revealed on click.</bs-collapse>',
  accordion: '<bs-accordion>\n  <bs-accordion-item heading="Item #1" open>First panel content.</bs-accordion-item>\n  <bs-accordion-item heading="Item #2">Second panel content.</bs-accordion-item>\n</bs-accordion>',
  tabs: '<bs-tabs active="home">\n  <bs-tab-panel name="home" label="Home">Home panel</bs-tab-panel>\n  <bs-tab-panel name="profile" label="Profile">Profile panel</bs-tab-panel>\n</bs-tabs>',
  offcanvas: '<bs-button>Open</bs-button>\n<bs-offcanvas heading="Sidebar">Offcanvas content.</bs-offcanvas>',
  toast: '<bs-toast open heading="Hello">This is a toast.</bs-toast>',
  tooltip: '<bs-tooltip content="A helpful tooltip"><bs-button>Hover me</bs-button></bs-tooltip>',
  popover: '<bs-popover heading="Popover" content="Rich content here." trigger="click"><bs-button>Click me</bs-button></bs-popover>',
  navbar: '<bs-navbar background="body-tertiary">\n  <span slot="brand">Brand</span>\n  <bs-nav><bs-nav-item href="#" active>Home</bs-nav-item><bs-nav-item href="#">Features</bs-nav-item></bs-nav>\n</bs-navbar>',
  breadcrumb: '<bs-breadcrumb></bs-breadcrumb>',
  select: '<bs-select></bs-select>',
};

function exampleFor(name) {
  return EXAMPLES[name] || '<bs-' + name + '></bs-' + name + '>';
}

function renderMdx(c, entry) {
  const tag = c.tagName || c.name;
  const example = exampleFor(c.name);
  const extraDeps = (entry.dependencies || []).filter((d) => d !== 'lit');
  const depsLine = extraDeps.length ? 'Additional peer deps: `' + extraDeps.join(' ') + '`' : '';
  const description = (c.description || '').replace(/:/g, '');

  const body = [
    '---',
    'title: ' + tag,
    'description: ' + description,
    '---',
    '',
    "import Example from '../../../components/Example.astro';",
    '',
    description,
    '',
    '## Example',
    '',
    '<Example client:load code={`' + example.replace(/`/g, '\\`') + '`} />',
    '',
    '## Install',
    '',
    '```sh',
    '# as an npm package',
    'npm install @bootstrap-wc/components',
    '# or copy the source',
    'npx bwc add ' + c.name,
    '```',
    '',
    depsLine,
    '',
    '## Usage',
    '',
    '```ts',
    "import '@bootstrap-wc/components/" + c.name + "';",
    '```',
    '',
    '```html',
    example,
    '```',
    '',
    'See `packages/components/src/' + c.name + '/` in the source for the complete property / event list.',
    '',
  ];
  return body.join('\n');
}

async function main() {
  const index = JSON.parse(await readFile(join(REGISTRY, 'index.json'), 'utf8'));
  await mkdir(OUT, { recursive: true });
  const existing = new Set(await readdir(OUT));
  let wrote = 0;
  let skipped = 0;

  for (const c of index.components) {
    if (c.name === 'core') continue;
    const file = c.name + '.mdx';
    if (existing.has(file)) {
      const current = await readFile(join(OUT, file), 'utf8');
      if (current.includes('<!-- handwritten -->')) {
        skipped++;
        continue;
      }
    }
    const entry = JSON.parse(await readFile(join(REGISTRY, c.name + '.json'), 'utf8'));
    await writeFile(join(OUT, file), renderMdx(c, entry));
    wrote++;
  }
  console.log('wrote ' + wrote + ' files, skipped ' + skipped + ' handwritten pages');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
