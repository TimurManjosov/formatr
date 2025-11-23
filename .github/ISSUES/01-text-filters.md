# Add Text Filters: slice, pad, truncate, and replace

## Description

Add four new text manipulation filters to `formatr` to provide users with more fine-grained control over string formatting:

- **`slice:start,end?`** – Extract a substring from a string, similar to JavaScript's `String.prototype.slice()`.
- **`pad:length[,direction][,char]`** – Pad a string to a specified length with optional direction (left/right/both) and padding character.
- **`truncate:length[,ellipsis]`** – Shorten long strings to a maximum length, optionally appending an ellipsis or custom suffix.
- **`replace:from,to`** – Perform simple string replacement (first occurrence or all occurrences).

These filters are essential for real-world formatting scenarios:
- **slice**: Extracting date parts, IDs, or preview text from larger strings.
- **pad**: Formatting fixed-width columns in CLI logs, aligning numbers or codes.
- **truncate**: Displaying previews of long user-generated content (comments, descriptions) without breaking layouts.
- **replace**: Simple text sanitization or character substitution in templates.

These filters fit naturally into the existing `formatr` architecture:
- They are pure text transformations that take the placeholder value and optional arguments.
- They integrate seamlessly with the existing filter registry in `src/filters/text.ts`.
- The parser already supports filter arguments (colon-separated), so no parser changes are needed.
- The `analyze()` function can validate argument counts and provide helpful error messages.

### Example Usage

```typescript
import { template } from "@timur_manjosov/formatr";

// slice
const extractId = template<{ userId: string }>(
  "ID: {userId|slice:0,8}"
);
console.log(extractId({ userId: "abc123def456ghi789" }));
// → "ID: abc123de"

// pad
const logLine = template<{ level: string; message: string }>(
  "[{level|pad:5}] {message}"
);
console.log(logLine({ level: "INFO", message: "Server started" }));
// → "[INFO ] Server started"

// truncate
const preview = template<{ comment: string }>(
  "Comment: {comment|truncate:50,...}"
);
console.log(preview({ comment: "This is a very long comment that needs to be truncated for display purposes" }));
// → "Comment: This is a very long comment that needs to be tr..."

// replace
const sanitize = template<{ text: string }>(
  "{text|replace:@,at}"
);
console.log(sanitize({ text: "user@example.com" }));
// → "useratexample.com"
```

## Requirements

### `slice:start,end?`
- Accept 1 or 2 arguments: `start` (required), `end` (optional).
- Parse arguments as integers (allow negative indices like JavaScript `slice`).
- If `end` is omitted, slice to the end of the string.
- Return empty string if the value is not a string or the indices are out of valid range.
- **Edge cases**: Handle negative indices, start > end, non-numeric arguments gracefully.

### `pad:length[,direction][,char]`
- Accept 1 to 3 arguments: `length` (required), `direction` (optional, default `"right"`), `char` (optional, default `" "`).
- `direction` can be `"left"`, `"right"`, or `"both"` (or `"center"`).
- `char` must be a single character; if longer, use only the first character.
- If the string is already longer than or equal to `length`, return it unchanged.
- Pad evenly on both sides for `"both"` direction (if uneven, favor left or right consistently).
- **Edge cases**: Non-numeric length, invalid direction, empty char.

### `truncate:length[,ellipsis]`
- Accept 1 or 2 arguments: `length` (required), `ellipsis` (optional, default `"..."`).
- If the string length is <= `length`, return it unchanged.
- Otherwise, truncate to `length` and append the ellipsis (ellipsis counts toward the total length).
- **Edge cases**: Ensure the truncated result (including ellipsis) does not exceed `length`. If `length` is very small, handle gracefully.

### `replace:from,to`
- Accept 2 arguments: `from` (substring to find), `to` (replacement string).
- Replace **all occurrences** of `from` with `to` (not just the first).
- If `from` is not found, return the original string unchanged.
- **Edge cases**: Empty `from`, empty `to`, special characters in `from`.

### General Requirements
- All filters must return strings.
- All filters must handle non-string input gracefully (convert to string with `String(value)`).
- All filters must be added to `src/filters/text.ts` and exported from `src/filters/index.ts`.
- All filters must have corresponding type definitions as `Filter` type.
- All filters must be registered in the `builtinFilters` map.

### Backwards Compatibility
- These are new filters, so there are no breaking changes.
- Existing templates will continue to work unchanged.

## Acceptance Criteria

### Implementation
- [ ] `slice`, `pad`, `truncate`, and `replace` filters are implemented in `src/filters/text.ts`.
- [ ] All four filters are exported from `src/filters/index.ts`.
- [ ] All four filters are added to the `builtinFilters` registry.

