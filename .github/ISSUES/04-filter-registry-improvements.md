# Default Filter Registry Improvements

## Description

Clarify and standardize the behavior of all built-in filters when they receive invalid or unexpected input types. Currently, some filters handle edge cases inconsistently, which can lead to confusing errors or unexpected output.

This issue focuses on:
- **Consistent error behavior**: Decide whether filters should throw errors, return fallback values, or coerce types when given invalid input.
- **Input validation**: Ensure all filters validate their inputs and handle edge cases gracefully.
- **Documentation**: Document the expected input types and behavior for each filter.
- **Error messages**: Provide clear, actionable error messages when filters receive invalid arguments or input.

Improving filter behavior is essential for:
- **Developer experience**: Predictable, well-documented behavior reduces confusion and debugging time.
- **Robustness**: Templates should handle edge cases gracefully rather than crashing unexpectedly.
- **Editor tooling**: Clear error messages and consistent behavior make it easier to integrate `formatr` with editors and linters.
- **Onboarding**: New users can learn the filter system more easily when behavior is consistent and documented.

This feature fits naturally into the existing `formatr` architecture:
- All filters are defined in `src/filters/` and registered in `builtinFilters`.
- The `analyze()` function already validates filter arguments for some filters.
- By standardizing filter behavior, we can extend `analyze()` to detect more issues at analysis time.

### Example Usage

**Current behavior (inconsistent):**
```typescript
import { template } from "@timur_manjosov/formatr";

// upper filter on non-string
const t1 = template<{ value: number }>("Result: {value|upper}");
console.log(t1({ value: 42 }));
// → "Result: 42" (converts to string, then uppercase: "42")

// number filter on non-number
const t2 = template<{ value: string }>("Price: {value|number}");
console.log(t2({ value: "not a number" }));
// → "Price: NaN" or throws? (inconsistent behavior)

// plural filter with missing args
const t3 = template<{ count: number }>("Items: {count|plural}");
console.log(t3({ count: 5 }));
// → Throws at runtime: "plural filter requires two args"
```

**After standardization:**
```typescript
import { template } from "@timur_manjosov/formatr";

// All text filters coerce to string
const t1 = template<{ value: number }>("Result: {value|upper}");
console.log(t1({ value: 42 }));
// → "Result: 42" (documented behavior: coerce to string, then uppercase)

// Number filters return the input as-is if not a number (or throw in strict mode)
const t2 = template<{ value: string }>("Price: {value|number}");
console.log(t2({ value: "not a number" }));
// → "Price: not a number" (documented fallback) or throws with clear message

// Argument errors are caught at analysis time
import { analyze } from "@timur_manjosov/formatr";
const report = analyze("{count|plural}");
console.log(report.messages);
// → [{ code: "bad-args", message: 'Filter "plural" requires exactly 2 arguments: singular, plural' }]
```

## Requirements

### Text Filters (`upper`, `lower`, `trim`)
- [ ] **Input coercion**: Always coerce input to string using `String(value)`.
- [ ] **Behavior**: Apply transformation to the coerced string.
- [ ] **Return**: Always return a string.
- [ ] **Edge cases**: Handle `null`, `undefined`, `NaN`, objects, arrays gracefully (coerce to string).

### Plural Filter (`plural`)
- [ ] **Input validation**: Check that the first argument is a finite number.
- [ ] **Argument validation**: Ensure exactly 2 arguments are provided (singular, plural).
- [ ] **Behavior**: Return singular form if `value === 1`, otherwise return plural form.
- [ ] **Error handling**: Throw a clear error if arguments are missing at runtime.
- [ ] **Analysis-time check**: `analyze()` should catch missing arguments (already implemented, but verify).

### Number Filters (`number`, `percent`)
- [ ] **Input validation**: Check that the input is a finite number.
- [ ] **Fallback behavior**: If input is not a number, return the input as-is (after converting to string) or throw an error (configurable via an option).
- [ ] **Locale support**: Use the provided `locale` option for formatting.
- [ ] **Edge cases**: Handle `NaN`, `Infinity`, `null`, `undefined`, non-numeric strings.

