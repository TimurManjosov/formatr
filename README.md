# formatr

> **Elegant, typed string formatting for TypeScript**

A tiny, type‑safe templating engine that combines placeholders, filters, internationalization (i18n), and dot‑path support into a single, familiar syntax. `formatr` lets you compose strings declaratively while catching errors at compile time.

<!-- Badges: update the links if necessary -->
[![npm](https://img.shields.io/npm/v/@timur_manjosov/formatr.svg)](https://www.npmjs.com/package/@timur_manjosov/formatr)
[![license](https://img.shields.io/github/license/TimurManjosov/formatr.svg)](LICENSE)

### 💡 Why formatr?

- **Type safety** – templates know the shape of your context, so missing keys are compile‑time errors.
- **Readable templates** – use `{placeholder|filter:args}` syntax instead of awkward string concatenation.
- **First‑class i18n** – built‑in filters for numbers, currency, percentages, and dates via `Intl`.
- **Extensible** – write your own filters and plug them in with a single option.
- **Zero runtime deps** – no dependencies outside the TypeScript standard library.

---

## Table of Contents

1. [Features](#✨-features)
2. [Quickstart](#🚀-quickstart)
3. [API](#📘-api)
4. [Built‑in Filters](#🧰-built‑in-filters)
5. [Custom Filters](#🧱-custom-filters)
6. [Dot‑Paths](#🧭-dot‑paths)
7. [Diagnostics](#🔍-diagnostics)
8. [Installation](#📦-installation)
9. [License](#📝-license)

## ✨ Features

- 🔒 **Typed templates** – type‑safe placeholders tied to your context.
- 🔗 **Chainable filters** – transform values inline with `|trim|upper`.
- 🌐 **i18n support** – format numbers, dates, and currencies effortlessly via `Intl`.
- 🗺 **Dot‑paths** – safely traverse nested objects (`{user.address.city}`).
- 🧩 **Customizable** – define your own filters and reuse them across templates.
- 🛠 **Diagnostics** – detect typos, unknown filters, and argument mismatches at authoring time.
- ⚡ **Performance** – internal caching ensures repeated renders are lightning‑fast.

---

## 🚀 Quickstart

Use `formatr` in three quick steps:

1. **Import** the `template` function.
2. **Define** your context type and template string.
3. **Render** the template with data.

```ts
import { template } from "formatr";

const greet = template<{ name: string; count: number }>(
  "Hello {name|upper}, you have {count|plural:message,messages}",
  { locale: "en" }
);

// Execute the compiled template with your data
console.log(greet({ name: "Lara", count: 2 }));
// → "Hello LARA, you have messages"
```
In this example:

- {name} is piped through the upper filter to uppercase the value.

- {count} uses the plural filter to choose between “message” and “messages” based on its numeric value.

- The optional locale determines how numeric and date filters behave.

## 📘 API
```ts
template(source, options?): (context) => string
```

Compile a template into a function that accepts a context object and returns the formatted string.

### Options:

- ```locale?: string``` – override the default locale for Intl‑based filters.

- onMissing?: "error" | "keep" | (key => string) – control how missing placeholders are handled:

- - ```"error"``` throws an exception,
  - ```"keep"``` leaves the placeholder untouched,
  - A function returns a fallback string.

- ```filters?: Record<string, (value, ...args) => unknown>``` – register custom filters.

- ```cacheSize?: number``` (default ```200```) – adjust internal caching; set to ```0``` to disable.

```analyze(source, options?): { messages: Diagnostic[] }```

Analyze a template string and return diagnostics about unknown filters, argument mismatches, or other authoring problems. Integrate this into your build or editor for early feedback.

## 🧰 Built-in filters
`format` ships with a suite of useful filters that can be chained and combined as needed:

| **Filter** | **Syntax** | **Description** |
|-------------|-------------|-----------------|
| `upper`     | `{name upper}` | upper |
| `lower`     | `{name lower}` | lower |
| `trim`      | `{name trim}` | trim |
| `plural`    | `{count plural:singular,plural}` | plural:singular,plural |
| `number`    | `{n number}` | number |
| `percent`   | `{n percent}` | percent |
| `currency`  | `{n currency:EUR}` | currency:EUR |
| `date`      | `{d date:short}` | date:short |


## 🧱Custom Filter
Filters are just functions. Define your own and pass them via the ```filters``` option:
```ts
import { template } from "formatr";

const greet = template("Hi {name|greet:!}", {
  filters: {
    greet: (value: unknown, punctuation: string = "!") => {
      return `👋 ${String(value)}${punctuation}`;
    },
  },
});

console.log(greet({ name: "Alex" }));
// → "👋 Alex!"
```
Custom filters receive the placeholder value as their first argument, followed by any additional arguments provided after the colon.

## 🧭 Dot‑Paths
Access nested properties safely using dot‑path notation. If any segment is ```undefined```, the entire expression resolves to ```undefined``` and can be handled by ```onMissing```:
```ts
import { template } from "formatr";

const t = template("City: {user.address.city}");

console.log(t({ user: { address: { city: "Berlin" } } }));
// → "City: Berlin"

```
Dot‑paths let you reach into complex objects without boilerplate or optional chaining.

## 🔍 Diagnostics
Use ```analyze()``` to detect issues early. Diagnostics report unknown filters, invalid arguments, and other authoring problems:
```ts
import { analyze } from "formatr";

const report = analyze("{n|plural:one}");
console.log(report.messages);
// [
//   {
//     code: "bad-args",
//     message: 'Filter "plural" requires exactly 2 arguments (e.g. one, other)',
//     range: { /* ... */ },
//   },
// ]
```
These diagnostics can be integrated into editors or build pipelines for a smooth developer experience.

## 📦 Installation
Add formatr to your project using any package manager:
```bash
npm i @timur_manjosov/formatr
```
## 📝 License
```formatr``` is open source software under the MIT license. Contributions are welcome!



