/**
 * Playground command - Launch an interactive playground
 */
import { Command } from 'commander';
import { template, analyze } from '@timur_manjosov/formatr';
import { 
  logger, 
  readFile,
  parseData,
  pathExists,
  EXIT_CODES,
} from '../utils/index.js';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createInterface } from 'node:readline';

interface PlaygroundOptions {
  port?: string;
  template?: string;
  data?: string;
  cli?: boolean;
  noOpen?: boolean;
}

/**
 * HTML for the browser playground
 */
const PLAYGROUND_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Formatr Playground</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      color: #333;
      margin-bottom: 20px;
    }
    .editor-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .panel {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .panel-header {
      background: #4CAF50;
      color: white;
      padding: 10px 15px;
      font-weight: bold;
    }
    .panel-header.data { background: #2196F3; }
    .panel-header.output { background: #FF9800; }
    .panel-header.errors { background: #f44336; }
    textarea {
      width: 100%;
      height: 200px;
      border: none;
      padding: 15px;
      font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
      font-size: 14px;
      resize: vertical;
    }
    textarea:focus { outline: none; }
    .output {
      padding: 15px;
      font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
      font-size: 14px;
      white-space: pre-wrap;
      min-height: 200px;
      background: #fafafa;
    }
    .error { color: #f44336; }
    .warning { color: #FF9800; }
    .btn {
      background: #4CAF50;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 16px;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 10px;
    }
    .btn:hover { background: #45a049; }
    .btn-secondary { background: #757575; }
    .btn-secondary:hover { background: #616161; }
    .toolbar { margin-bottom: 20px; }
    .messages { 
      padding: 15px; 
      min-height: 100px;
      background: #fff3e0;
    }
    .message-item {
      padding: 5px 0;
      border-bottom: 1px solid #eee;
    }
    .message-item:last-child { border-bottom: none; }
    @media (max-width: 768px) {
      .editor-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎨 Formatr Playground</h1>
    
    <div class="toolbar">
      <button class="btn" onclick="render()">▶ Render</button>
      <button class="btn btn-secondary" onclick="analyze()">🔍 Analyze</button>
      <button class="btn btn-secondary" onclick="clearAll()">🗑 Clear</button>
    </div>
    
    <div class="editor-grid">
      <div class="panel">
        <div class="panel-header">Template</div>
        <textarea id="template" placeholder="Enter your template here...
Example: Hello {name|upper}!">{{{INITIAL_TEMPLATE}}}</textarea>
      </div>
      
      <div class="panel">
        <div class="panel-header data">Data (JSON)</div>
        <textarea id="data" placeholder='{"name": "World"}'>{{{INITIAL_DATA}}}</textarea>
      </div>
    </div>
    
    <div class="editor-grid">
      <div class="panel">
        <div class="panel-header output">Output</div>
        <div id="output" class="output"></div>
      </div>
      
      <div class="panel">
        <div class="panel-header errors">Messages</div>
        <div id="messages" class="messages"></div>
      </div>
    </div>
  </div>
  
  <script>
    async function render() {
      const templateEl = document.getElementById('template');
      const dataEl = document.getElementById('data');
      const outputEl = document.getElementById('output');
      const messagesEl = document.getElementById('messages');
      
      try {
        const response = await fetch('/api/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template: templateEl.value,
            data: dataEl.value,
          }),
        });
        
        const result = await response.json();
        
        if (result.error) {
          outputEl.innerHTML = '<span class="error">' + escapeHtml(result.error) + '</span>';
        } else {
          outputEl.textContent = result.output;
        }
        
        messagesEl.innerHTML = result.messages?.map(m => 
          '<div class="message-item ' + m.severity + '">' + 
          escapeHtml(m.message) + 
          '</div>'
        ).join('') || '<div style="color: #4CAF50">✓ No issues</div>';
        
      } catch (error) {
        outputEl.innerHTML = '<span class="error">' + escapeHtml(error.message) + '</span>';
      }
    }
    
    async function analyze() {
      const templateEl = document.getElementById('template');
      const messagesEl = document.getElementById('messages');
      
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template: templateEl.value }),
        });
        
        const result = await response.json();
        
        if (result.messages?.length > 0) {
          messagesEl.innerHTML = result.messages.map(m => 
            '<div class="message-item ' + m.severity + '">' +
            (m.severity === 'error' ? '✗ ' : '⚠ ') +
            escapeHtml(m.message) +
            ' (line ' + m.range?.start?.line + ')' +
            '</div>'
          ).join('');
        } else {
          messagesEl.innerHTML = '<div style="color: #4CAF50">✓ No issues found</div>';
        }
        
      } catch (error) {
        messagesEl.innerHTML = '<span class="error">' + escapeHtml(error.message) + '</span>';
      }
    }
    
    function clearAll() {
      document.getElementById('template').value = '';
      document.getElementById('data').value = '{}';
      document.getElementById('output').textContent = '';
      document.getElementById('messages').innerHTML = '';
    }
    
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    // Auto-render on change
    let timeout;
    document.getElementById('template').addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(render, 500);
    });
    document.getElementById('data').addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(render, 500);
    });
    
    // Initial render
    render();
  </script>
