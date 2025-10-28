import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// ESLint flat config (type-aware for TS only)
export default tseslint.config(
  // Ignore build artifacts
  { ignores: ['dist', 'node_modules', 'coverage'] },

  // Base JS rules
  js.configs.recommended,

  // React rules
  react.configs.flat.recommended,

  // TypeScript rules (non type-aware for speed/compat)
  ...tseslint.configs.recommended,

  // Shared project specifics and Prettier compatibility
  prettier,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.browser } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'simple-import-sort': simpleImportSort
    },
    settings: { react: { version: 'detect' } },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // New JSX transform means React in scope is not required
      'react/react-in-jsx-scope': 'off',
      // Keep as a warning to avoid breaking dev for external links
      'react/jsx-no-target-blank': 'warn',
      // Developer ergonomics
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
      ],
      'react/jsx-indent': ['error', 2],
      'arrow-body-style': ['error', 'as-needed'],
      'react/function-component-definition': [0],
      'react/button-has-type': [0],
      'react/jsx-filename-extension': [1, { extensions: ['.tsx', '.ts'] }],
      'react/prop-types': [0],
      // Disable no-undef for TS projects to avoid false positives on types/JSX
      'no-undef': 'off',
      'no-console': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'import/extensions': [0, 'ignorePackages', { ts: 'never', tsx: 'never' }],
      'import/prefer-default-export': 'off',
      'import/no-unresolved': 'off',
      'react/require-default-props': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-expressions': 'off',
      'react/jsx-no-useless-fragment': 'off',
      'no-nested-ternary': 'off',
      'no-restricted-globals': 'off',
      'import/order': 'off',
      'tsdoc/syntax': 'off',
      'no-param-reassign': 'off',
      'react/no-unescaped-entities': 'off',
      'no-unused-vars': 'off',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^react', '^@?\\w'],
            ['^contexts/', '^@/contexts/'],
            ['^hooks/', '^@/hooks/'],
            ['^\\./Routes'],
            ['^components/', '^@/components/'],
            ['^viewModels/', '^@/viewModels/'],
            [
              '^images/',
              '^@/images/',
              '^\\.(png|jpe?g|gif|svg)$',
              '^@/images/.*\\.(png|jpe?g|gif|svg)$'
            ],
            ['^styles/', '^@/styles/'],
            ['^stores/', '^@/stores/', '^\\./stores/', '^\\.\\./stores/'],
            [
              '^config/',
              '^@/config',
              '^@/ui/config',
              '^types/',
              '^@/types/',
              '^@/ui/types/',
              '^constants/',
              '^@/constants/',
              '^@/ui/constants/'
            ]
          ]
        }
      ]
    }
  },
  // Overrides for R3F scene files: allow three.js JSX props and TS ergonomics
  {
    files: ['src/scene/r3f/**/*.{ts,tsx}'],
    rules: {
      'react/no-unknown-property': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  // Overrides for new UI R3F files
  {
    files: ['src/ui/scene/**/*.{ts,tsx}', 'src/ui/canvas/**/*.{ts,tsx}'],
    rules: {
      'react/no-unknown-property': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  // Specific utility file uses permissive parsing of external JSON
  {
    files: ['src/utils/iaUtiils.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
);
