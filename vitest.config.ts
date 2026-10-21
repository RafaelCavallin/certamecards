import { configDefaults, defineConfig } from 'vitest/config';

const DOMAIN_COVERAGE_THRESHOLD = 80;

const TESTS = ['src/app/domain/**/*.test.ts', 'src/app/state/**/*.test.ts', 'scripts/**/*.test.ts'];

const DOM_TESTS = [
  'src/app/domain/anki-cloze.test.ts',
  'src/app/domain/anki-convert-batch.test.ts',
  'src/app/domain/anki-convert.test.ts',
  'src/app/domain/anki-html.test.ts',
  'src/app/domain/anki-import-flow.test.ts',
  'src/app/domain/file-delivery.test.ts',
  'src/app/domain/image-codec.test.ts',
  'src/app/domain/review-keys.test.ts',
  'src/app/domain/storage-loss.test.ts',
  'src/app/domain/theme.test.ts',
  'src/app/state/image-prefetch.test.ts',
  'src/app/state/review-session-lifecycle.test.ts',
  'src/app/state/theme-store.test.ts',
];

export default defineConfig({
  test: {
    setupFiles: ['./src/test/setup.ts'],
    projects: [
      {
        extends: true,
        test: { name: 'node', environment: 'node', include: TESTS, exclude: [...configDefaults.exclude, ...DOM_TESTS] },
      },
      {
        extends: true,
        test: { name: 'dom', environment: 'jsdom', include: DOM_TESTS },
      },
    ],
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