</body>
</html>`;

/**
 * Escape HTML entities to prevent XSS
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Start the playground server
 */
function startPlaygroundServer(
  port: number,
  initialTemplate: string,
  initialData: string
): void {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    
    const url = req.url ?? '/';
    
    // Serve the playground HTML
    if (url === '/' && req.method === 'GET') {
      const html = PLAYGROUND_HTML
        .replace('{{{INITIAL_TEMPLATE}}}', escapeHtml(initialTemplate))
        .replace('{{{INITIAL_DATA}}}', escapeHtml(initialData));
      
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }
    
    // API: Render template
    if (url === '/api/render' && req.method === 'POST') {
      const MAX_BODY_SIZE = 1024 * 1024; // 1MB
      let body = '';
      let bodySize = 0;
      let tooLarge = false;

      req.on('data', (chunk: Buffer | string) => {
        if (tooLarge) {
          return;
        }

        const chunkLength = typeof chunk === 'string' ? chunk.length : chunk.byteLength;
        bodySize += chunkLength;
        
        if (bodySize > MAX_BODY_SIZE) {
          tooLarge = true;
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Request body too large' }));
          req.removeAllListeners('data');
          req.removeAllListeners('end');
          return;
        }

        body += chunk;
      });

      req.on('end', () => {
        if (tooLarge) {
          return;
        }

        try {
          
          let parsed: { template?: unknown; data?: unknown };
          try {
            parsed = JSON.parse(body) as { template?: unknown; data?: unknown };
          } catch {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON in request body' }));
            return;
          }
          
          const tmpl = typeof parsed.template === 'string' ? parsed.template : '';
          const dataStr = typeof parsed.data === 'string' ? parsed.data : '{}';
          
          let parsedData: unknown;
          try {
            parsedData = JSON.parse(dataStr);
          } catch {
            parsedData = {};
          }
          
          // Analyze first
          const report = analyze(tmpl);
          
          // Try to render
          let output = '';
          let error = '';
          try {
            const renderFn = template(tmpl);
            output = renderFn(parsedData as Record<string, unknown>);
          } catch (e) {
            error = e instanceof Error ? e.message : String(e);
          }
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            output,
            error,
            messages: report.messages,
          }));
        } catch (e) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: e instanceof Error ? e.message : String(e),
            messages: [],
          }));
        }
      });
      return;
    }
    
    // API: Analyze template
    if (url === '/api/analyze' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const { template: tmpl } = JSON.parse(body);
          const report = analyze(tmpl);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(report));
        } catch (e) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            messages: [{
              code: 'parse-error',
              message: e instanceof Error ? e.message : String(e),
              severity: 'error',
              range: { start: { line: 1, column: 1 }, end: { line: 1, column: 1 } },
            }],
          }));
        }
      });
      return;
    }
    
    // 404
    res.writeHead(404);
    res.end('Not Found');
  });
  
  server.listen(port, () => {
    logger.success(`Playground server running at http://localhost:${port}`);
    logger.info('Press Ctrl+C to stop.');
  });
}

/**
 * Start CLI REPL mode
 */
