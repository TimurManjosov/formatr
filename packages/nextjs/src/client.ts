import { useMemo } from 'react';
import { template } from '@timur_manjosov/formatr';

/**
 * Client-side hook for formatr templates
 * For use in Next.js client components
 * 
 * @param templateStr - Template string
 * @param context - Context data
 * @returns Formatted string
 * 
 * @example
 * ```tsx
 * 'use client';
 * 
 * import { useFormatr } from '@formatr/nextjs';
 * 
 * export function ClientGreeting({ name }: { name: string }) {
 *   const message = useFormatr('Hello, {name}!', { name });
 *   return <div>{message}</div>;
 * }
 * ```
 */
export function useFormatr<T extends Record<string, unknown>>(
  templateStr: string,
  context: T,
  filters?: Record<string, (value: unknown) => unknown>
): string {
  return useMemo(() => {
    const options: any = {};
    if (filters !== undefined) options.filters = filters;
    
    const compiled = template(templateStr, options);
    return compiled(context);
  }, [templateStr, context, filters]);
}
