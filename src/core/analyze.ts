import type { Filter } from '../filters';
import { builtinFilters, makeIntlFilters } from '../filters';
import type { TemplateAST } from './ast';
import { parseTemplate } from './parser';

export type DiagnosticCode = 'unknown-filter' | 'bad-args';

export interface Diagnostic {
  code: DiagnosticCode;
  message: string;
  // future: line/col; for now just index placeholder
  pos?: number;
  // optional extra context
  data?: Record<string, unknown>;
}

export interface AnalyzeOptions {
  locale?: string;
  filters?: Record<string, Filter>; // user-supplied
}

export interface AnalysisReport {
  messages: Diagnostic[];
}

export function analyze(source: string, options: AnalyzeOptions = {}): AnalysisReport {
  const messages: Diagnostic[] = [];
  const ast: TemplateAST = parseTemplate(source);

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

      // Basic arg checks for known built-ins we care about now:
      // plural must have exactly 2 args
      if (f.name === 'plural' && f.args.length !== 2) {
        messages.push({
          code: 'bad-args',
          message: `Filter "plural" requires exactly 2 args: singular, plural`,
          data: { filter: f.name, got: f.args.length },
        });
      }

      // currency must have at least 1 arg (code)
      if (f.name === 'currency' && f.args.length < 1) {
        messages.push({
          code: 'bad-args',
          message: `Filter "currency" requires at least 1 arg: currency code (e.g., EUR)`,
          data: { filter: f.name, got: f.args.length },
        });
      }

      // percent optional 1 arg (digits) → no strict check
      // number optional 0–2 args → no strict check
      // date optional 0–1 arg → no strict check
    }
  }

  return { messages };
}
