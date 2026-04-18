import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import kleur from 'kleur';
import { loadConfig } from '../utils/config.js';
import { fetchComponent } from '../utils/registry.js';
import { rewriteImports } from '../utils/transform.js';

export async function diffCommand(name: string) {
  const cwd = process.cwd();
  const config = await loadConfig(cwd);
  if (!config) {
    console.error(kleur.red('No bwc.json found. Run ') + kleur.cyan('bwc init') + kleur.red(' first.'));
    process.exit(1);
  }
  const entry = await fetchComponent(config.registryUrl, name);
  const baseDir = join(cwd, config.componentsDir);
  let drift = 0;
  for (const file of entry.files) {
    const localPath = join(baseDir, file.path);
    let local: string;
    try {
      local = await readFile(localPath, 'utf8');
    } catch {
      console.log(kleur.yellow(`  + ${file.path}  (missing locally)`));
      drift++;
      continue;
    }
    const upstream = rewriteImports(file.content, config);
    if (local === upstream) {
      console.log(kleur.green(`  = ${file.path}  (in sync)`));
    } else {
      console.log(kleur.red(`  ! ${file.path}  (drifted)`));
      drift++;
    }
  }
  if (drift) {
    console.log(kleur.dim(`\nRun `) + kleur.cyan(`bwc add ${name} --overwrite`) + kleur.dim(' to restore upstream.'));
  } else {
    console.log(kleur.green('\nNo drift.'));
  }
}
