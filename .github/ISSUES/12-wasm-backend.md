# Optional WebAssembly Backend

## Description

Investigate and implement an **optional WebAssembly (WASM) backend** for `formatr` to achieve extreme performance in high-throughput scenarios. This would involve:
- Compiling performance-critical parts of `formatr` (parser, compiler, filters) to WebAssembly.
- Providing a WASM module that can be loaded optionally for users who need maximum performance.
- Maintaining the existing JavaScript implementation as the default for ease of use and compatibility.

WebAssembly can provide:
- **Faster execution**: WASM code runs at near-native speed, especially for CPU-intensive operations like parsing and string manipulation.
- **Predictable performance**: WASM avoids JIT warmup time and garbage collection pauses.
- **Compatibility**: WASM runs in all modern browsers and Node.js.

Use cases for a WASM backend:
- **High-throughput servers**: APIs that render thousands of templates per second.
- **Real-time applications**: Logging systems, monitoring dashboards, live data feeds.
- **Edge computing**: Serverless functions with strict latency requirements.
- **Large templates**: Templates with hundreds of placeholders and filters.

This feature is **experimental and opt-in**:
- Users who need extreme performance can load the WASM module.
- Users who prioritize simplicity and bundle size can use the default JavaScript implementation.
- Both implementations should produce identical output (compatibility tests required).

### Example Usage

**Default (JavaScript):**
```typescript
import { template } from "@timur_manjosov/formatr";

const t = template("Hello {name|upper}!");
console.log(t({ name: "Alice" }));
// → "Hello ALICE!"
```

**With WASM backend (opt-in):**
```typescript
import { template, initWasm } from "@timur_manjosov/formatr";

// Load WASM module
await initWasm();

// Use as normal (WASM backend is used automatically)
const t = template("Hello {name|upper}!");
console.log(t({ name: "Alice" }));
// → "Hello ALICE!" (rendered using WASM)
```

**Fallback behavior:**
```typescript
import { template, initWasm, isWasmEnabled } from "@timur_manjosov/formatr";

// Try to load WASM, fallback to JS if unavailable
try {
  await initWasm();
  console.log("WASM backend enabled");
} catch (e) {
  console.log("Falling back to JS backend");
}

console.log("WASM enabled:", isWasmEnabled());
```

**Performance comparison:**
```typescript
import { template } from "@timur_manjosov/formatr";

const t = template("Hello {name|upper}!");

// Benchmark JS backend
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
// → WASM backend: 100ms (2x faster)
```

## Requirements

### WASM Module
- [ ] Identify performance-critical functions to compile to WASM:
  - Parser (`parseTemplate`)
  - Compiler (`compileTemplate`)
  - Core utilities (`resolvePath`, `applyFilter`)
  - String manipulation in filters
- [ ] Choose a language for WASM compilation:
  - **Rust**: Excellent WASM support, great performance, growing ecosystem.
  - **AssemblyScript**: TypeScript-like syntax, easy to learn, good WASM tooling.
  - **C/C++**: Mature, high performance, but more complex.
- [ ] Compile the chosen implementation to WASM.
- [ ] Generate JavaScript bindings for calling WASM functions.

### API Design
- [ ] `initWasm()`: Async function to load the WASM module.
- [ ] `isWasmEnabled()`: Returns `true` if WASM is loaded and enabled.
- [ ] `disableWasm()`: Temporarily disable WASM and fall back to JS.
- [ ] Ensure the API is identical whether WASM is enabled or not (transparent to users).

### Fallback Mechanism
- [ ] If WASM fails to load (e.g., unsupported environment, loading error), fall back gracefully to the JavaScript implementation.
- [ ] Provide clear error messages if WASM loading fails.
- [ ] Allow users to force JavaScript mode even if WASM is available (for debugging).

### Performance Testing
- [ ] Create benchmarks comparing WASM vs. JS for:
  - Simple templates (no filters)
  - Complex templates (multiple filters)
  - Large templates (hundreds of placeholders)
  - Nested paths
- [ ] Document performance improvements (e.g., "2x faster for complex templates").
- [ ] Ensure WASM has no performance regressions in edge cases (e.g., very small templates).

### Bundle Size
- [ ] The WASM module should be small (target: < 100 KB compressed).
- [ ] WASM should be loaded lazily (not bundled by default).
- [ ] Provide separate npm packages if needed:
  - `@timur_manjosov/formatr` – JS-only (default)
  - `@timur_manjosov/formatr-wasm` – WASM backend (opt-in)

### Compatibility Testing
- [ ] Ensure WASM and JS implementations produce **identical output** for all test cases.
- [ ] Run the entire test suite with both backends.
- [ ] Test in multiple environments:
  - Node.js (LTS versions)
  - Modern browsers (Chrome, Firefox, Safari, Edge)
  - Serverless platforms (AWS Lambda, Cloudflare Workers, Vercel)
  - React Native / Electron (if applicable)

### Documentation
- [ ] Add a section to the README explaining the WASM backend:
  - How to enable it
  - Performance benefits
  - Compatibility notes
- [ ] Add a `WASM.md` file with detailed implementation notes:
  - How the WASM module is built
  - How to contribute to the WASM backend
  - Performance benchmarks
- [ ] Add examples demonstrating WASM usage.

### Opt-In Design
- [ ] WASM is opt-in by default to minimize bundle size and complexity.
- [ ] Users who don't call `initWasm()` never load the WASM module.
- [ ] Provide environment variable or build flag to disable WASM entirely.

