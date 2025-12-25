/**
 * Analyze command - Analyze template complexity and characteristics
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
  getRelativePath,
  EXIT_CODES,
} from '../utils/index.js';

interface AnalyzeOptions {
  detailed?: boolean;
  compare?: boolean;
  json?: boolean;
  threshold?: string;
  showDependencies?: boolean;
}

interface TemplateMetrics {
  file: string;
  placeholderCount: number;
  filterCount: number;
  uniqueFilters: string[];
  complexity: number;
  lineCount: number;
  characterCount: number;
  issues: Diagnostic[];
  nestedDepth: number;
}

/**
 * Calculate complexity score for a template
 * Based on number of placeholders, filters, and nesting
 */
function calculateComplexity(source: string, report: AnalysisReport): number {
  // Base complexity from template length
  let complexity = Math.floor(source.length / 100);
  
  // Count placeholders (simple regex)
  const placeholderMatches = source.match(/\{[^}]+\}/g) || [];
  complexity += placeholderMatches.length;
  
  // Count filters
  const filterMatches = source.match(/\|[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
  complexity += filterMatches.length * 0.5;
  
  // Add complexity for issues
  complexity += report.messages.filter(m => m.severity === 'error').length * 2;
  complexity += report.messages.filter(m => m.severity === 'warning').length;
  
  return Math.round(complexity);
}

/**
 * Analyze a single template
 */
async function analyzeTemplate(filePath: string): Promise<TemplateMetrics> {
  const source = await readFile(filePath);
  const report = analyze(source);
  
  // Extract metrics
  const placeholderMatches = source.match(/\{[^{}]+\}/g) || [];
  const filterMatches = source.match(/\|([a-zA-Z_][a-zA-Z0-9_]*)/g) || [];
  const uniqueFilters = [...new Set(filterMatches.map(f => f.slice(1)))];
  
  // Calculate nesting depth (simple approximation)
  let maxDepth = 0;
  let currentDepth = 0;
  for (const char of source) {
    if (char === '{') {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    } else if (char === '}') {
      currentDepth = Math.max(0, currentDepth - 1);
    }
  }
  
  return {
    file: filePath,
    placeholderCount: placeholderMatches.length,
    filterCount: filterMatches.length,
    uniqueFilters,
    complexity: calculateComplexity(source, report),
    lineCount: source.split('\n').length,
    characterCount: source.length,
    issues: report.messages,
    nestedDepth: maxDepth,
  };
}

/**
 * Format metrics for console output
 */
function formatMetrics(metrics: TemplateMetrics, detailed: boolean): void {
  const relativePath = getRelativePath(metrics.file);
  
  console.log(logger.colored.bold(`\n${relativePath}`));
  console.log(`  Complexity: ${getComplexityColor(metrics.complexity)}`);
  console.log(`  Placeholders: ${metrics.placeholderCount}`);
  console.log(`  Filters: ${metrics.filterCount} (${metrics.uniqueFilters.length} unique)`);
  
  if (detailed) {
    console.log(`  Lines: ${metrics.lineCount}`);
    console.log(`  Characters: ${metrics.characterCount}`);
    console.log(`  Max nesting depth: ${metrics.nestedDepth}`);
    
    if (metrics.uniqueFilters.length > 0) {
      console.log(`  Unique filters: ${metrics.uniqueFilters.join(', ')}`);
    }
    
    if (metrics.issues.length > 0) {
      console.log(`  Issues: ${metrics.issues.length}`);
      for (const issue of metrics.issues) {
        const icon = issue.severity === 'error' ? logger.colored.red('✗') : logger.colored.yellow('⚠');
        console.log(`    ${icon} ${issue.message}`);
      }
    }
  }
}

/**
 * Get colored complexity indicator
 */
function getComplexityColor(complexity: number): string {
  if (complexity <= 5) {
    return logger.colored.green(`${complexity} (low)`);
  } else if (complexity <= 15) {
    return logger.colored.yellow(`${complexity} (medium)`);
  } else {
    return logger.colored.red(`${complexity} (high)`);
  }
}

/**
 * Parse threshold option (e.g., "complexity=10")
 */
function parseThreshold(threshold: string): { field: string; value: number } | null {
  const match = threshold.match(/^(\w+)=(\d+)$/);
  if (!match) return null;
  return { field: match[1]!, value: parseInt(match[2]!, 10) };
}

export const analyzeCommand = new Command('analyze')
  .description('Analyze template complexity and performance characteristics')
  .argument('[files...]', 'Template file(s) to analyze')
  .option('-d, --detailed', 'Show detailed metrics')
  .option('--compare', 'Compare multiple templates side by side')
  .option('--json', 'Output results as JSON')
  .option('-t, --threshold <spec>', 'Set threshold for CI (e.g., complexity=10)')
  .option('--show-dependencies', 'Show template dependencies')
  .action(async (files: string[], options: AnalyzeOptions) => {
    try {
      // Default to current directory if no files specified
      if (files.length === 0) {
        files = ['.'];
      }
      
      // Collect all template files
      const templateFiles: string[] = [];
      for (const filePath of files) {
        if (await isDirectory(filePath)) {
          const found = await findFiles(filePath, ['.fmt'], true);
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
      
      // Analyze all templates
      const results: TemplateMetrics[] = [];
      for (const file of templateFiles) {
        const metrics = await analyzeTemplate(file);
        results.push(metrics);
      }
      
      // Check thresholds
      let thresholdExceeded = false;
      if (options.threshold) {
        const threshold = parseThreshold(options.threshold);
        if (threshold) {
          for (const result of results) {
            let value: number | undefined;
            switch (threshold.field) {
              case 'complexity':
                value = result.complexity;
                break;
              case 'placeholderCount':
                value = result.placeholderCount;
                break;
              case 'filterCount':
                value = result.filterCount;
                break;
              case 'lineCount':
                value = result.lineCount;
                break;
              case 'nestedDepth':
                value = result.nestedDepth;
                break;
            }
            if (value !== undefined && value > threshold.value) {
              thresholdExceeded = true;
            }
          }
        }
      }
      
      // Output results
      if (options.json) {
        const output = results.map(r => ({
          file: getRelativePath(r.file),
          placeholderCount: r.placeholderCount,
          filterCount: r.filterCount,
          uniqueFilters: r.uniqueFilters,
          complexity: r.complexity,
          lineCount: r.lineCount,
          characterCount: r.characterCount,
          nestedDepth: r.nestedDepth,
          issues: r.issues.map(i => ({
            code: i.code,
            message: i.message,
            severity: i.severity,
          })),
        }));
        console.log(JSON.stringify(output, null, 2));
      } else if (options.compare && results.length > 1) {
        // Comparison table
        console.log('\n' + logger.colored.bold('Template Comparison'));
        console.log('─'.repeat(80));
        
        const headers = ['File', 'Complexity', 'Placeholders', 'Filters', 'Lines'];
        const rows = results.map(r => [
          getRelativePath(r.file).slice(0, 30),
          String(r.complexity),
          String(r.placeholderCount),
          String(r.filterCount),
          String(r.lineCount),
        ]);
        
        // Simple table output
        const colWidths = headers.map((h, i) => 
          Math.max(h.length, ...rows.map(row => row[i]?.length ?? 0))
        );
        
        console.log(headers.map((h, i) => h.padEnd(colWidths[i] ?? 0)).join(' | '));
        console.log(colWidths.map(w => '─'.repeat(w)).join('─┼─'));
        for (const row of rows) {
          console.log(row.map((cell, i) => cell.padEnd(colWidths[i] ?? 0)).join(' | '));
        }
      } else {
        // Standard output
        for (const result of results) {
          formatMetrics(result, options.detailed ?? false);
        }
        
        // Summary
        if (results.length > 1) {
          const totalComplexity = results.reduce((sum, r) => sum + r.complexity, 0);
          const avgComplexity = Math.round(totalComplexity / results.length);
          console.log('\n' + logger.colored.bold('Summary'));
          console.log(`  Total files: ${results.length}`);
          console.log(`  Average complexity: ${avgComplexity}`);
          console.log(`  Total placeholders: ${results.reduce((sum, r) => sum + r.placeholderCount, 0)}`);
        }
      }
      
      // Exit with appropriate code
      if (thresholdExceeded) {
        logger.error(`Threshold exceeded: ${options.threshold}`);
        process.exit(EXIT_CODES.FAILURE);
      }
      
      process.exit(EXIT_CODES.SUCCESS);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(EXIT_CODES.FAILURE);
    }
  });

export default analyzeCommand;
