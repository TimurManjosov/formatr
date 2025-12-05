/**
 * Type definitions for WebAssembly exports
 */

export interface WasmExports {
  /** Convert string to uppercase */
  toUpperCase(str: string): string;
  
  /** Convert string to lowercase */
  toLowerCase(str: string): string;
  
  /** Trim whitespace from both ends */
  trim(str: string): string;
  
  /** Memory management - WASM linear memory */
  memory: WebAssembly.Memory;
}
