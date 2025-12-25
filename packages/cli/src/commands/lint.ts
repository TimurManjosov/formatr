/**
 * Lint command - Lint templates for best practices and potential issues
 */
import { Command } from 'commander';
import { analyze, type Diagnostic } from '@timur_manjosov/formatr';
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

interface LintOptions {
  recursive?: boolean;
  config?: string;
  fix?: boolean;
  rules?: string;
  json?: boolean;
}

/**
 * Additional lint rules beyond the core analyzer
 */
interface LintRule {
  id: string;
  description: string;
  severity: 'error' | 'warning';
  check: (source: string) => LintIssue[];
  fix?: (source: string) => string;
}

interface LintIssue {
  rule: string;
  message: string;
  line: number;
  column: number;
  severity: 'error' | 'warning';
  fixable?: boolean;
}

/**
 * Built-in lint rules
 */
const LINT_RULES: LintRule[] = [
  {
    id: 'no-empty-placeholders',
    description: 'Disallow empty placeholders',
    severity: 'error',
    check: (source) => {
      const issues: LintIssue[] = [];
      const regex = /\{\s*\}/g;
      let match;
      
      while ((match = regex.exec(source)) !== null) {
        const beforeMatch = source.substring(0, match.index);
        const line = (beforeMatch.match(/\n/g) || []).length + 1;
        const lastNewline = beforeMatch.lastIndexOf('\n');
        const column = match.index - lastNewline;
        
        issues.push({
          rule: 'no-empty-placeholders',
          message: 'Empty placeholder detected',
          line,
          column,
          severity: 'error',
        });
      }
      
      return issues;
    },
  },
  {
    id: 'no-duplicate-filters',
    description: 'Disallow duplicate consecutive filters',
    severity: 'warning',
    check: (source) => {
      const issues: LintIssue[] = [];
      // Match patterns like {name|upper|upper}
      const regex = /\|(\w+)\|(\w+)/g;
      let match;
      
      while ((match = regex.exec(source)) !== null) {
        if (match[1] === match[2]) {
          const beforeMatch = source.substring(0, match.index);
          const line = (beforeMatch.match(/\n/g) || []).length + 1;
          const lastNewline = beforeMatch.lastIndexOf('\n');
          const column = match.index - lastNewline;
          
          issues.push({
            rule: 'no-duplicate-filters',
            message: `Duplicate filter "${match[1]}" detected`,
            line,
            column,
            severity: 'warning',
            fixable: true,
          });
        }
      }
      
      return issues;
    },
    fix: (source) => {
      // Remove duplicate consecutive filters
      return source.replace(/\|(\w+)\|\1(?=\||\})/g, '|$1');
    },
  },
  {
    id: 'consistent-spacing',
    description: 'Enforce consistent spacing in placeholders',
    severity: 'warning',
    check: (source) => {
      const issues: LintIssue[] = [];
      // Check for inconsistent spacing
      const inconsistentRegex = /\{\s+\w|\w\s+\}/g;
      let match;
      
      while ((match = inconsistentRegex.exec(source)) !== null) {
        const beforeMatch = source.substring(0, match.index);
        const line = (beforeMatch.match(/\n/g) || []).length + 1;
        const lastNewline = beforeMatch.lastIndexOf('\n');
        const column = match.index - lastNewline;
        
        issues.push({
          rule: 'consistent-spacing',
          message: 'Inconsistent spacing in placeholder',
          line,
          column,
          severity: 'warning',
          fixable: true,
        });
      }
      
      return issues;
    },
    fix: (source) => {
      return source
        .replace(/\{\s+/g, '{')
        .replace(/\s+\}/g, '}');
    },
  },
  {
    id: 'no-nested-braces',
    description: 'Disallow nested braces in placeholders',
    severity: 'error',
    check: (source) => {
      const issues: LintIssue[] = [];
      // Simplified depth-based check for nested single braces (ignores escaped/templating syntax)
      let depth = 0;
      let startPos = -1;
      
      for (let i = 0; i < source.length; i++) {
        const char = source[i];
        if (char === '{' && source[i + 1] !== '{') {
          if (depth === 1) {
            // Nested brace
            const beforeMatch = source.substring(0, i);
            const line = (beforeMatch.match(/\n/g) || []).length + 1;
            const lastNewline = beforeMatch.lastIndexOf('\n');
            const column = i - lastNewline;
            
            issues.push({
              rule: 'no-nested-braces',
              message: 'Nested braces detected',
              line,
              column,
              severity: 'error',
            });
          }
          depth++;
          if (startPos === -1) startPos = i;
        } else if (char === '}' && source[i - 1] !== '}') {
          depth = Math.max(0, depth - 1);
          if (depth === 0) startPos = -1;
        }
      }
      
      return issues;
    },
  },
];

