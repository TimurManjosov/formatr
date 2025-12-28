// src/plugin/types.ts

import type { SyncOrAsyncFilter } from '../filters';
import type { CompileOptions } from '../core/compile';
import type { TemplateAST } from '../core/ast';

/**
 * Plugin metadata for identification and dependency management.
 */
export interface PluginMetadata {
  /** Unique name of the plugin */
  name: string;
  /** Semantic version string (e.g., "1.0.0") */
  version: string;
  /** Optional description of the plugin */
  description?: string;
  /** Optional author information */
  author?: string;
  /** Plugin dependencies as name -> semver range */
  dependencies?: Record<string, string>;
}

/**
 * Render options passed to middleware hooks.
 */
export interface RenderOptions extends CompileOptions {
  /** Plugin-specific metadata that should not conflict with CompileOptions */
  pluginData?: Record<string, unknown>;
}

/**
 * Metadata about the render operation, passed to afterRender hooks.
 */
export interface RenderMetadata {
  /** The original template string */
  template: string;
  /** The context object used for rendering */
  context: Record<string, unknown>;
  /** Options passed to the render function */
  options?: RenderOptions;
  /** Plugin-specific metadata from beforeRender hooks (e.g., cacheKey) */
  metadata?: Record<string, unknown>;
}

/**
 * Error context passed to onError hooks.
 */
export interface ErrorContext {
  /** The template being rendered when the error occurred */
  template: string;
  /** The context object used for rendering */
  context: Record<string, unknown>;
  /** Options passed to the render function */
  options?: RenderOptions;
}

/**
 * Result of beforeRender hook.
 */
export interface BeforeRenderResult {
  /** Modified template string */
  template: string;
  /** Modified context object */
  context: Record<string, unknown>;
  /** If true, skip rendering and return cached result */
  skipRender?: boolean;
  /** Cached result to return when skipRender is true */
  cached?: string;
  /** Plugin-specific metadata to pass to afterRender (e.g., cacheKey) */
  metadata?: Record<string, unknown>;
}

/**
 * Loader function type for loading templates from custom sources.
 */
export type LoaderFunction = (source: string) => string | Promise<string>;

/**
 * Parser function type for custom syntax parsing.
 */
export type ParserFunction = (template: string) => TemplateAST;

/**
 * Formatter function type for custom output formatting.
 */
export type FormatterFunction = (value: unknown, format: string) => string;

/**
 * BeforeRender hook type - called before each render.
 */
export type BeforeRenderHook = (
  template: string,
  context: Record<string, unknown>,
  options?: RenderOptions
) => BeforeRenderResult | Promise<BeforeRenderResult>;

/**
 * AfterRender hook type - called after each render.
 */
export type AfterRenderHook = (
  result: string,
  metadata: RenderMetadata
) => string | Promise<string>;

/**
 * OnError hook type - called when render throws an error.
 */
export type OnErrorHook = (
  error: Error,
  context: ErrorContext
) => void | Error | Promise<void | Error>;

/**
 * AST transform function type.
 */
export type ASTTransform = (ast: TemplateAST) => TemplateAST;

/**
 * Template transform function type (string -> string).
 */
export type TemplateTransform = (template: string) => string;

/**
 * Middleware hooks for intercepting the render pipeline.
 */
export interface PluginMiddleware {
  /** Called before rendering each template */
  beforeRender?: BeforeRenderHook;
  /** Called after rendering each template */
  afterRender?: AfterRenderHook;
  /** Called when an error occurs during rendering */
  onError?: OnErrorHook;
}

/**
 * Transform hooks for modifying templates and ASTs.
 */
export interface PluginTransforms {
  /** Transform the AST before compilation */
  ast?: ASTTransform;
  /** Transform the template string before parsing */
  template?: TemplateTransform;
}

/**
 * Plugin definition interface.
 * @template Options - Type of plugin configuration options
 * @template Methods - Type of custom methods exposed by the plugin
 */
export interface Plugin<Options = unknown, Methods extends object = object> extends PluginMetadata {
  /**
   * Initialize the plugin. Called during registration.
   * @param options - Plugin configuration options
   */
  init?(options: Options): void | Promise<void>;

  /**
   * Cleanup the plugin. Called during unregistration.
   */
  cleanup?(): void | Promise<void>;

  /** Custom filters provided by this plugin */
  filters?: Record<string, SyncOrAsyncFilter>;

  /** Custom loaders provided by this plugin */
  loaders?: Record<string, LoaderFunction>;

  /** Custom parsers provided by this plugin */
  parsers?: Record<string, ParserFunction>;

  /** Custom formatters provided by this plugin */
  formatters?: Record<string, FormatterFunction>;

  /** Middleware hooks for render pipeline */
  middleware?: PluginMiddleware;

  /** Transform hooks for AST and template modification */
  transforms?: PluginTransforms;

  /** Custom methods exposed by this plugin */
  methods?: Methods;
}

/**
 * Plugin configuration passed to createPlugin.
 */
export type PluginConfig<Options = unknown, Methods extends object = object> = Plugin<Options, Methods>;

/**
 * Runtime context available to plugin hooks via `this`.
 */
export interface PluginRuntimeContext<Options = unknown, Methods extends object = object> {
  /** Plugin options passed during registration */
  options: Options;
  /** Per-plugin mutable state bag */
  state: Record<string, unknown>;
  /** Get another registered plugin by name (read-only view) */
  getPlugin(name: string): Plugin | undefined;
  /** Custom methods defined by the plugin */
  methods: Methods;
}

/**
 * Internal plugin instance with runtime context.
 */
export interface PluginInstance<Options = unknown, Methods extends object = object> {
  /** The plugin definition */
  plugin: Plugin<Options, Methods>;
  /** Runtime context for the plugin */
  runtime: PluginRuntimeContext<Options, Methods>;
  /** Whether the plugin has async hooks */
  hasAsyncHooks: boolean;
}

/**
 * Options for the plugin manager.
 */
export interface PluginManagerOptions {
  /**
   * How to handle filter name conflicts.
   * - 'last-wins': Last registered plugin's filter takes precedence (default)
   * - 'error': Throw an error on conflict
   */
  filterConflict?: 'last-wins' | 'error';
  /** Warning handler for non-fatal issues */
  onWarning?: (message: string) => void;
}
