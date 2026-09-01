import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';

export default defineConfig(({mode}) => {
  // Load env file based on `mode` in the current working directory.
  // Passing the third parameter as '' loads all variables regardless of prefix.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    resolve: {
      tsconfigPaths: true,
    },
    test: {
      globals: true,
      globalSetup: './vitest.setup.global.integration.ts',
      root: './',
      include: ['**/*.integration-spec.ts'],
      env:env
    },
  }
});
