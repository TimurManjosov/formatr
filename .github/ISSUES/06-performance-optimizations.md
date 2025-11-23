# Compiler and Performance Optimizations

## Description

Optimize the `formatr` compiler and render phase to improve performance, especially for:
- **Repeated renders**: Templates rendered many times with different contexts (e.g., in loops, server requests).
- **Large templates**: Templates with many placeholders and filters.
- **Hot paths**: Critical rendering paths where every millisecond counts (e.g., logging, API responses).

Currently, `formatr` uses a straightforward compilation approach:
- Parse template → AST
- Compile AST → render function
- Cache compiled render functions (LRU cache)
- Execute render function with context

While this works well for most use cases, there are opportunities to optimize:
- **String building**: The render function builds strings by concatenating fragments; this can be slow for large templates.
- **Filter resolution**: Filters are resolved by name on every render; pre-resolving filters could save time.
- **Precomputation**: Some work (e.g., static text fragments) can be precomputed during compilation.
- **Benchmarking**: Establish micro-benchmarks to measure and track performance characteristics.

Performance optimizations are valuable for:
- **High-throughput systems**: APIs, logging systems, and rendering engines that process thousands of templates per second.
- **Developer confidence**: Well-documented performance characteristics help users understand when to use `formatr` vs. alternatives.
- **Competitive advantage**: Fast template engines are more attractive to performance-conscious users.

This feature fits naturally into the existing `formatr` architecture:
- The compiler in `src/core/compile.ts` already generates render functions.
- The cache in `src/core/cache.ts` already speeds up repeated template compilations.
- By improving the generated render function code, we can make all templates faster without changing the API.

### Example Usage

**Current performance (baseline):**
```typescript
import { template } from "@timur_manjosov/formatr";

const t = template<{ name: string; count: number; price: number }>(
  "Hello {name|upper}, you have {count|plural:item,items} totaling {price|currency:USD}",
  { locale: "en-US" }
);

// Render 100,000 times
console.time("render");
for (let i = 0; i < 100_000; i++) {
  t({ name: "Alice", count: 5, price: 99.99 });
}
console.timeEnd("render");
// → render: 150ms (baseline)
```

**After optimizations:**
```typescript
// Same code, but faster due to compiler improvements
console.time("render");
for (let i = 0; i < 100_000; i++) {
  t({ name: "Alice", count: 5, price: 99.99 });
}
console.timeEnd("render");
// → render: 100ms (33% faster)
```

**Micro-benchmark suite:**
```bash
pnpm bench
# → Running benchmarks...
# → Simple template (no filters): 1,000,000 renders in 50ms (20,000,000 ops/sec)
# → Complex template (3 filters):  100,000 renders in 120ms (833,333 ops/sec)
# → Nested paths (user.name):      100,000 renders in 80ms (1,250,000 ops/sec)
```

## Requirements

### String Building Optimization
- [ ] Investigate alternatives to string concatenation:
  - Use an array to collect string fragments and `join()` at the end.
  - Pre-allocate string buffers (if supported by the JS engine).
  - Use template literals for static parts.
- [ ] Benchmark different approaches and choose the fastest.
- [ ] Ensure the optimization doesn't increase memory usage significantly.

### Filter Pre-Resolution
- [ ] During compilation, resolve filter functions from the registry and store references to them.
- [ ] In the render function, call pre-resolved filter functions directly instead of looking them up by name.
- [ ] This avoids repeated object property lookups during rendering.
- [ ] Ensure that custom filters passed at runtime are still supported.

### Precomputation of Static Content
- [ ] Identify static text nodes in the AST that don't depend on the context.
- [ ] Inline static text directly into the generated render function as string literals.
- [ ] Reduce the number of runtime operations for templates with lots of static text.

### Micro-Benchmarks
- [ ] Create a suite of micro-benchmarks in the `bench/` directory:
  - Simple template with no filters: `"Hello {name}"`
  - Template with text filters: `"{name|trim|upper}"`
  - Template with intl filters: `"{price|currency:USD}"`
  - Template with nested paths: `"{user.profile.name}"`
  - Large template with many placeholders
