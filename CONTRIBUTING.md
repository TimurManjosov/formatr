# Contributing to formatr

Thank you for your interest in contributing to `formatr`! We welcome contributions of all kinds—bug reports, feature requests, documentation improvements, and code contributions.

## Development Setup

### Prerequisites

- **Node.js** (v18 or later recommended)
- **npm** or **pnpm** (package manager)
- **Git** for version control

### Getting Started

1. **Fork the repository**
   
   Click the "Fork" button at the top right of the [formatr repository](https://github.com/TimurManjosov/formatr).

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/formatr.git
   cd formatr
   ```

3. **Install dependencies**

   ```bash
   npm install
   # or
   pnpm install
   ```

4. **Run tests**

   ```bash
   npm test
   ```

5. **Run tests in watch mode**

   ```bash
   npm run dev
   ```

6. **Build the project**

   ```bash
   npm run build
   ```

7. **Run examples**

   ```bash
   npm run examples
   ```

## Development Workflow

### Making Changes

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**

   - Write clear, concise code following the existing style
   - Add tests for new features or bug fixes
   - Update documentation as needed
   - Ensure all tests pass: `npm test`

3. **Run the full check suite**

   ```bash
   npm run check
   ```

   This runs linting, tests, and builds the project to ensure everything works correctly.

4. **Commit your changes**

   Write clear, descriptive commit messages:

   ```bash
   git commit -m "feat: add new filter for X"
   git commit -m "fix: resolve issue with Y"
   git commit -m "docs: update README with Z"
   ```

   Use conventional commit prefixes:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `test:` for test changes
   - `refactor:` for code refactoring
   - `perf:` for performance improvements
   - `chore:` for maintenance tasks

5. **Push to your fork**

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**

   - Go to the [formatr repository](https://github.com/TimurManjosov/formatr)
   - Click "New Pull Request"
   - Select your fork and branch
   - Provide a clear description of your changes
   - Link to any related issues

## Code Style

`formatr` follows these style guidelines:

- **TypeScript**: Use TypeScript's strict mode
- **Formatting**: Code is formatted with Prettier (run `npm run format`)
- **Linting**: Code is linted with ESLint (run `npm run lint`)
- **Naming**: Use descriptive variable and function names
- **Comments**: Add comments for complex logic; prefer self-documenting code

### File Structure

```
formatr/
├── src/
│   ├── api.ts           # Public API (template function)
│   ├── core/            # Core functionality
│   │   ├── analyze.ts   # Template analysis and diagnostics
│   │   ├── compile.ts   # Template compilation
│   │   ├── parser.ts    # Template parsing
│   │   └── cache.ts     # LRU cache implementation
│   ├── filters/         # Built-in filters
│   │   ├── index.ts
│   │   ├── text.ts      # Text manipulation filters
│   │   └── intl.ts      # Internationalization filters
│   └── index.ts         # Package entry point
├── test/                # Test files (Vitest)
├── examples/            # Example scripts
├── bench/               # Benchmarks
└── README.md            # Main documentation
```

## Adding New Features

### Adding a New Filter

1. **Add the filter function** to the appropriate file in `src/filters/`:
   - Text filters → `src/filters/text.ts`
   - Internationalization filters → `src/filters/intl.ts`

2. **Export the filter** from `src/filters/index.ts`

3. **Add it to `builtinFilters`** in `src/filters/index.ts`

4. **Write tests** in `test/template.filters.test.ts` or create a new test file

5. **Document the filter** in the README's "Built-in Filters" section

6. **Add JSDoc comments** with usage examples

**Example:**

```typescript
// In src/filters/text.ts
export function reverse(value: unknown): string {
  return String(value).split('').reverse().join('');
}

// In src/filters/index.ts
import { reverse } from './text';

export const builtinFilters: Record<string, Function> = {
  // ...existing filters
  reverse,
};

// In test/template.filters.test.ts
it('should reverse strings', () => {
  const t = template('{text|reverse}');
  expect(t({ text: 'hello' })).toBe('olleh');
});
```

### Adding Diagnostics

If you're adding a new filter that requires argument validation:

1. **Add validation logic** in `src/core/analyze.ts`
2. **Update the `validateBuiltinFilter` function** with expected argument counts
3. **Add test cases** in `test/analyze.*.test.ts`

## Writing Tests

We use [Vitest](https://vitest.dev/) for testing. Tests are located in the `test/` directory.

### Test Guidelines

- **Write tests for all new features and bug fixes**
- **Use descriptive test names**: `it('should format currency with locale', ...)`
- **Test edge cases**: null, undefined, empty strings, invalid inputs
- **Group related tests**: use `describe()` blocks
- **Keep tests focused**: each test should verify one behavior

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run dev

# Run specific test file
npx vitest run test/template.filters.test.ts
```

## Documentation Guidelines

Good documentation is essential! When contributing:

### Code Documentation

- **Add JSDoc comments** to all public functions
- **Include `@param`, `@returns`, and `@example` tags**
- **Document edge cases and error conditions**

**Example:**

```typescript
/**
 * Formats a number as currency.
 * 
 * @param value - The numeric value to format
 * @param code - The currency code (e.g., "USD", "EUR")
 * @returns The formatted currency string
 * 
 * @example
 * currency(42.99, "USD") // "$42.99" (en-US locale)
 * currency(42.99, "EUR") // "42,99 €" (de-DE locale)
 */
export function currency(value: unknown, code: string): string {
  // implementation
}
```

### README Updates

When adding features:

- **Update the "Built-in Filters" table** if adding filters
- **Add examples** demonstrating the feature
- **Update the API documentation** if changing function signatures
- **Add to the Table of Contents** if creating new sections

### Example Scripts

If creating new example scripts:

- **Keep examples simple and focused**
- **Add comments explaining non-obvious code**
- **Ensure examples run without errors**
- **Update `package.json` to include the example in the `examples` script**

## Pull Request Guidelines

### Before Submitting

- [ ] All tests pass (`npm test`)
- [ ] Code is linted (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation is updated
- [ ] Examples are tested
- [ ] Commit messages follow conventions

### PR Description

Provide a clear description including:

- **What** changed
- **Why** the change was needed
- **How** it was implemented
- **Related issues** (use "Fixes #123" to auto-close issues)
- **Breaking changes** (if any)

### Review Process

- Maintainers will review your PR
- Address any feedback or requested changes
- Once approved, your PR will be merged!

## Reporting Bugs

When reporting bugs, please include:

- **Description**: Clear description of the bug
- **Steps to Reproduce**: Minimal steps to reproduce the issue
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Environment**: OS, Node version, package version
- **Code Sample**: Minimal code that demonstrates the issue

## Suggesting Features

Feature requests are welcome! Please provide:

- **Use Case**: Describe the problem you're trying to solve
- **Proposed Solution**: Your idea for solving it
- **Alternatives**: Other solutions you've considered
- **Additional Context**: Any other relevant information

## Code of Conduct

### Our Standards

- **Be respectful** and inclusive
- **Welcome newcomers** and help them learn
- **Focus on constructive feedback**
- **Accept differing viewpoints**
- **Prioritize the community's well-being**

### Enforcement

Unacceptable behavior may result in:

- Warning
- Temporary ban
- Permanent ban

Report issues to the maintainers.

## Questions?

If you have questions:

- **Check the README** and existing documentation
- **Search existing issues** to see if your question was answered
- **Open a new issue** with the "question" label
- **Join discussions** in the GitHub Discussions section (if available)

## License

By contributing to `formatr`, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

Thank you for contributing to `formatr`! Your help makes this project better for everyone. 🎉
