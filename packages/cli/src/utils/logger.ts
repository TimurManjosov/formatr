/**
 * Logger utility with color support and --no-color handling
 */
import chalk from 'chalk';

let noColor = false;

/**
 * Check if colors should be disabled based on environment
 */
function shouldDisableColor(): boolean {
  // Check explicit flags
  if (noColor) return true;
  
  // Check NO_COLOR environment variable (https://no-color.org/)
  if (process.env['NO_COLOR'] !== undefined) return true;
  
  // Check FORCE_COLOR override
  if (process.env['FORCE_COLOR'] !== undefined) return false;
  
  // Check if stdout is a TTY
  if (!process.stdout.isTTY) return true;
  
  return false;
}

/**
 * Apply coloring if enabled, otherwise return plain string
 */
function applyColor(colorFn: (s: string) => string, text: string): string {
  if (shouldDisableColor()) {
    return text;
  }
  return colorFn(text);
}

/**
 * Set the no-color flag
 */
export function setNoColor(value: boolean): void {
  noColor = value;
}

/**
 * Logger with consistent formatting and color support
 */
export const logger = {
  info(message: string, ...args: unknown[]): void {
    console.log(message, ...args);
  },
  
  success(message: string, ...args: unknown[]): void {
    console.log(applyColor(chalk.green, '✓'), message, ...args);
  },
  
  warn(message: string, ...args: unknown[]): void {
    console.warn(applyColor(chalk.yellow, '⚠'), message, ...args);
  },
  
  error(message: string, ...args: unknown[]): void {
    console.error(applyColor(chalk.red, '✗'), message, ...args);
  },
  
  debug(message: string, ...args: unknown[]): void {
    if (process.env['DEBUG']) {
      console.log(applyColor(chalk.gray, '[debug]'), message, ...args);
    }
  },
  
  /**
   * Log with custom color
   */
  colored: {
    cyan(message: string): string {
      return applyColor(chalk.cyan, message);
    },
    green(message: string): string {
      return applyColor(chalk.green, message);
    },
    yellow(message: string): string {
      return applyColor(chalk.yellow, message);
    },
    red(message: string): string {
      return applyColor(chalk.red, message);
    },
    gray(message: string): string {
      return applyColor(chalk.gray, message);
    },
    bold(message: string): string {
      return applyColor(chalk.bold, message);
    },
  },
};

export default logger;