### Testing
- [ ] Unit tests for `slice` covering:
  - Basic slicing (positive indices)
  - Negative indices
  - Omitted `end` argument
  - Out-of-range indices
  - Non-string input
- [ ] Unit tests for `pad` covering:
  - Left, right, and both (center) padding
  - Custom padding character
  - String already at or exceeding target length
  - Non-numeric length
  - Invalid direction
- [ ] Unit tests for `truncate` covering:
  - Strings shorter than length (no truncation)
  - Strings longer than length (with default and custom ellipsis)
  - Very small length values
  - Non-string input
- [ ] Unit tests for `replace` covering:
  - Single occurrence replacement
  - Multiple occurrence replacement
  - Non-existent `from` substring
  - Empty `from` or `to`
  - Non-string input

### Documentation
- [ ] Update README.md to document all four new filters in the "Built-in Filters" table.
- [ ] Include example usage for each filter in the README.

### Integration
- [ ] Run `analyze()` on templates using these filters to ensure no false-positive errors.
- [ ] Ensure filters work with chaining (e.g., `{text|trim|slice:0,10|upper}`).

### Performance
- [ ] No significant performance regression in existing benchmarks.

### Developer Experience
- [ ] Error messages for invalid arguments are clear and actionable.
- [ ] TypeScript typings are correct and do not introduce any `any` types.

## Implementation Ideas

### Approach 1: Implement in `src/filters/text.ts`

Add the four filters alongside existing text filters (`upper`, `lower`, `trim`, `plural`):

```typescript
export const slice: Filter = (v, start?: string, end?: string) => {
  const str = String(v);
  const startIdx = start != null ? parseInt(start, 10) : 0;
  const endIdx = end != null ? parseInt(end, 10) : undefined;
  return str.slice(startIdx, endIdx);
};

export const pad: Filter = (v, length?: string, direction = "right", char = " ") => {
  const str = String(v);
  const len = length != null ? parseInt(length, 10) : 0;
  if (str.length >= len) return str;
  const padChar = char.charAt(0) || " ";
  const padSize = len - str.length;
  
  if (direction === "left") {
    return padChar.repeat(padSize) + str;
  } else if (direction === "both" || direction === "center") {
    const leftPad = Math.floor(padSize / 2);
    const rightPad = padSize - leftPad;
    return padChar.repeat(leftPad) + str + padChar.repeat(rightPad);
  } else {
    // default: right
    return str + padChar.repeat(padSize);
  }
};

export const truncate: Filter = (v, length?: string, ellipsis = "...") => {
  const str = String(v);
  const maxLen = length != null ? parseInt(length, 10) : str.length;
  if (str.length <= maxLen) return str;
  const truncatedLength = Math.max(0, maxLen - ellipsis.length);
  return str.slice(0, truncatedLength) + ellipsis;
};

export const replace: Filter = (v, from?: string, to = "") => {
  const str = String(v);
  if (from == null || from === "") return str;
  return str.split(from).join(to);
};
```

### Approach 2: Add argument validation in `analyze()`

Extend `src/core/analyze.ts` to check argument counts for these new filters:

```typescript
if (f.name === 'slice' && (f.args.length < 1 || f.args.length > 2)) {
  messages.push({
    code: 'bad-args',
    message: `Filter "slice" requires 1 or 2 args: start, end?`,
    ...atPos(source, f.range.start, lineStarts),
    data: { filter: f.name, got: f.args.length },
  });
}
// Similar checks for pad, truncate, replace...
```

### Potential Pitfalls
- **Argument parsing**: Ensure arguments are parsed correctly (integers for indices, strings for chars).
- **Edge cases**: Handle non-finite numbers, empty strings, and out-of-bounds indices gracefully.
- **Unicode**: Be aware of multi-byte characters; `slice` and `truncate` work on UTF-16 code units, which may split surrogate pairs.
- **Performance**: Avoid unnecessary string allocations in hot paths; use efficient string building techniques.

## Additional Notes

- **Related issues**: This issue is part of the SHORT-TERM FEATURES (v0.3–v0.4) roadmap.
- **Future extensions**:
  - Consider adding a `replaceRegex` filter for regex-based replacements (but keep `replace` simple for now).
  - Consider adding a `split` filter that returns an array (would require rethinking filter return types).
  - Consider adding `padStart` and `padEnd` as aliases for `pad:length,left` and `pad:length,right`.
- **Community feedback**: Gather user feedback on argument naming and default behavior after initial release.

---
