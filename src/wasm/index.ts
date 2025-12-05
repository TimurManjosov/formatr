/**
 * WebAssembly Backend API
 * 
 * This module provides an optional WebAssembly backend for performance-critical
 * string operations. The WASM backend is opt-in and falls back gracefully to
 * JavaScript implementations if unavailable.
 */

import type { WasmExports } from './types';
import { loadWasmModule } from './loader';

let wasmInstance: WasmExports | null = null;
let wasmEnabled = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialize the WebAssembly backend.
 * 
 * This function loads and instantiates the WASM module. If initialization fails,
 * it falls back gracefully to the JavaScript implementation without throwing.
 * 
 * @returns Promise that resolves when WASM is loaded (or fails silently)
 * 
 * @example
 * ```typescript
 * import { template, initWasm, isWasmEnabled } from "@timur_manjosov/formatr";
 * 
 * // Load WASM module
 * await initWasm();
 * 
 * if (isWasmEnabled()) {
 *   console.log("WASM backend enabled");
 * }
 * 
 * // Use templates as normal - WASM is used automatically
 * const t = template("Hello {name|upper}!");
 * console.log(t({ name: "Alice" }));
 * ```
 */
export async function initWasm(): Promise<void> {
  // Return existing initialization promise if already initializing
  if (initializationPromise) {
    return initializationPromise;
  }

  // Already initialized
  if (wasmEnabled && wasmInstance) {
    return Promise.resolve();
  }

  initializationPromise = (async () => {
    try {
      // Check if WebAssembly is available
      if (typeof WebAssembly === 'undefined') {
        throw new Error('WebAssembly is not supported in this environment');
      }

      // Load WASM module
      const wasmModule = await loadWasmModule();
      
      // Instantiate with minimal imports
      const instance = await WebAssembly.instantiate(wasmModule, {
        env: {
          abort: () => {
            // Silently handle aborts - they're internal WASM operations
            // Only log if there's a real error condition
          }
        }
      });

      wasmInstance = instance.exports as unknown as WasmExports;
      wasmEnabled = true;
    } catch (error) {
      // Fall back silently to JavaScript implementation
      console.warn('Failed to initialize WASM backend, falling back to JavaScript:', error);
      wasmInstance = null;
      wasmEnabled = false;
    } finally {
      initializationPromise = null;
    }
  })();

  return initializationPromise;
}

/**
 * Check if the WASM backend is currently enabled.
 * 
 * @returns True if WASM backend is loaded and enabled
 * 
 * @example
 * ```typescript
 * await initWasm();
 * console.log("WASM enabled:", isWasmEnabled());
 * ```
 */
export function isWasmEnabled(): boolean {
  return wasmEnabled && wasmInstance !== null;
}

/**
 * Disable the WASM backend and fall back to JavaScript implementation.
 * Useful for debugging or forcing JavaScript mode.
 * 
 * @example
 * ```typescript
 * // Force JavaScript mode for debugging
 * disableWasm();
 * 
 * const t = template("Hello {name|upper}!");
 * console.log(t({ name: "Alice" })); // Uses JS implementation
 * ```
 */
export function disableWasm(): void {
  wasmEnabled = false;
  // Keep instance for potential re-enable, just disable the flag
}

/**
 * Re-enable the WASM backend if it was previously loaded.
 * Does nothing if WASM was never initialized.
 * 
 * @returns True if WASM was successfully re-enabled
 */
export function enableWasm(): boolean {
  if (wasmInstance) {
    wasmEnabled = true;
    return true;
  }
  return false;
}

/**
 * Get the WASM instance for direct access to exported functions.
 * Returns null if WASM is not initialized or disabled.
 * 
 * @internal
 */
export function getWasmInstance(): WasmExports | null {
  if (!wasmEnabled) {
    return null;
  }
  return wasmInstance;
}
