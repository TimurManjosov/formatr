# Extended Diagnostics for Filters and Placeholders

## Description

Enhance the `analyze()` function to provide more precise and comprehensive diagnostic information for all template issues. Currently, diagnostics report unknown filters and some argument errors, but they lack:

- **Precise position ranges** for all diagnostic messages (currently only filter range is used, not placeholder range).
- **Warnings for suspicious usage patterns** (e.g., using a number-expecting filter on a likely string placeholder).
- **Diagnostics for missing placeholders** (when `onMissing` is set to `"error"` or strict mode is enabled).
- **Richer metadata** in diagnostic messages (e.g., expected vs. actual argument counts, suggestions).

These improvements are critical for building a great developer experience:
- **Editor integrations** (VS Code, IntelliJ) rely on precise positions to underline errors and show inline diagnostics.
- **CI/CD pipelines** benefit from detailed error messages to catch template issues before production.
- **Developers** can identify and fix template problems faster with clear, actionable feedback.

This feature fits naturally into the existing `formatr` architecture:
- The `analyze()` function already uses `src/core/position.ts` utilities (`buildLineStarts`, `indexToLineCol`) to convert byte offsets to line/column positions.
- The AST already includes `range` information for all nodes (text, placeholders, filter calls).
- By leveraging existing AST ranges, we can attach precise positions to every diagnostic.

### Example Usage

**Before (current behavior):**
```typescript
import { analyze } from "@timur_manjosov/formatr";

const report = analyze("{count|plural:one}");
console.log(report.messages);
// [
//   {
//     code: "bad-args",
//     message: 'Filter "plural" requires exactly 2 args: singular, plural',
//     pos: 7,
//     line: 0,
//     column: 7
//   }
// ]
```

**After (enhanced diagnostics):**
```typescript
import { analyze } from "@timur_manjosov/formatr";

const report = analyze("{count|plural:one} {price|number}");
console.log(report.messages);
// [
//   {
//     code: "bad-args",
//     message: 'Filter "plural" requires exactly 2 arguments (e.g. one, other)',
//     range: { start: { line: 0, column: 7 }, end: { line: 0, column: 18 } },
//     severity: "error",
//     data: { filter: "plural", expected: 2, got: 1 }
//   }
// ]

const report2 = analyze("{username|upper|number}");
console.log(report2.messages);
// [
//   {
//     code: "suspicious-filter",
//     message: 'Filter "number" expects a number, but "username" likely produces a string',
//     range: { start: { line: 0, column: 16 }, end: { line: 0, column: 22 } },
//     severity: "warning",
//     data: { filter: "number", placeholder: "username" }
//   }
// ]
```

## Requirements

### Position Ranges
- [ ] Extend the `Diagnostic` interface to include a `range` field with `start` and `end` positions (line/column).
- [ ] Use the existing `range` field from AST nodes (`node.range`, `filterCall.range`) to populate diagnostic ranges.
- [ ] Ensure all existing diagnostics (parse-error, unknown-filter, bad-args) include accurate `range` information.
- [ ] For parse errors, use the error position to create a single-character range or the nearest token range.

### Severity Levels
- [ ] Add a `severity` field to the `Diagnostic` interface: `"error" | "warning" | "info"`.
- [ ] Use `"error"` for syntax errors, unknown filters, and incorrect argument counts.
- [ ] Use `"warning"` for suspicious usage patterns (e.g., type mismatches).
- [ ] Use `"info"` for optional suggestions or hints.

### Suspicious Usage Detection
- [ ] Detect when a filter that expects a number (e.g., `number`, `percent`, `currency`, `plural`) is applied to a placeholder that likely produces a string (e.g., `name`, `title`, `description`).
- [ ] Use heuristics to infer likely types from placeholder names (e.g., `*Name`, `*Id`, `*Title` → string; `*Count`, `*Price`, `*Age` → number).
- [ ] Emit a `"suspicious-filter"` warning with details about the expected type and the placeholder name.

### Missing Placeholder Diagnostics
- [ ] When `onMissing: "error"` is set, emit diagnostics for placeholders that are not present in the provided context (requires passing context to `analyze()`).
- [ ] This will require a new parameter `context?: unknown` in the `analyze()` options.
- [ ] Emit a `"missing-key"` error for each placeholder path that cannot be resolved in the context.

### Enhanced Error Messages
- [ ] Improve error messages for `bad-args`:
  - Include expected vs. actual argument counts.
  - Provide example usage (e.g., `Filter "plural" requires exactly 2 arguments (e.g. one, other)`).
