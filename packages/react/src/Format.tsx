import { useFormat } from './useFormat';

export interface FormatProps<T extends Record<string, unknown>> {
  template: string;
  context: T;
}

/**
 * Component to render a formatr template
 * 
 * @example
 * ```tsx
 * <Format
 *   template="Hello, {name}!"
 *   context={{ name: 'World' }}
 * />
 * ```
 */
export function Format<T extends Record<string, unknown>>({
  template,
  context,
}: FormatProps<T>) {
  const formatted = useFormat(template, context);
  return <>{formatted}</>;
}