### Currency Filter (`currency`)
- [ ] **Input validation**: Check that the input is a finite number.
- [ ] **Argument validation**: Ensure at least 1 argument (currency code) is provided.
- [ ] **Fallback behavior**: If input is not a number, return the input as-is or throw.
- [ ] **Locale support**: Use the provided `locale` option for formatting.
- [ ] **Edge cases**: Handle invalid currency codes gracefully (let `Intl.NumberFormat` throw a clear error).

### Date Filter (`date`)
- [ ] **Input validation**: Check that the input is a valid Date object, timestamp, or ISO string.
- [ ] **Argument validation**: Ensure at least 1 argument (style: short, medium, long, full) is provided.
- [ ] **Fallback behavior**: If input is not a valid date, return the input as-is or throw.
- [ ] **Locale support**: Use the provided `locale` option for formatting.
- [ ] **Edge cases**: Handle invalid dates (e.g., `new Date("invalid")`) gracefully.

### General Requirements
- [ ] **Consistent error messages**: All filters should use a consistent error message format.
- [ ] **Analysis-time validation**: Extend `analyze()` to check argument counts for all filters.
- [ ] **Runtime validation**: All filters should validate inputs at runtime and provide clear error messages.
- [ ] **Documentation**: Document the expected input types, arguments, and behavior for each filter in the README and in JSDoc comments.

### Configuration Options (Optional)
- [ ] Consider adding a `strictFilters: boolean` option to control whether filters throw errors or return fallback values for invalid input.
- [ ] Example: `strictFilters: true` → filters throw errors; `strictFilters: false` → filters return fallback values.

### Backwards Compatibility
- [ ] Existing templates should continue to work as before (unless they rely on undocumented edge-case behavior).
- [ ] If behavior changes, document the changes in a migration guide.
- [ ] Consider adding deprecation warnings for filters that will change behavior in a future major version.

## Acceptance Criteria

### Implementation
- [ ] All text filters (`upper`, `lower`, `trim`) coerce input to string and handle edge cases.
- [ ] All number filters (`number`, `percent`, `currency`) validate input and provide clear fallback behavior.
- [ ] All filters validate arguments and throw clear errors if arguments are missing or invalid.
- [ ] All filters are documented with JSDoc comments describing input types, arguments, and behavior.

### Testing
- [ ] Unit tests for text filters with edge cases:
  - `upper(null)`, `upper(undefined)`, `upper(42)`, `upper({ obj: true })`, `upper([1, 2, 3])`
- [ ] Unit tests for `plural` filter with edge cases:
  - `plural(NaN)`, `plural(Infinity)`, `plural("not a number")`
  - Missing arguments, extra arguments
- [ ] Unit tests for number filters with edge cases:
  - `number(null)`, `number(undefined)`, `number("123")`, `number("not a number")`
- [ ] Unit tests for `currency` filter with edge cases:
  - Invalid currency code, missing currency code
- [ ] Unit tests for `date` filter with edge cases:
  - Invalid date, missing style argument, non-Date input

### Documentation
- [ ] Update README with a "Filter Behavior" section explaining:
  - How filters handle invalid input types.
  - What happens when arguments are missing or invalid.
  - How to use the `strictFilters` option (if implemented).
- [ ] Add a table documenting each filter's expected input type, arguments, and return type.
- [ ] Add JSDoc comments to all filter functions in `src/filters/`.

