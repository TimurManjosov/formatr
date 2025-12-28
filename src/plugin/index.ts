// src/plugin/index.ts

// Export types
export type {
  Plugin,
  PluginConfig,
  PluginMetadata,
  PluginMiddleware,
  PluginTransforms,
  PluginInstance,
  PluginRuntimeContext,
  PluginManagerOptions,
  RenderOptions,
  RenderMetadata,
  ErrorContext,
  BeforeRenderResult,
  LoaderFunction,
  ParserFunction,
  FormatterFunction,
  BeforeRenderHook,
  AfterRenderHook,
  OnErrorHook,
  ASTTransform,
  TemplateTransform,
} from './types';

// Export factory functions
export { createPlugin, bindPluginToRuntime, isAsyncFunction, hasAsyncHooks } from './factory';

// Export plugin manager
export { PluginManager } from './manager';

// Export version utilities
export { parseVersion, compareVersions, parseRange, satisfies } from './version';
export type { ParsedVersion } from './version';
