#!/usr/bin/env node
import { Command } from 'commander';
import kleur from 'kleur';
import { initCommand } from './commands/init.js';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';
import { diffCommand } from './commands/diff.js';

const program = new Command();

program
  .name('bwc')
  .description(kleur.cyan('Bootstrap Web Components CLI') + ' — add framework-agnostic components to your project')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize bwc.json in your project')
  .option('-y, --yes', 'Skip prompts and accept defaults')
  .action(initCommand);

program
  .command('add')
  .description('Add components to your project')
  .argument('[components...]', 'Component names (e.g. button alert modal). Omit for interactive picker.')
  .option('-y, --yes', 'Skip overwrite prompts')
  .option('-o, --overwrite', 'Overwrite existing files')
  .action(addCommand);

program
  .command('list')
  .description('List available components')
  .action(listCommand);

program
  .command('diff')
  .description('Show drift between a local component and the upstream registry')
  .argument('<component>', 'Component name')
  .action(diffCommand);

program.parseAsync(process.argv).catch((err) => {
  console.error(kleur.red('Error: ') + (err instanceof Error ? err.message : String(err)));
  process.exit(1);
});
