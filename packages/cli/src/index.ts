/**
 * @formatr/cli - Programmatic API
 * 
 * This module exports the CLI commands and utilities for programmatic use.
 */

// Export commands for programmatic use
export {
  renderCommand,
  validateCommand,
  analyzeCommand,
  benchmarkCommand,
  reportCommand,
  watchCommand,
  initCommand,
  formatCommand,
  lintCommand,
  playgroundCommand,
} from './commands/index.js';

// Export utilities
export {
  logger,
  setNoColor,
  readFile,
  writeFile,
  pathExists,
  isDirectory,
  isFile,
  findFiles,
  expandGlob,
  getRelativePath,
  resolvePath,
  parseData,
  parseDataString,
  serializeData,
  loadConfig,
  mergeConfig,
  getDefaultConfig,
  createProgress,
  createProgressBar,
  Progress,
  ProgressBar,
  EXIT_CODES,
  type DataFormat,
  type FormatrCliConfig,
  type ProgressOptions,
  type ExitCode,
} from './utils/index.js';
