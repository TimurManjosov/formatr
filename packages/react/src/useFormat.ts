import { useMemo } from 'react';
import { template } from '@timur_manjosov/formatr';
import { useFormatrContext } from './FormatrProvider';

interface TemplateOptions {
  filters?: Record<string, (value: unknown) => unknown>;
  locale?: string;
}

/**
 * Hook to format a template string with the given context
 * 
 * @param templateStr - The template string with placeholders
 * @param context - The context data for placeholder substitution
 * @returns The formatted string
 * 
 * @example
 * ```tsx
 * function Greeting({ name }: { name: string }) {
 *   const message = useFormat('Hello, {name}!', { name });
 *   return <div>{message}</div>;
 * }
 * ```
 */
export function useFormat<T extends Record<string, unknown>>(
  templateStr: string,
  context: T
): string {
  const { filters, locale } = useFormatrContext();

  // Serialize context for stable dependency comparison
  const contextKey = useMemo(() => JSON.stringify(context), [context]);

  return useMemo(() => {
    const options: TemplateOptions = {};
    if (filters !== undefined) options.filters = filters;
    if (locale !== undefined) options.locale = locale;
    
    const compiled = template(templateStr, options);
    return compiled(context);
  }, [templateStr, contextKey, filters, locale, context]);
}
