# Template Includes / Partials

## Description

Add support for **template includes** (also known as partials or sub-templates), allowing users to compose complex templates from smaller, reusable components. This is a common feature in templating engines like Handlebars, Mustache, and EJS.

Template includes enable:
- **Reusability**: Define common template fragments once and reuse them across multiple templates.
- **Maintainability**: Break large templates into smaller, manageable pieces.
- **Composition**: Build complex layouts by composing smaller templates.
- **DRY principle**: Avoid duplicating template code.

Proposed syntax:
- `{> templateName}` – Include another template by name.
- `{> layout.header}` – Include a template with a dot-separated path (for nested namespaces).

Examples of use cases:
- **Email templates**: Reuse header, footer, and styling across multiple email templates.
- **UI components**: Include reusable components like cards, buttons, or modals in HTML templates.
- **i18n**: Include common phrases or disclaimers in translated templates.
- **Logging**: Include timestamp and log level formatting in log message templates.

This feature requires:
- **New AST node type**: `IncludeNode` to represent includes in the AST.
- **Parser changes**: Recognize `{> name}` syntax and parse it into an `IncludeNode`.
- **Compiler changes**: When compiling, resolve the included template and inline its render function.
- **Template registry**: A way to register and look up templates by name (either at compilation time or runtime).
- **Context handling**: Decide whether included templates inherit the parent context, receive a subset, or receive custom data.

### Example Usage

**Basic include:**
```typescript
import { template, registerTemplate } from "@timur_manjosov/formatr";

// Register a reusable template
registerTemplate("greeting", "Hello {name|upper}!");

// Use the include in another template
const t = template<{ name: string }>(
  "{> greeting} Welcome to our platform."
);

console.log(t({ name: "Alice" }));
// → "Hello ALICE! Welcome to our platform."
```

**Includes with nested context:**
```typescript
import { template, registerTemplate } from "@timur_manjosov/formatr";

// Register header and footer templates
registerTemplate("layout.header", "=== {title|upper} ===");
registerTemplate("layout.footer", "--- End of {title} ---");

// Use includes in a main template
const t = template<{ title: string; content: string }>(
  `{> layout.header}
{content}
{> layout.footer}`
);

console.log(t({ title: "Report", content: "This is the main content." }));
// → "=== REPORT ===
//    This is the main content.
//    --- End of Report ---"
```

**Email template example:**
```typescript
import { template, registerTemplate } from "@timur_manjosov/formatr";

// Register reusable email components
registerTemplate("email.header", `
<html>
<head><style>body { font-family: Arial; }</style></head>
<body>
`);

registerTemplate("email.footer", `
<p>Regards,<br>The Team</p>
</body>
</html>
`);

// Compose an email template
const welcomeEmail = template<{ user: { name: string } }>(
  `{> email.header}
<h1>Welcome, {user.name}!</h1>
<p>Thanks for signing up.</p>
{> email.footer}`
);

console.log(welcomeEmail({ user: { name: "Alice" } }));
```

## Requirements

### Syntax
- [ ] Support `{> templateName}` syntax for includes.
- [ ] Support dot-separated template names (e.g., `{> layout.header}`).
- [ ] Do NOT support passing arguments to includes in the initial implementation (this can be a future extension).
- [ ] Include syntax should not conflict with existing placeholder or escape syntax.

### AST
- [ ] Add a new node type: `IncludeNode`:
  ```typescript
  export type IncludeNode = {
    kind: 'Include';
    name: string; // e.g., "greeting" or "layout.header"
    range: Range;
  };
  ```
- [ ] Update `Node` type to include `IncludeNode`: `type Node = TextNode | PlaceholderNode | IncludeNode;`

### Parser
- [ ] Recognize `{> templateName}` syntax in the parser.
- [ ] Extract the template name and create an `IncludeNode`.
- [ ] Handle whitespace around the template name (e.g., `{> header }` is valid).
- [ ] Provide clear error messages for invalid include syntax (e.g., `{>}` without a name).

### Template Registry
- [ ] Implement a global or context-specific template registry:
  ```typescript
  const templateRegistry: Map<string, string> = new Map();
  
  export function registerTemplate(name: string, source: string): void {
    templateRegistry.set(name, source);
  }
  
  export function getTemplate(name: string): string | undefined {
    return templateRegistry.get(name);
  }
  ```
