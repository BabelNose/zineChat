import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { loadEnv } from 'vite';

export default defineConfig(({mode}) => {
  // Load env file based on `mode` in the current working directory.
  // Passing the third parameter as '' loads all variables regardless of prefix.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [tsconfigPaths()],
    test: {
      globals: true,
      globalSetup: './vitest.setup.global.e2e.ts',
      root: './',
      include: ['**/*.e2e-spec.ts'],
      env:env
    },
  }
});
