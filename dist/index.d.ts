type Filter = (value: unknown, ...args: string[]) => unknown;

type Ctx = Record<string, unknown>;
type MissingHandler = 'error' | 'keep' | ((key: string) => string);
interface CompileOptions {
    onMissing?: MissingHandler;
    filters?: Record<string, Filter>;
    locale?: string;
    cacheSize?: number;
}

declare function template<T extends Ctx = Ctx>(source: string, options?: CompileOptions): (ctx: T) => string;

declare class FormatrError extends Error {
    readonly pos?: number | undefined;
    constructor(message?: string, pos?: number | undefined);
}

export { FormatrError, template };
