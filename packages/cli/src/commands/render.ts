/**
 * Render command - Render templates with provided data
 */
import { Command } from 'commander';
import { template } from '@timur_manjosov/formatr';
import { 
  logger, 
  readFile, 
  writeFile, 
  parseData, 
  findFiles, 
  isDirectory,
  isFile,
  pathExists,
  getRelativePath,
  createProgress,
  EXIT_CODES,
  type DataFormat,
} from '../utils/index.js';
import { join } from 'node:path';

interface RenderOptions {
  data?: string;
  output?: string;
  outputDir?: string;
  format?: DataFormat;
  watch?: boolean;
  recursive?: boolean;
}

/**
 * Read template from stdin
 */
async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    
    // Check if stdin has data (not a TTY)
    if (process.stdin.isTTY) {
      reject(new Error('No template provided. Use a file argument or pipe template via stdin.'));
      return;
    }
    
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
    process.stdin.on('error', reject);
  });
}

/**
 * Render a single template
 */
async function renderTemplate(
  templateSource: string, 
  data: unknown, 
  filePath?: string
): Promise<string> {
  try {
    const renderFn = template(templateSource);
    return renderFn(data as Record<string, unknown>);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const location = filePath ? ` in ${getRelativePath(filePath)}` : '';
    throw new Error(`Render error${location}: ${message}`);
  }
}

/**
 * Process a single template file
 */
async function processFile(
  filePath: string, 
  data: unknown, 
  options: RenderOptions
): Promise<{ success: boolean; output?: string; error?: string }> {
  try {
    const templateSource = await readFile(filePath);
    const result = await renderTemplate(templateSource, data, filePath);
    
    // Determine output path
    if (options.outputDir) {
      const relativePath = getRelativePath(filePath);
      const outputPath = join(options.outputDir, relativePath.replace(/\.fmt$/, '.txt'));
      await writeFile(outputPath, result);
      return { success: true, output: outputPath };
    }
    
    return { success: true, output: result };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Watch for file changes (lazy load chokidar)
 */
async function watchFiles(
  files: string[],
  dataPath: string,
  options: RenderOptions
): Promise<void> {
  let chokidar;
  try {
    chokidar = await import('chokidar');
  } catch {
    throw new Error('Watch mode requires the "chokidar" package. Install it with: npm install chokidar');
  }
  
  logger.info('Watching for changes...');
  logger.info(`  Templates: ${files.map(f => getRelativePath(f)).join(', ')}`);
  logger.info(`  Data: ${dataPath}`);
  logger.info('Press Ctrl+C to stop.\n');
  
  const watcher = chokidar.watch([...files, dataPath], {
    persistent: true,
    ignoreInitial: true,
  });
  
  const renderAll = async () => {
    const data = await parseData(dataPath, options.format);
    for (const file of files) {
      const result = await processFile(file, data, options);
      if (result.success) {
        if (options.outputDir) {
          logger.success(`Rendered ${getRelativePath(file)} → ${result.output}`);
        } else {
          console.log(result.output);
        }
      } else {
        logger.error(`${getRelativePath(file)}: ${result.error}`);
      }
    }
  };
  
  watcher.on('change', async (path) => {
    logger.info(`\nFile changed: ${getRelativePath(path)}`);
    await renderAll();
  });
  
  // Initial render
  await renderAll();
}

export const renderCommand = new Command('render')
  .description('Render a template with provided data')
  .argument('[template...]', 'Template file(s) or glob pattern')
  .option('-d, --data <source>', 'Data source (file path or inline JSON)')
  .option('-o, --output <file>', 'Output file (stdout if omitted)')
  .option('--output-dir <dir>', 'Output directory for multiple files')
  .option('-f, --format <format>', 'Data format: json, yaml, or auto (default: auto)')
  .option('-w, --watch', 'Watch for changes and re-render')
  .option('-r, --recursive', 'Process directories recursively')
  .action(async (templates: string[], options: RenderOptions) => {
    try {
      // Parse data
      let data: unknown = {};
      if (options.data) {
        data = await parseData(options.data, options.format);
      }
      
      // If no template arguments, read from stdin
      if (templates.length === 0) {
        const templateSource = await readStdin();
        const result = await renderTemplate(templateSource, data);
        
        if (options.output) {
          await writeFile(options.output, result);
          logger.success(`Output written to ${options.output}`);
        } else {
          console.log(result);
        }
        process.exit(EXIT_CODES.SUCCESS);
        return;
      }
      
      // Expand template paths
      const templateFiles: string[] = [];
      for (const templatePath of templates) {
        if (await isDirectory(templatePath)) {
          const files = await findFiles(
            templatePath,
            ['.fmt'],
            options.recursive ?? false
          );
          templateFiles.push(...files);
        } else if (await isFile(templatePath)) {
          templateFiles.push(templatePath);
        } else if (pathExists(templatePath)) {
          templateFiles.push(templatePath);
        } else {
          logger.error(`Template not found: ${templatePath}`);
          process.exit(EXIT_CODES.FAILURE);
          return;
        }
      }
      
      if (templateFiles.length === 0) {
        logger.error('No template files found');
        process.exit(EXIT_CODES.FAILURE);
        return;
      }
      
      // Watch mode
      if (options.watch) {
        if (!options.data) {
          logger.error('Watch mode requires --data option');
          process.exit(EXIT_CODES.INVALID_USAGE);
          return;
        }
        await watchFiles(templateFiles, options.data, options);
        return;
      }
      
      // Single file output
      if (templateFiles.length === 1 && !options.outputDir) {
        const filePath = templateFiles[0]!;
        const templateSource = await readFile(filePath);
        const result = await renderTemplate(templateSource, data, filePath);
        
        if (options.output) {
          await writeFile(options.output, result);
          logger.success(`Output written to ${options.output}`);
        } else {
          console.log(result);
        }
        process.exit(EXIT_CODES.SUCCESS);
        return;
      }
      
      // Multiple files
      const progress = createProgress({ text: 'Rendering templates...' });
      progress.start();
      
      let hasErrors = false;
      const results: { file: string; success: boolean; output?: string; error?: string }[] = [];
      
      for (const file of templateFiles) {
        const result = await processFile(file, data, options);
        results.push({ file, ...result });
        if (!result.success) {
          hasErrors = true;
        }
      }
      
      progress.stop();
      
      // Report results
      for (const result of results) {
        const relativePath = getRelativePath(result.file);
        if (result.success) {
          if (options.outputDir) {
            logger.success(`${relativePath} → ${result.output}`);
          } else {
            console.log(`\n--- ${relativePath} ---`);
            console.log(result.output);
          }
        } else {
          logger.error(`${relativePath}: ${result.error}`);
        }
      }
      
      process.exit(hasErrors ? EXIT_CODES.FAILURE : EXIT_CODES.SUCCESS);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(EXIT_CODES.FAILURE);
    }
  });

export default renderCommand;
