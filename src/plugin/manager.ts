// src/plugin/manager.ts

import type {
  Plugin,
  PluginInstance,
  PluginRuntimeContext,
  PluginManagerOptions,
  BeforeRenderResult,
  RenderMetadata,
  ErrorContext,
  RenderOptions,
} from './types';
import { bindPluginToRuntime, hasAsyncHooks, isAsyncFunction } from './factory';
import { satisfies } from './version';
import { FormatrError } from '../core/errors';

/**
 * Default warning handler - outputs to console.warn
 */
const defaultWarningHandler = (message: string): void => {
  console.warn(`[formatr] ${message}`);
};

/**
 * Manages plugin registration, lifecycle, and hook execution.
 * 
 * Features:
 * - Plugin registration with dependency checking
 * - Deterministic execution order (registration order)
 * - Lifecycle hooks (init, cleanup)
 * - Render pipeline hooks (beforeRender, afterRender, onError)
 * - Filter conflict detection
 * - Circular dependency detection
 */
export class PluginManager {
  /** Map of plugin name to plugin instance */
  private plugins: Map<string, PluginInstance> = new Map();
  
  /** Ordered list of plugin names (registration order) */
  private pluginOrder: string[] = [];
  
  /** Set of registered filter names to their source plugin */
  private filterRegistry: Map<string, string> = new Map();
  
  /** Manager options */
  private options: Required<PluginManagerOptions>;

  constructor(options: PluginManagerOptions = {}) {
    this.options = {
      filterConflict: options.filterConflict ?? 'last-wins',
      onWarning: options.onWarning ?? defaultWarningHandler,
    };
  }

  /**
   * Shared registration logic used by both register() and registerSync().
   * Validates, binds, and stores the plugin but does NOT call init.
   */
  private prepareRegistration<Options = unknown, Methods extends object = object>(
    plugin: Plugin<Options, Methods>,
    pluginOptions?: Options
  ): { boundPlugin: Plugin<Options, Methods>; instance: PluginInstance<Options, Methods> } {
    const name = plugin.name;

    // Check if plugin is already registered
    if (this.plugins.has(name)) {
      throw new FormatrError(`Plugin "${name}" is already registered`);
    }

    // Check dependencies before registration
    this.checkDependencies(plugin);

    // Check for circular dependencies
    this.checkCircularDependencies(plugin);

    // Create runtime context
    const runtime: PluginRuntimeContext<Options, Methods> = {
      options: pluginOptions as Options,
      state: {},
      getPlugin: (pluginName: string) => this.get(pluginName),
      methods: {} as Methods,
    };

    // Bind plugin hooks to runtime context
    const boundPlugin = bindPluginToRuntime(plugin, runtime);

    // Check for filter conflicts
    if (plugin.filters) {
      for (const filterName of Object.keys(plugin.filters)) {
        const existingPlugin = this.filterRegistry.get(filterName);
        if (existingPlugin) {
          if (this.options.filterConflict === 'error') {
            throw new FormatrError(
              `Filter "${filterName}" is already registered by plugin "${existingPlugin}". ` +
              `Plugin "${name}" cannot register it again.`
            );
          }
          this.options.onWarning(
            `Filter "${filterName}" from plugin "${name}" overrides filter from plugin "${existingPlugin}"`
          );
        }
        this.filterRegistry.set(filterName, name);
      }
    }

    // Create plugin instance
    const instance: PluginInstance<Options, Methods> = {
      plugin: boundPlugin,
      runtime,
      hasAsyncHooks: hasAsyncHooks(plugin),
    };

    // Store plugin
    this.plugins.set(name, instance as unknown as PluginInstance);
    this.pluginOrder.push(name);

    return { boundPlugin, instance };
  }

