import { LRU } from './core/cache';
import { compile, type CompileOptions, type Ctx } from './core/compile';
import { parseTemplate } from './core/parser';

const DEFAULT_CACHE_SIZE = 200;
const compiledCache = new LRU<string, (ctx: any) => string>(DEFAULT_CACHE_SIZE);

function makeCacheKey(source: string, options: CompileOptions): string {
  // Only include options that affect compilation output/behavior
  const opt = {
    locale: options.locale ?? null,
    onMissing: options.onMissing ?? 'keep',
    strictKeys: options.strictKeys ?? false,
    // include the filter names only (implementations come from user each call;
    // we assume same names = same behavior for caching purposes)
    filters: options.filters ? Object.keys(options.filters).sort() : [],
    // cacheSize is not part of cache identity
  };
  return JSON.stringify([source, opt]);
}

/**
 * Compiles a template string into a reusable function that accepts a context object and returns a formatted string.
 * 
 * The template function supports placeholders with filters, dot-path notation, and internationalization.
 * Compiled templates are cached for performance.
 * 
 * @template T - The type of the context object
 * @param source - The template string containing placeholders and filters (e.g., "Hello {name|upper}")
 * @param options - Configuration options for the template
 * @param options.locale - Locale for internationalization filters (e.g., "en-US", "de-DE")
 * @param options.onMissing - Behavior when a placeholder key is missing:
 *   - "error": Throws an exception (default)
 *   - "keep": Leaves the placeholder unchanged in the output
 *   - function: Custom function returning a fallback string
 * @param options.filters - Custom filter functions to extend built-in filters
 * @param options.cacheSize - Maximum number of compiled templates to cache (default: 200, set to 0 to disable)
 * @returns A function that takes a context object and returns the formatted string
 * 
 * @example
 * // Basic usage with filters
 * const greet = template<{ name: string; count: number }>(
 *   "Hello {name|upper}, you have {count|plural:message,messages}"
 * );
 * console.log(greet({ name: "Alice", count: 1 }));
 * // → "Hello ALICE, you have message"
 * 
 * @example
 * // With internationalization
 * const price = template<{ amount: number }>(
 *   "Total: {amount|currency:USD}",
 *   { locale: "en-US" }
 * );
 * console.log(price({ amount: 42.99 }));
 * // → "Total: $42.99"
 * 
 * @example
 * // With custom filters
 * const t = template<{ text: string }>(
 *   "{text|reverse}",
 *   {
 *     filters: {
 *       reverse: (val: unknown) => String(val).split('').reverse().join('')
 *     }
 *   }
 * );
 * console.log(t({ text: "hello" }));
 * // → "olleh"
 * 
 * @example
 * // With custom missing handler
 * const t = template<{ name?: string }>(
 *   "Hello {name}",
 *   { onMissing: (key) => `[${key} not provided]` }
 * );
 * console.log(t({}));
 * // → "Hello [name not provided]"
 */
export function template<T extends Ctx = Ctx>(
  source: string,
  options: CompileOptions = {}
): (ctx: T) => string {
  const cacheSize = options.cacheSize ?? DEFAULT_CACHE_SIZE;
  if (cacheSize !== compiledCache['max']) {
    // Recreate cache if user overrides size (simple approach).
    // Alternatively keep a map: size -> LRU.
    (compiledCache as any).max = cacheSize; // adjust at runtime
    if (cacheSize === 0) compiledCache.clear();
  }

  if (cacheSize > 0) {
    const key = makeCacheKey(source, options);
    const cached = compiledCache.get(key);
    if (cached) return cached as (ctx: T) => string;

    const ast = parseTemplate(source);
    const fn = compile(ast, options);
    compiledCache.set(key, fn as (ctx: any) => string);
    return fn as (ctx: T) => string;
  }

  // no caching
  const ast = parseTemplate(source);
  return compile(ast, options);
}
