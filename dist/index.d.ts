type Filter = (value: unknown, ...args: string[]) => unknown;

type Ctx = Record<string, unknown>;
type MissingHandler = 'error' | 'keep' | ((key: string) => string);
interface CompileOptions {
    onMissing?: MissingHandler;
    filters?: Record<string, Filter>;
    locale?: string;
}

type DiagnosticCode = 'unknown-filter' | 'bad-args';
interface Diagnostic {
    code: DiagnosticCode;
    message: string;
    pos?: number;
    data?: Record<string, unknown>;
}
interface AnalyzeOptions {
    locale?: string;
    filters?: Record<string, Filter>;
}
interface AnalysisReport {
    messages: Diagnostic[];
}
declare function analyze(source: string, options?: AnalyzeOptions): AnalysisReport;

declare function template<T extends Ctx = Ctx>(source: string, options?: CompileOptions): (ctx: T) => string;

declare class FormatrError extends Error {
    readonly pos?: number | undefined;
    constructor(message: string, pos?: number | undefined);
}

export { FormatrError, analyze, template };
