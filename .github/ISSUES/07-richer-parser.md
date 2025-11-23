# Richer Parser for Filter Arguments

## Description

Enhance the parser to support more sophisticated filter argument syntax, enabling users to write more expressive and flexible templates:

- **Quoted arguments**: Allow string arguments to contain commas, colons, and other special characters by wrapping them in quotes (e.g., `{title|truncate:30,"..."}`).
- **Escaped characters**: Support escaping commas, colons, and quotes inside arguments (e.g., `{text|replace:\,,;}`).
- **Simple expressions**: Optionally support basic expressions in arguments (e.g., `{value|add:5}`, `{text|slice:0,length}`), though this is a future consideration.

Currently, the parser uses a simple approach:
- Arguments are separated by commas (`,`).
- Arguments cannot contain commas, colons, or other delimiters.
- This limits the flexibility of filters that need complex arguments.

Enhanced argument parsing is valuable for:
- **Complex filters**: Filters like `replace`, `truncate`, and `split` often need arguments with special characters.
- **User-friendly syntax**: Quoted strings are intuitive and familiar from other templating languages.
- **Backwards compatibility**: Existing templates without quotes will continue to work.
- **Future extensibility**: A richer parser enables future features like nested expressions or function calls.

This feature requires changes to the parser in `src/core/parser.ts`:
- The parser must detect quoted strings and handle them specially.
- The parser must support escape sequences inside quoted strings.
- The AST remains unchanged (arguments are still an array of strings).
- The `analyze()` function and filters do not require changes.

### Example Usage

**Current syntax (limited):**
```typescript
import { template } from "@timur_manjosov/formatr";

// Cannot use commas in arguments
const t1 = template<{ text: string }>(
  "{text|truncate:30,...}"
);
// Error: "..." is parsed as two separate arguments ("." and "..")

// Cannot use colons in arguments
const t2 = template<{ url: string }>(
  "{url|replace:http:,https:}"
);
// Error: "http:" and "https:" are incorrectly parsed
```

**With quoted arguments:**
```typescript
import { template } from "@timur_manjosov/formatr";

// Quotes allow commas in arguments
const t1 = template<{ text: string }>(
  '{text|truncate:30,"..."}'
);
console.log(t1({ text: "This is a very long text that needs to be truncated" }));
// → "This is a very long text th..."

// Quotes allow colons and other special characters
const t2 = template<{ url: string }>(
  '{url|replace:"http:","https:"}'
);
console.log(t2({ url: "http://example.com" }));
// → "https://example.com"

// Escaped quotes inside quoted strings
const t3 = template<{ name: string }>(
  '{name|prepend:"He said, \\"Hello\\""}'
);
console.log(t3({ name: "Alice" }));
// → 'He said, "Hello"Alice'

// Mixed quoted and unquoted arguments
const t4 = template<{ text: string }>(
  '{text|pad:20,left," "}'
);
console.log(t4({ text: "Hello" }));
// → "               Hello"
```

**Backwards compatibility:**
```typescript
// Existing templates without quotes continue to work
const t5 = template<{ count: number }>(
  "{count|plural:item,items}"
);
console.log(t5({ count: 5 }));
// → "items"
```

## Requirements

### Quoted String Support
- [ ] The parser must recognize arguments wrapped in double quotes (`"`) or single quotes (`'`).
- [ ] Quoted arguments can contain any characters, including commas (`,`), colons (`:`), pipes (`|`), and closing braces (`}`).
- [ ] The quotes themselves are not included in the argument value (e.g., `"hello"` → `"hello"`).
- [ ] Both double and single quotes are supported (e.g., `"text"` and `'text'` are equivalent).

