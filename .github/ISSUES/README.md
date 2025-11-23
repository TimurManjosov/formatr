# formatr Roadmap Issues

This directory contains 13 comprehensive GitHub issues that outline the planned development roadmap for `formatr`. Each issue is self-contained, actionable, and follows a consistent structure.

## Issue Structure

Each issue includes:
1. **Title** - Short, imperative, and clear
2. **Description** - What, why, and how it fits into formatr's architecture
3. **Requirements** - Technical requirements, API shape, and edge cases
4. **Acceptance Criteria** - Clear conditions for completion
5. **Implementation Ideas** - Suggested approaches with code examples
6. **Additional Notes** - Related issues and future extensions

## Roadmap Overview

### SHORT-TERM FEATURES (v0.3–v0.4)

1. **[Text Filters: slice, pad, truncate, replace](01-text-filters.md)**
   - Add essential string manipulation filters
   - Enable substring extraction, padding, truncation, and replacement
   - ~9.3 KB, 224 lines

2. **[Extended Diagnostics for Filters and Placeholders](02-extended-diagnostics.md)**
   - Enhance `analyze()` with precise position ranges
   - Add suspicious usage detection and severity levels
   - ~12 KB, 276 lines

3. **[Strict Mode for Placeholders](03-strict-mode.md)**
   - Add `strictKeys` option for compile-time validation
   - Enforce that all placeholders exist in the context
   - ~11 KB, 264 lines

4. **[Default Filter Registry Improvements](04-filter-registry-improvements.md)**
   - Standardize filter behavior with invalid input types
   - Consistent error handling and documentation
   - ~13 KB, 285 lines

5. **[Documentation and Example Improvements](05-documentation-improvements.md)**
   - Expand README with real-world use cases
   - Add CLI logging, email templates, i18n examples
   - ~12 KB, 348 lines

### MID-TERM FEATURES (v0.5–v0.8)

6. **[Compiler and Performance Optimizations](06-performance-optimizations.md)**
   - Optimize string building and filter resolution
   - Establish micro-benchmarks suite
   - ~13 KB, 332 lines

7. **[Richer Parser for Filter Arguments](07-richer-parser.md)**
   - Support quoted arguments with special characters
   - Enable escape sequences in filter arguments
   - ~13 KB, 336 lines

8. **[Template Includes / Partials](08-template-includes.md)**
   - Add `{> templateName}` syntax for reusable components
   - Enable template composition and DRY patterns
   - ~14 KB, 395 lines

9. **[Diagnostic Suggestions for Filter Names](09-filter-suggestions.md)**
   - Suggest similar filters for typos using string distance
   - Enhance error messages with "Did you mean...?"
   - ~12 KB, 324 lines

### LONG-TERM FEATURES (v1.0+)

10. **[VS Code Extension](10-vscode-extension.md)**
    - Build editor extension with syntax highlighting
    - Live diagnostics, hover tooltips, and autocomplete
    - ~13 KB, 354 lines

11. **[Web Playground ("formatr-playground")](11-web-playground.md)**
    - Interactive browser-based template editor
    - Real-time rendering and diagnostics
    - ~14 KB, 365 lines

12. **[Optional WebAssembly Backend](12-wasm-backend.md)**
    - Compile performance-critical code to WASM
    - Opt-in for extreme performance scenarios
    - ~11 KB, 349 lines

13. **[Release and Distribution Improvements](13-release-improvements.md)**
    - Automated versioning, changelog, and NPM publishing
    - Semantic versioning and quality gates
    - ~12 KB, 347 lines

## Total Scope

- **13 issues** covering short-term, mid-term, and long-term features
- **~158 KB** of comprehensive documentation
- **4,199 lines** of detailed requirements and implementation guidance

## How to Use These Issues

### For Maintainers
1. Copy the content of each `.md` file to create actual GitHub issues
2. Label issues appropriately (e.g., `v0.3`, `enhancement`, `documentation`)
3. Assign issues to milestones (v0.3, v0.4, v0.5, etc.)
4. Reference these issues in PRs using the issue number

### For Contributors
1. Review the issue that interests you
2. Check the **Requirements** and **Acceptance Criteria** sections
3. Review the **Implementation Ideas** for suggested approaches
4. Ask questions in the issue comments before starting work

### Issue Dependencies

Some issues build on others:
- Issue #2 (Extended diagnostics) → Required for #3 (Strict mode) and #9 (Filter suggestions)
- Issue #1 (Text filters) → Benefits from #4 (Filter registry improvements)
- Issue #6 (Performance) → Should precede #12 (WASM backend)
- Issue #7 (Richer parser) → May enable #8 (Template includes) enhancements

## Contributing

See the main repository's `CONTRIBUTING.md` for contribution guidelines. When working on any of these issues:
- Follow the existing code style
- Write comprehensive tests
- Update documentation
- Consider backwards compatibility
- Reference the issue number in commits and PRs

## Questions?

If you have questions about any issue, please:
1. Read the full issue description first
2. Check related issues for context
3. Open a discussion in the main repository
4. Tag maintainers if needed

---

**Note:** These issues represent a comprehensive roadmap. The maintainers will prioritize based on community feedback, resource availability, and project goals.
