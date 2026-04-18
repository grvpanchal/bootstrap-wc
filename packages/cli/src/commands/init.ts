import prompts from 'prompts';
import kleur from 'kleur';
import { DEFAULT_CONFIG, loadConfig, saveConfig, type BwcConfig } from '../utils/config.js';

export async function initCommand(options: { yes?: boolean }) {
  const cwd = process.cwd();
  const existing = await loadConfig(cwd);
  if (existing && !options.yes) {
    const { overwrite } = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: 'bwc.json already exists. Overwrite?',
      initial: false,
    });
    if (!overwrite) {
      console.log(kleur.yellow('Aborted.'));
      return;
    }
  }

  let config: BwcConfig = { ...DEFAULT_CONFIG };
  if (!options.yes) {
    const answers = await prompts([
      {
        type: 'text',
        name: 'componentsDir',
        message: 'Where should component source files be written?',
        initial: DEFAULT_CONFIG.componentsDir,
      },
      {
        type: 'text',
        name: 'alias',
        message: 'What import alias resolves to that directory?',
        initial: DEFAULT_CONFIG.alias,
      },
      {
        type: 'confirm',
        name: 'typescript',
        message: 'Use TypeScript sources?',
        initial: true,
      },
    ]);
    config = {
      ...config,
      componentsDir: answers.componentsDir ?? config.componentsDir,
      alias: answers.alias ?? config.alias,
      typescript: answers.typescript ?? true,
    };
  }

  await saveConfig(cwd, config);
  console.log(kleur.green('\n✔ ') + 'Wrote ' + kleur.bold('bwc.json'));
  console.log(kleur.dim('\nNext: run ') + kleur.cyan('bwc add button') + kleur.dim(' to install your first component.'));
}