- [ ] Use a benchmarking library (e.g., Benchmark.js, Tinybench, or manual timing).
- [ ] Add a `pnpm bench` script to run benchmarks.
- [ ] Document performance characteristics in the README or a `PERFORMANCE.md` file.

### Profiling and Analysis
- [ ] Profile the current implementation to identify bottlenecks.
- [ ] Use Node.js profiling tools (`--prof`, Chrome DevTools, Clinic.js).
- [ ] Focus optimization efforts on the hottest paths.

### Documentation
- [ ] Add a **"Performance"** section to the README:
  - Explain caching behavior and cache size.
  - Explain when to precompile templates for best performance.
  - Provide benchmark results and comparison with other libraries (optional).
- [ ] Add a `PERFORMANCE.md` file with detailed performance characteristics:
  - Operations per second for different template types.
  - Memory usage and cache overhead.
  - Recommendations for high-performance scenarios.

### Backwards Compatibility
- [ ] Performance optimizations must not change the public API or template behavior.
- [ ] All existing tests must pass after optimizations.
- [ ] Ensure that custom filters and options still work correctly.

## Acceptance Criteria

### Implementation
- [ ] String building is optimized (array join or other efficient method).
- [ ] Filters are pre-resolved during compilation.
- [ ] Static text is precomputed and inlined in the render function.
- [ ] Micro-benchmark suite is implemented in `bench/`.
- [ ] Performance is measurably improved (at least 20% faster for common use cases).

### Testing
- [ ] All existing tests pass after optimizations.
- [ ] Add regression tests to ensure optimizations don't break edge cases:
  - Empty templates
  - Templates with only static text
  - Templates with only placeholders (no filters)
  - Templates with many filters
  - Templates with custom filters
- [ ] Benchmark suite runs successfully and reports performance metrics.

### Documentation
- [ ] README includes a "Performance" section with key metrics.
- [ ] `PERFORMANCE.md` file documents detailed benchmarks and recommendations.
- [ ] JSDoc comments explain performance-related options (e.g., `cacheSize`).

### Integration
- [ ] Optimizations work with all existing filters (built-in and custom).
- [ ] Optimizations work with all template options (locale, onMissing, etc.).
- [ ] Optimizations work with the `analyze()` function (no impact on diagnostics).

### Performance
- [ ] Rendering is at least 20% faster for templates with multiple filters.
- [ ] Compilation time is not significantly slower (acceptable trade-off).
- [ ] Memory usage is not significantly higher.

### Developer Experience
- [ ] Performance improvements are transparent to users (no API changes).
- [ ] Benchmarks are easy to run and understand.
- [ ] Documentation clearly explains performance characteristics.

## Implementation Ideas

### Approach 1: Array-Based String Building

Update `src/core/compile.ts` to use an array for collecting fragments:

**Current (string concatenation):**
```typescript
return (ctx: unknown) => {
  let result = "";
  for (const node of ast.nodes) {
    if (node.kind === "Text") {
      result += node.value;
    } else {
      // Resolve placeholder and apply filters
      let value = resolvePath(ctx, node.path);
      for (const filter of node.filters) {
        value = applyFilter(filter, value);
      }
      result += String(value);
    }
  }
  return result;
};
```

**Optimized (array join):**
```typescript
return (ctx: unknown) => {
  const fragments: string[] = [];
  for (const node of ast.nodes) {
    if (node.kind === "Text") {
      fragments.push(node.value);
    } else {
      // Resolve placeholder and apply filters
      let value = resolvePath(ctx, node.path);
      for (const filter of node.filters) {
        value = applyFilter(filter, value);
      }
      fragments.push(String(value));
    }
  }
  return fragments.join("");
};
```

### Approach 2: Pre-Resolve Filters

Update the compiler to resolve filters during compilation:

