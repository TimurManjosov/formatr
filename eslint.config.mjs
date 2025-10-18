// eslint.config.mjs
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  // Ignore build artifacts
  { ignores: ['dist', 'build', 'coverage', 'node_modules'] },

  // Base JS
  js.configs.recommended,

  // TypeScript recommended (adds parser & plugin for TS files)
  ...tseslint.configs.recommended,

  // ---> Your overrides must come AFTER the recommended configs
  {
    files: ['**/*.{ts,tsx}'],
    // re-attach the plugin in this block so rule keys are recognized here too
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      // flip to 'warn' if you want non-blocking warnings
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // (Optional) you can also scope looser rules to benches/tests only:
  {
    files: ['**/*.bench.ts', '**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
