<div align="center">

# 📝 formatr

**Elegant, typed string formatting for TypeScript**

A tiny, type‑safe templating engine that combines placeholders, filters, internationalization (i18n), and dot‑path support into a single, familiar syntax. `formatr` lets you compose strings declaratively while catching errors at compile time.

[![npm version](https://img.shields.io/npm/v/@timur_manjosov/formatr.svg?style=flat-square)](https://www.npmjs.com/package/@timur_manjosov/formatr)
[![npm downloads](https://img.shields.io/npm/dm/@timur_manjosov/formatr.svg?style=flat-square)](https://www.npmjs.com/package/@timur_manjosov/formatr)
[![license](https://img.shields.io/github/license/TimurManjosov/formatr.svg?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

[Features](#-features) • [Installation](#-installation) • [Quickstart](#-quickstart) • [API](#-api) • [Contributing](#-contributing)

</div>

---

## 💡 Why formatr?

`formatr` bridges the gap between simple string interpolation and complex templating engines. It provides a lightweight, type-safe solution for formatting strings with sophisticated features like filters, i18n support, and nested object access—all while maintaining excellent TypeScript integration.

**Key Benefits:**

- 🔒 **Type Safety** – Templates are aware of your context shape, catching missing keys at compile time
- 📖 **Readable Templates** – Clean `{placeholder|filter:args}` syntax instead of complex string concatenation
- 🌐 **First-Class i18n** – Built-in filters for numbers, currency, percentages, and dates using the `Intl` API
- 🔧 **Extensible** – Easily write custom filters and integrate them seamlessly
- ⚡ **Zero Runtime Dependencies** – No external dependencies beyond TypeScript standard library
- 🚀 **High Performance** – Internal caching ensures fast repeated renders

---

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quickstart](#-quickstart)
- [API](#-api)
  - [Options](#options)
- [Built-in Filters](#-built-in-filters)
- [Filter Behavior](#-filter-behavior)
- [Custom Filters](#-custom-filters)
- [Dot-Paths](#-dot-paths)
- [Diagnostics](#-diagnostics)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

- 🔒 **Typed Templates** – Type-safe placeholders tied to your context for compile-time error detection
- 🔗 **Chainable Filters** – Transform values inline with composable filters like `|trim|upper`
- 🌐 **Internationalization** – Format numbers, dates, and currencies effortlessly using `Intl` API
- 🗺️ **Dot-Path Navigation** – Safely traverse nested objects with `{user.address.city}` syntax
- 🧩 **Highly Customizable** – Define custom filters and reuse them across all templates
- 🛠️ **Smart Diagnostics** – Detect typos, unknown filters, and argument mismatches during development
- ⚡ **Optimized Performance** – Internal caching ensures repeated renders are lightning-fast
- 📦 **Tiny Bundle Size** – Minimal footprint with no external runtime dependencies

---

## 📦 Installation

Install `formatr` using your preferred package manager:

```bash
# npm
npm install @timur_manjosov/formatr

# pnpm
pnpm add @timur_manjosov/formatr

# yarn
yarn add @timur_manjosov/formatr
```

---

## 🚀 Quickstart

Get started with `formatr` in three simple steps:

### 1️⃣ Import the `template` function

```typescript
import { template } from "@timur_manjosov/formatr";
```

### 2️⃣ Define your template with type safety

```typescript
const greet = template<{ name: string; count: number }>(
  "Hello {name|upper}, you have {count|plural:message,messages}",
  { locale: "en" }
);
```

### 3️⃣ Render with your data

```typescript
console.log(greet({ name: "Lara", count: 1 }));
// → "Hello LARA, you have message"

console.log(greet({ name: "Alex", count: 5 }));
// → "Hello ALEX, you have messages"
```

**What's happening here?**

- `{name|upper}` – The `name` value is piped through the `upper` filter to convert it to uppercase
- `{count|plural:message,messages}` – The `plural` filter selects the appropriate form based on the count value
- `locale: "en"` – Optional locale setting that affects how numeric and date filters format values

### More Examples

**Currency Formatting:**

```typescript
const price = template<{ amount: number }>(
  "Total: {amount|currency:USD}",
  { locale: "en-US" }
);

console.log(price({ amount: 42.99 }));
// → "Total: $42.99"
```

**Nested Object Access:**

```typescript
const userInfo = template<{ user: { profile: { name: string } } }>(
  "Welcome, {user.profile.name|upper}!"
);

console.log(userInfo({ user: { profile: { name: "Alice" } } }));
// → "Welcome, ALICE!"
```

**Chaining Multiple Filters:**

```typescript
const format = template<{ text: string }>(
  "Result: {text|trim|lower|upper}"
);

console.log(format({ text: "  Hello World  " }));
// → "Result: HELLO WORLD"
```

---

## 📘 API

### `template(source, options?): (context) => string`

Compiles a template string into a reusable function that accepts a context object and returns a formatted string.

**Parameters:**

- `source` (string) – The template string containing placeholders and filters
- `options` (object, optional) – Configuration options for the template

**Returns:** A function that takes a context object and returns the formatted string.

#### Options

Configure template behavior with these options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `locale` | `string` | System default | Locale for internationalization filters (e.g., `"en-US"`, `"de-DE"`) |
| `onMissing` | `"error"` \| `"keep"` \| `function` | `"error"` | Behavior when a placeholder key is missing:<br/>• `"error"` – Throws an exception<br/>• `"keep"` – Leaves the placeholder unchanged<br/>• `function` – Custom function returning a fallback string |
| `filters` | `Record<string, Function>` | `{}` | Custom filter functions to extend built-in filters |
| `cacheSize` | `number` | `200` | Maximum number of compiled templates to cache (set to `0` to disable) |

**Example with Options:**

```typescript
const t = template<{ name?: string }>(
  "Hello {name|upper}!",
  {
    locale: "en-US",
    onMissing: (key) => `[Missing: ${key}]`,
    filters: {
      greet: (val: unknown) => `👋 ${val}`
    },
    cacheSize: 100
  }
);
```

---

### `analyze(source, options?): { messages: Diagnostic[] }`

Analyzes a template string and returns diagnostic information about potential issues, including unknown filters, invalid arguments, syntax errors, suspicious usage patterns, and missing placeholders.

**Parameters:**

- `source` (string) – The template string to analyze
- `options` (object, optional) – Analysis configuration:
  - `locale` (string, optional) – Locale for filter resolution
  - `filters` (object, optional) – Custom filters to include in analysis
  - `context` (any, optional) – Context object to validate placeholders against
  - `onMissing` (`"error"` | `"keep"` | function, optional) – Enables missing key detection when set to `"error"` with a `context`

**Returns:** An object containing an array of diagnostic messages with:
- `code` – Diagnostic type (`"parse-error"`, `"unknown-filter"`, `"bad-args"`, `"suspicious-filter"`, `"missing-key"`)
- `message` – Human-readable description
- `severity` – Issue severity (`"error"`, `"warning"`, `"info"`)
- `range` – Precise position with `start` and `end` line/column
- `data` – Structured metadata for tooling

**Example:**

```typescript
import { analyze } from "@timur_manjosov/formatr";

const report = analyze("{count|plural:singular}");

console.log(report.messages);
// [
//   {
//     code: "bad-args",
//     message: 'Filter "plural" requires exactly 2 arguments (e.g. one, other)',
//     severity: "error",
//     range: { start: { line: 1, column: 7 }, end: { line: 1, column: 24 } },
//     data: { filter: "plural", expected: 2, got: 1 }
//   }
// ]
```

**With Context Validation:**

```typescript
const report = analyze("{name} {age}", {
  context: { age: 30 },
  onMissing: "error"
});

// Reports missing "name" key
console.log(report.messages[0]);
// {
//   code: "missing-key",
//   message: 'Missing key "name" in context',
//   severity: "error",
//   ...
// }
```

Integrate `analyze()` into your editor, linter, or build process for early detection of template issues.

---

## 🧰 Built-in Filters

`formatr` includes a comprehensive set of built-in filters for common string transformations and formatting tasks:

| Filter | Syntax | Description | Example |
|--------|--------|-------------|---------|
| `upper` | `{name\|upper}` | Converts text to uppercase | `"hello"` → `"HELLO"` |
| `lower` | `{name\|lower}` | Converts text to lowercase | `"HELLO"` → `"hello"` |
| `trim` | `{name\|trim}` | Removes leading and trailing whitespace | `"  hello  "` → `"hello"` |
| `slice` | `{text\|slice:start,end?}` | Extracts a substring (supports negative indices) | `"hello world"\|slice:0,5` → `"hello"` |
| `pad` | `{text\|pad:length,direction?,char?}` | Pads string to specified length (direction: `left`, `right`, `both`/`center`) | `"hi"\|pad:5` → `"hi   "` |
| `truncate` | `{text\|truncate:length,ellipsis?}` | Truncates string to max length with ellipsis | `"hello world"\|truncate:8` → `"hello..."` |
| `replace` | `{text\|replace:from,to}` | Replaces all occurrences of substring | `"user@example"\|replace:@,at` → `"useratexample"` |
| `plural` | `{count\|plural:singular,plural}` | Selects singular or plural form based on count | `1` → `"item"`, `5` → `"items"` |
| `number` | `{value\|number}` | Formats number using locale settings | `1234.56` → `"1,234.56"` (en-US) |
| `percent` | `{value\|percent}` | Formats as percentage | `0.42` → `"42%"` |
| `currency` | `{value\|currency:USD}` | Formats as currency with specified code | `42.99` → `"$42.99"` (en-US) |
| `date` | `{value\|date:short}` | Formats date with specified style (`short`, `medium`, `long`, `full`) | `new Date()` → `"1/15/2025"` |

### Text Manipulation Examples

The new text filters provide powerful string manipulation capabilities:

```typescript
import { template } from "@timur_manjosov/formatr";

// Extract substring with slice
const extractId = template<{ userId: string }>(
  "ID: {userId|slice:0,8}"
);
console.log(extractId({ userId: "abc123def456ghi789" }));
// → "ID: abc123de"

// Pad strings for fixed-width output
const logLine = template<{ level: string; message: string }>(
  "[{level|pad:5}] {message}"
);
console.log(logLine({ level: "INFO", message: "Server started" }));
// → "[INFO ] Server started"

// Truncate long text with ellipsis
const preview = template<{ comment: string }>(
  "Comment: {comment|truncate:50,...}"
);
console.log(preview({ comment: "This is a very long comment that needs to be truncated for display" }));
// → "Comment: This is a very long comment that needs to be tr..."

// Replace substrings
const sanitize = template<{ text: string }>(
  "{text|replace:@,at}"
);
console.log(sanitize({ text: "user@example.com" }));
// → "useratexample.com"
```

### Filter Chaining

Filters can be chained together to apply multiple transformations:

```typescript
const t = template<{ name: string }>(
  "{name|trim|lower|upper}"
);

console.log(t({ name: "  Alice  " }));
// → "ALICE"
```

---

## 🔧 Filter Behavior

Understanding how filters handle edge cases and invalid inputs is crucial for building robust templates. This section documents the consistent behavior across all built-in filters.

### General Principles

All `formatr` filters follow these principles:

1. **Type Coercion**: Text filters (like `upper`, `lower`, `trim`) coerce inputs to strings using `String(value)`
2. **Graceful Fallback**: Number and date filters return the string representation of invalid inputs instead of throwing errors
3. **Explicit Errors**: Filters throw clear errors only when required arguments are missing
4. **Consistent Behavior**: All filters handle `null`, `undefined`, `NaN`, `Infinity`, objects, and arrays predictably

### Filter Input Types and Behavior

| Filter | Expected Input | Invalid Input Behavior | Example |
|--------|---------------|----------------------|---------|
| **Text Filters** |
| `upper`, `lower`, `trim` | Any value | Coerced to string via `String(value)` | `upper(42)` → `"42"` |
| `slice`, `pad`, `truncate`, `replace` | String-like | Coerced to string, then transformed | `slice(42, '0', '2')` → `"42"` |
| **Plural Filter** |
| `plural` | Finite number | Returns `String(value)` for non-numbers | `plural(NaN)` → `"NaN"` |
| **Number Filters** |
| `number`, `percent` | Finite number | Returns `String(value)` for non-numbers | `number("text")` → `"text"` |
| `currency` | Finite number | Returns `String(value)` for non-numbers | `currency(NaN, "USD")` → `"NaN"` |
| **Date Filter** |
| `date` | Date, timestamp, ISO string | Returns `String(value)` for invalid dates | `date("invalid")` → `"invalid"` |

### Edge Case Examples

#### Text Filters with Non-String Inputs

```typescript
import { template } from "@timur_manjosov/formatr";

// Numbers are converted to strings
const t1 = template('{value|upper}');
console.log(t1({ value: 42 }));
// → "42"

// NaN becomes "NAN"
console.log(t1({ value: NaN }));
// → "NAN"

// Objects use their toString representation
console.log(t1({ value: { key: 'val' } }));
// → "[OBJECT OBJECT]"

// Arrays are joined with commas
console.log(t1({ value: [1, 2, 3] }));
// → "1,2,3"
```

#### Number Filters with Invalid Inputs

```typescript
// Non-numeric strings fall back to their string representation
const t2 = template('{value|number}');
console.log(t2({ value: 'not a number' as any }));
// → "not a number"

// NaN and Infinity are returned as strings
console.log(t2({ value: NaN }));
// → "NaN"

console.log(t2({ value: Infinity }));
// → "Infinity"

// Numeric strings are parsed and formatted
console.log(t2({ value: '123.45' as any }));
// → "123.45" (formatted according to locale)
```

#### Plural Filter Behavior

```typescript
const t3 = template('{count|plural:item,items}');

// Normal usage
console.log(t3({ count: 1 }));
// → "item"

console.log(t3({ count: 5 }));
// → "items"

// Non-finite numbers fall back to string representation
console.log(t3({ count: NaN }));
// → "NaN"

console.log(t3({ count: Infinity }));
// → "Infinity"

// Missing arguments throw explicit errors
try {
  const t4 = template('{count|plural:item}');
  t4({ count: 1 });
} catch (err) {
  console.error(err.message);
  // → "plural filter requires two args: singular, plural"
}
```

#### Currency Filter with Invalid Inputs

```typescript
const t4 = template('{value|currency:USD}');

// Non-numeric values fall back to string representation
console.log(t4({ value: 'not a number' as any }));
// → "not a number"

console.log(t4({ value: NaN }));
// → "NaN"

// Missing currency code throws an error
try {
  const t5 = template('{value|currency}');
  t5({ value: 42 });
} catch (err) {
  console.error(err.message);
  // → "currency filter requires code, e.g., currency:EUR"
}
```

#### Date Filter with Invalid Dates

```typescript
const t5 = template('{value|date:short}');

// Invalid date strings fall back to string representation
console.log(t5({ value: 'not a date' as any }));
// → "not a date"

// Invalid Date objects return "Invalid Date"
console.log(t5({ value: new Date('invalid') }));
// → "Invalid Date"

// Valid dates are formatted according to style
console.log(t5({ value: new Date('2025-10-13') }));
// → "10/13/25" (en-US locale with short style)
```

### Argument Validation

The `analyze()` function validates filter arguments at analysis time, helping catch errors before runtime:

```typescript
import { analyze } from "@timur_manjosov/formatr";

// Missing arguments for plural filter
const report1 = analyze('{count|plural:item}');
console.log(report1.messages[0].message);
// → 'Filter "plural" requires exactly 2 arguments (e.g. one, other)'

// Missing arguments for currency filter
const report2 = analyze('{price|currency}');
console.log(report2.messages[0].message);
// → 'Filter "currency" requires at least 1 argument: currency code (e.g., USD)'

// Missing arguments for date filter
const report3 = analyze('{date|date}');
console.log(report3.messages[0].message);
// → 'Filter "date" requires 1 argument: style (short, medium, long, or full)'
```

### Handling Null and Undefined

**Note:** By default, `null` and `undefined` values in the context trigger the `onMissing` behavior rather than being passed to filters. This is by design to handle missing data gracefully.

```typescript
// null/undefined trigger onMissing by default (onMissing: "keep")
const t1 = template('{value|upper}');
console.log(t1({ value: null }));
// → "{value}" (placeholder kept as-is)

// With onMissing as a function
const t2 = template('{value|upper}', {
  onMissing: (key) => '[missing]'
});
console.log(t2({ value: null }));
// → "[missing]"

// Filters only receive non-null values unless explicitly configured otherwise
// This ensures missing data is handled consistently across your templates
```

To change this behavior and allow filters to process `null` and `undefined` values directly, you would need to customize the `onMissing` handling or ensure values are explicitly set to non-null defaults in your context.

---

## 🧱 Custom Filters

Extend `formatr` with your own filters by defining functions and passing them via the `filters` option.

### Creating a Custom Filter

Filters are simple functions that receive the placeholder value as the first argument, followed by any additional arguments specified in the template.

```typescript
import { template } from "@timur_manjosov/formatr";

const greet = template<{ name: string }>(
  "Hi {name|greet:!}", 
  {
    filters: {
      greet: (value: unknown, punctuation: string = "!") => {
        return `👋 ${String(value)}${punctuation}`;
      }
    }
  }
);

console.log(greet({ name: "Alex" }));
// → "Hi 👋 Alex!"
```

### Advanced Custom Filter Example

```typescript
const formatter = template<{ code: string }>(
  "Code: {code|highlight:javascript}",
  {
    filters: {
      highlight: (value: unknown, language: string) => {
        // Your custom syntax highlighting logic
        return `<code class="language-${language}">${value}</code>`;
      }
    }
  }
);
```

Custom filters have access to:
- The placeholder value (first parameter)
- Any colon-separated arguments (subsequent parameters)
- The ability to return any value (will be converted to string in the output)

---

## 🧭 Dot-Paths

Access nested object properties safely using dot-path notation. If any segment along the path is `undefined` or `null`, the entire expression resolves gracefully according to your `onMissing` configuration.

### Basic Dot-Path Usage

```typescript
import { template } from "@timur_manjosov/formatr";

const t = template<{ user: { address: { city: string } } }>(
  "City: {user.address.city}"
);

console.log(t({ user: { address: { city: "Berlin" } } }));
// → "City: Berlin"
```

### Dot-Paths with Filters

Combine dot-paths with filters for powerful data access and transformation:

```typescript
const t = template<{ user: { profile: { name: string; title: string } } }>(
  "Welcome, {user.profile.title} {user.profile.name|upper}!"
);

console.log(t({
  user: {
    profile: {
      name: "smith",
      title: "Dr."
    }
  }
}));
// → "Welcome, Dr. SMITH!"
```

### Handling Missing Paths

```typescript
const t = template<{ user?: { name?: string } }>(
  "Name: {user.name}",
  { onMissing: () => "[Not provided]" }
);

console.log(t({}));
// → "Name: [Not provided]"
```

Dot-paths eliminate the need for optional chaining in templates while maintaining type safety.

---

## 🔍 Diagnostics

Use the `analyze()` function to detect template issues during development. This helps catch errors early and can be integrated into editors, linters, or CI/CD pipelines.

### Running Diagnostics

```typescript
import { analyze } from "@timur_manjosov/formatr";

const report = analyze("{count|plural:one}");

console.log(report.messages);
// [
//   {
//     code: "bad-args",
//     message: 'Filter "plural" requires exactly 2 arguments (e.g. one, other)',
//     severity: "error",
//     range: { start: { line: 1, column: 7 }, end: { line: 1, column: 18 } },
//     data: { filter: "plural", expected: 2, got: 1 }
//   }
// ]
```

### Diagnostic Features

The enhanced diagnostics provide:

- **Precise Position Ranges** – Exact `start` and `end` locations for each issue
- **Severity Levels** – Distinguish between `"error"`, `"warning"`, and `"info"`
- **Structured Metadata** – Additional details in the `data` field for tooling
- **Suspicious Usage Detection** – Warns about potential type mismatches
- **Missing Key Detection** – Validate placeholders against provided context

### Diagnostic Types

The analyzer can detect:

- **Unknown filters** – References to filters that don't exist
- **Argument mismatches** – Incorrect number of arguments for built-in filters
- **Syntax errors** – Malformed template syntax
- **Suspicious usage** – Type mismatches (e.g., using `number` filter on string placeholders)
- **Missing keys** – Placeholders not found in the provided context (when `onMissing: "error"`)

### Enhanced Examples

**Suspicious Filter Usage:**

```typescript
const report = analyze("{username|number}");
// Warning: Filter "number" expects a number, but "username" likely produces a string

console.log(report.messages[0]);
// {
//   code: "suspicious-filter",
//   message: 'Filter "number" expects a number, but "username" likely produces a string',
//   severity: "warning",
//   range: { start: { line: 1, column: 10 }, end: { line: 1, column: 17 } },
//   data: { filter: "number", placeholder: "username", expectedType: "number" }
// }
```

**Missing Key Detection:**

```typescript
const report = analyze("{name} {age}", { 
  context: { age: 30 }, 
  onMissing: "error" 
});

// Reports missing "name" key
console.log(report.messages[0]);
// {
//   code: "missing-key",
//   message: 'Missing key "name" in context',
//   severity: "error",
//   range: { start: { line: 1, column: 1 }, end: { line: 1, column: 7 } },
//   data: { path: ["name"] }
// }
```

### Integration Examples

**Build Script:**

```typescript
import { analyze } from "@timur_manjosov/formatr";

const templates = [
  "{user.name|upper}",
  "{count|plural:item,items}",
  "{price|currency:USD}"
];

templates.forEach(tmpl => {
  const { messages } = analyze(tmpl);
  const errors = messages.filter(m => m.severity === "error");
  if (errors.length > 0) {
    console.error(`Issues in template "${tmpl}":`, errors);
    process.exit(1);
  }
});
```

**Editor Integration:**

Diagnostics include precise position ranges compatible with LSP (Language Server Protocol), enabling real-time feedback in editors like VS Code:

```typescript
const report = analyze("Line 1\n{foo|nope}\nLine 3");
const diagnostic = report.messages[0];

// Use range for editor highlighting
console.log(`Error at line ${diagnostic.range.start.line}, columns ${diagnostic.range.start.column}-${diagnostic.range.end.column}`);
// → Error at line 2, columns 5-10
```

---

## 🤝 Contributing

Contributions are welcome! Whether you want to report a bug, suggest a feature, or submit a pull request, your help is appreciated.

### How to Contribute

1. **Fork the repository** – Create your own fork of the project
2. **Create a feature branch** – `git checkout -b feature/amazing-feature`
3. **Make your changes** – Implement your feature or fix
4. **Run tests** – Ensure all tests pass with `pnpm test`
5. **Commit your changes** – `git commit -m 'Add some amazing feature'`
6. **Push to your branch** – `git push origin feature/amazing-feature`
7. **Open a Pull Request** – Submit your changes for review

### Development Setup

```bash
# Clone the repository
git clone https://github.com/TimurManjosov/formatr.git
cd formatr

# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests in watch mode
pnpm dev

# Build the project
pnpm build

# Lint the code
pnpm lint

# Format code
pnpm format
```

### Guidelines

- Write clear, concise commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style
- Keep pull requests focused on a single feature or fix

---

## 📝 License

`formatr` is open source software licensed under the [MIT License](LICENSE).

Copyright (c) 2025 Timur Manjosov

---

<div align="center">

**[⬆ Back to Top](#-formatr)**

Made with ❤️ by [Timur Manjosov](https://github.com/TimurManjosov)

If you find this project useful, please consider giving it a ⭐ on [GitHub](https://github.com/TimurManjosov/formatr)!

</div>
