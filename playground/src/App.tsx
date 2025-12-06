import { useState, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { template, analyze } from "@timur_manjosov/formatr";
import type { Diagnostic } from "@timur_manjosov/formatr";
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import "./App.css";

// Pre-built examples
const examples = {
  basic: {
    name: "Basic",
    template: "Hello {name}!",
    context: '{\n  "name": "Alice"\n}',
  },
  filters: {
    name: "Filters",
    template: "{name|trim|upper}",
    context: '{\n  "name": "  alice  "\n}',
  },
  plural: {
    name: "Pluralization",
    template: "You have {count|plural:message,messages}",
    context: '{\n  "count": 5\n}',
  },
  currency: {
    name: "Currency",
    template: "Price: {price|currency:USD}",
    context: '{\n  "price": 99.99\n}',
  },
  date: {
    name: "Date",
    template: "Today is {date|date:short}",
    context: '{\n  "date": "2025-12-06"\n}',
  },
  nested: {
    name: "Nested Paths",
    template: "Welcome, {user.profile.name|upper}!",
    context: '{\n  "user": {\n    "profile": {\n      "name": "Alice"\n    }\n  }\n}',
  },
  chaining: {
    name: "Chaining",
    template: "{text|trim|lower|upper}",
    context: '{\n  "text": "  Hello World  "\n}',
  },
  combined: {
    name: "Combined Example",
    template: "Hello {name|upper}!\\nYou have {count|plural:message,messages} totaling {price|currency:USD}.",
    context: '{\n  "name": "Alice",\n  "count": 5,\n  "price": 99.99\n}',
  },
};

type ExampleKey = keyof typeof examples;

interface PlaygroundState {
  template: string;
  context: string;
  locale: string;
  onMissing: "error" | "keep";
  cacheSize: number;
}

function App() {
  const [templateSource, setTemplateSource] = useState("Hello {name|upper}!");
  const [contextJSON, setContextJSON] = useState('{\n  "name": "Alice"\n}');
  const [output, setOutput] = useState("");
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [locale, setLocale] = useState("en-US");
  const [onMissing, setOnMissing] = useState<"error" | "keep">("keep");
  const [cacheSize, setCacheSize] = useState(200);
  const [contextError, setContextError] = useState<string>("");
  const [shareMessage, setShareMessage] = useState<string>("");

  // Load state from URL on mount
  useEffect(() => {
    loadFromURL();
  }, []);

  // Debounced rendering and diagnostics
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        // Parse context JSON
        let ctx: any;
        try {
          ctx = JSON.parse(contextJSON);
          setContextError("");
        } catch (e) {
          setContextError(`Invalid JSON: ${(e as Error).message}`);
          setOutput(`Error: Invalid JSON context`);
          return;
        }

        // Render template
        try {
          const t = template(templateSource, { locale, onMissing, cacheSize });
          setOutput(t(ctx));
        } catch (e) {
          setOutput(`Error: ${(e as Error).message}`);
        }

        // Run diagnostics
        const report = analyze(templateSource, { locale, context: ctx, onMissing });
        setDiagnostics(report.messages);
      } catch (e) {
        setOutput(`Error: ${(e as Error).message}`);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [templateSource, contextJSON, locale, onMissing, cacheSize]);

  const loadFromURL = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("s");
    if (encoded) {
      try {
        const decompressed = decompressFromEncodedURIComponent(encoded);
        if (decompressed) {
          const state: PlaygroundState = JSON.parse(decompressed);
          setTemplateSource(state.template);
          setContextJSON(state.context);
          setLocale(state.locale);
          setOnMissing(state.onMissing);
          setCacheSize(state.cacheSize);
        }
      } catch (e) {
        console.error("Failed to load from URL:", e);
      }
    }
  }, []);

  const shareLink = useCallback(() => {
    const state: PlaygroundState = {
      template: templateSource,
      context: contextJSON,
      locale,
      onMissing,
      cacheSize,
    };
    const encoded = compressToEncodedURIComponent(JSON.stringify(state));
    const url = `${window.location.origin}${window.location.pathname}?s=${encoded}`;
    
    navigator.clipboard.writeText(url).then(
      () => {
        setShareMessage("Link copied to clipboard!");
        setTimeout(() => setShareMessage(""), 3000);
      },
      () => {
        setShareMessage("Failed to copy link");
        setTimeout(() => setShareMessage(""), 3000);
      }
    );
  }, [templateSource, contextJSON, locale, onMissing, cacheSize]);

  const loadExample = useCallback((key: ExampleKey) => {
    const ex = examples[key];
    setTemplateSource(ex.template);
    setContextJSON(ex.context);
  }, []);

  const reset = useCallback(() => {
    setTemplateSource("Hello {name|upper}!");
    setContextJSON('{\n  "name": "Alice"\n}');
    setLocale("en-US");
    setOnMissing("keep");
    setCacheSize(200);
    // Clear URL
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return "🔴";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "";
    }
  };

  return (
    <div className="playground">
      <header className="header">
        <h1>🎮 formatr Playground</h1>
        <p>Interactive playground for testing formatr templates</p>
      </header>

      <div className="main-content">
        <div className="editors">
          <div className="editor-pane">
            <h3>Template</h3>
            <Editor
              height="300px"
              defaultLanguage="plaintext"
              value={templateSource}
              onChange={(value) => setTemplateSource(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
              }}
            />
          </div>

          <div className="editor-pane">
            <h3>Context (JSON)</h3>
            {contextError && <div className="error-banner">{contextError}</div>}
            <Editor
              height="300px"
              defaultLanguage="json"
              value={contextJSON}
              onChange={(value) => setContextJSON(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>

        <div className="results">
          <div className="output-pane">
            <h3>Output</h3>
            <pre className="output-content">{output}</pre>
          </div>

          <div className="diagnostics-pane">
            <h3>Diagnostics</h3>
            {diagnostics.length === 0 ? (
              <p className="no-errors">✓ No errors</p>
            ) : (
              <ul className="diagnostics-list">
                {diagnostics.map((d, i) => (
                  <li key={i} className={`diagnostic diagnostic-${d.severity}`}>
                    <span className="severity-icon">{getSeverityIcon(d.severity)}</span>
                    <span className="diagnostic-message">{d.message}</span>
                    {d.range && (
                      <span className="diagnostic-location">
                        (Line {d.range.start.line}, Col {d.range.start.column})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="options-panel">
        <h3>Options</h3>
        <div className="options-grid">
          <div className="option">
            <label htmlFor="locale">Locale:</label>
            <select
              id="locale"
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
            >
              <option value="en-US">en-US (English)</option>
              <option value="es-ES">es-ES (Spanish)</option>
              <option value="de-DE">de-DE (German)</option>
              <option value="fr-FR">fr-FR (French)</option>
              <option value="ja-JP">ja-JP (Japanese)</option>
              <option value="zh-CN">zh-CN (Chinese)</option>
            </select>
          </div>

          <div className="option">
            <label htmlFor="onMissing">On Missing:</label>
            <select
              id="onMissing"
              value={onMissing}
              onChange={(e) => setOnMissing(e.target.value as "error" | "keep")}
            >
              <option value="keep">Keep</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div className="option">
            <label htmlFor="cacheSize">Cache Size:</label>
            <input
              id="cacheSize"
              type="number"
              value={cacheSize}
              onChange={(e) => setCacheSize(parseInt(e.target.value) || 0)}
              min="0"
              max="1000"
            />
          </div>
        </div>
      </div>

      <div className="actions-panel">
        <div className="examples">
          <label htmlFor="examples">Examples:</label>
          <select
            id="examples"
            onChange={(e) => {
              if (e.target.value) {
                loadExample(e.target.value as ExampleKey);
                e.target.value = "";
              }
            }}
            defaultValue=""
          >
            <option value="">Select an example...</option>
            {Object.entries(examples).map(([key, ex]) => (
              <option key={key} value={key}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>

        <div className="actions">
          <button onClick={shareLink} className="btn-share">
            Share Link
          </button>
          <button onClick={reset} className="btn-reset">
            Reset
          </button>
          {shareMessage && <span className="share-message">{shareMessage}</span>}
        </div>
      </div>

      <footer className="footer">
        <p>
          Built with ❤️ using{" "}
          <a href="https://github.com/TimurManjosov/formatr" target="_blank" rel="noopener noreferrer">
            formatr
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