### Integration
- [ ] Ensure that `analyze()` checks argument counts for all filters (not just `plural` and `currency`).
- [ ] Extend `analyze()` to emit warnings for type mismatches (see issue #2).

### Performance
- [ ] Filter behavior changes should not introduce performance regressions.

### Developer Experience
- [ ] Error messages are clear and include the filter name and expected input/arguments.
- [ ] Filters behave predictably and consistently.
- [ ] Documentation is comprehensive and easy to understand.

## Implementation Ideas

### Approach 1: Standardize Text Filters

Update `src/filters/text.ts`:

```typescript
/**
 * Converts value to uppercase.
 * @param v - Any value (will be coerced to string)
 * @returns Uppercase string
 */
export const upper: Filter = (v) => {
  return String(v).toUpperCase();
};

/**
 * Converts value to lowercase.
 * @param v - Any value (will be coerced to string)
 * @returns Lowercase string
 */
export const lower: Filter = (v) => {
  return String(v).toLowerCase();
};

/**
 * Trims leading and trailing whitespace.
 * @param v - Any value (will be coerced to string)
 * @returns Trimmed string
 */
export const trim: Filter = (v) => {
  return String(v).trim();
};
```

### Approach 2: Add Input Validation for Number Filters

Update `src/filters/intl.ts`:

```typescript
export function makeIntlFilters(locale?: string): Record<string, Filter> {
  const loc = locale ?? "en";

  const number: Filter = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) {
      // Option 1: Return as-is
      return String(v);
      
      // Option 2: Throw error
      // throw new Error(`Filter "number" expects a finite number, got: ${typeof v}`);
    }
    return new Intl.NumberFormat(loc).format(n);
  };

  const currency: Filter = (v, code?: string) => {
    if (!code) {
      throw new Error('Filter "currency" requires a currency code (e.g., USD, EUR)');
    }
    const n = Number(v);
    if (!Number.isFinite(n)) {
      return String(v); // or throw
    }
    return new Intl.NumberFormat(loc, { style: "currency", currency: code }).format(n);
  };

  // ... other filters ...
}
```

### Approach 3: Extend `analyze()` for All Filters

Update `src/core/analyze.ts`:

```typescript
const filterArgumentRules: Record<string, { min: number; max?: number; message: string }> = {
  plural: { min: 2, max: 2, message: 'Filter "plural" requires exactly 2 arguments: singular, plural' },
  currency: { min: 1, max: 1, message: 'Filter "currency" requires 1 argument: currency code (e.g., USD)' },
  date: { min: 1, max: 1, message: 'Filter "date" requires 1 argument: style (short, medium, long, full)' },
  slice: { min: 1, max: 2, message: 'Filter "slice" requires 1 or 2 arguments: start, end?' },
  pad: { min: 1, max: 3, message: 'Filter "pad" requires 1 to 3 arguments: length, direction?, char?' },
  truncate: { min: 1, max: 2, message: 'Filter "truncate" requires 1 or 2 arguments: length, ellipsis?' },
  replace: { min: 2, max: 2, message: 'Filter "replace" requires 2 arguments: from, to' },
};

for (const f of node.filters) {
  const rule = filterArgumentRules[f.name];
  if (rule) {
    if (f.args.length < rule.min || (rule.max !== undefined && f.args.length > rule.max)) {
      messages.push({
        code: 'bad-args',
        message: rule.message,
        ...atPos(source, f.range.start, lineStarts),
        data: { filter: f.name, expected: rule.min, got: f.args.length },
      });
    }
  }
}
```

### Approach 4: Add `strictFilters` Option (Optional)

```typescript
export interface TemplateOptions {
  // ... existing options ...
  strictFilters?: boolean; // If true, filters throw on invalid input
}

// Pass strictFilters to each filter if needed, or wrap filters to enforce strict behavior
```

### Potential Pitfalls
- **Breaking changes**: Changing filter behavior (e.g., from throwing to returning fallback) could break existing templates. Mitigate this with careful documentation and a major version bump.
- **Performance**: Adding input validation to every filter call could introduce overhead; ensure checks are minimal and fast.
- **Intl errors**: `Intl.NumberFormat` and `Intl.DateTimeFormat` can throw errors for invalid currency codes or locales; decide whether to catch these or let them propagate.

## Additional Notes

- **Related issues**:
  - Issue #1 (Text filters) will add new filters that should follow these standards.
  - Issue #2 (Extended diagnostics) will add type mismatch warnings that rely on predictable filter behavior.
- **Future extensions**:
  - Add a `filters.validate()` function that validates all filter inputs and arguments without applying the transformation.
  - Add a `filters.coerce()` function that attempts to coerce inputs to the expected type.
  - Add a plugin system for custom validation rules.
- **Community feedback**: Gather user feedback on error-handling strategies (throw vs. fallback) and document the chosen approach clearly.

---
