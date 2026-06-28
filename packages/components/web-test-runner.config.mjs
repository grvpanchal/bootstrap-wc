import { esbuildPlugin } from '@web/dev-server-esbuild';
import { playwrightLauncher } from '@web/test-runner-playwright';

// Allow pointing at a pre-installed Chromium when Playwright's managed
// download isn't available (sandboxes, offline CI, etc.). In normal CI
// just leave `BWC_CHROMIUM_PATH` unset and Playwright will use the
// browser it manages itself.
const executablePath = process.env.BWC_CHROMIUM_PATH;

export default {
  files: ['test/**/*.test.ts'],
  nodeResolve: true,
  plugins: [esbuildPlugin({ ts: true, target: 'es2021', tsconfig: 'tsconfig.wtr.json' })],
  browsers: [
    playwrightLauncher({
      product: 'chromium',
      ...(executablePath ? { launchOptions: { executablePath } } : {}),
    }),
  ],
};
