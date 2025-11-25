import type { Filter } from '../filters';
import { builtinFilters, makeIntlFilters } from '../filters';
import type { TemplateAST } from './ast';
import { FormatrError } from './errors';

export type Ctx = Record<string, unknown>;
export type MissingHandler = 'error' | 'keep' | ((key: string) => string);

export interface CompileOptions {
  onMissing?: MissingHandler;
  filters?: Record<string, Filter>;
  locale?: string;
  // new:
  cacheSize?: number; // default 200 (0 disables)
  strictKeys?: boolean; // enforce key presence at render time
}

type ResolvedFilter = { fn: Filter; args: string[] };
type Part =
  | { type: 'text'; value: string }
  | { type: 'ph'; path: string[]; keyStr: string; filters?: ResolvedFilter[] };

// Safe traversal with early exit
function getPathValue(obj: unknown, path: string[]): { found: boolean; value?: unknown } {
  let cur: any = obj;
  for (const seg of path) {
    if (cur == null || (typeof cur !== 'object' && typeof cur !== 'function')) {
      return { found: false };
    }
    cur = cur[seg];
  }
  return cur === undefined ? { found: false } : { found: true, value: cur };
}

/**
 * Merges consecutive text nodes in the parts array for optimized rendering.
 * This reduces the number of array operations during render time.
 */
function mergeParts(rawParts: Part[]): Part[] {
  const merged: Part[] = [];
  let pendingText = '';

  for (const p of rawParts) {
    if (p.type === 'text') {
      pendingText += p.value;
    } else {
      if (pendingText) {
        merged.push({ type: 'text', value: pendingText });
        pendingText = '';
      }
      merged.push(p);
    }
  }

  if (pendingText) {
    merged.push({ type: 'text', value: pendingText });
  }

  return merged;
}

export function compile(ast: TemplateAST, options: CompileOptions = {}) {
  const onMissing = options.onMissing ?? 'keep';
  const strictKeys = options.strictKeys ?? false;

  const registry: Record<string, Filter> = {
    ...builtinFilters,
    ...makeIntlFilters(options.locale),
    ...(options.filters ?? {}),
  };

  // Pre-resolve filters per placeholder at compile time
  const rawParts: Part[] = ast.nodes.map((n) => {
    if (n.kind === 'Text') return { type: 'text', value: n.value };
    let resolved: ResolvedFilter[] | undefined;
    if (n.filters && n.filters.length) {
      resolved = n.filters.map((f) => {
        const fn = registry[f.name];
        if (!fn) throw new FormatrError(`Unknown filter "${f.name}"`);
        return { fn, args: f.args ?? [] };
      });
    }
    // Pre-compute keyStr at compile time to avoid join() at render time
    const keyStr = n.path.join('.');
    return resolved && resolved.length
      ? { type: 'ph', path: n.path, keyStr, filters: resolved }
      : { type: 'ph', path: n.path, keyStr };
  });

  // Merge consecutive text nodes for faster rendering
  const parts = mergeParts(rawParts);

  // Optimization: if template is all static text, return a constant function
  if (parts.length === 1) {
    const first = parts[0];
    if (first && first.type === 'text') {
      const staticResult = first.value;
      return function render(): string {
        return staticResult;
      };
    }
  }

  // Optimization: if template is empty, return empty string
  if (parts.length === 0) {
    return function render(): string {
      return '';
    };
  }

  return function render<T extends Ctx = Ctx>(ctx: T): string {
    // Use array-based string building for better performance with many fragments
    const fragments: string[] = [];

    for (const p of parts) {
      if (p.type === 'text') {
        fragments.push(p.value);
        continue;
      }

      const { found, value } = getPathValue(ctx, p.path);
      if (!found || value == null) {
        // strictKeys takes precedence over onMissing
        if (strictKeys || onMissing === 'error') throw new FormatrError(`Missing key "${p.keyStr}"`);
        if (onMissing === 'keep') {
          fragments.push(`{${p.keyStr}}`);
          continue;
        }
        fragments.push(onMissing(p.keyStr));
        continue;
      }

      let val: unknown = value;
      if (p.filters && p.filters.length) {
        for (const rf of p.filters) {
          val = rf.fn(val, ...rf.args);
        }
      }
      fragments.push(String(val));
    }

    return fragments.join('');
  };
}
