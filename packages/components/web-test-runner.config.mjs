import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
  files: ['test/**/*.test.ts'],
  nodeResolve: true,
  plugins: [esbuildPlugin({ ts: true, target: 'es2021' })],
  // Default launcher uses the system Chromium via @web/test-runner-chrome.
  // CI installs browsers; local dev requires a Chromium-compatible browser on PATH.
};