  /**
   * Register a plugin with the manager.
   * @param plugin - The plugin to register
   * @param pluginOptions - Options to pass to the plugin's init function
   * @throws FormatrError if plugin is already registered, has invalid dependencies, or has conflicts
   */
  async register<Options = unknown, Methods extends object = object>(
    plugin: Plugin<Options, Methods>,
    pluginOptions?: Options
  ): Promise<void> {
    const { boundPlugin } = this.prepareRegistration(plugin, pluginOptions);

    // Initialize plugin
    if (boundPlugin.init) {
      await boundPlugin.init(pluginOptions as Options);
    }
  }

  /**
   * Synchronous registration - throws if plugin has async init.
   */
  registerSync<Options = unknown, Methods extends object = object>(
    plugin: Plugin<Options, Methods>,
    pluginOptions?: Options
  ): void {
    // Check if plugin has async init
    if (plugin.init && isAsyncFunction(plugin.init)) {
      throw new FormatrError(
        `Plugin "${plugin.name}" has async init. Use register() instead of registerSync().`
      );
    }

    const { boundPlugin } = this.prepareRegistration(plugin, pluginOptions);

    // Initialize plugin synchronously
    if (boundPlugin.init) {
      boundPlugin.init(pluginOptions as Options);
    }
  }

  /**
   * Shared cleanup logic for removing a plugin from registries.
   */
  private removeFromRegistries(name: string): void {
    this.plugins.delete(name);
    this.pluginOrder = this.pluginOrder.filter((n) => n !== name);

    // Remove filters from registry
    for (const [filterName, pluginName] of this.filterRegistry.entries()) {
      if (pluginName === name) {
        this.filterRegistry.delete(filterName);
      }
    }
  }

  /**
   * Unregister a plugin by name.
   * Calls the plugin's cleanup hook if present.
   */
  async unregister(name: string): Promise<void> {
    const instance = this.plugins.get(name);
    if (!instance) return;

    // Call cleanup hook
    if (instance.plugin.cleanup) {
      await instance.plugin.cleanup();
    }

    this.removeFromRegistries(name);
  }

  /**
   * Synchronous unregister - throws if plugin has async cleanup.
   */
  unregisterSync(name: string): void {
    const instance = this.plugins.get(name);
    if (!instance) return;

    // Check if plugin has async cleanup
    if (instance.plugin.cleanup && isAsyncFunction(instance.plugin.cleanup)) {
      throw new FormatrError(
        `Plugin "${name}" has async cleanup. Use unregister() instead of unregisterSync().`
      );
    }

    // Call cleanup hook synchronously
    if (instance.plugin.cleanup) {
      instance.plugin.cleanup();
    }

    this.removeFromRegistries(name);
  }

  /**
   * Check if a plugin is registered.
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Get a registered plugin by name.
   */
  get(name: string): Plugin | undefined {
    const instance = this.plugins.get(name);
    return instance?.plugin;
  }

  /**
   * Get all registered plugins in order.
   */
  list(): Plugin[] {
    return this.pluginOrder.map((name) => this.plugins.get(name)!.plugin);
  }

  /**
   * Get all registered plugin names in order.
   */
  listNames(): string[] {
    return [...this.pluginOrder];
  }

  /**
   * Get the number of registered plugins.
   */
  get size(): number {
    return this.plugins.size;
  }

  /**
   * Check if any registered plugin has async hooks.
   */
  hasAnyAsyncHooks(): boolean {
    for (const instance of this.plugins.values()) {
      if (instance.hasAsyncHooks) return true;
    }
    return false;
  }

  /**
   * Collect all filters from registered plugins.
   * Later plugins override earlier ones for same filter name.
   */
  collectFilters(): Record<string, (...args: any[]) => any> {
    const filters: Record<string, (...args: any[]) => any> = {};
    for (const name of this.pluginOrder) {
      const instance = this.plugins.get(name);
      if (instance?.plugin.filters) {
        Object.assign(filters, instance.plugin.filters);
      }
    }
    return filters;
  }

