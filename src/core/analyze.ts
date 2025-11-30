// src/core/analyze.ts

import type { Filter } from '../filters';
import { builtinFilters, makeIntlFilters } from '../filters';
import type { TemplateAST } from './ast';
import { FormatrError } from './errors';
import { parseTemplate } from './parser';
import { buildLineStarts, indexToLineCol } from './position';
import { hasTemplate } from './registry';

export type DiagnosticCode = 'parse-error' | 'unknown-filter' | 'bad-args' | 'suspicious-filter' | 'missing-key' | 'unknown-template';

/**
 * Computes the Levenshtein distance between two strings.
 * This measures the minimum number of single-character edits (insertions, deletions, substitutions)
 * needed to transform one string into another.
 * 
 * @param a - First string
 * @param b - Second string
 * @returns The Levenshtein distance between the two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const lenA = a.length;
  const lenB = b.length;

  // Handle edge cases
  if (lenA === 0) return lenB;
  if (lenB === 0) return lenA;

  // Use two rows instead of full matrix for memory efficiency
  let prevRow: number[] = Array.from({ length: lenB + 1 }, (_, i) => i);
  let currRow: number[] = new Array<number>(lenB + 1).fill(0);

  for (let i = 1; i <= lenA; i++) {
    currRow[0] = i;

    for (let j = 1; j <= lenB; j++) {
      const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      // These array accesses are always within bounds due to the algorithm invariants
      const deletion = prevRow[j]! + 1;
      const insertion = currRow[j - 1]! + 1;
      const substitution = prevRow[j - 1]! + cost;
      currRow[j] = Math.min(deletion, insertion, substitution);
    }

    // Swap rows
    [prevRow, currRow] = [currRow, prevRow];
  }

  return prevRow[lenB]!;
}

/**
 * Generates suggestions for an unknown filter name based on available filters.
 * Uses case-insensitive Levenshtein distance to find similar filter names.
 * 
 * @param unknownFilter - The unknown filter name
 * @param availableFilters - Array of available filter names
 * @param maxSuggestions - Maximum number of suggestions to return (default: 3)
 * @param maxDistance - Maximum Levenshtein distance for a suggestion to be included (default: 2)
 * @returns Array of suggested filter names, sorted by distance
 */
export function suggestFilters(
  unknownFilter: string,
  availableFilters: string[],
  maxSuggestions = 3,
  maxDistance = 2
): string[] {
  const unknownLower = unknownFilter.toLowerCase();
  const suggestions: { name: string; distance: number }[] = [];

  for (const filter of availableFilters) {
    const distance = levenshteinDistance(unknownLower, filter.toLowerCase());
    if (distance <= maxDistance) {
      suggestions.push({ name: filter, distance });
    }
  }

  // Sort by distance (ascending), then alphabetically for equal distances
  suggestions.sort((a, b) => {
    if (a.distance !== b.distance) return a.distance - b.distance;
    return a.name.localeCompare(b.name);
  });

  return suggestions.slice(0, maxSuggestions).map(s => s.name);
}

/**
 * Builds a diagnostic message for an unknown filter, including suggestions if available.
 * 
 * @param filterName - The unknown filter name
 * @param suggestions - Array of suggested filter names
 * @returns The diagnostic message string
 */
function buildUnknownFilterMessage(filterName: string, suggestions: string[]): string {
  if (suggestions.length === 0) {
    return `Unknown filter "${filterName}"`;
  }
  if (suggestions.length === 1) {
    return `Unknown filter "${filterName}". Did you mean "${suggestions[0]}"?`;
  }
  // For 2+ suggestions: "Did you mean "x" or "y"?" or "Did you mean "x", "y", or "z"?"
  const quoted = suggestions.map(s => `"${s}"`);
  const last = quoted.pop()!; // Safe: we checked suggestions.length >= 2
  return `Unknown filter "${filterName}". Did you mean ${quoted.join(', ')} or ${last}?`;
}

