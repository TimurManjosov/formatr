import { computed, inject, unref, type MaybeRef } from 'vue';
import { template } from '@timur_manjosov/formatr';
import { FormatrOptionsKey, type FormatrPluginOptions } from './plugin';

interface TemplateOptions {
  filters?: Record<string, (value: unknown) => unknown>;
  locale?: string;
}

/**
 * Composable for reactive template formatting
 * 
 * @param templateStr - Template string (can be ref or reactive)
 * @param context - Context data (can be ref or reactive)
 * @returns Computed ref with formatted string that updates reactively
 * 
 * @example
 * ```vue
 * <script setup>
 * import { ref } from 'vue';
 * import { useFormat } from '@formatr/vue';
 * 
 * const name = ref('Alice');
 * const age = ref(30);
 * 
 * const formatted = useFormat(
 *   'Name: {name}, Age: {age}',
 *   { name, age }
 * );
 * 
 * // Updates automatically when name or age changes
 * </script>
 * 
 * <template>
 *   <div>{{ formatted }}</div>
 * </template>
 * ```
 */
export function useFormat<T extends Record<string, unknown>>(
  templateStr: MaybeRef<string>,
  context: MaybeRef<T>
) {
  const options = inject<FormatrPluginOptions>(FormatrOptionsKey, {});

  return computed(() => {
    const tpl = unref(templateStr);
    const ctx = unref(context);
    
    const compileOpts: TemplateOptions = {};
    if (options.filters !== undefined) compileOpts.filters = options.filters;
    if (options.locale !== undefined) compileOpts.locale = options.locale;
    
    const compiled = template(tpl, compileOpts);
    
    return compiled(ctx);
  });
}
