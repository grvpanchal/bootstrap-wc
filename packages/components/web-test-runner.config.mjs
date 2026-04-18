import { esbuildPlugin } from '@web/dev-server-esbuild';
import { playwrightLauncher } from '@web/test-runner-playwright';

export default {
  files: ['test/**/*.test.ts'],
  nodeResolve: true,
  plugins: [esbuildPlugin({ ts: true, target: 'es2021', tsconfig: 'tsconfig.wtr.json' })],
  browsers: [playwrightLauncher({ product: 'chromium' })],
};
