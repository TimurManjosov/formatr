// test/plugin.integration.test.ts
import { describe, expect, it } from 'vitest';
import { template } from '../src/api';
import { createPlugin, PluginManager } from '../src/plugin';

describe('Plugin Integration Tests', () => {
  describe('Filter plugins with template rendering', () => {
    it('should use plugin filters in template rendering', () => {
      // Create a plugin with custom filters
      const reversePlugin = createPlugin({
        name: 'reverse-plugin',
        version: '1.0.0',
        filters: {
          reverse: (value: unknown) => String(value).split('').reverse().join(''),
          shout: (value: unknown) => String(value).toUpperCase() + '!',
        },
      });

      // Create a manager and register the plugin
      const manager = new PluginManager();
      manager.registerSync(reversePlugin);

      // Collect filters from manager
      const pluginFilters = manager.collectFilters();

      // Use the filters in a template
      const t = template('{text|reverse|shout}', {
        filters: pluginFilters,
      });

      const result = t({ text: 'hello' });
      expect(result).toBe('OLLEH!');
    });

    it('should combine multiple plugin filters', () => {
      const stringPlugin = createPlugin({
        name: 'string-utils',
        version: '1.0.0',
        filters: {
          prefix: (value: unknown, prefix: string) => prefix + String(value),
          suffix: (value: unknown, suffix: string) => String(value) + suffix,
          repeat: (value: unknown, count: string) => String(value).repeat(parseInt(count, 10)),
        },
      });

      const manager = new PluginManager();
      manager.registerSync(stringPlugin);

      const t = template('{word|prefix:>>|suffix:<<|repeat:2}', {
        filters: manager.collectFilters(),
      });

      expect(t({ word: 'hi' })).toBe('>>hi<<>>hi<<');
    });
  });

  describe('Middleware plugins with render pipeline', () => {
    it('should use beforeRender to modify context', async () => {
      let hookCalled = false;
      let modifiedContext: Record<string, unknown> = {};

      const contextPlugin = createPlugin({
        name: 'context-modifier',
        version: '1.0.0',
        middleware: {
          beforeRender: (template, context) => {
            hookCalled = true;
            // Inject additional context
            modifiedContext = {
              ...context,
              greeting: 'Hello',
              timestamp: '2024-01-01',
            };
            return { template, context: modifiedContext };
          },
        },
      });

      const manager = new PluginManager();
      await manager.register(contextPlugin);

      // Execute beforeRender manually (simulating render pipeline)
      const result = await manager.executeBeforeRender(
        '{greeting}, {name}!',
        { name: 'World' }
      );

      expect(hookCalled).toBe(true);
      expect(result.context.greeting).toBe('Hello');
      expect(result.context.timestamp).toBe('2024-01-01');
      expect(result.context.name).toBe('World');
    });

    it('should use afterRender to transform output', async () => {
      const transformPlugin = createPlugin({
        name: 'output-transformer',
        version: '1.0.0',
        middleware: {
          afterRender: (result) => {
            // Wrap output in HTML tags
            return `<div class="output">${result}</div>`;
          },
        },
      });

      const manager = new PluginManager();
      await manager.register(transformPlugin);

      const rendered = 'Hello, World!';
      const result = await manager.executeAfterRender(rendered, {
        template: '',
        context: {},
      });

      expect(result).toBe('<div class="output">Hello, World!</div>');
    });
  });

  describe('Plugin state and methods', () => {
    it('should maintain plugin state across hook calls', async () => {
      let stateRef: Record<string, unknown>;

      const statefulPlugin = createPlugin({
        name: 'stateful-plugin',
        version: '1.0.0',
        init() {
          this.state.counter = 0;
          this.state.history = [];
          stateRef = this.state;
        },
        middleware: {
          beforeRender(template, context) {
            this.state.counter = (this.state.counter as number) + 1;
            (this.state.history as string[]).push(template);
            return { template, context };
          },
        },
      });

      const manager = new PluginManager();
      await manager.register(statefulPlugin);

      await manager.executeBeforeRender('template1', {});
      await manager.executeBeforeRender('template2', {});
      await manager.executeBeforeRender('template3', {});

      expect(stateRef!.counter).toBe(3);
      expect(stateRef!.history).toEqual(['template1', 'template2', 'template3']);
    });

    it('should allow inter-plugin communication via getPlugin', async () => {
      let retrievedPlugin: any;

      const basePlugin = createPlugin({
        name: 'base',
        version: '1.0.0',
        methods: {
          getValue: () => 'base-value',
        },
      });

      const consumerPlugin = createPlugin({
        name: 'consumer',
        version: '1.0.0',
        dependencies: { 'base': '^1.0.0' },
        init() {
          retrievedPlugin = this.getPlugin('base');
        },
      });

      const manager = new PluginManager();
      await manager.register(basePlugin);
      await manager.register(consumerPlugin);

      expect(retrievedPlugin).toBeDefined();
      expect(retrievedPlugin.name).toBe('base');
    });
  });

  describe('Full render pipeline simulation', () => {
    it('should simulate a complete render with plugins', async () => {
      const log: string[] = [];

      // Logging plugin
      const loggingPlugin = createPlugin({
        name: 'logging',
        version: '1.0.0',
        middleware: {
          beforeRender(template, context) {
            log.push(`beforeRender: ${template}`);
            return { template, context };
          },
          afterRender(result) {
            log.push(`afterRender: ${result}`);
            return result;
          },
        },
      });

      // Transform plugin
      const transformPlugin = createPlugin({
        name: 'transform',
        version: '1.0.0',
        filters: {
          double: (v: unknown) => String(v).repeat(2),
        },
        middleware: {
          beforeRender(template, context) {
            return { template, context: { ...context, extra: 'injected' } };
          },
        },
      });

      const manager = new PluginManager();
      await manager.register(loggingPlugin);
      await manager.register(transformPlugin);

      // Simulate render pipeline
      const originalTemplate = '{name|double}';
      const originalContext = { name: 'hi' };

      // 1. Execute beforeRender hooks
      const beforeResult = await manager.executeBeforeRender(
        originalTemplate,
        originalContext
      );

      // 2. Render template (simulated - in real use this would call compile/render)
      const pluginFilters = manager.collectFilters();
      const renderFn = template(beforeResult.template, { filters: pluginFilters });
      const rendered = renderFn(beforeResult.context as any);

      // 3. Execute afterRender hooks
      const finalResult = await manager.executeAfterRender(rendered, {
        template: beforeResult.template,
        context: beforeResult.context,
      });

      expect(finalResult).toBe('hihi');
      expect(beforeResult.context.extra).toBe('injected');
      expect(log).toContain('beforeRender: {name|double}');
      expect(log).toContain('afterRender: hihi');
    });
  });

  describe('Caching plugin pattern', () => {
    it('should demonstrate cache skip pattern', async () => {
      const cache = new Map<string, string>();

      const cachePlugin = createPlugin({
        name: 'cache',
        version: '1.0.0',
        init() {
          this.state.cache = cache;
        },
        middleware: {
          beforeRender(template, context) {
            const key = template + JSON.stringify(context);
            const cached = (this.state.cache as Map<string, string>).get(key);
            
            if (cached) {
              return { template, context, skipRender: true, cached };
            }
            
            return { template, context, metadata: { cacheKey: key } };
          },
          afterRender(result, metadata) {
            const cacheKey = metadata.metadata?.cacheKey as string | undefined;
            if (cacheKey) {
              (this.state.cache as Map<string, string>).set(cacheKey, result);
            }
            return result;
          },
        },
      });

      const manager = new PluginManager();
      await manager.register(cachePlugin);

      // First render - cache miss
      const before1 = await manager.executeBeforeRender('Hello {name}', { name: 'World' });
      expect(before1.skipRender).toBeFalsy();

      // Simulate render
      const rendered = 'Hello World';

      // After render - should cache
      await manager.executeAfterRender(rendered, {
        template: 'Hello {name}',
        context: { name: 'World' },
        metadata: before1.metadata,
      });

      // Second render - cache hit
      const before2 = await manager.executeBeforeRender('Hello {name}', { name: 'World' });
      expect(before2.skipRender).toBe(true);
      expect(before2.cached).toBe('Hello World');
    });
  });

  describe('Error handling plugin pattern', () => {
    it('should demonstrate error handling pattern', async () => {
      const errors: Error[] = [];

      const errorPlugin = createPlugin({
        name: 'error-handler',
        version: '1.0.0',
        middleware: {
          onError(error, context) {
            errors.push(error);
            // Return a custom error with more context
            const newError = new Error(
              `Template error: ${error.message} (template: ${context.template.slice(0, 20)}...)`
            );
            return newError;
          },
        },
      });

      const manager = new PluginManager();
      await manager.register(errorPlugin);

      const originalError = new Error('Unknown filter "boom"');
      const result = await manager.executeOnError(originalError, {
        template: 'Hello {name|boom}',
        context: { name: 'World' },
      });

      expect(errors).toContain(originalError);
      expect(result.message).toContain('Template error:');
      expect(result.message).toContain('Unknown filter "boom"');
    });
  });

  describe('Plugin cleanup', () => {
    it('should properly cleanup resources', async () => {
      let resourcesCleaned = false;
      let initCalled = false;

      const resourcePlugin = createPlugin({
        name: 'resource-manager',
        version: '1.0.0',
        init() {
          initCalled = true;
          this.state.connection = { open: true };
        },
        cleanup() {
          this.state.connection = { open: false };
          resourcesCleaned = true;
        },
      });

      const manager = new PluginManager();
      await manager.register(resourcePlugin);

      expect(initCalled).toBe(true);
      expect(resourcesCleaned).toBe(false);

      await manager.unregister('resource-manager');
      expect(resourcesCleaned).toBe(true);
    });
  });
});
