import { defineConfig } from 'vitest/config';

const DOMAIN_COVERAGE_THRESHOLD = 80;

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/app/domain/**/*.test.ts', 'scripts/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/app/domain/**/*.ts'],
      exclude: ['src/app/domain/**/*.test.ts'],
      thresholds: {
        'src/app/domain/**': {
          statements: DOMAIN_COVERAGE_THRESHOLD,
          branches: DOMAIN_COVERAGE_THRESHOLD,
          functions: DOMAIN_COVERAGE_THRESHOLD,
          lines: DOMAIN_COVERAGE_THRESHOLD,
        },
      },
    },
  },
});
