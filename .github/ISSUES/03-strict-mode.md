# Add Strict Mode for Placeholders

## Description

Introduce a **strict mode** option that ensures all placeholders used in a template are either:
1. Present in the provided context when rendering, or
2. Reported as errors during static analysis with `analyze()`.

Currently, `formatr` has an `onMissing` option that controls runtime behavior when a key is missing (`"error"`, `"keep"`, or a custom function). However, there's no way to enforce at **analysis time** (before rendering) that all placeholders must be defined.

Strict mode is valuable for:
- **Type-safe templates**: Catch missing keys at compile/build time rather than at runtime.
- **CI/CD validation**: Ensure all templates are complete before deployment.
- **Editor tooling**: Show errors for undefined placeholders as developers write templates.
- **i18n workflows**: Validate that all translation keys exist in the message catalog.

This feature fits naturally into the existing `formatr` architecture:
- The `analyze()` function already checks for unknown filters and bad arguments.
- By extending `analyze()` to accept a `context` parameter, we can check for missing keys.
- The `template()` function can accept a `strictKeys` or `mode` option to enable strict checking at analysis time.

### Example Usage

**Without strict mode (current behavior):**
```typescript
import { template } from "@timur_manjosov/formatr";

const t = template<{ name: string }>(
  "Hello {name}, you have {count} messages",
  { onMissing: "error" }
);

// Runtime error when rendering:
t({ name: "Alice" }); // Throws: Missing key "count"
```

**With strict mode:**
```typescript
import { template, analyze } from "@timur_manjosov/formatr";

// Approach 1: Strict validation at analysis time
const source = "Hello {name}, you have {count} messages";
const report = analyze(source, {
  context: { name: "Alice" }, // Missing "count"
  strictKeys: true
});

console.log(report.messages);
// [
//   {
//     code: "missing-key",
//     message: 'Missing key "count" in context',
//     severity: "error",
//     range: { start: { line: 0, column: 27 }, end: { line: 0, column: 34 } },
//     data: { path: ["count"] }
//   }
// ]

// Approach 2: Strict mode as a template option
const t = template<{ name: string; count: number }>(
  "Hello {name}, you have {count} messages",
  {
    strictKeys: true,
    onMissing: "error"
  }
);

// Type error at compile time: context must have both "name" and "count"
t({ name: "Alice" }); // TypeScript error: Property 'count' is missing
```

## Requirements

### Option Design
- [ ] Add a `strictKeys: boolean` option to `TemplateOptions` (default: `false`).
- [ ] Alternatively, add a `mode: "loose" | "strict"` option (where `"strict"` implies `strictKeys: true` and `onMissing: "error"`).
- [ ] When `strictKeys` is enabled, the template function should validate keys at **render time** if the context is incomplete.
- [ ] When `strictKeys` is enabled and a `context` is provided to `analyze()`, emit diagnostics for missing keys.

### Analysis-Time Validation
- [ ] Extend `AnalyzeOptions` to include `strictKeys: boolean` and `context?: unknown`.
- [ ] When both `strictKeys: true` and `context` are provided, traverse all placeholders in the AST and check if each path can be resolved in the context.
- [ ] Emit a `"missing-key"` diagnostic for each placeholder that cannot be resolved.
- [ ] Use the placeholder's `range` to provide accurate position information.

### Runtime Validation
- [ ] When `strictKeys: true`, the template function should check for missing keys at render time and throw an error if any are missing (similar to `onMissing: "error"`).
- [ ] Provide a clear error message that includes the missing key path.

### Dot-Path Support
- [ ] Strict mode must work with dot-paths (e.g., `{user.address.city}`).
- [ ] If any segment in a dot-path is `undefined` or `null`, report it as a missing key.
- [ ] Example: `{user.address.city}` should report `"user.address"` as missing if `context.user.address` is `undefined`.

### TypeScript Integration
- [ ] The `template<T>()` function already enforces that the context type `T` matches the placeholders at compile time.
- [ ] When `strictKeys: true`, consider adding stricter type checks (e.g., disallow optional properties in `T` for keys used in the template).
- [ ] However, this may be difficult to implement without advanced TypeScript features; focus on runtime and analysis-time checks first.

### Backwards Compatibility
- [ ] `strictKeys` defaults to `false`, so existing code is unaffected.
- [ ] The `onMissing` option continues to work as before when `strictKeys` is not enabled.
- [ ] `strictKeys` can coexist with `onMissing`: if both are set, `strictKeys` takes precedence for error behavior.

## Acceptance Criteria

### Implementation
- [ ] Add `strictKeys: boolean` option to `TemplateOptions` and `AnalyzeOptions`.
- [ ] Implement runtime strict key checking in the `template()` render function.
- [ ] Implement analysis-time strict key checking in `analyze()` when `context` is provided.
- [ ] Emit `"missing-key"` diagnostics with accurate ranges and metadata.

### Testing
- [ ] Unit tests for strict mode at render time:
  - Test that missing keys throw an error when `strictKeys: true`.
  - Test that all keys present works correctly.
  - Test that dot-paths are validated correctly.
  - Test that `strictKeys` takes precedence over `onMissing`.