- [ ] Alternatively, allow templates to be passed as an option:
  ```typescript
  const t = template("...", {
    templates: {
      "greeting": "Hello {name}!",
      "layout.header": "=== {title} ==="
    }
  });
  ```

### Compiler
- [ ] When compiling a template with includes, resolve each included template from the registry.
- [ ] Compile the included template into a render function.
- [ ] Inline the included template's render function into the parent render function.
- [ ] Pass the parent context to the included template (full context inheritance by default).
- [ ] Handle recursive includes gracefully (detect and prevent infinite loops).

### Context Handling
- [ ] By default, included templates receive the **full parent context**.
- [ ] Example: If parent has `{ name: "Alice", title: "Report" }`, the include also receives `{ name: "Alice", title: "Report" }`.
- [ ] Future extension: Allow passing a subset or custom context to includes (e.g., `{> greeting:name}` or `{> card:user.*}`).

### Error Handling
- [ ] If an included template is not found in the registry, throw a clear error at **compilation time**.
- [ ] If an included template contains a syntax error, report the error with the include name and position.
- [ ] Detect recursive includes (e.g., template A includes B, which includes A) and throw an error.

### Analyze Integration
- [ ] The `analyze()` function should detect:
  - Unknown includes (template not registered).
  - Recursive includes.
  - Syntax errors in included templates.
- [ ] Add a new diagnostic code: `"unknown-include"`.

### Backwards Compatibility
- [ ] The `{>` syntax does not conflict with existing syntax.
- [ ] Existing templates without includes continue to work unchanged.

## Acceptance Criteria

### Implementation
- [ ] `IncludeNode` is added to the AST.
- [ ] Parser recognizes `{> templateName}` syntax and creates `IncludeNode`.
- [ ] Template registry is implemented (`registerTemplate`, `getTemplate`).
- [ ] Compiler resolves and inlines included templates.
- [ ] Recursive includes are detected and prevented.
- [ ] Included templates inherit the parent context.

### Testing
- [ ] Unit tests for parser:
  - Parse `{> greeting}` into an `IncludeNode`.
  - Handle whitespace: `{>  greeting  }`.
  - Error on invalid syntax: `{>}`, `{> }`.
- [ ] Unit tests for compiler:
  - Include a simple template: `{> greeting}`.
  - Include multiple templates in one parent.
  - Include a template with placeholders and filters.
  - Nested includes (A includes B, B includes C).
  - Recursive includes (A includes B, B includes A) → error.
- [ ] Unit tests for context inheritance:
  - Included template uses a placeholder from the parent context.
  - Included template uses a nested path from the parent context.
- [ ] Unit tests for error handling:
  - Unknown include → clear error message.
  - Syntax error in included template → error with include name.

### Documentation
- [ ] Update README with a section on "Template Includes".
- [ ] Add examples of registering and using includes.
- [ ] Document context inheritance behavior.
- [ ] Document error handling for unknown or recursive includes.
- [ ] Add an example script demonstrating includes (e.g., `examples/includes.ts`).

### Integration
- [ ] Includes work with all existing filters.
- [ ] Includes work with dot-paths in placeholders.
- [ ] The `analyze()` function detects unknown includes and recursive includes.

### Performance
- [ ] Including templates should not significantly slow down rendering (inline compilation is efficient).
- [ ] Consider caching compiled includes to avoid recompilation.

### Developer Experience
- [ ] Clear error messages for unknown includes, recursive includes, and syntax errors.
- [ ] Includes make it easy to compose reusable templates.
- [ ] Documentation provides clear examples and best practices.

## Implementation Ideas

### Approach 1: Global Template Registry

Add a global registry:

```typescript
// src/core/registry.ts
const templateRegistry: Map<string, string> = new Map();

export function registerTemplate(name: string, source: string): void {
  templateRegistry.set(name, source);
}

export function getTemplate(name: string): string | undefined {
  return templateRegistry.get(name);
}

export function clearTemplates(): void {
  templateRegistry.clear();
}
```

Export from `src/index.ts`:
```typescript
export { registerTemplate, clearTemplates } from "./core/registry";
```

### Approach 2: Compiler Integration

