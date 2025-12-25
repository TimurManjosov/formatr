/**
 * Watch command - Watch templates and data files for changes
 */
import { Command } from 'commander';
import { template } from '@timur_manjosov/formatr';
import { 
  logger, 
  readFile, 
  writeFile,
  findFiles,
  parseData,
  isDirectory,
  pathExists,
  getRelativePath,
  EXIT_CODES,
} from '../utils/index.js';
import { join, basename, extname, dirname } from 'node:path';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

interface WatchOptions {
  data?: string;
  dataDir?: string;
  output?: string;
  outputDir?: string;
  debounce?: string;
  serve?: boolean;
  port?: string;
  extensions?: string;
}

/**
 * Parse extensions option
 */
function parseExtensions(extensions?: string): string[] {
  if (!extensions) {
    return ['.fmt', '.json', '.yaml', '.yml'];
  }
  return extensions.split(',').map(ext => ext.trim());
}

/**
 * Render a template with data
 */
async function renderTemplate(
  templatePath: string,
  data: unknown
): Promise<string> {
  const source = await readFile(templatePath);
  const renderFn = template(source);
  return renderFn(data as Record<string, unknown>);
}

/**
 * Simple debounce function
 */
function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Start a simple live reload server
 */
function startLiveReloadServer(port: number, getContent: () => Promise<string>): void {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      if (req.url === '/') {
        const content = await getContent();
        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Formatr Watch</title>
  <style>
    body { font-family: monospace; padding: 20px; white-space: pre-wrap; }
  </style>
  <script>
    setInterval(() => fetch('/content').then(r => r.text()).then(t => {
      if (document.body.textContent !== t) {
        document.body.textContent = t;
      }
    }), 1000);
  </script>
</head>
<body>${content}</body>
</html>`;
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      } else if (req.url === '/content') {
        const content = await getContent();
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(content);
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    } catch (error) {
      res.writeHead(500);
      res.end(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  
  server.listen(port, () => {
    logger.info(`Live reload server running at http://localhost:${port}`);
  });
}

export const watchCommand = new Command('watch')
  .description('Watch templates and data files for changes')
  .argument('[template]', 'Template file or directory to watch')
  .option('-d, --data <file>', 'Data file (JSON or YAML)')
  .option('--data-dir <dir>', 'Data directory to watch')
  .option('-o, --output <file>', 'Output file')
  .option('--output-dir <dir>', 'Output directory for multiple templates')
  .option('--debounce <ms>', 'Debounce delay in milliseconds', '300')
  .option('--serve', 'Start a live reload server')
  .option('-p, --port <port>', 'Server port', '3000')
  .option('-e, --extensions <list>', 'File extensions to watch (comma-separated)')
  .action(async (templateArg: string | undefined, options: WatchOptions) => {
    try {
      // Lazy load chokidar
      let chokidar;
      try {
        chokidar = await import('chokidar');
      } catch {
        logger.error('Watch mode requires the "chokidar" package. Install it with: npm install chokidar');
        process.exit(EXIT_CODES.FAILURE);
        return;
      }
      
      const templatePath = templateArg ?? '.';
      const debounceMs = parseInt(options.debounce ?? '300', 10);
      const extensions = parseExtensions(options.extensions);
      
      // Determine files to watch
      let templateFiles: string[] = [];
      if (await isDirectory(templatePath)) {
        templateFiles = await findFiles(templatePath, ['.fmt'], true);
      } else if (pathExists(templatePath)) {
        templateFiles = [templatePath];
      } else {
        logger.error(`Template not found: ${templatePath}`);
        process.exit(EXIT_CODES.FAILURE);
        return;
      }
      
      if (templateFiles.length === 0) {
        logger.error('No template files found');
        process.exit(EXIT_CODES.FAILURE);
        return;
      }
      
      // Data source
      const dataPath = options.data;
      if (!dataPath && !options.dataDir) {
        logger.error('Data source required (--data or --data-dir)');
        process.exit(EXIT_CODES.INVALID_USAGE);
        return;
      }
      
      // Files to watch
      const watchPaths = [...templateFiles];
      if (dataPath) watchPaths.push(dataPath);
      if (options.dataDir) watchPaths.push(options.dataDir);
      
      logger.info('Starting watch mode...');
      logger.info(`  Templates: ${templateFiles.length} file(s)`);
      logger.info(`  Data: ${dataPath || options.dataDir}`);
      logger.info(`  Debounce: ${debounceMs}ms`);
      logger.info('Press Ctrl+C to stop.\n');
      
      // Current rendered content for live reload
      let currentContent = '';
      
      // Render function
      const render = async (): Promise<void> => {
        try {
          const data = dataPath ? await parseData(dataPath) : {};
          
          for (const file of templateFiles) {
            const result = await renderTemplate(file, data);
            
            if (options.output) {
              await writeFile(options.output, result);
              logger.success(`Rendered ${getRelativePath(file)} → ${options.output}`);
            } else if (options.outputDir) {
              const outputName = basename(file, extname(file)) + '.txt';
              const outputPath = join(options.outputDir, outputName);
              await writeFile(outputPath, result);
              logger.success(`Rendered ${getRelativePath(file)} → ${outputPath}`);
            } else {
              currentContent = result;
              console.log('\n--- Output ---');
              console.log(result);
              console.log('--- End ---\n');
            }
          }
        } catch (error) {
          logger.error(`Render error: ${error instanceof Error ? error.message : String(error)}`);
        }
      };
      
      // Debounced render
      const debouncedRender = debounce(render, debounceMs);
      
      // Initial render
      await render();
      
      // Start live reload server if requested
      if (options.serve) {
        const port = parseInt(options.port ?? '3000', 10);
        startLiveReloadServer(port, async () => {
          if (!currentContent && dataPath && templateFiles.length > 0) {
            const firstTemplate = templateFiles[0];
            if (firstTemplate) {
              const data = await parseData(dataPath);
              currentContent = await renderTemplate(firstTemplate, data);
            }
          }
          return currentContent;
        });
      }
      
      // Start watcher
      const watcher = chokidar.watch(watchPaths, {
        persistent: true,
        ignoreInitial: true,
      });
      
      watcher.on('change', (path: string) => {
        logger.info(`Changed: ${getRelativePath(path)}`);
        debouncedRender();
      });
      
      watcher.on('add', (path: string) => {
        logger.info(`Added: ${getRelativePath(path)}`);
        debouncedRender();
      });
      
      watcher.on('error', (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Watcher error: ${message}`);
      });
      
      // Keep process running
      process.on('SIGINT', () => {
        logger.info('\nStopping watch mode...');
        watcher.close();
        process.exit(EXIT_CODES.SUCCESS);
      });
      
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(EXIT_CODES.FAILURE);
    }
  });

export default watchCommand;
