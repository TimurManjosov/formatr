/**
 * Platform-specific WASM loader
 * This file handles loading the WASM module in both Node.js and browser environments.
 * @internal
 */

/**
 * Load the WASM module from the appropriate source.
 * Handles both Node.js and browser environments.
 */
export async function loadWasmModule(): Promise<WebAssembly.Module> {
  // Check for Node.js environment (use string indexing to avoid TS errors)
  const g = globalThis as any;
  const proc = g['process'];
  const isNode = typeof proc !== 'undefined' && 
                 proc != null &&
                 typeof proc['versions'] === 'object' && 
                 typeof proc['versions']['node'] === 'string';
  
  if (isNode) {
    return loadInNode();
  } else {
    return loadInBrowser();
  }
}

/**
 * Load WASM in Node.js environment
 */
async function loadInNode(): Promise<WebAssembly.Module> {
  // Dynamic imports with type assertions to avoid TypeScript errors
  const fsModule: any = await import('fs');
  const pathModule: any = await import('path');
  const fs = fsModule.default || fsModule;
  const path = pathModule.default || pathModule;
  
  const g = globalThis as any;
  const proc = g['process'];
  
  // Get current working directory
  const cwd = typeof proc['cwd'] === 'function' ? proc['cwd']() : '.';
  
  // Get __dirname if available (CommonJS), otherwise use cwd
  const dirname = typeof g['__dirname'] === 'string' ? g['__dirname'] : cwd;
  
  // Try to load from multiple possible locations
  const possiblePaths = [
    path.join(dirname, '../../build/release.wasm'),
    path.join(cwd, 'build/release.wasm'),
    path.join(cwd, 'node_modules/@timur_manjosov/formatr/build/release.wasm'),
  ];

  for (const wasmPath of possiblePaths) {
    try {
      const wasmBuffer = fs.readFileSync(wasmPath);
      return await WebAssembly.compile(wasmBuffer);
    } catch {
      // Try next path
      continue;
    }
  }
  
  throw new Error('Could not find WASM module in any expected location');
}

/**
 * Load WASM in browser environment
 */
async function loadInBrowser(): Promise<WebAssembly.Module> {
  // Try multiple strategies to load WASM
  
  // Strategy 1: Use import.meta.url if available
  const g = globalThis as any;
  if (typeof g['import'] !== 'undefined' && 
      typeof g['import']['meta'] !== 'undefined' && 
      typeof g['import']['meta']['url'] === 'string') {
    try {
      const wasmUrl = new URL('../../build/release.wasm', g['import']['meta']['url']);
      const response = await fetch(wasmUrl);
      if (response.ok) {
        return await WebAssembly.compileStreaming(response);
      }
    } catch {
      // Fall through to next strategy
    }
  }
  
  // Strategy 2: Try relative path from document base
  try {
    const response = await fetch('./build/release.wasm');
    if (response.ok) {
      return await WebAssembly.compile(await response.arrayBuffer());
    }
  } catch {
    // Fall through to error
  }
  
  // Strategy 3: Try from root
  try {
    const response = await fetch('/build/release.wasm');
    if (response.ok) {
      return await WebAssembly.compile(await response.arrayBuffer());
    }
  } catch {
    // Fall through to error
  }
  
  throw new Error('Could not load WASM module from any location');
}
