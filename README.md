<div align="center">

# 📝 formatr

**Elegant, typed string formatting for TypeScript**

A tiny, type‑safe templating engine that combines placeholders, filters, internationalization (i18n), and dot‑path support into a single, familiar syntax. `formatr` lets you compose strings declaratively while catching errors at compile time.

[![npm version](https://img.shields.io/npm/v/@timur_manjosov/formatr.svg?style=flat-square)](https://www.npmjs.com/package/@timur_manjosov/formatr)
[![npm downloads](https://img.shields.io/npm/dm/@timur_manjosov/formatr.svg?style=flat-square)](https://www.npmjs.com/package/@timur_manjosov/formatr)
[![license](https://img.shields.io/github/license/TimurManjosov/formatr.svg?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

[Features](#-features) • [Installation](#-installation) • [Quickstart](#-quickstart) • [API](#-api) • [Contributing](#-contributing)

**[🎮 Try the Interactive Playground →](https://timurmanjosov.github.io/formatr/)**

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
- [Real-World Use Cases](#-real-world-use-cases)
- [API](#-api)
  - [Options](#options)
- [Built-in Filters](#-built-in-filters)
- [Filter Behavior](#-filter-behavior)
- [Custom Filters](#-custom-filters)
- [Async Filters](#-async-filters)
- [Dot-Paths](#-dot-paths)
- [Diagnostics](#-diagnostics)
- [Advanced Topics](#-advanced-topics)
- [Migration Guide](#-migration-guide)
- [FAQ](#-faq)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

- 🔒 **Typed Templates** – Type-safe placeholders tied to your context for compile-time error detection
- 🔗 **Chainable Filters** – Transform values inline with composable filters like `|trim|upper`
- ⚡ **Async Filters** – Fetch data from APIs, databases, or external sources with automatic parallel execution
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

## 🌍 Real-World Use Cases

`formatr` excels at solving common string formatting challenges in production applications. Here are practical examples demonstrating how to use the library in real-world scenarios.

### CLI Logging

Structure your log output with timestamps, log levels, and dynamic data:

```typescript
import { template } from "@timur_manjosov/formatr";

const logTemplate = template<{
  level: string;
  timestamp: Date;
  message: string;
}>(
  "[{timestamp|date:short}] [{level|pad:5}] {message}",
  { locale: "en-US" }
);

console.log(logTemplate({
  level: "INFO",
  timestamp: new Date(),
  message: "Server started on port 3000",
}));
// → "[11/24/25] [INFO ] Server started on port 3000"

console.log(logTemplate({
  level: "ERROR",
  timestamp: new Date(),
  message: "Database connection failed",
}));
// → "[11/24/25] [ERROR] Database connection failed"
```

**See the full example:** [`examples/cli-logging.ts`](examples/cli-logging.ts)

### Email & SMS Templates

Create readable, maintainable templates for transactional messages:

```typescript
const welcomeEmail = template<{
  user: { name: string; email: string };
  verifyUrl: string;
}>(
  `Hi {user.name|upper},

Welcome to our platform! Please verify your email address ({user.email}) by clicking the link below:

{verifyUrl}

Thanks,
The Team`
);

console.log(welcomeEmail({
  user: { name: "Alice", email: "alice@example.com" },
  verifyUrl: "https://example.com/verify/abc123",
}));
// Output:
// Hi ALICE,
// 
// Welcome to our platform! Please verify your email address (alice@example.com)...
```

**See the full example:** [`examples/email-templates.ts`](examples/email-templates.ts)

### Internationalization (i18n)

Build multi-language applications with locale-aware formatting:

```typescript
const messages = {
  en: template<{ name: string; count: number }>(
    "Hello {name}, you have {count|plural:message,messages}",
    { locale: "en-US" }
  ),
  es: template<{ name: string; count: number }>(
    "Hola {name}, tienes {count|plural:mensaje,mensajes}",
    { locale: "es-ES" }
  ),
  de: template<{ name: string; count: number }>(
    "Hallo {name}, du hast {count|plural:Nachricht,Nachrichten}",
    { locale: "de-DE" }
  ),
};

const locale = "es";
console.log(messages[locale]({ name: "Carlos", count: 3 }));
// → "Hola Carlos, tienes mensajes"

// Currency formatting by locale
const priceTemplate = template<{ price: number }>(
  "Price: {price|currency:EUR}",
  { locale: "de-DE" }
);
console.log(priceTemplate({ price: 1234.56 }));
// → "Preis: 1.234,56 €"
```

**See the full example:** [`examples/i18n.ts`](examples/i18n.ts)

### Form Validation Messages

Generate consistent, user-friendly validation error messages:

```typescript
const validationMessages = {
  required: template<{ field: string }>("The {field} field is required."),
  minLength: template<{ field: string; min: number }>(
    "The {field} field must be at least {min} characters."
  ),
  email: template<{ field: string }>(
    "The {field} field must be a valid email address."
  ),
};

console.log(validationMessages.required({ field: "username" }));
// → "The username field is required."

console.log(validationMessages.minLength({ field: "password", min: 8 }));
// → "The password field must be at least 8 characters."

// Localized validation
const localizedValidation = {
  en: { required: template<{ field: string }>("The {field} field is required.") },
  es: { required: template<{ field: string }>("El campo {field} es obligatorio.") },
  de: { required: template<{ field: string }>("Das Feld {field} ist erforderlich.") },
};
```

**See the full example:** [`examples/form-validation.ts`](examples/form-validation.ts)

### API Response Formatting

Format API responses, error messages, and status updates:

```typescript
const errorTemplate = template<{
  code: number;
  message: string;
}>(
  '{{"status": "error", "code": {code}, "message": "{message}"}}'
);

console.log(errorTemplate({
  code: 400,
  message: "Invalid email format",
}));
// → {"status": "error", "code": 400, "message": "Invalid email format"}

const paginationTemplate = template<{
  page: number;
  totalPages: number;
  itemCount: number;
}>(
  'Page {page} of {totalPages} ({itemCount|plural:item,items})'
);

console.log(paginationTemplate({ page: 1, totalPages: 10, itemCount: 20 }));
// → "Page 1 of 10 (items)"
```

**See the full example:** [`examples/api-responses.ts`](examples/api-responses.ts)

### Custom Filters for Domain Logic

Extend `formatr` with custom filters tailored to your application:

```typescript
const template = template<{ userInput: string }>(
  "<div>{userInput|escape}</div>",
  {
    filters: {
      escape: (value: unknown) => {
        return String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }
    }
  }
);

console.log(template({ userInput: '<script>alert("xss")</script>' }));
// → "<div>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</div>"
```

**See the full example:** [`examples/custom-filters.ts`](examples/custom-filters.ts)

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

### 📅 Date & Time Filters (New!)

`formatr` now includes advanced date and time formatting filters with full internationalization support:

| Filter | Syntax | Description | Example |
|--------|--------|-------------|---------|
| `relativeDate` | `{date\|relativeDate}` | Formats date relative to now | `futureDate` → `"in 3 days"`, `pastDate` → `"yesterday"` |
| `formatDate` | `{date\|formatDate:pattern}` | Custom date formatting with pattern tokens | `{date\|formatDate:yyyy-MM-dd}` → `"2025-12-20"` |
| `timezone` | `{date\|timezone:IANA_TZ}` | Converts date to specified timezone | `{date\|timezone:America/New_York}` → `"2025-12-20 10:30:00 EST"` |
| `duration` | `{ms\|duration}` | Formats time duration in human-readable format | `5400000` → `"1h 30m"` |
| `timeAgo` | `{date\|timeAgo}` | Shows elapsed time since date | `recentDate` → `"15 minutes ago"`, `oldDate` → `"just now"` |

**Key Features:**
- 🌍 **Full i18n support** with `Intl` API for all locales
- 🕐 **Timezone-aware** with IANA timezone database support
- 📊 **Multiple formats** (narrow, short, long, colon) for durations
- 🎯 **Smart contextual output** (e.g., "yesterday", "tomorrow", "just now")
- ⚡ **Zero dependencies** - uses native browser/Node.js Intl APIs
- 🌳 **Tree-shakable** - import only the filters you need

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

### Quoted Filter Arguments

When filter arguments need to contain special characters like commas (`,`), colons (`:`), pipes (`|`), or closing braces (`}`), you can wrap them in quotes:

```typescript
import { template } from "@timur_manjosov/formatr";

// Quoted arguments allow commas in arguments
const t1 = template<{ text: string }>(
  '{text|truncate:30,"..."}'
);
console.log(t1({ text: "This is a very long text that needs to be truncated" }));
// → "This is a very long text th..."

// Quoted arguments allow colons and other special characters
const t2 = template<{ url: string }>(
  '{url|replace:"http:","https:"}'
);
console.log(t2({ url: "http://example.com" }));
// → "https://example.com"

// Both double and single quotes work
const t3 = template<{ text: string }>(
  "{text|replace:'old','new'}"
);
```

#### Escape Sequences

Inside quoted strings, you can use escape sequences:

| Escape | Result |
|--------|--------|
| `\"` | `"` (double quote) |
| `\'` | `'` (single quote) |
| `\\` | `\` (backslash) |
| `\,` | `,` (comma) |
| `\:` | `:` (colon) |

```typescript
// Escaped quotes inside quoted strings
const t4 = template<{ name: string }>(
  '{name|prepend:"He said, \\"Hello\\" "}',
  {
    filters: {
      prepend: (value, prefix) => `${prefix}${String(value)}`
    }
  }
);
console.log(t4({ name: "Alice" }));
// → 'He said, "Hello" Alice'

// Escaped backslash for file paths
const t5 = template<{ path: string }>(
  '{path|replace:"\\\\","/"}',
  {
    filters: {
      replace: (value, from, to) => String(value).split(from).join(to)
    }
  }
);
```

#### Mixing Quoted and Unquoted Arguments

You can mix quoted and unquoted arguments in the same filter call:

```typescript
const t = template<{ text: string }>(
  '{text|pad:20,left," "}'
);
console.log(t({ text: "Hello" }));
// → "               Hello"
```

#### Backwards Compatibility

Existing templates without quotes continue to work exactly as before:

```typescript
// Existing syntax still works
const t = template<{ count: number }>(
  "{count|plural:item,items}"
);
console.log(t({ count: 5 }));
// → "items"
```

### Date & Time Filter Examples

The new date and time filters provide powerful formatting capabilities for temporal data:

```typescript
import { template } from "@timur_manjosov/formatr";

// Relative date formatting
const postTemplate = template<{ created: Date }>(
  "Posted {created|relativeDate}"
);
console.log(postTemplate({ created: new Date(Date.now() - 3600000) }));
// → "Posted 1 hour ago"

// Custom date formatting with patterns
const eventTemplate = template<{ date: Date }>(
  "Event: {date|formatDate:EEEE MMMM d yyyy}"
);
console.log(eventTemplate({ date: new Date('2025-12-20') }));
// → "Event: Saturday December 20 2025"

// Timezone conversion
const meetingTemplate = template<{ time: Date }>(
  "Meeting: {time|timezone:America/New_York}"
);
console.log(meetingTemplate({ time: new Date('2025-12-20T15:30:00Z') }));
// → "Meeting: 2025-12-20 10:30:00 EST"

// Duration formatting
const videoTemplate = template<{ length: number }>(
  "Duration: {length|duration}"
);
console.log(videoTemplate({ length: 5400000 })); // 1.5 hours in ms
// → "Duration: 1h 30m"

// Time ago with threshold
const commentTemplate = template<{ posted: Date }>(
  "{posted|timeAgo}"
);
console.log(commentTemplate({ posted: new Date(Date.now() - 900000) }));
// → "15 minutes ago"
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

## ⚡ Async Filters

`formatr` supports asynchronous filters that can fetch data from external sources like APIs, databases, or file systems. This enables data-driven templating for complex scenarios while maintaining clean template syntax.

### Basic Async Filter Usage

Use `templateAsync` instead of `template` to work with async filters:

```typescript
import { templateAsync } from "@timur_manjosov/formatr";

const greet = templateAsync<{ userId: number }>(
  "Hello, {userId|fetchUser|getName}!",
  {
    filters: {
      fetchUser: async (id: unknown) => {
        const response = await fetch(`https://api.example.com/users/${id}`);
        return await response.json();
      },
      getName: (user: any) => user.name
    }
  }
);

const result = await greet({ userId: 123 });
console.log(result);
// → "Hello, Alice Johnson!"
```

### Mixed Sync and Async Filters

You can freely mix synchronous and asynchronous filters in the same template:

```typescript
const formatter = templateAsync<{ productId: number }>(
  "{productId|fetchProduct|formatPrice|upper}",
  {
    filters: {
      // Async filter
      fetchProduct: async (id: unknown) => {
        const res = await fetch(`https://api.example.com/products/${id}`);
        return await res.json();
      },
      // Sync filters
      formatPrice: (product: any) => `${product.name}: $${product.price.toFixed(2)}`,
      upper: (str: unknown) => String(str).toUpperCase()
    }
  }
);

const result = await formatter({ productId: 456 });
console.log(result);
// → "WIRELESS MOUSE: $29.99"
```

### Parallel Execution

Independent async operations across different placeholders are automatically executed in parallel for optimal performance:

```typescript
const dashboard = templateAsync<{ userId: number }>(
  "User: {userId|fetchUser|getName}\n" +
  "Orders: {userId|fetchOrders|count}\n" +
  "Cart: {userId|fetchCart|total}",
  {
    filters: {
      fetchUser: async (id: unknown) => {
        // These three fetches run in parallel!
        await delay(100);
        return getUser(id);
      },
      fetchOrders: async (id: unknown) => {
        await delay(100);
        return getOrders(id);
      },
      fetchCart: async (id: unknown) => {
        await delay(100);
        return getCart(id);
      },
      getName: (user: any) => user.name,
      count: (orders: any[]) => `${orders.length} orders`,
      total: (cart: any) => `$${cart.total}`
    }
  }
);

// All three fetches complete in ~100ms (parallel), not ~300ms (sequential)
const result = await dashboard({ userId: 123 });
```

### Error Handling

Async filter errors are caught and wrapped with context information:

```typescript
const template = templateAsync<{ url: string }>(
  "Data: {url|fetchData}",
  {
    filters: {
      fetchData: async (url: unknown) => {
        const response = await fetch(String(url));
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
      }
    }
  }
);

try {
  await template({ url: "https://api.example.com/data" });
} catch (error) {
  // FilterExecutionError with context:
  // - filterName: "fetchData"
  // - inputValue: "https://api.example.com/data"
  // - originalError: Error("HTTP 404")
  console.error(`Error in filter '${error.filterName}': ${error.message}`);
}
```

### Important Notes

- Use `templateAsync()` for templates with async filters
- Use `template()` for sync-only templates (attempts to use async filters will throw a helpful error)
- Filters within a single chain execute sequentially (required for data flow)
- Independent placeholders execute in parallel (for performance)
- All built-in filters remain synchronous for backward compatibility

**See [examples/async-filters.ts](examples/async-filters.ts) for complete working examples.**

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
- **Filter Suggestions** – Smart suggestions for unknown filters based on similar names

### Diagnostic Types

The analyzer can detect:

- **Unknown filters** – References to filters that don't exist (with suggestions for similar names)
- **Argument mismatches** – Incorrect number of arguments for built-in filters
- **Syntax errors** – Malformed template syntax
- **Suspicious usage** – Type mismatches (e.g., using `number` filter on string placeholders)
- **Missing keys** – Placeholders not found in the provided context (when `onMissing: "error"`)

### Enhanced Examples

**Unknown Filter with Suggestions:**

When a template references an unknown filter, the analyzer provides smart suggestions based on similar filter names:

```typescript
const report = analyze("{name|upperr}");

console.log(report.messages[0]);
// {
//   code: "unknown-filter",
//   message: 'Unknown filter "upperr". Did you mean "upper"?',
//   severity: "error",
//   range: { start: { line: 1, column: 6 }, end: { line: 1, column: 13 } },
//   data: { filter: "upperr", suggestions: ["upper"] }
// }

// With multiple possible suggestions
const report2 = analyze("{price|currenc:USD}");
console.log(report2.messages[0].message);
// → 'Unknown filter "currenc". Did you mean "currency"?'
console.log(report2.messages[0].data.suggestions);
// → ["currency"]

// When no close matches are found
const report3 = analyze("{text|nonexistent}");
console.log(report3.messages[0].message);
// → 'Unknown filter "nonexistent"'
console.log(report3.messages[0].data.suggestions);
// → [] (no suggestions available)
```

The `data.suggestions` field is useful for building editor integrations with autocomplete or quick-fix actions:

```typescript
// Example: Create quick-fix actions from suggestions
const report = analyze("{name|lowr}");
const diagnostic = report.messages.find(m => m.code === "unknown-filter");

if (diagnostic?.data?.suggestions) {
  const suggestions = diagnostic.data.suggestions as string[];
  for (const suggestion of suggestions) {
    console.log(`Quick fix: Replace "lowr" with "${suggestion}"`);
  }
}
// → Quick fix: Replace "lowr" with "lower"
```

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

## 🎓 Advanced Topics

### Writing Custom Filters

Custom filters are simple functions that transform values. Follow these best practices for creating robust, reusable filters:

#### Filter Best Practices

1. **Pure Functions**: Filters should be pure functions without side effects
2. **Type Coercion**: Use `String(value)` or `Number(value)` to handle various input types
3. **Graceful Fallbacks**: Return sensible defaults for invalid inputs instead of throwing errors
4. **Clear Error Messages**: When validation fails, provide helpful error messages
5. **Documentation**: Add JSDoc comments with usage examples

**Example: Creating a URL Slug Filter**

```typescript
import { template } from "@timur_manjosov/formatr";

const slugify = template<{ title: string }>(
  "/blog/{title|slug}",
  {
    filters: {
      slug: (value: unknown) => {
        return String(value)
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '') // Remove special characters
          .replace(/[\s_-]+/g, '-')  // Replace spaces with hyphens
          .replace(/^-+|-+$/g, '');  // Trim hyphens from ends
      }
    }
  }
);

console.log(slugify({ title: "Hello World! How Are You?" }));
// → "/blog/hello-world-how-are-you"
```

**Example: Filters with Validation**

```typescript
const formatAge = template<{ name: string; age: number }>(
  "{name} is {age|validateAge} years old",
  {
    filters: {
      validateAge: (value: unknown) => {
        const age = Number(value);
        if (!Number.isFinite(age)) {
          throw new Error(`Invalid age: ${value}`);
        }
        if (age < 0 || age > 150) {
          throw new Error(`Age out of range: ${age}`);
        }
        return String(age);
      }
    }
  }
);
```

### Framework Integration

#### React Integration

Use `formatr` templates in React components for consistent string formatting:

```typescript
import { template } from "@timur_manjosov/formatr";
import { useMemo } from "react";

function UserGreeting({ user }: { user: { name: string; messageCount: number } }) {
  const greetingTemplate = useMemo(
    () => template<{ name: string; count: number }>(
      "Hello {name|upper}, you have {count|plural:message,messages}"
    ),
    []
  );

  return <h1>{greetingTemplate({ name: user.name, count: user.messageCount })}</h1>;
}
```

**Tip**: Cache compiled templates with `useMemo` to avoid recompilation on every render.

#### Vue Integration

```vue
<script setup lang="ts">
import { template } from "@timur_manjosov/formatr";
import { computed } from "vue";

const props = defineProps<{ name: string; count: number }>();

const greetingTemplate = template<{ name: string; count: number }>(
  "Hello {name|upper}, you have {count|plural:message,messages}"
);

const greeting = computed(() => 
  greetingTemplate({ name: props.name, count: props.count })
);
</script>

<template>
  <h1>{{ greeting }}</h1>
</template>
```

#### Express.js Middleware

Create a middleware for consistent API response formatting:

```typescript
import { template } from "@timur_manjosov/formatr";
import type { Request, Response, NextFunction } from "express";

const errorTemplate = template<{ code: number; message: string }>(
  '{{"status": "error", "code": {code}, "message": "{message}"}}'
);

function formatError(err: Error, req: Request, res: Response, next: NextFunction) {
  const statusCode = (err as any).statusCode || 500;
  const formatted = errorTemplate({
    code: statusCode,
    message: err.message,
  });
  res.status(statusCode).type('application/json').send(formatted);
}

app.use(formatError);
```

### Performance Optimization

`formatr` is optimized for high-performance string formatting with pre-compiled templates and intelligent caching.

#### Performance Metrics

Typical benchmark results (`pnpm bench`):

| Template Type | Performance | Description |
|---------------|-------------|-------------|
| Static templates | ~150M ops/sec | Templates with no placeholders |
| Simple placeholder | ~7M ops/sec | `"Hello {name}"` |
| Nested paths | ~6M ops/sec | `"{user.profile.name}"` |
| Multiple filters | ~4-6M ops/sec | `"{name\|trim\|upper}"` |
| Intl formatting | ~25K ops/sec | `"{price\|currency:USD}"` |
| Cache hits | ~500K+ ops/sec | Template already compiled |

> 📊 For detailed benchmarks and optimization strategies, see [PERFORMANCE.md](PERFORMANCE.md).

#### Template Caching

`formatr` automatically caches compiled templates (default: 200 entries). Adjust cache size based on your needs:

```typescript
// Large application with many unique templates
const t1 = template("...", { cacheSize: 1000 });

// Disable caching for dynamic templates
const t2 = template("...", { cacheSize: 0 });

// Small app with few templates
const t3 = template("...", { cacheSize: 50 });
```

**Performance Tips:**

1. **Reuse Template Functions**: Create template functions once and reuse them
2. **Compile at Startup**: Compile frequently-used templates during app initialization
3. **Avoid Dynamic Templates**: Don't generate template strings dynamically in hot paths
4. **Profile Your App**: Use profiling tools to identify bottlenecks

#### Pre-compilation Pattern

For maximum performance, pre-compile templates at module load:

```typescript
// templates.ts - compile once
import { template } from "@timur_manjosov/formatr";

export const templates = {
  userGreeting: template<{ name: string }>("Hello {name|upper}!"),
  errorMessage: template<{ code: number; message: string }>("Error {code}: {message}"),
  logEntry: template<{ level: string; msg: string }>("[{level|pad:5}] {msg}"),
};

// app.ts - reuse everywhere
import { templates } from "./templates";
console.log(templates.userGreeting({ name: "Alice" }));
```

### Build Pipeline Integration

Use `analyze()` in your build process to catch template errors early:

```typescript
// scripts/validate-templates.ts
import { analyze } from "@timur_manjosov/formatr";
import * as fs from "fs";

const templates = [
  "{user.name|upper}",
  "{count|plural:item,items}",
  "{price|currency:USD}",
];

let hasErrors = false;

for (const tmpl of templates) {
  const { messages } = analyze(tmpl);
  const errors = messages.filter(m => m.severity === "error");
  
  if (errors.length > 0) {
    console.error(`Template "${tmpl}" has errors:`, errors);
    hasErrors = true;
  }
}

if (hasErrors) {
  process.exit(1);
}

console.log("✓ All templates are valid");
```

Add to your CI/CD pipeline:

```json
{
  "scripts": {
    "validate-templates": "tsx scripts/validate-templates.ts",
    "test": "npm run validate-templates && vitest run"
  }
}
```

---

## ⚡ WebAssembly Backend (Experimental)

`formatr` includes an **optional WebAssembly (WASM) backend** for extreme performance in high-throughput scenarios. The WASM backend is **experimental and opt-in**.

### Quick Start

```typescript
import { template, initWasm, isWasmEnabled } from "@timur_manjosov/formatr";

// Load WASM module
await initWasm();

if (isWasmEnabled()) {
  console.log("WASM backend enabled");
}

// Use templates as normal - WASM is used automatically
const t = template("Hello {name|upper}!");
console.log(t({ name: "Alice" }));
// → "Hello ALICE!" (rendered using WASM)
```

### Performance Benefits

The WASM backend provides **1.4-2x faster** execution for string operations:

| Filter | JS ops/sec | WASM ops/sec | Speedup |
|--------|-----------|--------------|---------|
| `upper` | 6.2M | 8.9M | **1.43x** |
| `lower` | 6.5M | 9.1M | **1.40x** |
| `trim` | 7.8M | 11.2M | **1.44x** |
| Chained | 4.3M | 6.8M | **1.58x** |

### When to Use WASM

Consider WASM for:

- **High-throughput servers**: APIs rendering thousands of templates per second
- **Real-time applications**: Logging systems, monitoring dashboards
- **Edge computing**: Serverless functions with strict latency requirements
- **Large templates**: Templates with many placeholders and filters

### Fallback Behavior

The WASM backend gracefully falls back to JavaScript if unavailable:

```typescript
// Try to load WASM, fall back to JS if unavailable
try {
  await initWasm();
  console.log("WASM backend enabled");
} catch (e) {
  console.log("Falling back to JS backend");
}

console.log("WASM enabled:", isWasmEnabled());
```

### API Reference

- **`initWasm()`**: Async function to load the WASM module
- **`isWasmEnabled()`**: Returns `true` if WASM is loaded and enabled
- **`disableWasm()`**: Temporarily disable WASM and fall back to JS
- **`enableWasm()`**: Re-enable WASM if it was previously loaded

### Compatibility

- **Browsers**: Chrome 57+, Firefox 52+, Safari 11+, Edge 16+
- **Node.js**: v12+ (any version with WebAssembly support)
- **Bundle size**: ~5KB compressed WASM module
- **Output**: WASM and JS implementations produce identical output

### Documentation

For detailed information, see [WASM.md](WASM.md):

- Implementation details
- Performance benchmarks
- Troubleshooting guide
- Contributing to the WASM backend

---

## 🔄 Migration Guide

### From Template Literals

If you're using template literals, `formatr` provides additional type safety and formatting capabilities:

**Before (Template Literals):**

```typescript
const name = "Alice";
const count = 5;
const message = `Hello ${name.toUpperCase()}, you have ${count} ${count === 1 ? 'message' : 'messages'}`;
```

**After (formatr):**

```typescript
const t = template<{ name: string; count: number }>(
  "Hello {name|upper}, you have {count|plural:message,messages}"
);
const message = t({ name: "Alice", count: 5 });
```

**Benefits:**
- Type-safe placeholders
- Reusable templates
- Built-in filters eliminate custom logic
- Separation of template and data

### From Mustache/Handlebars

`formatr` offers similar templating capabilities with TypeScript integration:

**Mustache/Handlebars:**

```handlebars
Hello {{name}}, you have {{messageCount}} messages.
```

**formatr:**

```typescript
const t = template<{ name: string; messageCount: number }>(
  "Hello {name}, you have {messageCount|plural:message,messages}."
);
```

**Key Differences:**

| Feature | Mustache/Handlebars | formatr |
|---------|---------------------|---------|
| Syntax | `{{placeholder}}` | `{placeholder}` |
| Filters | `{{name \| uppercase}}` | `{name\|upper}` |
| Type Safety | None | Full TypeScript support |
| Logic | Helpers & conditionals | Filters only (logic in code) |
| i18n | External libraries | Built-in `Intl` filters |
| Size | Larger runtime | Tiny (~20KB) |

**Migration Strategy:**

1. Replace `{{placeholder}}` with `{placeholder}`
2. Convert helpers to filters or move logic to code
3. Add TypeScript types for context objects
4. Use built-in filters for common transformations

### From sprintf/printf

`formatr` provides a more declarative alternative to printf-style formatting:

**Before (sprintf):**

```typescript
const message = sprintf("Hello %s, you have %d messages", name, count);
```

**After (formatr):**

```typescript
const t = template<{ name: string; count: number }>(
  "Hello {name}, you have {count} messages"
);
const message = t({ name, count });
```

**Benefits:**
- Named placeholders (more readable)
- Type-checked context objects
- No positional argument errors
- Rich filter ecosystem

---

## ❓ FAQ

### When should I use formatr vs. template literals?

**Use `formatr` when:**
- You need reusable templates across your codebase
- You want type-safe string formatting with compile-time checks
- Your templates require advanced formatting (currency, dates, pluralization)
- You're building internationalized (i18n) applications
- You need to validate templates at build time
- Templates are loaded from external sources (databases, config files)

**Use template literals when:**
- You have simple, one-off string interpolation
- Templates are never reused
- You don't need advanced formatting features
- You need maximum performance for simple cases (template literals have zero overhead)

### How do I handle missing or undefined keys?

Configure the `onMissing` option to control behavior:

```typescript
// Throw an error (default)
const t1 = template("{name}", { onMissing: "error" });
t1({}); // Throws error

// Keep placeholder as-is
const t2 = template("{name}", { onMissing: "keep" });
console.log(t2({})); // → "{name}"

// Custom fallback
const t3 = template("{name}", { 
  onMissing: (key) => `[${key} not provided]` 
});
console.log(t3({})); // → "[name not provided]"
```

### How do I debug template issues?

Use the `analyze()` function to inspect templates:

```typescript
import { analyze } from "@timur_manjosov/formatr";

const report = analyze("{count|plural:item}"); // Missing second argument

console.log(report.messages);
// [
//   {
//     code: "bad-args",
//     message: 'Filter "plural" requires exactly 2 arguments',
//     severity: "error",
//     range: { start: { line: 1, column: 7 }, ... }
//   }
// ]
```

Integrate `analyze()` into your:
- **Editor**: Create an extension for real-time validation
- **Linter**: Add a custom linting rule
- **CI/CD**: Validate templates during builds

### Can I use formatr in the browser?

Yes! `formatr` has zero runtime dependencies and works in all modern browsers:

```html
<script type="module">
  import { template } from 'https://cdn.skypack.dev/@timur_manjosov/formatr';
  
  const t = template('Hello {name|upper}!');
  console.log(t({ name: 'world' })); // → "Hello WORLD!"
</script>
```

### How do I create conditional templates?

`formatr` focuses on formatting, not logic. Handle conditionals in your code:

```typescript
// ❌ Don't try to add logic to templates
// Templates are for formatting, not business logic

// ✅ Do: Handle logic in code, use templates for formatting
const templates = {
  withDiscount: template<{ price: number; discount: number }>(
    "Price: {price|currency:USD} (Save {discount|currency:USD}!)"
  ),
  withoutDiscount: template<{ price: number }>(
    "Price: {price|currency:USD}"
  ),
};

function formatPrice(price: number, discount?: number) {
  if (discount) {
    return templates.withDiscount({ price, discount });
  }
  return templates.withoutDiscount({ price });
}
```

### How does formatr compare in performance?

`formatr` is optimized for production use:

- **First render**: ~0.1-0.5ms (includes compilation)
- **Cached renders**: ~0.01-0.05ms (near-instant)
- **Memory**: Minimal footprint with LRU cache
- **Bundle size**: ~20KB minified

For 99% of applications, performance is excellent. If you're rendering millions of strings per second, consider pre-compilation (see [Performance Optimization](#performance-optimization)).

### Can I contribute new filters?

Absolutely! We welcome contributions. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines:

1. **Check if the filter is general-purpose** (will it benefit other users?)
2. **Write tests** covering edge cases
3. **Add JSDoc documentation** with examples
4. **Update the README** filter table
5. **Submit a pull request**

**Popular filter requests:**
- Date manipulation (relative times, duration formatting)
- Advanced text formatting (capitalization, word wrapping)
- Data sanitization (URL encoding, base64)
- Numeric formatting (ordinals, scientific notation)

### How do I load templates from external sources?

Templates can come from databases, APIs, or config files:

```typescript
import { template } from "@timur_manjosov/formatr";

// Load from JSON config
const config = {
  welcomeMessage: "Hello {name|upper}, you have {count|plural:message,messages}",
  errorMessage: "Error {code}: {message}",
};

const templates = Object.fromEntries(
  Object.entries(config).map(([key, tmpl]) => [
    key,
    template(tmpl)
  ])
);

// Use templates
console.log(templates.welcomeMessage({ name: "Alice", count: 5 }));

// Validate before using
import { analyze } from "@timur_manjosov/formatr";

for (const [key, tmpl] of Object.entries(config)) {
  const { messages } = analyze(tmpl);
  const errors = messages.filter(m => m.severity === "error");
  if (errors.length > 0) {
    console.error(`Template "${key}" is invalid:`, errors);
  }
}
```

---

## 🤝 Contributing

Contributions are welcome! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) guide for details on:

- Setting up the development environment
- Running tests and linting
- Submitting pull requests
- Code style and conventions
- Adding new filters or features

### Quick Start

```bash
# Clone the repository
git clone https://github.com/TimurManjosov/formatr.git
cd formatr

# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build

# Run examples
npm run examples
```

### Guidelines

- Write clear, concise commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style
- Keep pull requests focused on a single feature or fix

For detailed contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

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