### Backwards Compatibility
- [ ] The WASM backend is a new, optional feature, so no breaking changes.
- [ ] Existing code continues to work without modification.

## Acceptance Criteria

### Implementation
- [ ] WASM module is compiled from Rust/AssemblyScript/C++.
- [ ] JavaScript bindings allow calling WASM functions.
- [ ] `initWasm()`, `isWasmEnabled()`, and `disableWasm()` APIs are implemented.
- [ ] Fallback to JS backend works seamlessly if WASM fails to load.

### Testing
- [ ] All unit tests pass with both JS and WASM backends.
- [ ] Compatibility tests confirm identical output from both backends.
- [ ] Performance benchmarks show measurable improvement with WASM.
- [ ] WASM module works in Node.js, browsers, and serverless environments.

### Documentation
- [ ] README includes a section on the WASM backend.
- [ ] `WASM.md` file provides detailed implementation and contribution notes.
- [ ] Examples demonstrate WASM usage.

### Performance
- [ ] WASM backend is at least 50% faster than JS for complex templates.
- [ ] WASM module size is < 100 KB compressed.
- [ ] Loading WASM module adds minimal overhead (< 10ms).

### Developer Experience
- [ ] Enabling WASM is simple (one async call).
- [ ] Fallback behavior is transparent and requires no user intervention.
- [ ] Clear error messages if WASM loading fails.
- [ ] Documentation explains when to use WASM vs. JS.

## Implementation Ideas

### Approach 1: Use Rust with wasm-bindgen

Write core logic in Rust:

```rust
// src/parser.rs
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn parse_template(source: &str) -> JsValue {
    // Parse logic here
    let ast = /* ... */;
    serde_wasm_bindgen::to_value(&ast).unwrap()
}
```

Compile to WASM:

```bash
cargo install wasm-pack
wasm-pack build --target web
```

Use in TypeScript:

```typescript
import init, { parse_template } from "./wasm/formatr_wasm";

export async function initWasm() {
  await init();
  console.log("WASM backend loaded");
}

export function template(source: string) {
  if (isWasmEnabled()) {
    const ast = parse_template(source);
    // Compile and render using WASM
  } else {
    // Use JS backend
  }
}
```

### Approach 2: Use AssemblyScript

Write core logic in AssemblyScript (TypeScript-like):

```typescript
// assembly/parser.ts
export function parseTemplate(source: string): string {
  // Parse logic here
  return JSON.stringify(ast);
}
```

Compile to WASM:

```bash
npm install -D assemblyscript
npx asc assembly/parser.ts --outFile build/parser.wasm --optimize
```

Load in TypeScript:

```typescript
import { instantiate } from "./build/parser.wasm";

let wasmModule: any = null;

export async function initWasm() {
  wasmModule = await instantiate();
  console.log("WASM backend loaded");
}

export function parseTemplate(source: string) {
  if (wasmModule) {
    return wasmModule.parseTemplate(source);
  } else {
    // Fallback to JS
  }
}
```

### Approach 3: Benchmark Setup

Create `bench/wasm.bench.ts`:

```typescript
import { template, initWasm, disableWasm } from "../src";

async function benchJS() {
  disableWasm();
  const t = template("Hello {name|upper}!");
  
  console.time("JS backend");
  for (let i = 0; i < 1_000_000; i++) {
    t({ name: "Alice" });
  }
  console.timeEnd("JS backend");
}

async function benchWASM() {
  await initWasm();
  const t = template("Hello {name|upper}!");
  
  console.time("WASM backend");
  for (let i = 0; i < 1_000_000; i++) {
    t({ name: "Alice" });
  }
  console.timeEnd("WASM backend");
}

benchJS().then(() => benchWASM());
```

### Approach 4: Dual Package Publishing

Publish two packages:

```json
// package.json (JS-only)
{
  "name": "@timur_manjosov/formatr",
  "main": "dist/index.cjs",
  "module": "dist/index.js"
}

// package.json (with WASM)
{
  "name": "@timur_manjosov/formatr-wasm",
  "main": "dist/index.cjs",
  "module": "dist/index.js",
  "files": ["dist", "wasm"]
}
```

### Potential Pitfalls
- **Complexity**: Adding WASM significantly increases code complexity and maintenance burden.
- **Debugging**: WASM is harder to debug than JavaScript; provide good error messages.
- **Bundle size**: WASM modules can be large; ensure compression and lazy loading.
- **Platform support**: WASM may not work in all environments (e.g., old browsers, some serverless platforms).
- **Diminishing returns**: For simple templates, WASM overhead may negate performance gains.
- **Memory management**: WASM has different memory models; ensure proper memory management (no leaks).

## Additional Notes

- **Related issues**:
  - Issue #6 (Performance optimizations) should be completed before starting WASM work to maximize JS performance first.
- **Future extensions**:
  - Use SIMD (Single Instruction, Multiple Data) for even faster string operations.
  - Compile the entire `formatr` library to WASM (not just performance-critical parts).
  - Investigate GPU acceleration for massive parallelization (experimental).
- **Alternative approaches**:
  - Use a JavaScript JIT compiler (e.g., QuickJS, Hermes) instead of WASM.
  - Use native bindings (N-API) for Node.js-only performance improvements.
- **Community feedback**: Gather user feedback on whether WASM is needed; prioritize if there's strong demand.

---
