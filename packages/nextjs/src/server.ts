import { template, templateAsync } from '@timur_manjosov/formatr';
import { TemplateLoader, type TemplateLoaderOptions } from '@formatr/shared';

let globalLoader: TemplateLoader | null = null;
let globalFilters: Record<string, (value: unknown) => unknown> = {};

/**
 * Configure formatr for server-side rendering
 * Call this once in your app, typically in a layout or API route
 */
export function configureFormatr(options: TemplateLoaderOptions & {
  filters?: Record<string, (value: unknown) => unknown>;
}) {
  globalLoader = new TemplateLoader(options);
  globalFilters = options.filters || {};
}

/**
 * Render a template on the server (for SSR/SSG)
 * 
 * @param templateName - Name of the template file
 * @param context - Context data for the template
 * @returns Rendered template string
 * 
 * @example
 * ```typescript
 * // In getServerSideProps or getStaticProps
 * export async function getServerSideProps() {
 *   const content = await formatr('blog-post', {
 *     title: 'My Post',
 *     content: '...',
 *   });
 *   
 *   return { props: { content } };
 * }
 * ```
 */
export async function formatr<T extends Record<string, unknown>>(
  templateName: string,
  context: T
): Promise<string> {
  if (!globalLoader) {
    throw new Error(
      'Formatr not configured. Call configureFormatr() first.'
    );
  }

  const source = await globalLoader.load(templateName);
  const compiled = template(source, { filters: globalFilters });
  return compiled(context);
}

/**
 * Render a template asynchronously on the server (supports async filters)
 * 
 * @param templateName - Name of the template file
 * @param context - Context data for the template
 * @returns Promise of rendered template string
 */
export async function formatrAsync<T extends Record<string, unknown>>(
  templateName: string,
  context: T
): Promise<string> {
  if (!globalLoader) {
    throw new Error(
      'Formatr not configured. Call configureFormatr() first.'
    );
  }

  const source = await globalLoader.load(templateName);
  const compiled = templateAsync(source, { filters: globalFilters });
  return await compiled(context);
}
