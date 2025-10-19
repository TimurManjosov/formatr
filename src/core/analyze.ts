import type { Filter } from '../filters';
import { builtinFilters, makeIntlFilters } from '../filters';
import type { TemplateAST } from './ast';
import { FormatrError } from './errors';
import { parseTemplate } from './parser';
import { buildLineStarts, indexToLineCol } from './position';

export type DiagnosticCode = 'unknown-filter' | 'bad-args' | 'parse-error';
export interface Diagnostic {
  code: DiagnosticCode;
  message: string;
  pos?: number;
  line?: number;
  column?: number;
  data?: Record<string, unknown>;
}
export interface AnalyzeOptions {
  locale?: string;
  filters?: Record<string, Filter>;
}
export interface AnalysisReport {
  messages: Diagnostic[];
}

export function analyze(source: string, options: AnalyzeOptions = {}): AnalysisReport {
  const messages: Diagnostic[] = [];
  const lineStarts = buildLineStarts(source);

  let ast: TemplateAST;
  try {
    ast = parseTemplate(source);
  } catch (e: unknown) {
    if (e instanceof FormatrError) {
      const pos = e.pos ?? 0;
      const { line, column } = indexToLineCol(source, pos, lineStarts);
      messages.push({
        code: 'parse-error',
        message: e.message,
        pos,
        line,
        column,
      });
      return { messages };
    }
    // unknown error: surface generic parse-error without pos
    messages.push({
      code: 'parse-error',
      message: (e as Error)?.message ?? String(e),
    });
    return { messages };
  }

  const registry: Record<string, Filter> = {
    ...builtinFilters,
    ...makeIntlFilters(options.locale),
    ...(options.filters ?? {}),
  };

  for (const node of ast.nodes) {
    if (node.kind !== 'Placeholder' || !node.filters?.length) continue;

    for (const f of node.filters) {
      const fn = registry[f.name];
      if (!fn) {
        messages.push({
          code: 'unknown-filter',
          message: `Unknown filter "${f.name}"`,
          data: { filter: f.name },
        });
        continue;
      }
      if (f.name === 'plural' && f.args.length !== 2) {
        messages.push({
          code: 'bad-args',
          message: `Filter "plural" requires exactly 2 args: singular, plural`,
          data: { filter: f.name, got: f.args.length },
        });
      }
      if (f.name === 'currency' && f.args.length < 1) {
        messages.push({
          code: 'bad-args',
          message: `Filter "currency" requires at least 1 arg: currency code (e.g., EUR)`,
          data: { filter: f.name, got: f.args.length },
        });
      }
    }
  }

  return { messages };
}

// add default export for compatibility with default imports
export default analyze;
