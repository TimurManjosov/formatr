/**
 * Configuration file loading and merging
 */
import { readFile, pathExists } from './file-handler.js';
import { parseDataString } from './data-parser.js';
import { resolve, dirname } from 'node:path';

/**
 * CLI configuration interface
 */
export interface FormatrCliConfig {
  /** Template file extension */
  templateExtension?: string;
  /** Output directory for generated files */
  outputDir?: string;
  /** Data directory for batch operations */
  dataDir?: string;
  /** Default locale for internationalization */
  locale?: string;
  /** Custom filter definitions */
  filters?: Record<string, string>;
  /** Lint rule configuration */
  lint?: {
    rules?: Record<string, 'error' | 'warn' | 'off'>;
    extends?: string;
  };
  /** Format style options */
  format?: {
    style?: 'compact' | 'expanded';
    indentation?: number;
  };
  /** Watch mode configuration */
  watch?: {
    debounce?: number;
    extensions?: string[];
  };
}

/**
 * Configuration file names to search for (in order)
 */
const CONFIG_FILES = [
  '.formatrrc',
  '.formatrrc.json',
  '.formatrrc.yaml',
  '.formatrrc.yml',
  'formatr.config.js',
  'formatr.config.mjs',
  'formatr.config.cjs',
];

/**
 * Find configuration file in directory and parent directories
 */
async function findConfigFile(startDir: string): Promise<string | null> {
  let currentDir = resolve(startDir);
  const root = resolve('/');
  
  while (currentDir !== root) {
    for (const configFile of CONFIG_FILES) {
      const configPath = resolve(currentDir, configFile);
      if (pathExists(configPath)) {
        return configPath;
      }
    }
    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }
  
  return null;
}

/**
 * Load configuration from a specific file
 */
async function loadConfigFromFile(configPath: string): Promise<FormatrCliConfig> {
  const ext = configPath.split('.').pop()?.toLowerCase();
  
  // Handle JS config files
  if (ext === 'js' || ext === 'mjs' || ext === 'cjs') {
    try {
      const absolutePath = resolve(configPath);
      // Use dynamic import for JS files
      const configModule = await import(`file://${absolutePath}`);
      return configModule.default || configModule;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load config from ${configPath}: ${message}`);
    }
  }
  
  // Handle JSON/YAML config files
  const content = await readFile(configPath);
  
  // Empty or whitespace-only file
  if (!content.trim()) {
    return {};
  }
  
  // Detect format from extension or content
  const format = ext === 'yaml' || ext === 'yml' ? 'yaml' : 'json';
  return (await parseDataString(content, format)) as FormatrCliConfig;
}

/**
 * Load configuration with fallback to defaults
 */
export async function loadConfig(
  explicitConfigPath?: string,
  startDir: string = process.cwd()
): Promise<{ config: FormatrCliConfig; configPath: string | null }> {
  let configPath: string | null = null;
  
  if (explicitConfigPath) {
    if (!pathExists(explicitConfigPath)) {
      throw new Error(`Configuration file not found: ${explicitConfigPath}`);
    }
    configPath = resolve(explicitConfigPath);
  } else {
    configPath = await findConfigFile(startDir);
  }
  
  if (!configPath) {
    return { config: {}, configPath: null };
  }
  
  const config = await loadConfigFromFile(configPath);
  return { config, configPath };
}

/**
 * Merge CLI options with config file settings
 * CLI options take precedence over config file
 */
export function mergeConfig(
  cliOptions: Partial<FormatrCliConfig>,
  fileConfig: FormatrCliConfig
): FormatrCliConfig {
  return {
    ...fileConfig,
    ...cliOptions,
    // Deep merge for nested objects
    lint: {
      ...fileConfig.lint,
      ...cliOptions.lint,
      rules: {
        ...fileConfig.lint?.rules,
        ...cliOptions.lint?.rules,
      },
    },
    format: {
      ...fileConfig.format,
      ...cliOptions.format,
    },
    watch: {
      ...fileConfig.watch,
      ...cliOptions.watch,
    },
  };
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): FormatrCliConfig {
  return {
    templateExtension: '.fmt',
    outputDir: './dist',
    dataDir: './data',
    locale: 'en-US',
    lint: {
      rules: {},
      extends: 'recommended',
    },
    format: {
      style: 'expanded',
      indentation: 2,
    },
    watch: {
      debounce: 300,
      extensions: ['.fmt', '.json', '.yaml', '.yml'],
    },
  };
}
