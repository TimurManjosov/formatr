/**
 * Report command - Generate reports from templates and data
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
  createProgress,
  EXIT_CODES,
} from '../utils/index.js';
import { join, basename, extname } from 'node:path';

interface ReportOptions {
  template?: string;
  data?: string;
  dataDir?: string;
  outputDir?: string;
  format?: 'html' | 'markdown' | 'text';
  style?: string;
}

/**
 * Wrap content in HTML document
 */
function wrapHtml(content: string, title: string, style?: string): string {
  const styleTag = style 
    ? `<link rel="stylesheet" href="${style}">`
    : `<style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
               max-width: 800px; margin: 0 auto; padding: 20px; }
        pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
        code { background: #f5f5f5; padding: 2px 5px; }
      </style>`;
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${styleTag}
</head>
<body>
${content}
</body>
</html>`;
}

/**
 * Generate report from template and data
 */
async function generateReport(
  templatePath: string,
  dataPath: string,
  format: 'html' | 'markdown' | 'text',
  style?: string
): Promise<{ content: string; extension: string }> {
  const templateSource = await readFile(templatePath);
  const data = await parseData(dataPath);
  
  const renderFn = template(templateSource);
  const content = renderFn(data as Record<string, unknown>);
  
  switch (format) {
    case 'html': {
      const title = basename(templatePath, extname(templatePath));
      return { 
        content: wrapHtml(content, title, style), 
        extension: '.html' 
      };
    }
    case 'markdown':
      return { content, extension: '.md' };
    case 'text':
    default:
      return { content, extension: '.txt' };
  }
}

export const reportCommand = new Command('report')
  .description('Generate reports from templates and data')
  .option('-t, --template <file>', 'Template file')
  .option('-d, --data <file>', 'Data file (JSON or YAML)')
  .option('--data-dir <dir>', 'Data directory for batch generation')
  .option('-o, --output-dir <dir>', 'Output directory')
  .option('-f, --format <type>', 'Output format: html, markdown, text', 'text')
  .option('-s, --style <file>', 'CSS style file for HTML output')
  .action(async (options: ReportOptions) => {
    try {
      if (!options.template) {
        logger.error('Template file is required (--template)');
        process.exit(EXIT_CODES.INVALID_USAGE);
        return;
      }
      
      if (!pathExists(options.template)) {
        logger.error(`Template not found: ${options.template}`);
        process.exit(EXIT_CODES.FAILURE);
        return;
      }
      
      const format = options.format as 'html' | 'markdown' | 'text';
      
      // Batch mode with data directory
      if (options.dataDir) {
        if (!await isDirectory(options.dataDir)) {
          logger.error(`Data directory not found: ${options.dataDir}`);
          process.exit(EXIT_CODES.FAILURE);
          return;
        }
        
        const dataFiles = await findFiles(options.dataDir, ['.json', '.yaml', '.yml'], false);
        
        if (dataFiles.length === 0) {
          logger.warn('No data files found in directory');
          process.exit(EXIT_CODES.SUCCESS);
          return;
        }
        
        const outputDir = options.outputDir ?? './reports';
        const progress = createProgress({ text: 'Generating reports...' });
        progress.start();
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const dataFile of dataFiles) {
          try {
            const result = await generateReport(
              options.template,
              dataFile,
              format,
              options.style
            );
            
            const outputName = basename(dataFile, extname(dataFile)) + result.extension;
            const outputPath = join(outputDir, outputName);
            
            await writeFile(outputPath, result.content);
            successCount++;
          } catch (error) {
            logger.error(`Failed to generate report for ${getRelativePath(dataFile)}: ${error instanceof Error ? error.message : String(error)}`);
            errorCount++;
          }
        }
        
        progress.stop();
        
        logger.info(`Generated ${successCount} report(s)` + (errorCount > 0 ? `, ${errorCount} failed` : ''));
        
        if (options.outputDir) {
          logger.info(`Output directory: ${options.outputDir}`);
        }
        
        process.exit(errorCount > 0 ? EXIT_CODES.FAILURE : EXIT_CODES.SUCCESS);
        return;
      }
      
      // Single report mode
      if (!options.data) {
        logger.error('Data file is required (--data)');
        process.exit(EXIT_CODES.INVALID_USAGE);
        return;
      }
      
      const result = await generateReport(
        options.template,
        options.data,
        format,
        options.style
      );
      
      if (options.outputDir) {
        const outputName = basename(options.template, extname(options.template)) + result.extension;
        const outputPath = join(options.outputDir, outputName);
        await writeFile(outputPath, result.content);
        logger.success(`Report saved to ${outputPath}`);
      } else {
        console.log(result.content);
      }
      
      process.exit(EXIT_CODES.SUCCESS);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(EXIT_CODES.FAILURE);
    }
  });

export default reportCommand;