```typescript
function compileTemplate(ast: TemplateAST, options: TemplateOptions): RenderFunction {
  const registry = buildFilterRegistry(options);
  
  // Pre-resolve all filters used in the template
  const resolvedFilters: Map<FilterCall, Filter> = new Map();
  for (const node of ast.nodes) {
    if (node.kind === "Placeholder" && node.filters) {
      for (const filterCall of node.filters) {
        const filterFn = registry[filterCall.name];
        if (filterFn) {
          resolvedFilters.set(filterCall, filterFn);
        }
      }
    }
  }
  
  return (ctx: unknown) => {
    const fragments: string[] = [];
    for (const node of ast.nodes) {
      if (node.kind === "Text") {
        fragments.push(node.value);
      } else {
        let value = resolvePath(ctx, node.path);
        if (node.filters) {
          for (const filterCall of node.filters) {
            const filterFn = resolvedFilters.get(filterCall);
            if (filterFn) {
              value = filterFn(value, ...filterCall.args);
            }
          }
        }
        fragments.push(String(value));
      }
    }
    return fragments.join("");
  };
}
```

### Approach 3: Inline Static Text

Precompute static text during compilation:

```typescript
function compileTemplate(ast: TemplateAST, options: TemplateOptions): RenderFunction {
  // Identify sequences of static text nodes and merge them
  const optimizedNodes = [];
  let currentStatic = "";
  
  for (const node of ast.nodes) {
    if (node.kind === "Text") {
      currentStatic += node.value;
    } else {
      if (currentStatic) {
        optimizedNodes.push({ kind: "Text", value: currentStatic });
        currentStatic = "";
      }
      optimizedNodes.push(node);
    }
  }
  
  if (currentStatic) {
    optimizedNodes.push({ kind: "Text", value: currentStatic });
  }
  
  // Generate render function from optimized nodes
  // ...
}
```

### Approach 4: Micro-Benchmark Suite

Create `bench/render.bench.ts`:

```typescript
import { template } from "../src";
import { performance } from "perf_hooks";

function bench(name: string, fn: () => void, iterations: number) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  const duration = end - start;
  const opsPerSec = (iterations / duration) * 1000;
  console.log(`${name}: ${iterations.toLocaleString()} renders in ${duration.toFixed(2)}ms (${opsPerSec.toFixed(0)} ops/sec)`);
}

const simple = template<{ name: string }>("Hello {name}");
bench("Simple (no filters)", () => simple({ name: "Alice" }), 1_000_000);

const withFilters = template<{ name: string }>("Hello {name|trim|upper}");
bench("With filters", () => withFilters({ name: "  Alice  " }), 100_000);

const intl = template<{ price: number }>("Price: {price|currency:USD}", { locale: "en-US" });
bench("Intl (currency)", () => intl({ price: 99.99 }), 100_000);

const nested = template<{ user: { profile: { name: string } } }>("Name: {user.profile.name}");
bench("Nested paths", () => nested({ user: { profile: { name: "Alice" } } }), 100_000);
```

### Potential Pitfalls
- **Premature optimization**: Focus on real bottlenecks identified by profiling, not theoretical improvements.
- **Code complexity**: Optimizations can make the code harder to read and maintain; balance performance with maintainability.
- **Diminishing returns**: Some optimizations may provide minimal benefit for typical use cases; prioritize those with measurable impact.
- **Memory vs. speed**: Some optimizations (e.g., caching) trade memory for speed; ensure the trade-off is reasonable.

## Additional Notes

- **Related issues**:
  - Issue #12 (WebAssembly backend) is a longer-term optimization for extreme performance scenarios.
- **Future extensions**:
  - Investigate Just-In-Time (JIT) compilation for frequently used templates.
  - Explore parallel rendering for templates with independent placeholders.
  - Add performance monitoring and alerting for regressions in CI.
- **Comparison with other libraries**: Consider benchmarking against popular alternatives (Mustache.js, Handlebars, EJS) to position `formatr` competitively.

---
