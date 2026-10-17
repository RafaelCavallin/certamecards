// @ts-check
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';

export default defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: [
      'src/app/domain/reinforce.ts',
      'src/app/state/reinforce-session.ts',
      'src/app/pages/reinforce/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/domain/scheduler',
                '**/domain/db',
                '**/domain/cards',
                '**/domain/decks',
                '**/domain/tag-bulk',
                '**/domain/sync*',
                './scheduler',
                './db',
                './cards',
                './decks',
                './tag-bulk',
                './sync*',
              ],
              allowTypeImports: true,
              message: 'O reforço não grava nada (RF53). Edição de texto só via ui/card-edit-dialog.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/label-has-associated-control': [
        'error',
        { controlComponents: ['app-markable-field'] },
      ],
    },
  },
]);
