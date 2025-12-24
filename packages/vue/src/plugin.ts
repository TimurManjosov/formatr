import type { App, InjectionKey } from 'vue';

export interface FormatrPluginOptions {
  filters?: Record<string, (value: unknown) => unknown>;
  locale?: string;
}

export const FormatrOptionsKey: InjectionKey<FormatrPluginOptions> = Symbol('formatr-options');

/**
 * Vue plugin for formatr global configuration
 * 
 * @example
 * ```typescript
 * import { createApp } from 'vue';
 * import { FormatrPlugin } from '@formatr/vue';
 * 
 * const app = createApp(App);
 * 
 * app.use(FormatrPlugin, {
 *   filters: {
 *     upper: (v) => String(v).toUpperCase(),
 *   },
 *   locale: 'en-US',
 * });
 * ```
 */
export const FormatrPlugin = {
  install(app: App, options: FormatrPluginOptions = {}) {
    app.provide(FormatrOptionsKey, options);
  },
};
