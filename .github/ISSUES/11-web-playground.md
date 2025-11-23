# Web Playground ("formatr-playground")

## Description

Build an **interactive web playground** where users can:
- Type a `formatr` template in one pane.
- Provide context data (as JSON) in another pane.
- See the rendered output instantly.
- View live diagnostics (errors, warnings, suggestions) from the `analyze()` function.
- Experiment with filters, dot-paths, and escaping in a safe, visual environment.

A web playground is valuable for:
- **Onboarding**: New users can experiment with `formatr` without installing anything.
- **Documentation**: Embed the playground in docs to provide interactive examples.
- **Debugging**: Users can quickly test templates and debug issues.
- **Showcase**: Demonstrates the library's capabilities in an engaging way.
- **Learning**: Users can discover features by exploring and experimenting.

The playground should be:
- **Hosted online**: Accessible via a URL (e.g., `playground.formatr.dev` or `formatr.github.io/playground`).
- **Fast**: Instant feedback as users type (debounced).
- **Mobile-friendly**: Responsive design for tablets and phones.
- **Shareable**: Generate shareable links with pre-filled templates and context.

### Example Usage

**Playground UI:**
```
+------------------------------------------+------------------------------------------+
| Template (editable)                      | Context (editable JSON)                  |
|------------------------------------------|------------------------------------------|
| Hello {name|upper}!                      | {                                        |
| You have {count|plural:message,messages} |   "name": "Alice",                       |
| totaling {price|currency:USD}.           |   "count": 5,                            |
|                                          |   "price": 99.99                         |
|                                          | }                                        |
+------------------------------------------+------------------------------------------+
| Output (read-only)                       | Diagnostics (read-only)                  |
|------------------------------------------|------------------------------------------|
| Hello ALICE!                             | ✓ No errors                              |
| You have messages                        |                                          |
| totaling $99.99.                         |                                          |
+------------------------------------------+------------------------------------------+
| Options                                                                            |
|------------------------------------------------------------------------------------|
| Locale: [en-US ▼]  OnMissing: [error ▼]  Cache: [200]                            |
+------------------------------------------------------------------------------------+
| [Share Link] [Reset] [Examples ▼]                                                 |
+------------------------------------------------------------------------------------+
```

**Features:**
- Real-time rendering as users type (debounced 300ms).
- Syntax highlighting in the template editor (CodeMirror or Monaco Editor).
- JSON validation and formatting in the context editor.
- Color-coded diagnostics (red for errors, yellow for warnings).
- Click a diagnostic to jump to the relevant line in the template.
- Share button generates a URL with encoded template and context.
- Examples dropdown with pre-built templates (e.g., "Basic", "Currency", "i18n", "Nested Paths").

## Requirements

### Core Functionality
- [ ] **Template editor**: A code editor (Monaco, CodeMirror, or textarea) for entering templates.
- [ ] **Context editor**: A JSON editor for entering context data with syntax highlighting and validation.
- [ ] **Output pane**: Read-only display of the rendered template.
- [ ] **Diagnostics pane**: Display diagnostics from `analyze()` with severity indicators (error, warning, info).
- [ ] **Live updates**: Re-render on every change (debounced 300ms).

### UI/UX
- [ ] Clean, modern design with a clear layout.
- [ ] Responsive design for desktop, tablet, and mobile.
- [ ] Dark mode toggle (optional but recommended).
- [ ] Keyboard shortcuts (e.g., Ctrl+Enter to render, Ctrl+K to clear).
- [ ] Loading indicators for rendering (if async).

### Options Panel
- [ ] **Locale**: Dropdown to select locale (en-US, es-ES, de-DE, fr-FR, etc.).
- [ ] **OnMissing**: Dropdown to select missing key behavior (error, keep).
- [ ] **Cache size**: Input field for cache size (default: 200).
- [ ] **Strict keys**: Checkbox to enable strict mode (if implemented).

