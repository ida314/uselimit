// ESLint v9 flat config (migrated from the legacy .eslintrc.js).
//
// Reuses the already-installed @typescript-eslint packages — no extra
// dependencies. Linting is intentionally type-unaware (the `recommended`
// preset, not `recommended-type-checked`) so it stays fast and needs no
// `parserOptions.project` wiring.
const tsParser = require('@typescript-eslint/parser')
const tsPlugin = require('@typescript-eslint/eslint-plugin')

module.exports = [
  {
    ignores: ['**/dist/**', '**/node_modules/**'],
  },
  {
    files: ['packages/*/src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // Allow intentionally-unused `_`-prefixed args (used by StorageAdapter impls).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
]