Update `src/core/compile.ts` to handle includes:

```typescript
function compileTemplate(
  ast: TemplateAST,
  options: TemplateOptions,
  visited: Set<string> = new Set()
): RenderFunction {
  return (ctx: unknown) => {
    const fragments: string[] = [];
    
    for (const node of ast.nodes) {
      if (node.kind === "Text") {
        fragments.push(node.value);
      } else if (node.kind === "Placeholder") {
        // ... existing placeholder logic ...
      } else if (node.kind === "Include") {
        // Resolve included template
        const includeSource = getTemplate(node.name);
        if (!includeSource) {
          throw new FormatrError(`Unknown include: "${node.name}"`, node.range.start);
        }
        
        // Detect recursive includes
        if (visited.has(node.name)) {
          throw new FormatrError(`Recursive include detected: "${node.name}"`, node.range.start);
        }
        visited.add(node.name);
        
        // Compile included template
        const includeAst = parseTemplate(includeSource);
        const includeRender = compileTemplate(includeAst, options, visited);
        
        // Render included template with parent context
        fragments.push(includeRender(ctx));
        
        visited.delete(node.name);
      }
    }
    
    return fragments.join("");
  };
}
```

### Approach 3: Parser Update

Update `src/core/parser.ts` to recognize `{>`:

```typescript
function parseTemplate(source: string): TemplateAST {
  // ... existing code ...
  
  if (source[pos] === "{" && source[pos + 1] === ">") {
    // Parse include
    pos += 2; // Skip "{>"
    
    // Skip whitespace
    while (pos < source.length && /\s/.test(source[pos])) pos++;
    
    // Read template name
    const nameStart = pos;
    while (pos < source.length && source[pos] !== "}") {
      pos++;
    }
    
    if (pos >= source.length) {
      throw new FormatrError("Unterminated include", nameStart);
    }
    
    const name = source.slice(nameStart, pos).trim();
    if (!name) {
      throw new FormatrError("Include name is required", nameStart);
    }
    
    pos++; // Skip "}"
    
    nodes.push({
      kind: "Include",
      name,
      range: { start: nodeStart, end: pos },
    });
    
    continue;
  }
  
  // ... existing code ...
}
```

### Approach 4: Analyze Integration

Update `src/core/analyze.ts` to check includes:

```typescript
export function analyze(source: string, options: AnalyzeOptions = {}): AnalysisReport {
  // ... existing code ...
  
  for (const node of ast.nodes) {
    if (node.kind === "Include") {
      const includeSource = getTemplate(node.name);
      if (!includeSource) {
        messages.push({
          code: "unknown-include",
          message: `Unknown include "${node.name}"`,
          severity: "error",
          range: astRangeToRange(source, node.range, lineStarts),
          data: { include: node.name },
        });
      } else {
        // Recursively analyze included template
        const includeReport = analyze(includeSource, options);
        messages.push(...includeReport.messages);
      }
    }
  }
  
  return { messages };
}
```

### Potential Pitfalls
- **Circular includes**: Must detect and prevent infinite loops (e.g., A includes B, B includes A).
- **Context scoping**: Decide whether includes should have access to the full parent context or a restricted subset.
- **Performance**: Inlining includes at compile time is fast, but deeply nested includes could increase compilation time.
- **Template resolution**: Decide whether templates are resolved from a global registry, passed as options, or both.
- **Error messages**: Ensure errors in included templates include the include name and position for easier debugging.

## Additional Notes

- **Related issues**:
  - Issue #5 (Documentation) should include examples of using includes.
  - Issue #7 (Richer parser) may be needed to support passing arguments to includes in the future.
- **Future extensions**:
  - **Pass arguments to includes**: `{> greeting:name}` or `{> card:user}`.
  - **Scoped context**: Limit the context passed to includes (e.g., only pass `user` object).
  - **Async includes**: Load templates asynchronously from files or URLs.
  - **Include with filters**: Apply filters to the output of an include (e.g., `{> greeting|upper}`).
  - **Conditional includes**: Include templates based on conditions (e.g., `{> header:if:showHeader}`).
- **Alternative designs**:
  - Use a different syntax: `<%include greeting%>`, `{{> greeting}}`, `[[ greeting ]]`.
  - Support inline template definitions within the parent template.

---
