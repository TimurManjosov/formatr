type Filter = (value: unknown, ...args: string[]) => unknown;

type Ctx = Record<string, unknown>;
type MissingHandler = 'error' | 'keep' | ((key: string) => string);
interface CompileOptions {
    onMissing?: MissingHandler;
    filters?: Record<string, Filter>;
    locale?: string;
    cacheSize?: number;
    strictKeys?: boolean;
}

declare function template<T extends Ctx = Ctx>(source: string, options?: CompileOptions): (ctx: T) => string;

declare class FormatrError extends Error {
    readonly pos?: number | undefined;
    constructor(message?: string, pos?: number | undefined);
}

type DiagnosticCode = 'parse-error' | 'unknown-filter' | 'bad-args' | 'suspicious-filter' | 'missing-key';
interface Position {
    line: number;
    column: number;
}
interface Range {
    start: Position;
    end: Position;
}
type DiagnosticSeverity = 'error' | 'warning' | 'info';
interface Diagnostic {
    code: DiagnosticCode;
    message: string;
    severity: DiagnosticSeverity;
    range: Range;
    data?: Record<string, unknown>;
    /** @deprecated Use range instead */
    pos?: number;
    /** @deprecated Use range.start.line instead */
    line?: number;
    /** @deprecated Use range.start.column instead */
    column?: number;
}
interface AnalyzeOptions {
    locale?: string;
    filters?: Record<string, Filter>;
    context?: unknown;
    onMissing?: 'error' | 'keep' | ((key: string) => string);
    strictKeys?: boolean;
}
interface AnalysisReport {
    messages: Diagnostic[];
}
declare function analyze(source: string, options?: AnalyzeOptions): AnalysisReport;

export { type AnalysisReport, type AnalyzeOptions, type Diagnostic, type DiagnosticCode, type DiagnosticSeverity, FormatrError, type Position, type Range, analyze, template };
