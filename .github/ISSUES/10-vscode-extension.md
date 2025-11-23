# VS Code Extension

## Description

Build a **VS Code extension** for `formatr` that provides:
- **Syntax highlighting** for `formatr` template strings in TypeScript/JavaScript files.
- **Live diagnostics** powered by the `analyze()` function (show errors, warnings, and suggestions inline).
- **Hover tooltips** showing documentation for placeholders and filters.
- **Autocomplete** for filter names and filter arguments.
- **Quick fixes** for common issues (e.g., fix typos based on suggestions).
- **Snippets** for common template patterns.

A VS Code extension is essential for:
- **Developer experience**: Provides immediate feedback and autocompletion while writing templates.
- **Error prevention**: Catches syntax errors, unknown filters, and missing keys before running code.
- **Discoverability**: Helps users learn available filters and template syntax through autocomplete and hover tooltips.
- **Adoption**: A first-class editor experience makes the library more attractive to developers.

The extension leverages:
- **Language Server Protocol (LSP)**: Use VS Code's language server capabilities to provide diagnostics, hover, and autocomplete.
- **TextMate grammar**: Define syntax highlighting rules for `formatr` templates.
- **formatr's `analyze()` function**: Reuse existing diagnostic logic to power live error checking.

### Example Usage

**Syntax highlighting:**
- Template strings containing `formatr` templates are highlighted:
  ```typescript
  const t = template<{ name: string }>(
    "Hello {name|upper}!" // ← "name" and "upper" are highlighted
  );
  ```

**Live diagnostics:**
- Unknown filters are underlined in red:
  ```typescript
  const t = template<{ name: string }>(
    "Hello {name|upperr}!"
    //           ^^^^^^ Error: Unknown filter "upperr". Did you mean "upper"?
  );
  ```

**Hover tooltips:**
- Hovering over a filter shows its documentation:
  ```typescript
  const t = template("Price: {price|currency:USD}");
  // Hover over "currency" → Tooltip: "Formats a number as currency using Intl.NumberFormat"
  ```

**Autocomplete:**
- Typing `{name|` triggers autocomplete for available filters:
  ```typescript
  const t = template("{name|");
  // Autocomplete suggestions: upper, lower, trim, plural, ...
  ```

**Quick fixes:**
- Click on an error to see quick fix options:
  ```typescript
  const t = template("{name|upperr}");
  // Quick fix: Replace "upperr" with "upper"
  ```

## Requirements

### Extension Structure
- [ ] Create a new repository or directory: `formatr-vscode` or `extensions/vscode/`.
- [ ] Use the VS Code Extension API.
- [ ] Publish to the Visual Studio Marketplace.
- [ ] Support VS Code version 1.60+ (or latest LTS).

### Syntax Highlighting
- [ ] Create a TextMate grammar (`syntaxes/formatr.tmLanguage.json`) for highlighting `formatr` template strings.
- [ ] Highlight:
  - Placeholder braces: `{` and `}`
  - Placeholder paths: `name`, `user.name`
  - Filter pipes: `|`
  - Filter names: `upper`, `currency`
  - Filter arguments: `:USD`, `:singular,plural`
  - Escaped braces: `{{`, `}}`
- [ ] Support templates in both string literals and template literals (backticks).
- [ ] Register the grammar in `package.json` with a language contribution.

### Live Diagnostics
- [ ] Use the `analyze()` function to detect errors in templates.
- [ ] Run diagnostics on file save or on-the-fly (configurable).
- [ ] Show diagnostics in the Problems panel and as inline squiggles.
- [ ] Support all diagnostic codes: `parse-error`, `unknown-filter`, `bad-args`, `missing-key`, `suspicious-filter`.
- [ ] Use severity levels: `error`, `warning`, `info`.

### Hover Tooltips
- [ ] Show documentation for filters when hovering over filter names.
- [ ] Show placeholder path information when hovering over placeholders.
- [ ] Include examples and links to the `formatr` documentation.