export interface Position {
  line: number;
  column: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface Diagnostic {
  code: DiagnosticCode;
  message: string;
  severity: DiagnosticSeverity;
  range: Range;
  data?: Record<string, unknown>;
  
  // Deprecated but kept for backwards compatibility
  /** @deprecated Use range instead */
  pos?: number;
  /** @deprecated Use range.start.line instead */
  line?: number;
  /** @deprecated Use range.start.column instead */
  column?: number;
}

export interface AnalyzeOptions {
  locale?: string;
  filters?: Record<string, Filter>;
  context?: unknown;
  onMissing?: 'error' | 'keep' | ((key: string) => string);
  strictKeys?: boolean;
}

export interface AnalysisReport {
  messages: Diagnostic[];
}

// Helper to convert AST range to diagnostic range
function astRangeToRange(source: string, astRange: { start: number; end: number }, lineStarts: number[]): Range {
  const start = indexToLineCol(source, astRange.start, lineStarts);
  const end = indexToLineCol(source, astRange.end, lineStarts);
  return { start, end };
}

// Helper to infer likely type from placeholder name
function inferPlaceholderType(path: string[]): 'string' | 'number' | 'unknown' {
  const key = path[path.length - 1]?.toLowerCase() ?? '';
  // Number indicators
  if (
    key.includes('count') ||
    key.includes('price') ||
    key.includes('age') ||
    key.includes('quantity') ||
    key.includes('amount') ||
    key.includes('total') ||
    key.includes('sum') ||
    key.includes('num')
  ) {
    return 'number';
  }
  // String indicators
  if (
    key.includes('name') ||
    key.includes('title') ||
    key.includes('description') ||
    key.includes('id') ||
    key.includes('text') ||
    key.includes('label') ||
    key.includes('message')
  ) {
    return 'string';
  }
  return 'unknown';
}

// Helper to get expected type for a filter
function getFilterExpectedType(filterName: string): 'string' | 'number' | 'date' | 'unknown' {
  if (['number', 'percent', 'currency', 'plural'].includes(filterName)) return 'number';
  if (['upper', 'lower', 'trim', 'slice', 'pad', 'truncate', 'replace'].includes(filterName)) return 'string';
  if (['date'].includes(filterName)) return 'date';
  return 'unknown';
}

// Helper to resolve path in context
function resolvePath(context: unknown, path: string[]): unknown {
  let current: any = context;
  for (const key of path) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[key];
    if (current === undefined) return undefined;
  }
  return current;
}

function atPos(source: string, pos: number, lineStarts: number[]) {
  const { line, column } = indexToLineCol(source, pos, lineStarts);
  return { pos, line, column };
}

/**
 * Analyzes a template string and returns diagnostic information about potential issues.
 * 
 * This function performs static analysis on template strings to detect:
 * - Parse errors and syntax issues
 * - Unknown or misspelled filters
 * - Invalid filter arguments
 * - Suspicious filter usage (type mismatches)
 * - Missing keys in the provided context
 * 
 * The analyzer can be integrated into editors, linters, or build processes for early detection
 * of template issues.
 * 
 * @param source - The template string to analyze
 * @param options - Analysis configuration options
 * @param options.locale - Locale for filter resolution (affects which filters are available)
 * @param options.filters - Custom filters to include in analysis
 * @param options.context - Context object to validate placeholders against
 * @param options.onMissing - Enables missing key detection when set to "error" with a context
 * @param options.strictKeys - When true, validates all placeholders exist in context
 * @returns An analysis report containing an array of diagnostic messages
 * 
 * @example
 * // Detect invalid filter arguments
 * const report = analyze("{count|plural:singular}");
 * console.log(report.messages[0]);
 * // {
 * //   code: "bad-args",
 * //   message: 'Filter "plural" requires exactly 2 arguments (e.g. one, other)',
 * //   severity: "error",
 * //   range: { start: { line: 1, column: 7 }, end: { line: 1, column: 24 } }
 * // }
 * 
 * @example
 * // Detect unknown filters
 * const report = analyze("{name|unknownFilter}");
 * console.log(report.messages[0]);
 * // {
 * //   code: "unknown-filter",
 * //   message: 'Unknown filter "unknownFilter"',
 * //   severity: "error",
 * //   ...
 * // }
 * 
 * @example
 * // Validate placeholders against context
 * const report = analyze("{name} {age}", {
 *   context: { age: 30 },
 *   onMissing: "error"
 * });
 * console.log(report.messages[0]);
 * // {
 * //   code: "missing-key",
 * //   message: 'Missing key "name" in context',
 * //   severity: "error",
 * //   ...
 * // }
 * 
 * @example
 * // Detect suspicious filter usage
 * const report = analyze("{username|number}");
 * console.log(report.messages[0]);
 * // {
 * //   code: "suspicious-filter",
 * //   message: 'Filter "number" expects a number, but "username" likely produces a string',
 * //   severity: "warning",
 * //   ...
 * // }
 */
