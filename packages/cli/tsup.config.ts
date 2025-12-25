import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'cli': 'src/cli.ts',
    'index': 'src/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  target: 'node16',
  shims: true,
});
