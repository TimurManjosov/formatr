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
}

type ResolvedFilter = { fn: Filter; args: string[] };
type Part =
  | { type: 'text'; value: string }
  | { type: 'ph'; path: string[]; filters?: ResolvedFilter[] };

// NEW: safe traversal with early exit
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

export function compile(ast: TemplateAST, options: CompileOptions = {}) {
  const onMissing = options.onMissing ?? 'keep';

  const registry: Record<string, Filter> = {
    ...builtinFilters,
    ...makeIntlFilters(options.locale),
    ...(options.filters ?? {}),
  };

  // Pre-resolve filters per placeholder at compile time
  const parts: Part[] = ast.nodes.map((n) => {
    if (n.kind === 'Text') return { type: 'text', value: n.value };
    let resolved: ResolvedFilter[] | undefined;
    if (n.filters && n.filters.length) {
      resolved = n.filters.map((f) => {
        const fn = registry[f.name];
        if (!fn) throw new FormatrError(`Unknown filter "${f.name}"`);
        return { fn, args: f.args ?? [] };
      });
    }
    return resolved && resolved.length
      ? { type: 'ph', path: n.path, filters: resolved }
      : { type: 'ph', path: n.path };
  });

  return function render<T extends Ctx = Ctx>(ctx: T): string {
    let out = '';
    for (const p of parts) {
      if (p.type === 'text') {
        out += p.value;
        continue;
      }

      const { found, value } = getPathValue(ctx, p.path);
      if (!found || value == null) {
        const keyStr = p.path.join('.');
        if (onMissing === 'error') throw new FormatrError(`Missing key "${keyStr}"`);
        if (onMissing === 'keep') {
          out += `{${keyStr}}`;
          continue;
        }
        out += onMissing(keyStr);
        continue;
      }

      let val: unknown = value;
      if (p.filters && p.filters.length) {
        for (const rf of p.filters) {
          val = rf.fn(val, ...rf.args);
        }
      }
      out += String(val);
    }
    return out;
  };
}