export function analyze(source: string, options: AnalyzeOptions = {}): AnalysisReport {
  const messages: Diagnostic[] = [];
  const lineStarts = buildLineStarts(source);

  let ast: TemplateAST;
  try {
    ast = parseTemplate(source);
  } catch (e: unknown) {
    if (e instanceof FormatrError) {
      const pos = e.pos ?? 0;
      const posInfo = atPos(source, pos, lineStarts);
      // Create a single-character range for parse errors
      const range = astRangeToRange(source, { start: pos, end: pos + 1 }, lineStarts);
      messages.push({
        code: 'parse-error',
        message: e.message,
        severity: 'error',
        range,
        ...posInfo,
      });
      return { messages };
    }
    const range = astRangeToRange(source, { start: 0, end: 1 }, lineStarts);
    messages.push({
      code: 'parse-error',
      message: (e as Error)?.message ?? String(e),
      severity: 'error',
      range,
    });
    return { messages };
  }

  const registry: Record<string, Filter> = {
    ...builtinFilters,
    ...makeIntlFilters(options.locale),
    ...(options.filters ?? {}),
  };

  // Check for missing placeholders if context is provided
  // strictKeys takes precedence over onMissing
  if (options.context !== undefined && (options.strictKeys || options.onMissing === 'error')) {
    for (const node of ast.nodes) {
      if (node.kind === 'Placeholder') {
        const value = resolvePath(options.context, node.path);
        // Check for both undefined and null to match runtime behavior
        if (value === undefined || value === null) {
          const range = astRangeToRange(source, node.range, lineStarts);
          const posInfo = atPos(source, node.range.start, lineStarts);
          messages.push({
            code: 'missing-key',
            message: `Missing key "${node.path.join('.')}" in context`,
            severity: 'error',
            range,
            data: { path: node.path },
            ...posInfo,
          });
        }
      }
    }
  }

  // Check for unknown templates in include nodes
  for (const node of ast.nodes) {
    if (node.kind === 'Include') {
      if (!hasTemplate(node.name)) {
        const range = astRangeToRange(source, node.range, lineStarts);
        const posInfo = atPos(source, node.range.start, lineStarts);
        messages.push({
          code: 'unknown-template',
          message: `Unknown template "${node.name}"`,
          severity: 'error',
          range,
          data: { template: node.name },
          ...posInfo,
        });
      }
    }
  }

  for (const node of ast.nodes) {
    if (node.kind !== 'Placeholder' || !node.filters?.length) continue;

    for (const f of node.filters) {
      const fn = registry[f.name];
      if (!fn) {
        // Generate suggestions for the unknown filter
        const availableFilters = Object.keys(registry);
        const suggestions = suggestFilters(f.name, availableFilters);
        const message = buildUnknownFilterMessage(f.name, suggestions);

        const range = astRangeToRange(source, f.range, lineStarts);
        const posInfo = atPos(source, f.range.start, lineStarts);
        messages.push({
          code: 'unknown-filter',
          message,
          severity: 'error',
          range,
          data: { filter: f.name, suggestions },
          ...posInfo,
        });
        continue;
      }

      // Suspicious usage detection
      const expectedType = getFilterExpectedType(f.name);
      const inferredType = inferPlaceholderType(node.path);
      if (
        expectedType !== 'unknown' &&
        inferredType !== 'unknown' &&
        expectedType !== inferredType
      ) {
        const range = astRangeToRange(source, f.range, lineStarts);
        const posInfo = atPos(source, f.range.start, lineStarts);
        messages.push({
          code: 'suspicious-filter',
          message: `Filter "${f.name}" expects a ${expectedType}, but "${node.path.join('.')}" likely produces a ${inferredType}`,
          severity: 'warning',
          range,
          data: { filter: f.name, placeholder: node.path.join('.'), expectedType },
          ...posInfo,
        });
      }

      // arg arity checks for known built-ins (with enhanced messages)
      if (f.name === 'plural' && f.args.length !== 2) {
        const range = astRangeToRange(source, f.range, lineStarts);
        const posInfo = atPos(source, f.range.start, lineStarts);
        messages.push({
          code: 'bad-args',
          message: `Filter "plural" requires exactly 2 arguments (e.g. one, other)`,
          severity: 'error',
          range,
          data: { filter: f.name, expected: 2, got: f.args.length },
          ...posInfo,
        });
      }
      if (f.name === 'currency' && f.args.length < 1) {
        const range = astRangeToRange(source, f.range, lineStarts);
        const posInfo = atPos(source, f.range.start, lineStarts);
        messages.push({
          code: 'bad-args',
          message: `Filter "currency" requires at least 1 argument: currency code (e.g., USD)`,
          severity: 'error',
          range,
          data: { filter: f.name, expected: 'at least 1', got: f.args.length },
          ...posInfo,
        });
      }
      if (f.name === 'slice' && (f.args.length < 1 || f.args.length > 2)) {
        const range = astRangeToRange(source, f.range, lineStarts);
        const posInfo = atPos(source, f.range.start, lineStarts);
        messages.push({
          code: 'bad-args',
          message: `Filter "slice" requires 1 or 2 arguments: start, end?`,
          severity: 'error',
          range,
          data: { filter: f.name, expected: '1-2', got: f.args.length },
          ...posInfo,
        });
      }
      if (f.name === 'pad' && (f.args.length < 1 || f.args.length > 3)) {
        const range = astRangeToRange(source, f.range, lineStarts);
        const posInfo = atPos(source, f.range.start, lineStarts);
        messages.push({
          code: 'bad-args',
          message: `Filter "pad" requires 1 to 3 arguments: length, direction?, char?`,
          severity: 'error',
          range,
          data: { filter: f.name, expected: '1-3', got: f.args.length },
          ...posInfo,
        });
      }
      if (f.name === 'truncate' && (f.args.length < 1 || f.args.length > 2)) {
        const range = astRangeToRange(source, f.range, lineStarts);
        const posInfo = atPos(source, f.range.start, lineStarts);
        messages.push({
          code: 'bad-args',
          message: `Filter "truncate" requires 1 or 2 arguments: length, ellipsis?`,
          severity: 'error',
          range,
          data: { filter: f.name, expected: '1-2', got: f.args.length },
          ...posInfo,
        });
      }
      if (f.name === 'replace' && f.args.length !== 2) {
        const range = astRangeToRange(source, f.range, lineStarts);
        const posInfo = atPos(source, f.range.start, lineStarts);
        messages.push({
          code: 'bad-args',
          message: `Filter "replace" requires exactly 2 arguments: from, to`,
          severity: 'error',
          range,
          data: { filter: f.name, expected: 2, got: f.args.length },
          ...posInfo,
        });
      }
      if (f.name === 'date' && f.args.length < 1) {
        const range = astRangeToRange(source, f.range, lineStarts);
        const posInfo = atPos(source, f.range.start, lineStarts);
        messages.push({
          code: 'bad-args',
          message: `Filter "date" requires 1 argument: style (short, medium, long, or full)`,
          severity: 'error',
          range,
          data: { filter: f.name, expected: 'at least 1', got: f.args.length },
          ...posInfo,
        });
      }
    }
  }

  return { messages };
}

// add default export for compatibility with default imports
export default analyze;