### Examples
- [ ] Provide a dropdown with pre-built examples:
  - "Basic" – Simple placeholder: `Hello {name}!`
  - "Filters" – Text filters: `{name|trim|upper}`
  - "Pluralization" – Plural filter: `{count|plural:item,items}`
  - "Currency" – Currency formatting: `{price|currency:USD}`
  - "Date" – Date formatting: `{date|date:short}`
  - "Nested Paths" – Dot-paths: `{user.profile.name}`
  - "Chaining" – Multiple filters: `{text|trim|lower|upper}`
- [ ] Selecting an example loads it into the editor.

### Sharing
- [ ] Generate a shareable URL that encodes the template, context, and options in the query string (e.g., `?t=...&c=...&l=en-US`).
- [ ] Use URL compression (e.g., LZ-string) to keep URLs short.
- [ ] Copy link button to copy the URL to the clipboard.

### Diagnostics Integration
- [ ] Run `analyze()` on every template change.
- [ ] Display diagnostics in the diagnostics pane with:
  - Severity icon (🔴 error, ⚠️ warning, ℹ️ info).
  - Line and column numbers.
  - Clear error message.
- [ ] Click a diagnostic to jump to the relevant line in the template editor.

### Hosting
- [ ] Host the playground as a static site (no backend required).
- [ ] Deploy to GitHub Pages, Vercel, Netlify, or similar.
- [ ] Optionally host on a custom domain (e.g., `playground.formatr.dev`).

