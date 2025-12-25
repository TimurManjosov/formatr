#!/usr/bin/env node
/**
 * @formatr/cli - Command Line Interface for formatr template library
 */
import { Command } from 'commander';
import { setNoColor } from './utils/index.js';
import {
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

const program = new Command();

program
  .name('formatr')
  .description('CLI tools for the formatr template library')
  .version('1.0.0')
  .option('--no-color', 'Disable colored output')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts['color'] === false) {
      setNoColor(true);
    }
  });

// Register all commands
program.addCommand(renderCommand);
program.addCommand(validateCommand);
program.addCommand(analyzeCommand);
program.addCommand(benchmarkCommand);
program.addCommand(reportCommand);
program.addCommand(watchCommand);
program.addCommand(initCommand);
program.addCommand(formatCommand);
program.addCommand(lintCommand);
program.addCommand(playgroundCommand);

program.parse(process.argv);