### Autocomplete
- [ ] Provide autocomplete for filter names after typing `|`.
- [ ] Provide autocomplete for filter arguments after typing `:`.
- [ ] Include descriptions for each filter in the autocomplete list.
- [ ] Support custom filters defined in the workspace (if detectable).

### Quick Fixes
- [ ] Provide quick fixes for common errors:
  - Unknown filter: Suggest replacing with a similar filter.
  - Missing filter arguments: Insert a template with placeholders.
  - Typos in placeholder names: Suggest existing keys (if context is available).

### Snippets
- [ ] Provide snippets for common template patterns:
  - `formatr-basic`: `template<{ $1 }>("$2")`
  - `formatr-filter`: `{$1|$2}`
  - `formatr-plural`: `{$1|plural:$2,$3}`
  - `formatr-currency`: `{$1|currency:$2}`
  - `formatr-date`: `{$1|date:short}`

### Configuration
- [ ] Add extension settings for customization:
  - `formatr.diagnostics.enable`: Enable/disable live diagnostics (default: `true`).
  - `formatr.diagnostics.onSave`: Run diagnostics on save instead of on-the-fly (default: `false`).
  - `formatr.locale`: Default locale for intl filters (default: system locale).
  - `formatr.filters`: User-defined custom filters (advanced).

### Language Support
- [ ] Support TypeScript and JavaScript files.
- [ ] Detect `formatr` templates by recognizing `template()` calls.
- [ ] Optionally support other file types (e.g., `.json`, `.yaml`) if templates are embedded.

### Testing
- [ ] Write tests for the extension using VS Code's extension testing framework.
- [ ] Test syntax highlighting, diagnostics, hover, autocomplete, and quick fixes.
- [ ] Test with various VS Code themes to ensure highlighting is readable.

### Documentation
- [ ] Create a README for the extension with:
  - Installation instructions.
  - Feature list with screenshots/GIFs.
  - Configuration options.
  - Troubleshooting tips.
- [ ] Add the extension to the main `formatr` README.

### Publishing
- [ ] Publish to the Visual Studio Marketplace.
- [ ] Set up automated publishing via CI (GitHub Actions).
- [ ] Provide installation instructions in the main README.

### Backwards Compatibility
- [ ] The extension is a new addition, so no compatibility concerns.

## Acceptance Criteria

### Implementation
- [ ] VS Code extension is scaffolded and configured.
- [ ] Syntax highlighting is implemented and works for `formatr` templates.
- [ ] Live diagnostics are implemented using the `analyze()` function.
- [ ] Hover tooltips show filter documentation.
- [ ] Autocomplete provides filter suggestions.
- [ ] Quick fixes are available for common errors.
- [ ] Snippets are provided for common patterns.
- [ ] Extension settings are configurable.

### Testing
- [ ] Extension is tested manually in VS Code.
- [ ] Automated tests pass for all features.
- [ ] Syntax highlighting is tested with various themes.
- [ ] Diagnostics are accurate and timely.

### Documentation
- [ ] Extension README is comprehensive with screenshots.
- [ ] Main `formatr` README mentions the VS Code extension.

### Publishing
- [ ] Extension is published to the Visual Studio Marketplace.
- [ ] Installation instructions are clear and up-to-date.

### Developer Experience
- [ ] Extension provides immediate feedback for template errors.
- [ ] Autocomplete and hover tooltips make it easy to write templates.
- [ ] Quick fixes save time and reduce frustration.
- [ ] Extension is performant and does not slow down VS Code.

## Implementation Ideas

### Approach 1: Scaffold Extension

Use the VS Code extension generator:

```bash
npm install -g yo generator-code
yo code
# Choose "New Extension (TypeScript)"
# Name: formatr-vscode
```

### Approach 2: TextMate Grammar

Create `syntaxes/formatr.tmLanguage.json`:

```json
{
  "scopeName": "source.formatr",
  "patterns": [
    {
      "name": "meta.placeholder.formatr",
      "begin": "\\{",
      "end": "\\}",
      "patterns": [
        {
          "name": "variable.other.placeholder.formatr",
          "match": "[a-zA-Z_][a-zA-Z0-9_.]*"
        },
        {
          "name": "keyword.operator.filter.formatr",
          "match": "\\|"
        },
        {
          "name": "entity.name.function.filter.formatr",
          "match": "[a-zA-Z_][a-zA-Z0-9_]*"
        },
        {
          "name": "punctuation.separator.arguments.formatr",
          "match": ":"
        },
        {
          "name": "string.unquoted.argument.formatr",
          "match": "[^,}]+"
        }
      ]
    },
    {
      "name": "constant.character.escape.formatr",
      "match": "\\{\\{|\\}\\}"
    }
  ]
}
```

Register in `package.json`:

```json
{
  "contributes": {
    "languages": [
      {
        "id": "formatr",
        "extensions": [".formatr"],
        "aliases": ["formatr"]
      }
    ],
    "grammars": [
      {
        "language": "formatr",
        "scopeName": "source.formatr",
        "path": "./syntaxes/formatr.tmLanguage.json"
      }
    ]
  }
}
```

### Approach 3: Language Server

Create a language server using the Language Server Protocol:

```typescript
// src/server.ts
import { createConnection, TextDocuments, ProposedFeatures } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { analyze } from "@timur_manjosov/formatr";

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

documents.onDidChangeContent(change => {
  validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  const text = textDocument.getText();
  
  // Extract formatr templates from the document
  const templates = extractTemplates(text);
  
  const diagnostics = [];
  for (const { source, offset } of templates) {
    const report = analyze(source);
    for (const message of report.messages) {
      diagnostics.push({
        severity: message.severity === "error" ? 1 : 2,
        range: {
          start: textDocument.positionAt(offset + message.range.start.column),
          end: textDocument.positionAt(offset + message.range.end.column),
        },
        message: message.message,
        source: "formatr",
      });
    }
  }
  
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

documents.listen(connection);
connection.listen();
```

### Approach 4: Autocomplete Provider

Implement autocomplete for filters:

```typescript
connection.onCompletion((params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return [];
  
  const text = document.getText();
  const offset = document.offsetAt(params.position);
  
  // Check if we're inside a filter context (after "|")
  if (text[offset - 1] === "|") {
    return [
      { label: "upper", kind: 3, detail: "Convert to uppercase" },
      { label: "lower", kind: 3, detail: "Convert to lowercase" },
      { label: "trim", kind: 3, detail: "Remove whitespace" },
      { label: "plural", kind: 3, detail: "Pluralize (singular,plural)" },
      { label: "number", kind: 3, detail: "Format as number" },
      { label: "currency", kind: 3, detail: "Format as currency (code)" },
      { label: "date", kind: 3, detail: "Format as date (style)" },
    ];
  }
  
  return [];
});
```

### Potential Pitfalls
- **Performance**: Running diagnostics on every keystroke can be slow; use debouncing or run only on save.
- **Template detection**: Detecting `formatr` templates in TypeScript/JavaScript files requires parsing or heuristics; consider using a regex or AST parser.
- **Custom filters**: Detecting user-defined custom filters requires analyzing the code, which is complex.
- **Marketplace approval**: Publishing to the Marketplace requires review; ensure the extension meets quality standards.
- **Maintenance**: VS Code extensions require ongoing maintenance for new VS Code versions and API changes.

## Additional Notes

- **Related issues**:
  - Issue #2 (Extended diagnostics) provides the diagnostic data that the extension uses.
  - Issue #9 (Filter suggestions) provides suggestions that can be used in quick fixes.
- **Future extensions**:
  - Support for other editors (IntelliJ, Sublime Text, Atom).
  - Integration with GitHub Copilot to suggest templates.
  - Refactoring tools (e.g., rename placeholder across all templates).
  - Template preview pane showing rendered output in real-time.
- **Community contributions**: Encourage community contributions to the extension (e.g., new snippets, improved highlighting).

---
