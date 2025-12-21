export * from './api';
export { FormatrError, FilterExecutionError } from './core/errors';
export { analyze } from './core/analyze';
export type { 
  AnalyzeOptions, 
  AnalysisReport, 
  Diagnostic, 
  DiagnosticCode, 
  DiagnosticSeverity,
  Position,
  Range
} from './core/analyze';
export type { IncludeNode } from './core/ast';
export type { AsyncFilter, SyncOrAsyncFilter } from './filters';

// WebAssembly Backend API
export { initWasm, isWasmEnabled, disableWasm, enableWasm } from './wasm/index';
export type { WasmExports } from './wasm/types';
