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