/**
 * Get enabled rules based on ruleset
 */
function getEnabledRules(ruleset: string): LintRule[] {
  if (ruleset === 'recommended') {
    return LINT_RULES;
  }
  // Custom rulesets could be implemented here
  return LINT_RULES;
}

/**
 * Lint a single file
 */
async function lintFile(
  filePath: string,
  rules: LintRule[],
  fix: boolean
): Promise<{ issues: LintIssue[]; fixed: boolean }> {
  let source = await readFile(filePath);
  const issues: LintIssue[] = [];
  let fixed = false;
  
  // Run core analyzer
  const report = analyze(source);
  for (const diag of report.messages) {
    issues.push({
      rule: diag.code,
      message: diag.message,
      line: diag.range?.start.line ?? 1,
      column: diag.range?.start.column ?? 1,
      severity: diag.severity as 'error' | 'warning',
    });
  }
  
  // Run custom lint rules
  for (const rule of rules) {
    const ruleIssues = rule.check(source);
    issues.push(...ruleIssues);
    
    // Apply fixes if requested
    if (fix && rule.fix) {
      const fixableIssues = ruleIssues.filter(i => i.fixable);
      if (fixableIssues.length > 0) {
        source = rule.fix(source);
        fixed = true;
      }
    }
  }
  
  // Write fixed content back
  if (fixed) {
    await writeFile(filePath, source);
  }
  
  return { issues, fixed };
}

export const lintCommand = new Command('lint')
  .description('Lint templates for best practices and potential issues')
  .argument('[files...]', 'Template file(s) or directories to lint')
  .option('-r, --recursive', 'Lint directories recursively')
  .option('-c, --config <file>', 'Configuration file')
  .option('--fix', 'Fix auto-fixable issues')
  .option('--rules <ruleset>', 'Rule set to use: recommended', 'recommended')
  .option('--json', 'Output results as JSON')
  .action(async (files: string[], options: LintOptions) => {
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
      
      const rules = getEnabledRules(options.rules ?? 'recommended');
      
      const progress = createProgress({ text: 'Linting templates...' });
      if (!options.json && templateFiles.length > 1) {
        progress.start();
      }
      
      const results: Array<{ file: string; issues: LintIssue[]; fixed: boolean }> = [];
      let totalIssues = 0;
      let totalFixed = 0;
      
      for (const file of templateFiles) {
        const result = await lintFile(file, rules, options.fix ?? false);
        results.push({ file, ...result });
        totalIssues += result.issues.length;
        if (result.fixed) totalFixed++;
      }
      
      progress.stop();
      
      // Output results
      if (options.json) {
        const output = results.map(r => ({
          file: getRelativePath(r.file),
          issues: r.issues,
          fixed: r.fixed,
        }));
        console.log(JSON.stringify(output, null, 2));
      } else {
        let hasErrors = false;
        
        for (const result of results) {
          if (result.issues.length === 0) continue;
          
          const relativePath = getRelativePath(result.file);
          console.log(`\n${logger.colored.bold(relativePath)}${result.fixed ? logger.colored.green(' (fixed)') : ''}`);
          
          for (const issue of result.issues) {
            const icon = issue.severity === 'error' 
              ? logger.colored.red('✗') 
              : logger.colored.yellow('⚠');
            
            if (issue.severity === 'error') hasErrors = true;
            
            console.log(`  ${icon} ${issue.line}:${issue.column} ${issue.message} (${logger.colored.gray(issue.rule)})`);
          }
        }
        
        // Summary
        console.log();
        if (totalIssues === 0) {
          logger.success(`Linted ${templateFiles.length} file(s) with no issues`);
        } else {
          const errorCount = results.reduce(
            (sum, r) => sum + r.issues.filter(i => i.severity === 'error').length,
            0
          );
          const warningCount = totalIssues - errorCount;
          
          logger.info(
            `Found ${totalIssues} issue(s) in ${results.filter(r => r.issues.length > 0).length} file(s): ` +
            `${logger.colored.red(`${errorCount} error(s)`)}, ${logger.colored.yellow(`${warningCount} warning(s)`)}`
          );
          
          if (totalFixed > 0) {
            logger.success(`Fixed ${totalFixed} file(s)`);
          }
        }
        
        if (hasErrors) {
          process.exit(EXIT_CODES.FAILURE);
        }
      }
      
      process.exit(EXIT_CODES.SUCCESS);
    } catch (error) {
      if (options.json) {
        console.log(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
      } else {
        logger.error(error instanceof Error ? error.message : String(error));
      }
      process.exit(EXIT_CODES.FAILURE);
    }
  });

export default lintCommand;
