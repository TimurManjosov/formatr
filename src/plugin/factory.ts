// src/plugin/factory.ts

import type { Plugin, PluginConfig, PluginRuntimeContext } from './types';
import { FormatrError } from '../core/errors';

/**
 * Validate plugin name format.
 * Names must be non-empty strings containing only alphanumeric characters, hyphens, and underscores.
 */
function validatePluginName(name: string): void {
  if (!name || typeof name !== 'string') {
    throw new FormatrError('Plugin must have a name (non-empty string)');
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new FormatrError(
      `Invalid plugin name "${name}". Names must contain only alphanumeric characters, hyphens, and underscores.`
    );
  }
}

/**
 * Validate plugin version format.
 * Versions must be valid semver strings (e.g., "1.0.0", "2.1.3-beta.1").
 */
function validatePluginVersion(version: string): void {
  if (!version || typeof version !== 'string') {
    throw new FormatrError('Plugin must have a version (non-empty string)');
  }
  if (!/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?$/.test(version)) {
    throw new FormatrError(
      `Invalid plugin version "${version}". Versions must follow semver format (e.g., "1.0.0").`
    );
  }
}

/**
 * Bind a function to a runtime context.
 * This allows plugin hooks to access `this` as the runtime context.
 */
function bindToContext<T extends (...args: any[]) => any>(
  fn: T | undefined,
  context: PluginRuntimeContext
): T | undefined {
  if (!fn) return undefined;
  return fn.bind(context) as T;
}

/**
 * Create a plugin with validation and context binding.
 * 
 * This factory function:
 * - Validates required fields (name, version)
 * - Normalizes absent sections to empty objects
 * - Binds lifecycle hooks and middleware to runtime context
 * - Preserves type inference for options and methods
 * 
 * @param config - Plugin configuration
 * @returns A validated plugin instance
 * 
 * @example
 * ```typescript
 * const myPlugin = createPlugin({
 *   name: 'my-plugin',
 *   version: '1.0.0',
 *   filters: {
 *     reverse: (value: string) => value.split('').reverse().join('')
 *   },
 *   middleware: {
 *     beforeRender: (template, context) => ({ template, context })
 *   }
 * });
 * ```
 */
export function createPlugin<Options = unknown, Methods extends object = object>(
  config: PluginConfig<Options, Methods>
): Plugin<Options, Methods> {
  // Validate required fields
  validatePluginName(config.name);
  validatePluginVersion(config.version);

  // Create the plugin with normalized structure
  // Use Object.assign to avoid exactOptionalPropertyTypes issues
  const plugin = {
    // Metadata
    name: config.name,
    version: config.version,
    dependencies: config.dependencies ?? {},

    // Extension points - normalized to empty objects
    filters: config.filters ?? {},
    loaders: config.loaders ?? {},
    parsers: config.parsers ?? {},
    formatters: config.formatters ?? {},
    middleware: config.middleware ?? {},
    transforms: config.transforms ?? {},
    methods: config.methods ?? ({} as Methods),
  } as Plugin<Options, Methods>;

  // Only add optional properties if they exist
  if (config.description !== undefined) plugin.description = config.description;
  if (config.author !== undefined) plugin.author = config.author;
  if (config.init !== undefined) plugin.init = config.init;
  if (config.cleanup !== undefined) plugin.cleanup = config.cleanup;

  return plugin;
}

/**
 * Bind all plugin hooks to a runtime context.
 * Called by PluginManager during registration to set up the runtime environment.
 * 
 * @param plugin - The plugin to bind
 * @param runtime - The runtime context to bind to
 * @returns Plugin with all hooks bound to the runtime context
 */
export function bindPluginToRuntime<Options = unknown, Methods extends object = object>(
  plugin: Plugin<Options, Methods>,
  runtime: PluginRuntimeContext<Options, Methods>
): Plugin<Options, Methods> {
  // Build the bound plugin step by step to avoid exactOptionalPropertyTypes issues
  const bound: Plugin<Options, Methods> = {
    name: plugin.name,
    version: plugin.version,
    dependencies: plugin.dependencies ?? {},
    filters: plugin.filters ?? {},
    loaders: plugin.loaders ?? {},
    parsers: plugin.parsers ?? {},
    formatters: plugin.formatters ?? {},
    transforms: plugin.transforms ?? {},
    methods: plugin.methods ?? ({} as Methods),
    middleware: {},
  };

  // Copy optional metadata only if present
  if (plugin.description !== undefined) bound.description = plugin.description;
  if (plugin.author !== undefined) bound.author = plugin.author;

  // Bind lifecycle hooks only if they exist
  const boundInit = bindToContext(plugin.init, runtime);
  const boundCleanup = bindToContext(plugin.cleanup, runtime);
  if (boundInit) bound.init = boundInit;
  if (boundCleanup) bound.cleanup = boundCleanup;

  // Bind middleware hooks only if they exist
  if (plugin.middleware) {
    const middleware: Record<string, unknown> = {};
    const boundBeforeRender = bindToContext(plugin.middleware.beforeRender, runtime);
    const boundAfterRender = bindToContext(plugin.middleware.afterRender, runtime);
    const boundOnError = bindToContext(plugin.middleware.onError, runtime);
    
    if (boundBeforeRender) middleware.beforeRender = boundBeforeRender;
    if (boundAfterRender) middleware.afterRender = boundAfterRender;
    if (boundOnError) middleware.onError = boundOnError;
    
    (bound as any).middleware = middleware;
  }

  // Bind filters to runtime context
  if (plugin.filters) {
    const boundFilters: Record<string, unknown> = {};
    for (const [key, filter] of Object.entries(plugin.filters)) {
      if (typeof filter === 'function') {
        boundFilters[key] = filter.bind(runtime);
      } else {
        boundFilters[key] = filter;
      }
    }
    bound.filters = boundFilters as typeof bound.filters;
  }

  // Bind custom methods
  if (plugin.methods) {
    const boundMethods: Record<string, unknown> = {};
    for (const [key, method] of Object.entries(plugin.methods)) {
      if (typeof method === 'function') {
        boundMethods[key] = method.bind(runtime);
      } else {
        boundMethods[key] = method;
      }
    }
    bound.methods = boundMethods as Methods;
    // Also update runtime methods
    runtime.methods = boundMethods as Methods;
  }

  return bound;
}

/**
 * Check if a function is async (returns a Promise).
 */
export function isAsyncFunction(fn: unknown): boolean {
  if (typeof fn !== 'function') return false;
  return fn.constructor.name === 'AsyncFunction';
}

/**
 * Check if a plugin has any async hooks.
 */
export function hasAsyncHooks(plugin: Plugin): boolean {
  if (plugin.init && isAsyncFunction(plugin.init)) return true;
  if (plugin.cleanup && isAsyncFunction(plugin.cleanup)) return true;
  if (plugin.middleware?.beforeRender && isAsyncFunction(plugin.middleware.beforeRender)) return true;
  if (plugin.middleware?.afterRender && isAsyncFunction(plugin.middleware.afterRender)) return true;
  if (plugin.middleware?.onError && isAsyncFunction(plugin.middleware.onError)) return true;
  return false;
}
