import type { Filter } from '../filters';
import { builtinFilters } from '../filters';
import type { TemplateAST } from './ast';
import { FormatrError } from './errors';

export type Ctx = Record<string, unknown>;

export type MissingHandler = 'error' | 'keep' | ((key: string) => string);

export interface CompileOptions {
  onMissing?: MissingHandler; // default: "keep"
  filters?: Record<string, Filter>; // user overrides/extends
}

type Part =
  | { type: 'text'; value: string }
  | { type: 'ph'; key: string; filters?: { name: string; args: string[] }[] };

export function compile(ast: TemplateAST, options: CompileOptions = {}) {
  const onMissing = options.onMissing ?? 'keep';
  const registry: Record<string, Filter> = {
    ...builtinFilters,
    ...(options.filters ?? {}),
  };

  // Flatten AST
  const parts: Part[] = ast.nodes.map((n) => {
    if (n.kind === 'Text') return { type: 'text', value: n.value };
    // Only include `filters` if present — don't add `filters: undefined`
    return n.filters && n.filters.length
      ? { type: 'ph', key: n.key, filters: n.filters }
      : { type: 'ph', key: n.key };
  });

  return function render<T extends Ctx = Ctx>(ctx: T): string {
    let out = '';
    for (const p of parts) {
      if (p.type === 'text') {
        out += p.value;
      } else {
        let val = (ctx as Ctx)[p.key];

        if (val === undefined || val === null) {
          if (onMissing === 'error') {
            throw new FormatrError(`Missing key "${p.key}"`);
          } else if (onMissing === 'keep') {
            out += `{${p.key}}`;
            continue;
          } else {
            out += onMissing(p.key);
            continue;
          }
        }

        if (p.filters && p.filters.length) {
          for (const f of p.filters) {
            const fn = registry[f.name];
            if (!fn) {
              throw new FormatrError(`Unknown filter "${f.name}"`);
            }
            val = fn(val, ...(f.args ?? []));
          }
        }

        out += String(val);
      }
    }
    return out;
  };
}