### Technology Stack
- [ ] **Frontend framework**: React, Vue, Svelte, or vanilla TypeScript.
- [ ] **Code editor**: Monaco Editor (VS Code's editor) or CodeMirror 6.
- [ ] **Bundler**: Vite, Parcel, or Webpack.
- [ ] **Styling**: Tailwind CSS, CSS Modules, or styled-components.

### Performance
- [ ] Rendering should be near-instant for typical templates (< 50ms).
- [ ] Debounce editor input to avoid excessive re-renders.
- [ ] Lazy-load heavy dependencies (e.g., Monaco Editor).

### Backwards Compatibility
- [ ] The playground is a new addition, so no compatibility concerns.

## Acceptance Criteria

### Implementation
- [ ] Playground UI is implemented with template, context, output, and diagnostics panes.
- [ ] Live rendering works with debouncing.
- [ ] Diagnostics are displayed accurately.
- [ ] Options panel allows customization of locale, onMissing, and cache.
- [ ] Examples dropdown provides pre-built templates.
- [ ] Share link generates a URL with encoded data.
- [ ] Playground is hosted online and accessible via a URL.

### Testing
- [ ] Playground is tested manually in multiple browsers (Chrome, Firefox, Safari, Edge).
- [ ] Playground is tested on mobile devices (responsive design).
- [ ] Shareable links work correctly (decode and load state).
- [ ] Diagnostics are accurate and update in real-time.

### Documentation
- [ ] Link to the playground from the main `formatr` README.
- [ ] Add a "Try it online" button in the README.
- [ ] Optionally add a tutorial or guide for using the playground.

### Deployment
- [ ] Playground is deployed to a public URL.
- [ ] Deployment is automated via CI (e.g., GitHub Actions).
- [ ] Custom domain (optional) is configured (e.g., `playground.formatr.dev`).

### Developer Experience
- [ ] Playground is intuitive and easy to use.
- [ ] Examples help users get started quickly.
- [ ] Diagnostics provide clear, actionable feedback.
- [ ] Shareable links make it easy to collaborate and share examples.

## Implementation Ideas

### Approach 1: Use React + Monaco Editor

Scaffold the playground with Vite and React:

```bash
pnpm create vite formatr-playground --template react-ts
cd formatr-playground
pnpm install @monaco-editor/react
pnpm install @timur_manjosov/formatr
```

Create the main component:

```tsx
// src/App.tsx
import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { template, analyze } from "@timur_manjosov/formatr";

export default function App() {
  const [templateSource, setTemplateSource] = useState("Hello {name|upper}!");
  const [contextJSON, setContextJSON] = useState('{\n  "name": "Alice"\n}');
  const [output, setOutput] = useState("");
  const [diagnostics, setDiagnostics] = useState([]);
  const [locale, setLocale] = useState("en-US");

  useEffect(() => {
    // Debounce rendering
    const timer = setTimeout(() => {
      try {
        const ctx = JSON.parse(contextJSON);
        const t = template(templateSource, { locale });
        setOutput(t(ctx));
        
        const report = analyze(templateSource, { locale });
        setDiagnostics(report.messages);
      } catch (e) {
        setOutput(`Error: ${e.message}`);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [templateSource, contextJSON, locale]);

  return (
    <div className="playground">
      <div className="editor-pane">
        <h3>Template</h3>
        <Editor
          height="200px"
          language="plaintext"
          value={templateSource}
          onChange={(value) => setTemplateSource(value || "")}
        />
      </div>
      
      <div className="editor-pane">
        <h3>Context (JSON)</h3>
        <Editor
          height="200px"
          language="json"
          value={contextJSON}
          onChange={(value) => setContextJSON(value || "")}
        />
      </div>
      
      <div className="output-pane">
        <h3>Output</h3>
        <pre>{output}</pre>
      </div>
      
      <div className="diagnostics-pane">
        <h3>Diagnostics</h3>
        {diagnostics.length === 0 ? (
          <p>✓ No errors</p>
        ) : (
          <ul>
            {diagnostics.map((d, i) => (
              <li key={i} className={`diagnostic-${d.severity}`}>
                {d.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
```

### Approach 2: Shareable Links

Encode state in the URL:

```typescript
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";

function shareLink() {
  const state = {
    template: templateSource,
    context: contextJSON,
    locale,
  };
  const encoded = compressToEncodedURIComponent(JSON.stringify(state));
  const url = `${window.location.origin}?s=${encoded}`;
  navigator.clipboard.writeText(url);
  alert("Link copied to clipboard!");
}

function loadFromURL() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("s");
  if (encoded) {
    const state = JSON.parse(decompressFromEncodedURIComponent(encoded));
    setTemplateSource(state.template);
    setContextJSON(state.context);
    setLocale(state.locale);
  }
}

useEffect(() => {
  loadFromURL();
}, []);
```

### Approach 3: Examples Dropdown

Add a set of examples:

```typescript
const examples = {
  basic: {
    template: "Hello {name}!",
    context: '{\n  "name": "Alice"\n}',
  },
  filters: {
    template: "{name|trim|upper}",
    context: '{\n  "name": "  alice  "\n}',
  },
  plural: {
    template: "You have {count|plural:message,messages}",
    context: '{\n  "count": 5\n}',
  },
  currency: {
    template: "Price: {price|currency:USD}",
    context: '{\n  "price": 99.99\n}',
  },
};

function loadExample(key: string) {
  const ex = examples[key];
  setTemplateSource(ex.template);
  setContextJSON(ex.context);
}
```

### Approach 4: Deploy to GitHub Pages

Add a GitHub Actions workflow:

```yaml
# .github/workflows/deploy-playground.yml
name: Deploy Playground

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Potential Pitfalls
- **Bundle size**: Monaco Editor is large (several MB); consider code splitting or using a lighter editor like CodeMirror.
- **Performance**: Rendering large templates on every keystroke can be slow; ensure debouncing is sufficient.
- **URL length**: Encoded URLs can be very long; use compression (LZ-string) and test with long templates.
- **Mobile UX**: Small screens make multi-pane layouts challenging; consider a tabbed layout for mobile.
- **JSON validation**: Invalid JSON in the context pane should be handled gracefully with clear error messages.

## Additional Notes

- **Related issues**:
  - Issue #2 (Extended diagnostics) provides the diagnostic data displayed in the playground.
  - Issue #5 (Documentation) should link to the playground for interactive learning.
- **Future extensions**:
  - Add a "Download as HTML" button to export the output.
  - Add support for custom filters (user-defined in the playground).
  - Add a tutorial mode with step-by-step instructions.
  - Integrate with GitHub to save/load templates from Gists.
  - Add a "Challenge" mode with exercises for learning `formatr`.
- **Community contributions**: Encourage users to contribute examples, themes, or UI improvements.

---
