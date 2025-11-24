// src/core/analyze.ts

import type { Filter } from '../filters';
import { builtinFilters, makeIntlFilters } from '../filters';
import type { TemplateAST } from './ast';
import { FormatrError } from './errors';
import { parseTemplate } from './parser';
import { buildLineStarts, indexToLineCol } from './position';

export type DiagnosticCode = 'parse-error' | 'unknown-filter' | 'bad-args';

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

function atPos(source: string, pos: number, lineStarts: number[]) {
  const { line, column } = indexToLineCol(source, pos, lineStarts);
  return { pos, line, column };
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
      messages.push({
        code: 'parse-error',
        message: e.message,
        ...atPos(source, pos, lineStarts),
      });
      return { messages };
    }
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
          ...atPos(source, f.range.start, lineStarts),
          data: { filter: f.name },
        });
        continue;
      }

      // arg arity checks for known built-ins (extend as you add more rules)
      if (f.name === 'plural' && f.args.length !== 2) {
        messages.push({
          code: 'bad-args',
          message: `Filter "plural" requires exactly 2 args: singular, plural`,
          ...atPos(source, f.range.start, lineStarts),
          data: { filter: f.name, got: f.args.length },
        });
      }
      if (f.name === 'currency' && f.args.length < 1) {
        messages.push({
          code: 'bad-args',
          message: `Filter "currency" requires at least 1 arg: currency code (e.g., EUR)`,
          ...atPos(source, f.range.start, lineStarts),
          data: { filter: f.name, got: f.args.length },
        });
      }
      if (f.name === 'slice' && (f.args.length < 1 || f.args.length > 2)) {
        messages.push({
          code: 'bad-args',
          message: `Filter "slice" requires 1 or 2 args: start, end?`,
          ...atPos(source, f.range.start, lineStarts),
          data: { filter: f.name, got: f.args.length },
        });
      }
      if (f.name === 'pad' && (f.args.length < 1 || f.args.length > 3)) {
        messages.push({
          code: 'bad-args',
          message: `Filter "pad" requires 1 to 3 args: length, direction?, char?`,
          ...atPos(source, f.range.start, lineStarts),
          data: { filter: f.name, got: f.args.length },
        });
      }
      if (f.name === 'truncate' && (f.args.length < 1 || f.args.length > 2)) {
        messages.push({
          code: 'bad-args',
          message: `Filter "truncate" requires 1 or 2 args: length, ellipsis?`,
          ...atPos(source, f.range.start, lineStarts),
          data: { filter: f.name, got: f.args.length },
        });
      }
      if (f.name === 'replace' && f.args.length !== 2) {
        messages.push({
          code: 'bad-args',
          message: `Filter "replace" requires exactly 2 args: from, to`,
          ...atPos(source, f.range.start, lineStarts),
          data: { filter: f.name, got: f.args.length },
        });
      }
    }
  }

  return { messages };
}

// add default export for compatibility with default imports
export default analyze;
