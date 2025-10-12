import type { TemplateAST } from './ast';
import { FormatrError } from './errors';

export type Ctx = Record<string, unknown>;

export type MissingHandler = 'error' | 'keep' | ((key: string) => string);

export interface CompileOptions {
  onMissing?: MissingHandler; // default: "keep"
}

type Part = { type: 'text'; value: string } | { type: 'key'; key: string };

export function compile(ast: TemplateAST, options: CompileOptions = {}) {
  const onMissing = options.onMissing ?? 'keep';

  // Flatten AST into parts for faster rendering
  const parts: Part[] = ast.nodes.map((n) =>
    n.kind === 'Text' ? { type: 'text', value: n.value } : { type: 'key', key: n.key }
  );

  return function render<T extends Ctx = Ctx>(ctx: T): string {
    let out = '';
    for (const p of parts) {
      if (p.type === 'text') {
        out += p.value;
      } else {
        const v = (ctx as Ctx)[p.key];
        if (v === undefined || v === null) {
          if (onMissing === 'error') {
            throw new FormatrError(`Missing key "${p.key}"`);
          } else if (onMissing === 'keep') {
            out += `{${p.key}}`;
          } else {
            out += onMissing(p.key);
          }
        } else {
          out += String(v);
        }
      }
    }
    return out;
  };
}
