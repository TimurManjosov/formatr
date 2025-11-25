# Performance Guide

This document provides detailed performance characteristics and optimization recommendations for `formatr`.

## Overview

`formatr` is designed for high-performance string formatting with these key optimizations:

- **Pre-compiled templates**: Templates are compiled once and cached for reuse
- **Filter pre-resolution**: Filter functions are resolved at compile time, not render time
- **Static text merging**: Consecutive static text nodes are merged during compilation
- **LRU cache**: Compiled templates are cached to avoid recompilation (default: 200 entries)
- **Static template optimization**: Pure static templates return a constant function

## Benchmark Results

Performance metrics from `pnpm bench` (typical results, may vary by hardware):

### Render Performance

| Template Type | Operations/sec | Description |
|---------------|----------------|-------------|
| Static only | ~150M+ ops/sec | Templates with no placeholders |
| Simple placeholder | ~7M ops/sec | `"Hello {name}"` |
| Nested paths | ~6M ops/sec | `"{user.profile.name}"` |
| Multiple filters | ~4-6M ops/sec | `"{name\|trim\|upper}"` |
| Many placeholders | ~2.5M ops/sec | 5+ placeholders |
| Intl formatting | ~25K ops/sec | `"{price\|currency:USD}"` |

### Compilation Performance

| Operation | Operations/sec | Description |
|-----------|----------------|-------------|
| Cache hit | ~500K+ ops/sec | Template already compiled |
| Full compilation | ~45K ops/sec | New template compilation |

## Performance Characteristics

### What's Fast

1. **Static templates**: Templates without placeholders are optimized to return a constant function, achieving ~150M ops/sec.

2. **Simple placeholders**: Basic `{name}` substitution is extremely fast (~7M ops/sec).

3. **Nested paths**: Deep object access like `{user.profile.name}` has minimal overhead (~6M ops/sec).

4. **Text filters**: Built-in text filters (`upper`, `lower`, `trim`, etc.) are highly optimized (~4-6M ops/sec).

5. **Cache hits**: Repeatedly using the same template source retrieves from cache instantly (~500K ops/sec).

### What's Slower

1. **Intl filters**: Currency, date, and number formatting use the browser's `Intl` API, which is slower (~25K ops/sec). This is due to `Intl.NumberFormat` and `Intl.DateTimeFormat` overhead.

2. **First compilation**: The first render of a new template incurs compilation cost (~45K ops/sec).

3. **Many placeholders**: Each placeholder adds processing overhead.

## Optimization Recommendations

### 1. Pre-compile Templates at Startup

```typescript
// ✅ Good: Compile once, use everywhere
const templates = {
  greeting: template<{ name: string }>("Hello {name|upper}!"),
  price: template<{ amount: number }>("{amount|currency:USD}", { locale: "en-US" }),
};

// In your hot path
function greet(name: string) {
  return templates.greeting({ name });
}
```

### 2. Reuse Template Functions

```typescript
// ✅ Good: Template compiled once
const logTemplate = template("[{level|pad:5}] {message}");

function log(level: string, message: string) {
  console.log(logTemplate({ level, message }));
}

// ❌ Bad: Template recompiled every call
function log(level: string, message: string) {
  const t = template("[{level|pad:5}] {message}");
  console.log(t({ level, message }));
}
```

### 3. Avoid Intl Filters in Hot Paths

If you need to format thousands of values per second, consider caching formatted results:

```typescript
// ✅ Better: Cache formatted results
const currencyCache = new Map<number, string>();
const currencyTemplate = template<{ amount: number }>("{amount|currency:USD}", { locale: "en-US" });

function formatCurrency(amount: number): string {
  let formatted = currencyCache.get(amount);
  if (!formatted) {
    formatted = currencyTemplate({ amount });
    currencyCache.set(amount, formatted);
  }
  return formatted;
}
```

### 4. Adjust Cache Size for Your Use Case

```typescript
// High-variety applications (many unique templates)
template("...", { cacheSize: 1000 });

// Low-memory environments
template("...", { cacheSize: 50 });

// Dynamic templates (disable cache)
template("...", { cacheSize: 0 });
```

### 5. Use Static Templates When Possible

Templates without placeholders are optimized to be extremely fast:

```typescript
// ~150M ops/sec - returns constant function
const header = template("Welcome to Our App!");

// vs ~7M ops/sec with placeholder
const header = template("Welcome to {appName}!");
```

## Memory Usage

### Template Cache

The LRU cache stores compiled render functions:

- **Default size**: 200 entries
- **Memory per entry**: ~1-5KB (depends on template complexity)
- **Maximum overhead**: ~200-1000KB with default settings

### Render Function Memory

Each compiled template creates a closure containing:
- Pre-resolved filter references
- Merged text nodes
- Pre-computed key strings for error messages

This is a one-time cost per unique template.

## Comparison with Alternatives

| Library | Simple Template | With Filters | Notes |
|---------|-----------------|--------------|-------|
| `formatr` | ~7M ops/sec | ~4M ops/sec | Full-featured with caching |
| Template literals | ~100M+ ops/sec | N/A | No filters, limited reuse |
| `printf` style | ~2M ops/sec | N/A | Positional args only |

**When to use `formatr`:**
- You need reusable templates
- You need built-in filters (formatting, i18n)
- You want type safety
- Templates come from external sources

**When to use template literals:**
- One-off string interpolation
- Maximum performance is critical
- No formatting/transformation needed

## Running Benchmarks

Run the benchmark suite locally:

```bash
pnpm bench
```

The benchmark measures:
- Render performance for various template types
- Compilation performance (cached vs uncached)
- Operations per second for each scenario

## Profiling Your Application

To identify performance bottlenecks:

### Node.js Profiling

```bash
# Generate V8 profile
node --prof your-app.js
node --prof-process isolate-*.log > processed.txt
```

### Chrome DevTools

```bash
# Start with inspector
node --inspect your-app.js
# Open chrome://inspect in Chrome
```

### Clinic.js

```bash
npm install -g clinic
clinic doctor -- node your-app.js
```

## Internal Optimizations

`formatr` implements several internal optimizations:

### 1. Filter Pre-Resolution

Filters are resolved to function references at compile time:

```typescript
// At compile time: resolve "upper" -> function reference
// At render time: call function directly (no lookup)
```

### 2. Static Text Merging

Consecutive text nodes are merged during compilation:

```typescript
// Input: "Hello " + "World " + "{name}"
// Compiled: ["Hello World ", placeholder]
```

### 3. Key String Pre-computation

Error message key strings are computed at compile time:

```typescript
// Pre-computed: "user.profile.name"
// Not computed at render time
```

### 4. Static Template Fast Path

Templates with no placeholders return immediately:

```typescript
// Compiled to: () => "Hello World!"
// No fragment array, no loop
```

## Contributing Performance Improvements

When contributing performance optimizations:

1. **Add benchmarks** for the specific scenario
2. **Measure before and after** with `pnpm bench`
3. **Document trade-offs** (memory vs speed, complexity vs performance)
4. **Ensure all tests pass** - optimizations must not break functionality

## Further Reading

- [V8 Blog](https://v8.dev/blog) - JavaScript engine internals
- [MDN Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) - Internationalization API
- [Node.js Profiling](https://nodejs.org/en/docs/guides/simple-profiling/) - Official profiling guide
