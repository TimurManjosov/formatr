import { useMemo } from 'react';
import * as React from 'react';
import { templateAsync } from '@timur_manjosov/formatr';
import { useFormatrContext } from './FormatrProvider';

// Type declaration for React's experimental `use` hook
declare module 'react' {
  function use<T>(promise: Promise<T>): T;
}

/**
 * Hook to format a template string asynchronously with support for async filters
 * This hook integrates with React Suspense
 * 
 * @param templateStr - The template string with placeholders
 * @param context - The context data for placeholder substitution
 * @returns The formatted string (suspends while loading)
 * 
 * @example
 * ```tsx
 * function AsyncGreeting({ userId }: { userId: number }) {
 *   const message = useAsyncFormat(
 *     'Hello, {userId|fetchUser.name}!',
 *     { userId }
 *   );
 *   return <div>{message}</div>;
 * }
 * 
 * // Wrap in Suspense boundary
 * <Suspense fallback={<div>Loading...</div>}>
 *   <AsyncGreeting userId={123} />
 * </Suspense>
 * ```
 */
export function useAsyncFormat<T extends Record<string, unknown>>(
  templateStr: string,
  context: T
): string {
  const { filters, locale } = useFormatrContext();

  const promise = useMemo(() => {
    const options: any = {};
    if (filters !== undefined) options.filters = filters;
    if (locale !== undefined) options.locale = locale;
    
    const compiled = templateAsync(templateStr, options);
    return compiled(context);
  }, [templateStr, context, filters, locale]);

  // Use React's experimental `use` hook to integrate with Suspense
  // @ts-ignore - use is experimental in React 18/19
  return React.use(promise);
}