- [ ] Improve error messages for `unknown-filter`:
  - Suggest similar filter names (see issue #9 for full implementation).
  - Provide a link to filter documentation.

### Data Enrichment
- [ ] Add a `data` field to diagnostics with structured metadata:
  - For `bad-args`: `{ filter: string, expected: number | string, got: number }`
  - For `unknown-filter`: `{ filter: string, suggestions?: string[] }`
  - For `suspicious-filter`: `{ filter: string, placeholder: string, expectedType: string }`
  - For `missing-key`: `{ path: string[] }`

### Backwards Compatibility
- [ ] The `Diagnostic` interface can be extended with optional fields to maintain compatibility.
- [ ] Existing code that only checks `code` and `message` will continue to work.
- [ ] Deprecate the `pos`, `line`, `column` fields in favor of `range` (but keep them for now for backwards compatibility).

## Acceptance Criteria

### Implementation
- [ ] `Diagnostic` interface includes `range`, `severity`, and `data` fields.
- [ ] All diagnostics emitted by `analyze()` include accurate `range` information.
- [ ] `analyze()` accepts an optional `context` parameter for missing-key detection.
- [ ] Suspicious usage detection is implemented with reasonable heuristics.
- [ ] Error messages are more descriptive and actionable.

### Testing
- [ ] Unit tests for position ranges:
  - Verify that diagnostics for parse errors include the correct range.
  - Verify that diagnostics for unknown filters include the correct filter range.
  - Verify that diagnostics for bad-args include the correct filter range.
- [ ] Unit tests for suspicious usage detection:
  - Test `{username|number}` → warning.
  - Test `{count|upper}` → warning.
  - Test `{price|currency:USD}` → no warning.
- [ ] Unit tests for missing-key detection:
  - Test with `context` provided and keys missing.
  - Test with nested paths (`user.name` missing).
- [ ] Unit tests for enhanced error messages:
  - Verify that `bad-args` messages include expected/got counts.
  - Verify that `unknown-filter` messages are helpful.

### Documentation
- [ ] Update README to mention enhanced diagnostics and the new `range` field.
- [ ] Add an example of using `analyze()` with `context` for missing-key detection.
- [ ] Document the new `severity` levels and how to interpret them.

### Integration
- [ ] Ensure that existing code using `analyze()` continues to work without modification.
- [ ] Ensure that the `range` field is compatible with LSP (Language Server Protocol) diagnostic format for future VS Code extension.

### Performance
- [ ] `analyze()` should remain fast even with enhanced diagnostics (avoid unnecessary traversals).

### Developer Experience
- [ ] Diagnostic messages are clear, concise, and actionable.
- [ ] Ranges are accurate and can be used to highlight errors in an editor.
- [ ] The `data` field provides structured information for tooling to use.

## Implementation Ideas

### Approach 1: Extend `Diagnostic` Interface

Update `src/core/analyze.ts`:

```typescript
export interface Position {
  line: number;
  column: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export type DiagnosticSeverity = "error" | "warning" | "info";

export interface Diagnostic {
  code: DiagnosticCode;
  message: string;
  severity: DiagnosticSeverity;
  range: Range;
  data?: Record<string, unknown>;
  
  // Deprecated but kept for backwards compatibility
  /** @deprecated Use range instead */
  pos?: number;
  /** @deprecated Use range.start.line instead */
  line?: number;
  /** @deprecated Use range.start.column instead */
  column?: number;
}
```

### Approach 2: Build Range Helper

Add a helper function to convert AST ranges to diagnostic ranges:

```typescript
function astRangeToRange(source: string, astRange: ASTRange, lineStarts: number[]): Range {
  const start = indexToLineCol(source, astRange.start, lineStarts);
  const end = indexToLineCol(source, astRange.end, lineStarts);
  return { start, end };
}
```

### Approach 3: Suspicious Filter Detection

Add heuristics for type inference:

```typescript
function inferPlaceholderType(path: string[]): "string" | "number" | "unknown" {
  const key = path[path.length - 1].toLowerCase();
  if (key.includes("count") || key.includes("price") || key.includes("age") || key.includes("quantity")) {
    return "number";
  }
  if (key.includes("name") || key.includes("title") || key.includes("description") || key.includes("id")) {
    return "string";
  }
  return "unknown";
}

function getFilterExpectedType(filterName: string): "string" | "number" | "date" | "unknown" {
  if (["number", "percent", "currency", "plural"].includes(filterName)) return "number";
  if (["upper", "lower", "trim", "slice", "pad", "truncate", "replace"].includes(filterName)) return "string";
  if (["date"].includes(filterName)) return "date";
  return "unknown";
}
```

### Approach 4: Missing Key Detection

Add optional context parameter:

```typescript
export interface AnalyzeOptions {
  locale?: string;
  filters?: Record<string, Filter>;
  context?: unknown;
  onMissing?: "error" | "keep" | ((key: string) => string);
}

// In analyze():
if (options.context !== undefined && options.onMissing === "error") {
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
```

### Potential Pitfalls
- **Type inference heuristics**: Simple name-based heuristics may produce false positives; consider making this opt-in via an option.
- **Performance**: Traversing the AST multiple times could be slow for large templates; ensure diagnostics are collected in a single pass.
- **Context availability**: In many scenarios, the context is not known at analysis time; make missing-key detection optional and well-documented.
- **Range accuracy**: Ensure that ranges are accurate even for multi-line templates and templates with escaped characters.

## Additional Notes

- **Related issues**:
  - Issue #9 (Diagnostic suggestions for filter names) will build on this issue to add filter name suggestions.
  - Issue #3 (Strict mode for placeholders) will use the missing-key detection implemented here.
- **Future extensions**:
  - Add diagnostics for unused placeholders in the context (keys in context but not used in template).
  - Add diagnostics for deeply nested paths that might be performance concerns.
  - Support for custom diagnostic rules via a plugin system.
- **Editor integration**: The enhanced diagnostics format (with `range` and `severity`) is designed to be compatible with LSP, making it easy to integrate with VS Code and other editors.

---
