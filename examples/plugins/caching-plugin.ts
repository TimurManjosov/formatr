// examples/plugins/caching-plugin.ts
/**
 * Example: Caching Plugin
 * 
 * This plugin demonstrates the beforeRender/afterRender middleware pattern
 * to implement template result caching with skipRender support.
 */

import { createPlugin, PluginManager } from '../../src/plugin';
import { template } from '../../src/api';
import { createHash } from 'crypto';

// Cache configuration interface
interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache entries
}

// Create the caching plugin
const cachingPlugin = createPlugin<CacheOptions>({
  name: 'cache',
  version: '1.0.0',
  description: 'Caches template render results for improved performance',
  author: 'formatr',

  init(options) {
    // Initialize cache state
    this.state.cache = new Map<string, { value: string; expiry: number }>();
    this.state.ttl = options?.ttl ?? 60000; // Default 1 minute
    this.state.maxSize = options?.maxSize ?? 1000;
    this.state.hits = 0;
    this.state.misses = 0;

    console.log(`[Cache] Initialized with TTL=${this.state.ttl}ms, maxSize=${this.state.maxSize}`);
  },

  middleware: {
    beforeRender(tpl, context) {
      const cache = this.state.cache as Map<string, { value: string; expiry: number }>;
      const key = getCacheKey(tpl, context);
      const entry = cache.get(key);
      const now = Date.now();

      // Check for valid cache hit
      if (entry && entry.expiry > now) {
        (this.state.hits as number)++;
        console.log(`[Cache] HIT for key ${key.slice(0, 16)}...`);
        return {
          template: tpl,
          context,
          skipRender: true,
          cached: entry.value,
        };
      }

      // Cache miss or expired
      (this.state.misses as number)++;
      console.log(`[Cache] MISS for key ${key.slice(0, 16)}...`);
      
      return {
        template: tpl,
        context,
        metadata: { cacheKey: key },
      };
    },

    afterRender(result, metadata) {
      // Only cache if we have a cache key (wasn't a cache hit)
      const cacheKey = metadata.metadata?.cacheKey as string | undefined;
      if (cacheKey) {
        const cache = this.state.cache as Map<string, { value: string; expiry: number }>;
        const ttl = this.state.ttl as number;
        const maxSize = this.state.maxSize as number;

        // Evict oldest entries if cache is full
        if (cache.size >= maxSize) {
          const firstKey = cache.keys().next().value;
          if (firstKey) cache.delete(firstKey);
        }

        // Store the result
        cache.set(cacheKey, {
          value: result,
          expiry: Date.now() + ttl,
        });
        console.log(`[Cache] Stored result for key ${cacheKey.slice(0, 16)}...`);
      }

      return result;
    },
  },

  methods: {
    clear() {
      const cache = this.state.cache as Map<string, unknown>;
      cache.clear();
      this.state.hits = 0;
      this.state.misses = 0;
      console.log('[Cache] Cleared');
    },

    getStats() {
      const cache = this.state.cache as Map<string, unknown>;
      return {
        size: cache.size,
        hits: this.state.hits as number,
        misses: this.state.misses as number,
        hitRate: (this.state.hits as number) / 
          ((this.state.hits as number) + (this.state.misses as number) || 1),
      };
    },
  },

  cleanup() {
    const cache = this.state.cache as Map<string, unknown>;
    cache.clear();
    console.log('[Cache] Plugin cleanup complete');
  },
});

// Helper to generate cache key
function getCacheKey(template: string, context: Record<string, unknown>): string {
  const hash = createHash('sha256');
  hash.update(template);
  hash.update(JSON.stringify(context));
  return hash.digest('hex');
}

// Usage demonstration
async function main() {
  console.log('=== Caching Plugin Example ===\n');

  const manager = new PluginManager();
  await manager.register(cachingPlugin, { ttl: 5000 }); // 5 second TTL

  // Simulate render pipeline
  async function render(tpl: string, context: Record<string, unknown>): Promise<string> {
    // 1. Execute beforeRender hooks
    const beforeResult = await manager.executeBeforeRender(tpl, context);

    // 2. Check if we can skip render (cache hit)
    if (beforeResult.skipRender) {
      return beforeResult.cached!;
    }

    // 3. Actually render the template
    const compiledTemplate = template(tpl);
    const rendered = compiledTemplate(context);

    // 4. Execute afterRender hooks (which will cache the result)
    return await manager.executeAfterRender(rendered, {
      template: tpl,
      context,
      ...beforeResult,
    });
  }

  // First render - cache miss
  console.log('\n--- First render (cache miss) ---');
  const result1 = await render('Hello, {name}!', { name: 'World' });
  console.log('Result:', result1);

  // Second render - cache hit
  console.log('\n--- Second render (cache hit) ---');
  const result2 = await render('Hello, {name}!', { name: 'World' });
  console.log('Result:', result2);

  // Different context - cache miss
  console.log('\n--- Different context (cache miss) ---');
  const result3 = await render('Hello, {name}!', { name: 'Universe' });
  console.log('Result:', result3);

  // Get cache stats
  const plugin = manager.get('cache');
  if (plugin?.methods) {
    console.log('\n--- Cache Statistics ---');
    console.log((plugin.methods as any).getStats());
  }

  // Cleanup
  await manager.clear();
}

main().catch(console.error);
