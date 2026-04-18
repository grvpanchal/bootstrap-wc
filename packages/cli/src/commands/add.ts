import { mkdir, writeFile, access, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import prompts from 'prompts';
import kleur from 'kleur';
import ora from 'ora';
import { loadConfig } from '../utils/config.js';
import { fetchIndex, resolveGraph } from '../utils/registry.js';
import { rewriteImports } from '../utils/transform.js';

async function exists(p: string) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

export async function addCommand(names: string[], options: { yes?: boolean; overwrite?: boolean }) {
  const cwd = process.cwd();
  const config = await loadConfig(cwd);
  if (!config) {
    console.error(kleur.red('No bwc.json found. Run ') + kleur.cyan('bwc init') + kleur.red(' first.'));
    process.exit(1);
  }

  // Interactive picker when no components given.
  if (!names.length) {
    const spin = ora('Fetching registry…').start();
    const index = await fetchIndex(config.registryUrl);
    spin.succeed(`Registry loaded (${index.components.length} components)`);
    const selection = await prompts({
      type: 'multiselect',
      name: 'chosen',
      message: 'Select components to add',
      choices: index.components
        .filter((c) => c.name !== 'core')
        .map((c) => ({ title: c.tagName ?? c.name, value: c.name, description: c.description })),
    });
    names = selection.chosen ?? [];
    if (!names.length) {
      console.log(kleur.yellow('Nothing selected.'));
      return;
    }
  }

  const spin = ora('Resolving dependency graph…').start();
  const entries = await resolveGraph(config.registryUrl, names);
  spin.succeed(`Resolved ${entries.length} entries`);

  // Aggregate external dependencies for advisory.
  const externalDeps = new Set<string>();
  for (const e of entries) for (const d of e.dependencies) externalDeps.add(d);

  // Write files.
  let written = 0;
  let skipped = 0;
  const baseDir = join(cwd, config.componentsDir);
  for (const entry of entries) {
    for (const file of entry.files) {
      const target = join(baseDir, file.path);
      const already = await exists(target);
      if (already && !options.overwrite && !options.yes) {
        const { replace } = await prompts({
          type: 'confirm',
          name: 'replace',
          message: `${kleur.bold(file.path)} exists — overwrite?`,
          initial: false,
        });
        if (!replace) {
          skipped++;
          continue;
        }
      }
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, rewriteImports(file.content, config), 'utf8');
      written++;
    }
    console.log(kleur.green('  ✓ ') + (entry.tagName ?? entry.name));
  }

  if (externalDeps.size) {
    console.log(kleur.cyan('\nInstall these npm packages:'));
    console.log(kleur.bold('  npm install lit ' + Array.from(externalDeps).join(' ')));
  }

  console.log(
    kleur.green('\n✔ ') + `${written} file(s) written` + (skipped ? `, ${skipped} skipped` : '') + '.',
  );
  console.log(kleur.dim('Make sure Bootstrap 5.3 CSS is loaded at the document level:'));
  console.log(
    kleur.dim(
      '  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3/dist/css/bootstrap.min.css">',
    ),
  );
}

export async function _readIfExists(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
}