  /**
   * Validate that a hook is not an async function.
   * @throws FormatrError if hook is async
   */
  private validateHookNotAsync(
    hook: ((...args: unknown[]) => unknown) | undefined,
    pluginName: string,
    hookName: string
  ): void {
    if (hook && isAsyncFunction(hook)) {
      throw new FormatrError(
        `Plugin "${pluginName}" has async ${hookName} hook. Use async render methods.`
      );
    }
  }

  /**
   * Validate that a hook result is not a Promise.
   * @throws FormatrError if result is a Promise
   */
  private validateResultNotPromise(
    result: unknown,
    pluginName: string,
    hookName: string
  ): void {
    if (result instanceof Promise) {
      throw new FormatrError(
        `Plugin "${pluginName}" ${hookName} hook returned a Promise. Use async render methods.`
      );
    }
  }

  /**
   * Get beforeRender hooks with their plugin names in registration order.
   */
  private getBeforeRenderHooks(): Array<{ name: string; hook: NonNullable<Plugin['middleware']>['beforeRender'] }> {
    const hooks: Array<{ name: string; hook: NonNullable<Plugin['middleware']>['beforeRender'] }> = [];
    for (const name of this.pluginOrder) {
      const instance = this.plugins.get(name);
      const hook = instance?.plugin.middleware?.beforeRender;
      if (hook) {
        hooks.push({ name, hook });
      }
    }
    return hooks;
  }

  /**
   * Get afterRender hooks with their plugin names in reverse order (LIFO).
   */
  private getAfterRenderHooks(): Array<{ name: string; hook: NonNullable<Plugin['middleware']>['afterRender'] }> {
    const hooks: Array<{ name: string; hook: NonNullable<Plugin['middleware']>['afterRender'] }> = [];
    for (let i = this.pluginOrder.length - 1; i >= 0; i--) {
      const name = this.pluginOrder[i]!;
      const instance = this.plugins.get(name);
      const hook = instance?.plugin.middleware?.afterRender;
      if (hook) {
        hooks.push({ name, hook });
      }
    }
    return hooks;
  }

  /**
   * Execute beforeRender hooks in registration order.
   * If any hook sets skipRender: true, execution stops and returns the cached result.
   */
  async executeBeforeRender(
    template: string,
    context: Record<string, unknown>,
    options?: RenderOptions
  ): Promise<BeforeRenderResult> {
    let result: BeforeRenderResult = { template, context };

    for (const { hook } of this.getBeforeRenderHooks()) {
      result = await hook(result.template, result.context, options);
      if (result.skipRender) {
        return result;
      }
    }

    return result;
  }

  /**
   * Execute beforeRender hooks synchronously.
   * Throws if any hook is async.
   */
  executeBeforeRenderSync(
    template: string,
    context: Record<string, unknown>,
    options?: RenderOptions
  ): BeforeRenderResult {
    let result: BeforeRenderResult = { template, context };

    for (const { name, hook } of this.getBeforeRenderHooks()) {
      this.validateHookNotAsync(hook, name, 'beforeRender');
      const hookResult = hook(result.template, result.context, options);
      this.validateResultNotPromise(hookResult, name, 'beforeRender');
      result = hookResult as BeforeRenderResult;
      if (result.skipRender) {
        return result;
      }
    }

    return result;
  }

  /**
   * Execute afterRender hooks in reverse order (LIFO).
   * This provides symmetry with beforeRender for cleanup/teardown patterns.
   */
  async executeAfterRender(result: string, metadata: RenderMetadata): Promise<string> {
    let output = result;

    for (const { hook } of this.getAfterRenderHooks()) {
      output = await hook(output, metadata);
    }

    return output;
  }

  /**
   * Execute afterRender hooks synchronously.
   * Throws if any hook is async.
   */
  executeAfterRenderSync(result: string, metadata: RenderMetadata): string {
    let output = result;

    for (const { name, hook } of this.getAfterRenderHooks()) {
      this.validateHookNotAsync(hook, name, 'afterRender');
      const hookResult = hook(output, metadata);
      this.validateResultNotPromise(hookResult, name, 'afterRender');
      output = hookResult as string;
    }

    return output;
  }

