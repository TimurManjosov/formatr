import type { TemplateLoaderOptions } from '@formatr/shared';

export interface FormatrNextConfig extends TemplateLoaderOptions {
  filters?: Record<string, (value: unknown) => unknown>;
  precompile?: boolean;
}

export interface NextConfig {
  formatr?: FormatrNextConfig;
  [key: string]: any;
}

/**
 * Next.js configuration wrapper for formatr
 * 
 * @param nextConfig - Next.js configuration object
 * @returns Modified Next.js configuration
 * 
 * @example
 * ```typescript
 * // next.config.js
 * import { withFormatr } from '@formatr/nextjs';
 * 
 * export default withFormatr({
 *   formatr: {
 *     templatesDir: './templates',
 *     cache: true,
 *     precompile: true,
 *   },
 * });
 * ```
 */
export function withFormatr(nextConfig: NextConfig = {}): NextConfig {
  return {
    ...nextConfig,
    webpack(config: any, options: any) {
      // Future: Add template precompilation here
      
      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, options);
      }
      
      return config;
    },
  };
}
