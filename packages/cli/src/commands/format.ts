/**
 * Format command - Format template files according to style guidelines
 */
import { Command } from 'commander';
import { 
  logger, 
  readFile, 
  writeFile,
  findFiles,
  isDirectory,
  pathExists,
  getRelativePath,
  createProgress,
  EXIT_CODES,
} from '../utils/index.js';

interface FormatOptions {
  recursive?: boolean;
  config?: string;
  check?: boolean;
  style?: 'compact' | 'expanded';
}

/**
 * Format a template string
 * Applies consistent formatting:
 * - Normalize whitespace around placeholders
 * - Consistent filter syntax
 * - Proper indentation
 */
function formatTemplate(source: string, style: 'compact' | 'expanded'): string {
  let result = source;
  
  // Normalize line endings
  result = result.replace(/\r\n/g, '\n');
  
  // Remove trailing whitespace from lines
  result = result.split('\n').map(line => line.trimEnd()).join('\n');
  
  // Normalize placeholder spacing
  // { name } -> {name}
  result = result.replace(/\{\s+/g, '{');
  result = result.replace(/\s+\}/g, '}');
  
  // Normalize filter spacing
  // {name | upper} -> {name|upper}
  // {name|  upper} -> {name|upper}
  result = result.replace(/\s*\|\s*/g, '|');
  
  // Normalize filter argument spacing
  // {count|plural:item, items} -> {count|plural:item,items} (compact)
  // {count|plural:item, items} -> {count|plural:item, items} (expanded)
  if (style === 'compact') {
    result = result.replace(/,\s+/g, ',');
  } else {
    // Ensure single space after comma in filter args
    result = result.replace(/,(\S)/g, ', $1');
  }
  
  // Remove consecutive blank lines (more than 2)
  result = result.replace(/\n{3,}/g, '\n\n');
  
  // Ensure file ends with single newline
  result = result.trimEnd() + '\n';
  
  return result;
}

/**
 * Format a single file
 */
async function formatFile(
  filePath: string,
  options: FormatOptions
): Promise<{ changed: boolean; original: string; formatted: string }> {
  const original = await readFile(filePath);
  const style = options.style ?? 'expanded';
  const formatted = formatTemplate(original, style);
  
  return {
    changed: original !== formatted,
    original,
    formatted,
  };
}

export const formatCommand = new Command('format')
  .description('Format template files according to style guidelines')
  .argument('[files...]', 'Template file(s) or directories to format')
  .option('-r, --recursive', 'Format directories recursively')
  .option('-c, --config <file>', 'Configuration file')
  .option('--check', 'Check formatting without modifying files')
  .option('-s, --style <style>', 'Formatting style: compact or expanded', 'expanded')
  .action(async (files: string[], options: FormatOptions) => {
    try {
      // Default to current directory if no files specified
      if (files.length === 0) {
        files = ['.'];
      }
      
      // Collect all template files
      const templateFiles: string[] = [];
      for (const filePath of files) {
        if (await isDirectory(filePath)) {
          const found = await findFiles(
            filePath,
            ['.fmt'],
            options.recursive ?? false
          );
          templateFiles.push(...found);
        } else if (pathExists(filePath)) {
          templateFiles.push(filePath);
        } else {
          logger.error(`File not found: ${filePath}`);
          process.exit(EXIT_CODES.FAILURE);
          return;
        }
      }
      
      if (templateFiles.length === 0) {
        logger.warn('No template files found');
        process.exit(EXIT_CODES.SUCCESS);
        return;
      }
      
      const progress = createProgress({ text: 'Formatting templates...' });
      if (templateFiles.length > 1) {
        progress.start();
      }
      
      let changedCount = 0;
      let unchangedCount = 0;
      const changedFiles: string[] = [];
      
      for (const file of templateFiles) {
        const result = await formatFile(file, options);
        
        if (result.changed) {
          changedCount++;
          changedFiles.push(file);
          
          if (!options.check) {
            await writeFile(file, result.formatted);
          }
        } else {
          unchangedCount++;
        }
      }
      
      progress.stop();
      
      // Report results
      if (options.check) {
        if (changedCount > 0) {
          logger.error(`${changedCount} file(s) need formatting:`);
          for (const file of changedFiles) {
            console.log(`  ${getRelativePath(file)}`);
          }
          process.exit(EXIT_CODES.FAILURE);
        } else {
          logger.success(`All ${templateFiles.length} file(s) are properly formatted`);
        }
      } else {
        if (changedCount > 0) {
          logger.success(`Formatted ${changedCount} file(s)`);
          for (const file of changedFiles) {
            console.log(`  ${getRelativePath(file)}`);
          }
        } else {
          logger.success(`All ${templateFiles.length} file(s) already formatted`);
        }
      }
      
      process.exit(EXIT_CODES.SUCCESS);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(EXIT_CODES.FAILURE);
    }
  });

export default formatCommand;