### Escape Sequences
- [ ] Inside quoted strings, support escaping special characters:
  - `\"` → `"` (escaped double quote)
  - `\'` → `'` (escaped single quote)
  - `\\` → `\` (escaped backslash)
  - `\,` → `,` (escaped comma, though not needed inside quotes)
  - `\:` → `:` (escaped colon, though not needed inside quotes)
- [ ] Outside quoted strings, no escape sequences are needed (commas and colons are delimiters).

### Backwards Compatibility
- [ ] Unquoted arguments continue to work as before.
- [ ] Existing templates without quotes are not affected.
- [ ] The parser must distinguish between quoted and unquoted arguments correctly.

### Error Handling
- [ ] Unterminated quoted strings should produce a clear parse error (e.g., `{text|truncate:30,"...` → error: "Unterminated string").
- [ ] Invalid escape sequences should produce a clear parse error (e.g., `{text|replace:"\x"}` → error: "Invalid escape sequence").
- [ ] Provide accurate error positions (line/column) for all parse errors.

### AST Changes
- [ ] The AST `FilterCall.args` field remains an array of strings.
- [ ] The parser processes quoted strings and escape sequences, but the compiled arguments are just strings.
- [ ] No changes to the AST structure are needed.

### Analyzer and Compiler
- [ ] The `analyze()` function should handle quoted arguments correctly (no changes needed if the parser produces the same AST structure).
- [ ] The compiler should handle quoted arguments correctly (no changes needed).

### Documentation
- [ ] Update the README to explain quoted argument syntax.
- [ ] Add examples of using quoted arguments in filters.
- [ ] Document supported escape sequences.

## Acceptance Criteria

### Implementation
- [ ] Parser supports double-quoted arguments (`"..."`).
- [ ] Parser supports single-quoted arguments (`'...'`).
- [ ] Parser supports escape sequences inside quoted strings (`\"`, `\'`, `\\`).
- [ ] Parser produces clear error messages for unterminated strings and invalid escape sequences.
- [ ] Unquoted arguments continue to work as before.

### Testing
- [ ] Unit tests for quoted arguments:
  - Double quotes: `{text|filter:"arg"}`
  - Single quotes: `{text|filter:'arg'}`
  - Quotes containing commas: `{text|filter:"a,b,c"}`
  - Quotes containing colons: `{text|filter:"a:b:c"}`
  - Quotes containing pipes: `{text|filter:"a|b"}`
  - Quotes containing braces: `{text|filter:"a}b"}`
- [ ] Unit tests for escape sequences:
  - Escaped double quote: `{text|filter:"He said, \"Hello\""}`
  - Escaped single quote: `{text|filter:'It\'s working'}`
  - Escaped backslash: `{text|filter:"C:\\path\\to\\file"}`
- [ ] Unit tests for mixed quoted and unquoted arguments:
  - `{text|filter:unquoted,"quoted",another}`
- [ ] Unit tests for error cases:
  - Unterminated string: `{text|filter:"hello}`
  - Unmatched quotes: `{text|filter:"hello'}`
  - Invalid escape sequences: `{text|filter:"\x"}`
- [ ] Unit tests for backwards compatibility:
  - Ensure all existing test templates continue to work.

### Documentation
- [ ] README includes a section on "Quoted Filter Arguments" with examples.
- [ ] README includes a section on "Escape Sequences" with a table of supported sequences.
- [ ] Add an example script demonstrating quoted arguments.

### Integration
- [ ] Quoted arguments work with all built-in filters.
- [ ] Quoted arguments work with custom filters.
- [ ] The `analyze()` function handles quoted arguments correctly.

### Performance
- [ ] Parsing quoted arguments should not significantly slow down the parser.

### Developer Experience
- [ ] Error messages for unterminated strings and invalid escapes are clear and helpful.
- [ ] Examples in the documentation make it easy to understand how to use quoted arguments.

## Implementation Ideas

### Approach 1: Extend Parser

Update `src/core/parser.ts` to handle quoted strings:

```typescript
function parseFilterArgs(input: string, start: number): { args: string[]; end: number } {
  const args: string[] = [];
  let pos = start;
  
  while (pos < input.length) {
    // Skip whitespace
    while (pos < input.length && /\s/.test(input[pos])) pos++;
    
    if (input[pos] === '"' || input[pos] === "'") {
      // Parse quoted string
      const quote = input[pos];
      pos++; // Skip opening quote
      let arg = "";
      
      while (pos < input.length && input[pos] !== quote) {
        if (input[pos] === "\\") {
          // Handle escape sequences
          pos++;
          if (pos >= input.length) {
            throw new FormatrError("Unexpected end of input in escape sequence", pos);
          }
          const escaped = input[pos];
          if (escaped === quote || escaped === "\\" || escaped === "," || escaped === ":") {
            arg += escaped;
          } else {
            throw new FormatrError(`Invalid escape sequence: \\${escaped}`, pos);
          }
        } else {
          arg += input[pos];
        }
        pos++;
      }
      
      if (pos >= input.length) {
        throw new FormatrError("Unterminated string", start);
      }
      
      pos++; // Skip closing quote
      args.push(arg);
    } else {
      // Parse unquoted argument (until comma or closing brace)
      let arg = "";
      while (pos < input.length && input[pos] !== "," && input[pos] !== "}") {
        arg += input[pos];
        pos++;
      }
      args.push(arg.trim());
    }
    
    // Check for comma or end
    if (pos < input.length && input[pos] === ",") {
      pos++; // Skip comma
    } else {
      break;
    }
  }
  
  return { args, end: pos };
}
```

### Approach 2: Update Filter Argument Parsing

The current parser likely splits arguments by commas. Update it to respect quotes:

```typescript
function splitArgs(argString: string): string[] {
  const args: string[] = [];
  let current = "";
  let inQuote = false;
  let quoteChar = "";
  
  for (let i = 0; i < argString.length; i++) {
    const char = argString[i];
    
    if (char === "\\" && inQuote) {
      // Escape sequence
      i++;
      if (i < argString.length) {
        current += argString[i];
      }
    } else if ((char === '"' || char === "'") && !inQuote) {
      // Start quote
      inQuote = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuote) {
      // End quote
      inQuote = false;
      quoteChar = "";
    } else if (char === "," && !inQuote) {
      // Delimiter
      args.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  
  if (current || argString.endsWith(",")) {
    args.push(current.trim());
  }
  
  return args;
}
```

### Approach 3: Add Tests

Add comprehensive tests in `test/parser.test.ts` or `test/template.filters.test.ts`:

```typescript
test("quoted arguments with commas", () => {
  const t = template<{ text: string }>'{text|truncate:30,"..."}');
  expect(t({ text: "This is a very long text" })).toBe("This is a very long text");
});

test("quoted arguments with colons", () => {
  const t = template<{ url: string }>('{url|replace:"http:","https:"}');
  expect(t({ url: "http://example.com" })).toBe("https://example.com");
});

test("escaped quotes inside quoted strings", () => {
  const t = template<{ name: string }>('{name|prepend:"He said, \\"Hello\\""}');
  expect(t({ name: "Alice" })).toBe('He said, "Hello"Alice');
});

test("unterminated string error", () => {
  expect(() => template('{text|filter:"hello}')).toThrow("Unterminated string");
});
```

### Potential Pitfalls
- **Complexity**: Quoted string parsing adds complexity to the parser; ensure it's well-tested and maintainable.
- **Performance**: Parsing quoted strings may be slower than splitting by commas; benchmark to ensure acceptable performance.
- **Edge cases**: Handle nested quotes, mixed quote types, and unusual escape sequences correctly.
- **Backwards compatibility**: Ensure that existing templates without quotes continue to work exactly as before.

## Additional Notes

- **Related issues**:
  - Issue #1 (Text filters) will benefit from quoted arguments for filters like `replace` and `truncate`.
  - Issue #8 (Template includes) may require quoted arguments for include paths.
- **Future extensions**:
  - Support nested expressions: `{value|add:(count * 2)}`
  - Support array literals: `{items|join:[", ", " and "]}`
  - Support object literals: `{data|format:{pretty: true}}`
  - Support backtick strings: `` {text|filter:`multi-line string`} ``
- **Alternative designs**:
  - Use a proper expression parser (e.g., ANTLR, PEG.js) for more complex syntax.
  - Use a different delimiter for arguments (e.g., `|filter@arg1@arg2`) to avoid quote complexity.

---
