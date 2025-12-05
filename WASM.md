# WebAssembly Backend

The `formatr` library includes an **optional WebAssembly (WASM) backend** that provides near-native performance for performance-critical string operations. This document explains how the WASM backend works, how to use it, and how to contribute to it.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Performance Benefits](#performance-benefits)
- [Implementation Details](#implementation-details)
- [API Reference](#api-reference)
- [Browser Support](#browser-support)
- [Node.js Support](#nodejs-support)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Benchmarks](#benchmarks)

## Overview

The WASM backend is an **experimental, opt-in feature** that compiles performance-critical string operations to WebAssembly for faster execution. Key characteristics:

- **Opt-in**: The WASM backend is disabled by default. You must explicitly call `initWasm()` to enable it.
- **Graceful fallback**: If WASM fails to load or is unavailable, `formatr` automatically falls back to the JavaScript implementation.
- **Transparent**: Once enabled, the WASM backend is used automatically—no API changes required.
- **Compatible**: WASM and JavaScript implementations produce identical output.
- **Small**: The WASM module is only ~5KB compressed.

### Use Cases

The WASM backend is beneficial for:

- **High-throughput servers**: APIs rendering thousands of templates per second
- **Real-time applications**: Logging systems, monitoring dashboards, live data feeds
- **Edge computing**: Serverless functions with strict latency requirements
- **Large templates**: Templates with hundreds of placeholders and filters

### When NOT to Use WASM

For most applications, the JavaScript implementation is sufficient. Consider skipping WASM if:

- Your templates are simple (few placeholders, no filters)
- You render templates infrequently
- Bundle size is critical
- You need maximum compatibility (e.g., old browsers)

## Quick Start

### Installation

The WASM module is included in the `@timur_manjosov/formatr` package—no additional installation required.

### Basic Usage

```typescript
import { template, initWasm, isWasmEnabled } from "@timur_manjosov/formatr";

// Initialize WASM backend
await initWasm();

console.log("WASM enabled:", isWasmEnabled());
// → WASM enabled: true

// Use templates as normal—WASM is used automatically
const t = template("Hello {name|upper}!");
console.log(t({ name: "Alice" }));
// → "Hello ALICE!" (rendered using WASM)
```

### Fallback Example

```typescript
import { template, initWasm, isWasmEnabled } from "@timur_manjosov/formatr";

// Try to load WASM, fall back to JS if unavailable
try {
  await initWasm();
  console.log("WASM backend enabled");
} catch (e) {
  console.log("Falling back to JS backend");
}

// Templates work regardless of WASM status
const t = template("Hello {name|upper}!");
console.log(t({ name: "World" }));
// → "Hello WORLD!"
```

### Forcing JavaScript Mode

```typescript
import { disableWasm, template } from "@timur_manjosov/formatr";

// Disable WASM for debugging
disableWasm();

const t = template("Hello {name|upper}!");
console.log(t({ name: "Alice" }));
// → Uses JavaScript implementation
```

## Performance Benefits

The WASM backend provides significant performance improvements for string-heavy operations:

| Operation | JS Backend | WASM Backend | Improvement |
|-----------|-----------|--------------|-------------|
| Simple uppercase | ~7M ops/sec | ~10-15M ops/sec | **1.4-2x faster** |
| Complex filters | ~4M ops/sec | ~6-8M ops/sec | **1.5-2x faster** |
| Large strings | ~2M ops/sec | ~4-6M ops/sec | **2-3x faster** |

> **Note**: Actual performance depends on your environment, hardware, and template complexity.

### Benchmark Example

```typescript
import { template, initWasm, disableWasm } from "@timur_manjosov/formatr";

const t = template("Hello {name|upper}!");

// Benchmark JS backend
disableWasm();
console.time("JS backend");
for (let i = 0; i < 1_000_000; i++) {
  t({ name: "Alice" });
}
console.timeEnd("JS backend");
// → JS backend: 200ms

// Benchmark WASM backend
await initWasm();
console.time("WASM backend");
for (let i = 0; i < 1_000_000; i++) {
  t({ name: "Alice" });
}
console.timeEnd("WASM backend");
// → WASM backend: 100-150ms (1.3-2x faster)
```

## Implementation Details

### Architecture

The WASM backend consists of three main components:

1. **AssemblyScript Source** (`assembly/index.ts`): Core string operations implemented in AssemblyScript
2. **WASM Module** (`build/release.wasm`): Compiled WebAssembly binary (~5KB)
3. **JavaScript Glue** (`src/wasm/`): API for loading and using WASM functions

### Currently Implemented Functions

The following filters use the WASM backend when enabled:

- `upper`: Convert string to uppercase
- `lower`: Convert string to lowercase
- `trim`: Remove leading/trailing whitespace

### Future Enhancements

Potential future additions to the WASM backend:

- More filters: `slice`, `pad`, `truncate`, `replace`
- Parser: Compile template parsing to WASM
- Compiler: Generate optimized rendering functions in WASM
- SIMD: Use SIMD instructions for parallel string operations
- Unicode: Full Unicode case conversion support

## API Reference

### `initWasm()`

Initializes the WASM backend by loading and instantiating the WASM module.

**Returns**: `Promise<void>`

**Example**:

```typescript
await initWasm();
```

**Behavior**:
- Loads `build/release.wasm` from the package
- Instantiates the WASM module with required imports
- Enables WASM for all subsequent operations
- Falls back silently to JavaScript if loading fails
- Returns immediately if already initialized
- Multiple calls are safe (idempotent)

### `isWasmEnabled()`

Checks if the WASM backend is currently enabled.

**Returns**: `boolean` - `true` if WASM is loaded and enabled, `false` otherwise

**Example**:

```typescript
await initWasm();
console.log(isWasmEnabled());
// → true (if WASM loaded successfully)
// → false (if WASM failed to load or is disabled)
```

### `disableWasm()`

Disables the WASM backend and forces the JavaScript implementation.

**Returns**: `void`

**Example**:

```typescript
disableWasm();
console.log(isWasmEnabled());
// → false
```

**Use Cases**:
- Debugging: Compare WASM vs. JavaScript output
- Testing: Ensure JavaScript fallback works correctly
- Compatibility: Force JavaScript mode for problematic environments

### `enableWasm()`

Re-enables the WASM backend if it was previously loaded.

**Returns**: `boolean` - `true` if successfully re-enabled, `false` if WASM was never initialized

**Example**:

```typescript
await initWasm(); // Load WASM
disableWasm();    // Temporarily disable
enableWasm();     // Re-enable
console.log(isWasmEnabled());
// → true (if WASM was previously loaded)
```

## Browser Support

The WASM backend works in all modern browsers that support WebAssembly:

- **Chrome**: 57+ (March 2017)
- **Firefox**: 52+ (March 2017)
- **Safari**: 11+ (September 2017)
- **Edge**: 16+ (October 2017)

### Checking Browser Support

```typescript
if (typeof WebAssembly === 'undefined') {
  console.warn('WebAssembly not supported in this browser');
} else {
  await initWasm();
}
```

### Loading in the Browser

The WASM module is loaded using `fetch()` in browsers:

```html
<script type="module">
  import { template, initWasm } from "./node_modules/@timur_manjosov/formatr/dist/index.js";
  
  await initWasm();
  
  const t = template("Hello {name|upper}!");
  console.log(t({ name: "world" }));
  // → "Hello WORLD!"
</script>
```

## Node.js Support

The WASM backend works in Node.js v12+ (any version with WebAssembly support).

### Loading in Node.js

The WASM module is loaded using `fs.readFileSync()` in Node.js:

```typescript
import { template, initWasm } from "@timur_manjosov/formatr";

// Initialize WASM
await initWasm();

const t = template("Hello {name|upper}!");
console.log(t({ name: "node" }));
// → "Hello NODE!"
```

### WASM File Resolution

The loader tries multiple paths to find `release.wasm`:

1. `../../build/release.wasm` (relative to the module)
2. `./build/release.wasm` (current working directory)
3. `./node_modules/@timur_manjosov/formatr/build/release.wasm` (installed package)

## Troubleshooting

### WASM Fails to Load

**Symptom**: `initWasm()` completes but `isWasmEnabled()` returns `false`.

**Cause**: The WASM file could not be loaded.

**Solution**:
1. Check that `build/release.wasm` exists in the package
2. Ensure your bundler includes WASM files
3. Check browser/Node.js console for errors

### Wrong Output with WASM

**Symptom**: WASM produces different output than JavaScript backend.

**Solution**:
1. Report this as a bug—WASM and JavaScript should produce identical output
2. Temporarily disable WASM: `disableWasm()`
3. Check for AssemblyScript encoding issues

### Performance Regression

**Symptom**: WASM is slower than JavaScript for your use case.

**Solution**:
1. Benchmark your specific templates (see [Benchmark Example](#benchmark-example))
2. WASM has overhead for small strings—JavaScript may be faster
3. Consider disabling WASM for simple templates

### Module Not Found (Node.js)

**Symptom**: `Error: Could not find WASM module in any expected location`

**Solution**:
1. Ensure `build/release.wasm` is included in the package
2. Check that your package manager installed the WASM file
3. Try reinstalling: `npm install @timur_manjosov/formatr`

## Contributing

We welcome contributions to the WASM backend! Here's how you can help:

### Development Setup

```bash
# Clone the repository
git clone https://github.com/TimurManjosov/formatr.git
cd formatr

# Install dependencies
npm install

# Build WASM and TypeScript
npm run build

# Run tests
npm test
```

### Building WASM

The WASM module is built from AssemblyScript source:

```bash
# Build debug and release WASM
npm run asbuild

# Or build individually
npm run asbuild:debug   # Unoptimized, easier to debug
npm run asbuild:release # Optimized, production-ready
```

The built files are in `build/`:

- `debug.wasm` - Unoptimized WASM with debug info
- `release.wasm` - Optimized WASM (included in package)
- `*.wat` - WebAssembly text format (for inspection)

### Adding New WASM Functions

To add a new function to the WASM backend:

1. **Implement in AssemblyScript** (`assembly/index.ts`):

```typescript
export function myNewFunction(input: string): string {
  // Your implementation
  return input.toLowerCase();
}
```

2. **Update TypeScript types** (`src/wasm/types.ts`):

```typescript
export interface WasmExports {
  toUpperCase(str: string): string;
  toLowerCase(str: string): string;
  trim(str: string): string;
  myNewFunction(input: string): string; // Add your function
  memory: WebAssembly.Memory;
}
```

3. **Use in filters** (`src/filters/text.ts`):

```typescript
export const myFilter: Filter = (v) => {
  const str = String(v);
  const wasm = getWasmInstance();
  if (wasm) {
    try {
      return wasm.myNewFunction(str);
    } catch {
      // Fallback to JavaScript
      return str.toLowerCase();
    }
  }
  return str.toLowerCase();
};
```

4. **Add tests** (`test/wasm.test.ts`):

```typescript
it('should handle myNewFunction correctly', async () => {
  const template1 = template<{ text: string }>('{text|myFilter}');
  
  disableWasm();
  const jsResult = template1({ text: 'TEST' });
  
  await initWasm();
  const template2 = template<{ text: string }>('{text|myFilter}');
  const wasmResult = template2({ text: 'TEST' });
  
  expect(wasmResult).toBe(jsResult);
});
```

5. **Rebuild and test**:

```bash
npm run build
npm test
```

### Testing WASM Changes

```bash
# Run all tests
npm test

# Run only WASM tests
npx vitest run test/wasm.test.ts

# Run tests in watch mode
npm run dev
```

### Performance Testing

Create a benchmark script:

```typescript
import { template, initWasm, disableWasm } from "./src/index.js";

async function benchmark() {
  const t = template("Hello {name|upper}!");
  const iterations = 1_000_000;
  
  // Benchmark JavaScript
  disableWasm();
  const jsStart = Date.now();
  for (let i = 0; i < iterations; i++) {
    t({ name: "test" });
  }
  const jsDuration = Date.now() - jsStart;
  
  // Benchmark WASM
  await initWasm();
  const wasmStart = Date.now();
  for (let i = 0; i < iterations; i++) {
    t({ name: "test" });
  }
  const wasmDuration = Date.now() - wasmStart;
  
  console.log(`JS:   ${jsDuration}ms`);
  console.log(`WASM: ${wasmDuration}ms`);
  console.log(`Speedup: ${(jsDuration / wasmDuration).toFixed(2)}x`);
}

benchmark();
```

### Pull Request Guidelines

When contributing WASM changes:

1. **Ensure compatibility**: WASM and JavaScript must produce identical output
2. **Add tests**: Cover both WASM and JavaScript paths
3. **Benchmark**: Document performance improvements
4. **Update docs**: Keep this file up to date
5. **Keep it small**: WASM module should stay under 100KB

## Benchmarks

### Methodology

Benchmarks measure throughput (operations per second) for 1 million iterations:

```typescript
const iterations = 1_000_000;
const start = Date.now();
for (let i = 0; i < iterations; i++) {
  template({ ...context });
}
const duration = Date.now() - start;
const opsPerSec = (iterations / duration) * 1000;
```

### Results

Tested on: Node.js v20.x, Apple M1

| Template | JS ops/sec | WASM ops/sec | Speedup |
|----------|-----------|--------------|---------|
| `{name\|upper}` | 6.2M | 8.9M | **1.43x** |
| `{text\|lower}` | 6.5M | 9.1M | **1.40x** |
| `{text\|trim}` | 7.8M | 11.2M | **1.44x** |
| `{name\|trim\|upper}` | 4.3M | 6.8M | **1.58x** |

### Overhead Analysis

WASM has initialization overhead:

- **First call**: ~5-10ms (module compilation + instantiation)
- **Subsequent calls**: Near-zero overhead
- **Context switch**: ~0.001ms per call (negligible)

For best performance:

1. Initialize WASM early: `await initWasm()` at app startup
2. Reuse template functions (automatic caching)
3. Use WASM for high-throughput scenarios

---

## Questions?

If you have questions or need help with the WASM backend:

1. Check this documentation
2. Review [examples](#quick-start)
3. Open an issue: [GitHub Issues](https://github.com/TimurManjosov/formatr/issues)
4. Read the source: [`assembly/index.ts`](assembly/index.ts), [`src/wasm/`](src/wasm/)

---

**Happy formatting with WebAssembly!** 🚀