async function startRepl(initialTemplate: string, initialData: string): Promise<void> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  let currentTemplate = initialTemplate;
  let currentData = initialData;
  
  console.log('\n' + logger.colored.bold('Formatr REPL'));
  console.log('Commands: :template, :data, :render, :analyze, :help, :quit\n');
  
  const prompt = () => {
    rl.question(logger.colored.cyan('formatr> '), async (input) => {
      const trimmed = input.trim();
      
      if (trimmed === ':quit' || trimmed === ':q') {
        console.log('Goodbye!');
        rl.close();
        process.exit(EXIT_CODES.SUCCESS);
        return;
      }
      
      if (trimmed === ':help' || trimmed === ':h') {
        console.log(`
Commands:
  :template <text>  Set the template
  :data <json>      Set the data (JSON)
  :render           Render the template with current data
  :analyze          Analyze the template for issues
  :show             Show current template and data
  :quit             Exit the REPL
        `);
        prompt();
        return;
      }
      
      if (trimmed === ':show') {
        console.log('\nTemplate:', currentTemplate || '(empty)');
        console.log('Data:', currentData || '{}');
        console.log();
        prompt();
        return;
      }
      
      if (trimmed.startsWith(':template ')) {
        currentTemplate = trimmed.slice(10);
        console.log('Template set.');
        prompt();
        return;
      }
      
      if (trimmed.startsWith(':data ')) {
        currentData = trimmed.slice(6);
        console.log('Data set.');
        prompt();
        return;
      }
      
      if (trimmed === ':render') {
        try {
          const data = JSON.parse(currentData || '{}');
          const renderFn = template(currentTemplate);
          const result = renderFn(data);
          console.log('\n' + logger.colored.green('Output:'));
          console.log(result);
          console.log();
        } catch (e) {
          console.log(logger.colored.red('Error:'), e instanceof Error ? e.message : String(e));
        }
        prompt();
        return;
      }
      
      if (trimmed === ':analyze') {
        const report = analyze(currentTemplate);
        if (report.messages.length === 0) {
          console.log(logger.colored.green('✓ No issues found'));
        } else {
          for (const msg of report.messages) {
            const icon = msg.severity === 'error' ? logger.colored.red('✗') : logger.colored.yellow('⚠');
            console.log(`${icon} ${msg.message}`);
          }
        }
        console.log();
        prompt();
        return;
      }
      
      // If input doesn't start with :, treat as template for quick testing
      if (trimmed && !trimmed.startsWith(':')) {
        try {
          const data = JSON.parse(currentData || '{}');
          const renderFn = template(trimmed);
          const result = renderFn(data);
          console.log(logger.colored.gray('→'), result);
        } catch (e) {
          console.log(logger.colored.red('Error:'), e instanceof Error ? e.message : String(e));
        }
      }
      
      prompt();
    });
  };
  
  prompt();
}

export const playgroundCommand = new Command('playground')
  .description('Launch an interactive playground')
  .option('-p, --port <port>', 'Server port', '8080')
  .option('-t, --template <file>', 'Initial template file')
  .option('-d, --data <file>', 'Initial data file')
  .option('--cli', 'Run in CLI mode (REPL)')
  .option('--no-open', 'Do not open browser automatically')
  .action(async (options: PlaygroundOptions) => {
    try {
      // Load initial template and data
      let initialTemplate = 'Hello {name|upper}!';
      let initialData = '{"name": "World"}';
      
      if (options.template && pathExists(options.template)) {
        initialTemplate = await readFile(options.template);
      }
      
      if (options.data && pathExists(options.data)) {
        const data = await parseData(options.data);
        initialData = JSON.stringify(data, null, 2);
      }
      
      // CLI REPL mode
      if (options.cli) {
        await startRepl(initialTemplate, initialData);
        return;
      }
      
      // Browser mode
      const port = parseInt(options.port ?? '8080', 10);
      
      logger.info('Starting Formatr Playground...');
      startPlaygroundServer(port, initialTemplate, initialData);
      
      // Keep the process running
      process.on('SIGINT', () => {
        logger.info('\nShutting down...');
        process.exit(EXIT_CODES.SUCCESS);
      });
      
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(EXIT_CODES.FAILURE);
    }
  });

export default playgroundCommand;