  /**
   * Execute onError hooks in registration order.
   * Hooks can:
   * - Return void to keep the original error
   * - Return a new Error to replace the original
   * - Throw a new Error to replace the original
   */
  async executeOnError(error: Error, context: ErrorContext): Promise<Error> {
    let currentError = error;

    for (const name of this.pluginOrder) {
      const instance = this.plugins.get(name);
      const hook = instance?.plugin.middleware?.onError;
      if (hook) {
        try {
          const result = await hook(currentError, context);
          if (result instanceof Error) {
            currentError = result;
          }
        } catch (hookError) {
          if (hookError instanceof Error) {
            currentError = hookError;
          }
        }
      }
    }

    return currentError;
  }

  /**
   * Execute onError hooks synchronously.
   */
  executeOnErrorSync(error: Error, context: ErrorContext): Error {
    let currentError = error;

    for (const name of this.pluginOrder) {
      const instance = this.plugins.get(name);
      const hook = instance?.plugin.middleware?.onError;
      if (hook) {
        this.validateHookNotAsync(hook, name, 'onError');
        try {
          const result = hook(currentError, context);
          this.validateResultNotPromise(result, name, 'onError');
          if (result instanceof Error) {
            currentError = result;
          }
        } catch (hookError) {
          if (hookError instanceof Error) {
            currentError = hookError;
          }
        }
      }
    }

    return currentError;
  }

  /**
   * Check plugin dependencies.
   * @throws FormatrError if any dependency is missing or has version mismatch
   */
  private checkDependencies(plugin: Plugin): void {
    if (!plugin.dependencies) return;

    for (const [depName, depRange] of Object.entries(plugin.dependencies)) {
      const dep = this.get(depName);
      if (!dep) {
        throw new FormatrError(
          `Plugin "${plugin.name}" requires "${depName}" but it is not installed. ` +
          `Install "${depName}" before "${plugin.name}".`
        );
      }

      if (!satisfies(dep.version, depRange)) {
        throw new FormatrError(
          `Plugin "${plugin.name}" requires "${depName}@${depRange}" but found version "${dep.version}".`
        );
      }
    }
  }

  /**
   * Check for circular dependencies.
   * Uses DFS to detect cycles in the dependency graph.
   * @throws FormatrError if circular dependency is detected
   */
  private checkCircularDependencies(plugin: Plugin): void {
    if (!plugin.dependencies || Object.keys(plugin.dependencies).length === 0) return;

    const visited = new Set<string>();
    const path: string[] = [];

    const detectCycle = (name: string): void => {
      if (path.includes(name)) {
        const cycle = [...path.slice(path.indexOf(name)), name].join(' → ');
        throw new FormatrError(`Circular dependency detected: ${cycle}`);
      }

      if (visited.has(name)) return;
      visited.add(name);
      path.push(name);

      const dep = this.get(name);
      if (dep?.dependencies) {
        for (const depName of Object.keys(dep.dependencies)) {
          detectCycle(depName);
        }
      }

      path.pop();
    };

    // Start from the new plugin's dependencies
    path.push(plugin.name);
    for (const depName of Object.keys(plugin.dependencies)) {
      detectCycle(depName);
    }
  }

  /**
   * Clear all registered plugins.
   */
  async clear(): Promise<void> {
    // Unregister all plugins in reverse order
    const names = [...this.pluginOrder].reverse();
    for (const name of names) {
      await this.unregister(name);
    }
  }

  /**
   * Clear all registered plugins synchronously.
   */
  clearSync(): void {
    // Unregister all plugins in reverse order
    const names = [...this.pluginOrder].reverse();
    for (const name of names) {
      this.unregisterSync(name);
    }
  }
}