- [ ] Unit tests for strict mode at analysis time:
  - Test `analyze()` with `strictKeys: true` and a partial context.
  - Test that missing keys are reported as `"missing-key"` diagnostics.
  - Test that nested paths are validated correctly.
  - Test that all keys present produces no diagnostics.
- [ ] Unit tests for edge cases:
  - Context with `null` or `undefined` values.
  - Context with extra keys not used in the template (should not error).
  - Empty template.
  - Template with no placeholders.

### Documentation
- [ ] Update README to document the `strictKeys` option.
- [ ] Add examples of using strict mode for build-time validation.
- [ ] Explain how strict mode interacts with `onMissing`.
- [ ] Add a section on using `analyze()` with `context` for strict validation.

### Integration
- [ ] Ensure strict mode works with all existing filters.
- [ ] Ensure strict mode works with custom filters.
- [ ] Ensure strict mode works with internationalization filters.

### Performance
- [ ] Strict key checking should have minimal performance impact at render time.
- [ ] Analysis-time checking may be slower due to context traversal, but should still be fast for typical templates.

### Developer Experience
- [ ] Error messages for missing keys are clear and include the full path (e.g., `"Missing key \"user.address.city\""`).
- [ ] Diagnostics include accurate position information for editor integrations.
- [ ] TypeScript types for `template<T>()` provide compile-time safety (where possible).

## Implementation Ideas

### Approach 1: Add `strictKeys` Option

Update `src/api.ts`:

```typescript
export interface TemplateOptions {
  locale?: string;
  onMissing?: "error" | "keep" | ((key: string) => string);
  filters?: Record<string, Filter>;
  cacheSize?: number;
  strictKeys?: boolean; // NEW
}
```

### Approach 2: Runtime Validation

In the compiled render function, add a check before resolving each path:

```typescript
function compileTemplate(ast: TemplateAST, options: TemplateOptions): RenderFunction {
  const strictKeys = options.strictKeys ?? false;
  
  // ... existing code ...
  
  return (ctx: unknown) => {
    let result = "";
    for (const node of ast.nodes) {
      if (node.kind === "Placeholder") {
        let value = resolvePath(ctx, node.path);
        
        if (strictKeys && value === undefined) {
          throw new Error(`Missing key "${node.path.join(".")}" in context`);
        }
        
        // ... apply filters, etc ...
      }
    }
    return result;
  };
}
```

### Approach 3: Analysis-Time Validation

Update `src/core/analyze.ts`:

```typescript
export interface AnalyzeOptions {
  locale?: string;
  filters?: Record<string, Filter>;
  context?: unknown; // NEW
  strictKeys?: boolean; // NEW
}

export function analyze(source: string, options: AnalyzeOptions = {}): AnalysisReport {
  // ... existing code ...
  
  if (options.strictKeys && options.context !== undefined) {
    for (const node of ast.nodes) {
      if (node.kind === "Placeholder") {
        const value = resolvePath(options.context, node.path);
        if (value === undefined) {
          messages.push({
            code: "missing-key",
            message: `Missing key "${node.path.join(".")}" in context`,
            severity: "error",
            range: astRangeToRange(source, node.range, lineStarts),
            data: { path: node.path },
          });
        }
      }
    }
  }
  
  return { messages };
}
```

### Approach 4: Path Resolution

Reuse or enhance the existing `resolvePath()` utility:

```typescript
function resolvePath(obj: unknown, path: string[]): unknown {
  let current: any = obj;
  for (const segment of path) {
    if (current == null) return undefined;
    current = current[segment];
  }
  return current;
}
```

### Potential Pitfalls
- **Null vs. undefined**: Decide whether `null` values should be treated as "missing" or as valid values. Recommendation: treat both `null` and `undefined` as missing in strict mode.
- **Performance**: Validating every key at render time could be slow for large contexts; consider caching validation results.
- **False positives**: If a context has dynamic keys (e.g., from a Proxy or custom getter), strict mode may report false positives. Document this limitation.
- **Type complexity**: Enforcing strict keys at the TypeScript type level is complex and may not be feasible without advanced type gymnastics.

## Additional Notes

- **Related issues**:
  - Issue #2 (Extended diagnostics) provides the foundation for `missing-key` diagnostics.
  - Issue #4 (Default filter registry improvements) should ensure filters handle `undefined` gracefully when strict mode is disabled.
- **Future extensions**:
  - Add a `warnUnusedKeys: boolean` option to warn about context keys that are not used in the template.
  - Support allowlists/denylists for keys (e.g., allow certain keys to be missing even in strict mode).
  - Add a `strictFilters: boolean` option to ensure all filter arguments are provided.
- **Alternative designs**:
  - Instead of `strictKeys`, use `mode: "loose" | "strict"` where strict mode implies `strictKeys: true` and `onMissing: "error"`.
  - Add a separate `validate()` function that returns errors instead of throwing, for use in build scripts.

---
