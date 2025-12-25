/**
 * Validate command - Validate template syntax and structure
 */
import { Command } from 'commander';
import { analyze, type AnalysisReport, type Diagnostic } from '@timur_manjosov/formatr';
import { 
  logger, 
  readFile, 
  findFiles, 
  isDirectory,
  isFile,
  pathExists,
  parseData,
  getRelativePath,
  createProgress,
  EXIT_CODES,
} from '../utils/index.js';

interface ValidateOptions {
  recursive?: boolean;
  schema?: string;
  strict?: boolean;
  json?: boolean;
  context?: string;
}

interface ValidationResult {
  file: string;
  valid: boolean;
  errors: Diagnostic[];
  warnings: Diagnostic[];
}

/**
 * Validate a single template
 */
async function validateTemplate(
  filePath: string,
  options: ValidateOptions
): Promise<ValidationResult> {
  const source = await readFile(filePath);
  
  // Load context if provided
  let context: unknown;
  if (options.context) {
    context = await parseData(options.context);
  }
  
  const analyzeOptions: Parameters<typeof analyze>[1] = {
    context,
    onMissing: options.strict ? 'error' : 'keep',
  };
  if (options.strict !== undefined) {
    analyzeOptions.strictKeys = options.strict;
  }
  const report: AnalysisReport = analyze(source, analyzeOptions);
  
  const errors = report.messages.filter(m => m.severity === 'error');
  const warnings = report.messages.filter(m => m.severity === 'warning');
  
  // In strict mode, treat warnings as errors
  const effectiveErrors = options.strict ? [...errors, ...warnings] : errors;
  const effectiveWarnings = options.strict ? [] : warnings;
  
  return {
    file: filePath,
    valid: effectiveErrors.length === 0,
    errors: effectiveErrors,
    warnings: effectiveWarnings,
  };
}

/**
 * Format a diagnostic message for console output
 */
function formatDiagnostic(diag: Diagnostic, file: string): string {
  const location = diag.range 
    ? `${diag.range.start.line}:${diag.range.start.column}`
    : '';
  const relativePath = getRelativePath(file);
  return `  ${relativePath}:${location} - ${diag.message}`;
}

export const validateCommand = new Command('validate')
  .description('Validate template syntax and structure')
  .argument('[files...]', 'Template file(s) or directories to validate')
  .option('-r, --recursive', 'Validate directories recursively')
  .option('-s, --schema <file>', 'Validate against a JSON schema')
  .option('--strict', 'Treat warnings as errors')
  .option('--json', 'Output results as JSON')
  .option('-c, --context <file>', 'Context data file for validating placeholders')
  .action(async (files: string[], options: ValidateOptions) => {
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
        } else if (await isFile(filePath)) {
          templateFiles.push(filePath);
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
      
      // Validate all templates
      const progress = createProgress({ text: 'Validating templates...' });
      if (!options.json && templateFiles.length > 1) {
        progress.start();
      }
      
      const results: ValidationResult[] = [];
      for (const file of templateFiles) {
        const result = await validateTemplate(file, options);
        results.push(result);
      }
      
      progress.stop();
      
      // Output results
      if (options.json) {
        const output = results.map(r => ({
          file: getRelativePath(r.file),
          valid: r.valid,
          errors: r.errors.map(e => ({
            code: e.code,
            message: e.message,
            severity: e.severity,
            range: e.range,
          })),
          warnings: r.warnings.map(w => ({
            code: w.code,
            message: w.message,
            severity: w.severity,
            range: w.range,
          })),
        }));
        console.log(JSON.stringify(output, null, 2));
      } else {
        let hasErrors = false;
        let hasWarnings = false;
        
        for (const result of results) {
          const relativePath = getRelativePath(result.file);
          
          if (result.errors.length > 0) {
            hasErrors = true;
            logger.error(relativePath);
            for (const error of result.errors) {
              console.log(formatDiagnostic(error, result.file));
            }
          } else if (result.warnings.length > 0) {
            hasWarnings = true;
            logger.warn(relativePath);
            for (const warning of result.warnings) {
              console.log(formatDiagnostic(warning, result.file));
            }
          } else {
            logger.success(relativePath);
          }
        }
        
        // Summary
        const totalFiles = results.length;
        const validFiles = results.filter(r => r.valid).length;
        const invalidFiles = totalFiles - validFiles;
        
        console.log();
        if (invalidFiles > 0) {
          logger.info(`Validated ${totalFiles} file(s): ${logger.colored.red(`${invalidFiles} invalid`)}, ${logger.colored.green(`${validFiles} valid`)}`);
        } else if (hasWarnings) {
          logger.info(`Validated ${totalFiles} file(s): ${logger.colored.yellow('warnings found')}, ${logger.colored.green(`${validFiles} valid`)}`);
        } else {
          logger.info(`Validated ${totalFiles} file(s): ${logger.colored.green('all valid')}`);
        }
      }
      
      // Exit code
      const hasErrors = results.some(r => !r.valid);
      process.exit(hasErrors ? EXIT_CODES.FAILURE : EXIT_CODES.SUCCESS);
    } catch (error) {
      if (options.json) {
        console.log(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
      } else {
        logger.error(error instanceof Error ? error.message : String(error));
      }
      process.exit(EXIT_CODES.FAILURE);
    }
  });

export default validateCommand;
