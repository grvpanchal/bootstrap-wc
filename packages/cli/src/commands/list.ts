import kleur from 'kleur';
import { DEFAULT_CONFIG, loadConfig } from '../utils/config.js';
import { fetchIndex } from '../utils/registry.js';

export async function listCommand() {
  const cwd = process.cwd();
  const config = (await loadConfig(cwd)) ?? DEFAULT_CONFIG;
  const index = await fetchIndex(config.registryUrl);
  const groups = new Map<string, typeof index.components>();
  for (const c of index.components) {
    if (!groups.has(c.category)) groups.set(c.category, []);
    groups.get(c.category)!.push(c);
  }
  for (const [category, items] of Array.from(groups).sort(([a], [b]) => a.localeCompare(b))) {
    console.log(kleur.bold().cyan(`\n${category.toUpperCase()}`));
    for (const c of items) {
      const tag = c.tagName ? kleur.dim(` <${c.tagName}>`) : '';
      console.log(`  ${kleur.green(c.name.padEnd(20))}${tag}  ${c.description ?? ''}`);
    }
  }
  console.log();
}
