# Planned Issues

## Issue 1 — feat(intl): add number/percent/currency filters

**Description**

Implement numeric formatting via `Intl.NumberFormat`, respecting `options.locale`.

- `number:{minFrac,maxFrac}`
- `percent:{frac}` (scales input 0–1 to 0–100 automatically)
- `currency:CODE{frac}` (e.g., currency: EUR)

**API examples**

```ts
template("{n[number]}", { locale: "de" })({ n: 12345.678 }) // "12.345,678"
template("{p[percent:1]}", { locale: "de" })({ p: 0.1234 }) // "12,3 %"
template("{price[currency:EUR]}", { locale: "de" })({ price: 12.5 }) // "12,50 €"
```

**Acceptance criteria**

- Pass unit tests for de/en locales
- Unknown/invalid currency code → clear error
- Fractions default sensible values (e.g., min=0, max=none)
- Usage docs in README (section: Internationalization)

## Issue 2 — feat(intl): add date filter

**Description**

Implement date formatting via `Intl.DateTimeFormat`, style param.

**API examples**

```ts
template("{d[date:short]}", { locale: "de" })({ d: new Date("2025-10-13") })
template("{d[date:long]}", { locale: "de" })({ d: 1734096000000 /* ms */ })
```

**Acceptance criteria**

- Supports `short | medium | long | full`
- Accepts `Date` or timestamp (number)
- Invalid inputs → clear error; no throw on `null` (respect onMissing earlier)
- Tests in two locales

## Issue 3 — feat(dx): analyze(source) diagnostics

**Description**

Expose `analyze(source, { filters? }) -> { messages: Diagnostic[] }`.

**Detect**

- unknown filters
- bad arg counts for built-ins (e.g., `plural` must have 2)
- unterminated placeholder (`{name`)
- invalid identifier (`{9x}`)

**Acceptance criteria**

- Deterministic messages with position index
- Unit tests for each diagnostic
- Mention in README “Developer Experience”

## Issue 4 — feat(core): dot-path placeholders

**Description**

Support `{user.name}` with safe traversal.

**Acceptance criteria**

- `{ user: { name: "A" } } → "A"`
- missing nested key respects `onMissing`
- tests for multi-level, nullish, arrays not required yet

## Issue 5 — chore: micro-bench & precompile cache

**Description**

Add simple micro-bench (vitest bench or node script). Optional LRU cache of compiled templates by source string.

**Acceptance criteria**

- Bench runs locally; README shows rough numbers
- Cache toggled via options (default on)
