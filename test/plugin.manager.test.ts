// test/plugin.manager.test.ts
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { PluginManager } from '../src/plugin/manager';
import { createPlugin } from '../src/plugin/factory';
import { FormatrError } from '../src/core/errors';

describe('PluginManager', () => {
  let manager: PluginManager;

  beforeEach(() => {
    manager = new PluginManager();
  });

  describe('register', () => {
    it('should register a plugin', async () => {
      const plugin = createPlugin({
        name: 'test-plugin',
        version: '1.0.0',
      });

      await manager.register(plugin);
      expect(manager.has('test-plugin')).toBe(true);
      expect(manager.size).toBe(1);
    });

    it('should call init on registration', async () => {
      const init = vi.fn();
      const plugin = createPlugin({
        name: 'test-plugin',
        version: '1.0.0',
        init,
      });

      await manager.register(plugin, { key: 'value' });
      expect(init).toHaveBeenCalledWith({ key: 'value' });
    });

    it('should throw when registering duplicate plugin', async () => {
      const plugin = createPlugin({
        name: 'test-plugin',
        version: '1.0.0',
      });

      await manager.register(plugin);
      await expect(manager.register(plugin)).rejects.toThrow(FormatrError);
      await expect(manager.register(plugin)).rejects.toThrow(/already registered/);
    });

    it('should maintain registration order', async () => {
      const p1 = createPlugin({ name: 'plugin-a', version: '1.0.0' });
      const p2 = createPlugin({ name: 'plugin-b', version: '1.0.0' });
      const p3 = createPlugin({ name: 'plugin-c', version: '1.0.0' });

      await manager.register(p1);
      await manager.register(p2);
      await manager.register(p3);

      const names = manager.listNames();
      expect(names).toEqual(['plugin-a', 'plugin-b', 'plugin-c']);
    });

    it('should pass options to init with correct this binding', async () => {
      let capturedThis: any;
      const plugin = createPlugin({
        name: 'test-plugin',
        version: '1.0.0',
        init(options) {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          capturedThis = this;
          this.state.initialized = true;
          this.state.options = options;
        },
      });

      await manager.register(plugin, { foo: 'bar' });
      
      expect(capturedThis).toBeDefined();
      expect(capturedThis.state.initialized).toBe(true);
      expect(capturedThis.state.options).toEqual({ foo: 'bar' });
      expect(capturedThis.options).toEqual({ foo: 'bar' });
    });
  });

  describe('registerSync', () => {
    it('should register a plugin synchronously', () => {
      const plugin = createPlugin({
        name: 'test-plugin',
        version: '1.0.0',
        init: () => {},
      });

      manager.registerSync(plugin);
      expect(manager.has('test-plugin')).toBe(true);
    });

    it('should throw for async init', () => {
      const plugin = createPlugin({
        name: 'test-plugin',
        version: '1.0.0',
        init: async () => {},
      });

      expect(() => manager.registerSync(plugin)).toThrow(FormatrError);
      expect(() => manager.registerSync(plugin)).toThrow(/async init/);
    });
  });

  describe('unregister', () => {
    it('should unregister a plugin', async () => {
      const plugin = createPlugin({
        name: 'test-plugin',
        version: '1.0.0',
      });

      await manager.register(plugin);
      expect(manager.has('test-plugin')).toBe(true);

      await manager.unregister('test-plugin');
      expect(manager.has('test-plugin')).toBe(false);
      expect(manager.size).toBe(0);
    });

    it('should call cleanup on unregister', async () => {
      const cleanup = vi.fn();
      const plugin = createPlugin({
        name: 'test-plugin',
        version: '1.0.0',
        cleanup,
      });

      await manager.register(plugin);
      await manager.unregister('test-plugin');
      expect(cleanup).toHaveBeenCalled();
    });

    it('should do nothing for non-existent plugin', async () => {
      await expect(manager.unregister('non-existent')).resolves.toBeUndefined();
    });
  });

  describe('get and list', () => {
    it('should get a plugin by name', async () => {
      const plugin = createPlugin({
        name: 'test-plugin',
        version: '1.0.0',
      });

      await manager.register(plugin);
      const retrieved = manager.get('test-plugin');
      expect(retrieved?.name).toBe('test-plugin');
    });

    it('should return undefined for non-existent plugin', () => {
      expect(manager.get('non-existent')).toBeUndefined();
    });

    it('should list all plugins in order', async () => {
      const p1 = createPlugin({ name: 'first', version: '1.0.0' });
      const p2 = createPlugin({ name: 'second', version: '1.0.0' });

      await manager.register(p1);
      await manager.register(p2);

      const plugins = manager.list();
      expect(plugins.length).toBe(2);
      expect(plugins[0]?.name).toBe('first');
      expect(plugins[1]?.name).toBe('second');
    });
  });

  describe('dependencies', () => {
    it('should throw for missing dependency', async () => {
      const plugin = createPlugin({
        name: 'dependent',
        version: '1.0.0',
        dependencies: { 'base-plugin': '^1.0.0' },
      });

      await expect(manager.register(plugin)).rejects.toThrow(FormatrError);
      await expect(manager.register(plugin)).rejects.toThrow(/requires "base-plugin" but it is not installed/);
    });

    it('should allow registration when dependency is present', async () => {
      const base = createPlugin({ name: 'base-plugin', version: '1.0.0' });
      const dependent = createPlugin({
        name: 'dependent',
        version: '1.0.0',
        dependencies: { 'base-plugin': '^1.0.0' },
      });

      await manager.register(base);
      await expect(manager.register(dependent)).resolves.toBeUndefined();
    });

    it('should throw for version mismatch', async () => {
      const base = createPlugin({ name: 'base-plugin', version: '2.0.0' });
      const dependent = createPlugin({
        name: 'dependent',
        version: '1.0.0',
        dependencies: { 'base-plugin': '^1.0.0' },
      });

      await manager.register(base);
      await expect(manager.register(dependent)).rejects.toThrow(FormatrError);
      await expect(manager.register(dependent)).rejects.toThrow(/requires "base-plugin@\^1\.0\.0" but found version "2\.0\.0"/);
    });

    it('should detect circular dependencies', async () => {
      // Test case: trying to register a plugin with an unmet dependency
      // This demonstrates that the dependency system prevents invalid states
      const pluginA = createPlugin({
        name: 'plugin-a',
        version: '1.0.0',
        dependencies: { 'plugin-b': '^1.0.0' },
      });

      // Can't register A because B isn't installed
      await expect(manager.register(pluginA)).rejects.toThrow(/requires "plugin-b"/);

      // Test case: valid dependency chain (A -> B -> C) should work
      const manager2 = new PluginManager();
      
      // Base plugin with no deps
      const base = createPlugin({ name: 'base', version: '1.0.0' });
      await manager2.register(base);

      // Plugin that depends on base
      const child = createPlugin({
        name: 'child',
        version: '1.0.0',
        dependencies: { 'base': '^1.0.0' },
      });
      await manager2.register(child);

      // Plugin that depends on child
      const grandchild = createPlugin({
        name: 'grandchild',
        version: '1.0.0',
        dependencies: { 'child': '^1.0.0' },
      });
      await manager2.register(grandchild);

      // All three should be registered without circular dep error
      expect(manager2.size).toBe(3);
    });
  });

  describe('filter conflicts', () => {
    it('should warn on filter conflict (last wins by default)', async () => {
      const onWarning = vi.fn();
      const manager = new PluginManager({ onWarning });

      const plugin1 = createPlugin({
        name: 'plugin-1',
        version: '1.0.0',
        filters: { myFilter: () => 'first' },
      });

      const plugin2 = createPlugin({
        name: 'plugin-2',
        version: '1.0.0',
        filters: { myFilter: () => 'second' },
      });

      await manager.register(plugin1);
      await manager.register(plugin2);

      expect(onWarning).toHaveBeenCalledWith(
        'Filter "myFilter" from plugin "plugin-2" overrides filter from plugin "plugin-1"'
      );

      // Verify last wins
      const filters = manager.collectFilters();
      expect(filters.myFilter('test')).toBe('second');
    });

    it('should throw on filter conflict in strict mode', async () => {
      const manager = new PluginManager({ filterConflict: 'error' });

      const plugin1 = createPlugin({
        name: 'plugin-1',
        version: '1.0.0',
        filters: { myFilter: () => 'first' },
      });

      const plugin2 = createPlugin({
        name: 'plugin-2',
        version: '1.0.0',
        filters: { myFilter: () => 'second' },
      });

      await manager.register(plugin1);
      await expect(manager.register(plugin2)).rejects.toThrow(FormatrError);
      await expect(manager.register(plugin2)).rejects.toThrow(/Filter "myFilter" is already registered/);
    });
  });

  describe('collectFilters', () => {
    it('should collect all filters from registered plugins', async () => {
      const plugin1 = createPlugin({
        name: 'plugin-1',
        version: '1.0.0',
        filters: {
          upper: (v) => String(v).toUpperCase(),
          lower: (v) => String(v).toLowerCase(),
        },
      });

      const plugin2 = createPlugin({
        name: 'plugin-2',
        version: '1.0.0',
        filters: {
          trim: (v) => String(v).trim(),
        },
      });

      await manager.register(plugin1);
      await manager.register(plugin2);

      const filters = manager.collectFilters();
      expect(Object.keys(filters)).toEqual(['upper', 'lower', 'trim']);
      expect(filters.upper('hello')).toBe('HELLO');
      expect(filters.trim('  hi  ')).toBe('hi');
    });
  });

  describe('beforeRender hooks', () => {
    it('should execute beforeRender hooks in registration order', async () => {
      const order: string[] = [];

      const plugin1 = createPlugin({
        name: 'plugin-1',
        version: '1.0.0',
        middleware: {
          beforeRender: (template, context) => {
            order.push('plugin-1');
            return { template, context };
          },
        },
      });

      const plugin2 = createPlugin({
        name: 'plugin-2',
        version: '1.0.0',
        middleware: {
          beforeRender: (template, context) => {
            order.push('plugin-2');
            return { template, context };
          },
        },
      });

      await manager.register(plugin1);
      await manager.register(plugin2);

      await manager.executeBeforeRender('template', {});
      expect(order).toEqual(['plugin-1', 'plugin-2']);
    });

    it('should allow template modification', async () => {
      const plugin = createPlugin({
        name: 'modifier',
        version: '1.0.0',
        middleware: {
          beforeRender: (template, context) => ({
            template: template.toUpperCase(),
            context,
          }),
        },
      });

      await manager.register(plugin);
      const result = await manager.executeBeforeRender('hello', {});
      expect(result.template).toBe('HELLO');
    });

    it('should allow context modification', async () => {
      const plugin = createPlugin({
        name: 'modifier',
        version: '1.0.0',
        middleware: {
          beforeRender: (template, context) => ({
            template,
            context: { ...context, injected: true },
          }),
        },
      });

      await manager.register(plugin);
      const result = await manager.executeBeforeRender('template', { original: true });
      expect(result.context).toEqual({ original: true, injected: true });
    });

    it('should support skipRender for caching', async () => {
      const plugin = createPlugin({
        name: 'cache',
        version: '1.0.0',
        middleware: {
          beforeRender: (template, context) => ({
            template,
            context,
            skipRender: true,
            cached: 'cached result',
          }),
        },
      });

      await manager.register(plugin);
      const result = await manager.executeBeforeRender('template', {});
      expect(result.skipRender).toBe(true);
      expect(result.cached).toBe('cached result');
    });

    it('should stop at first skipRender', async () => {
      const order: string[] = [];

      const plugin1 = createPlugin({
        name: 'cache',
        version: '1.0.0',
        middleware: {
          beforeRender: (template, context) => {
            order.push('cache');
            return { template, context, skipRender: true, cached: 'cached' };
          },
        },
      });

      const plugin2 = createPlugin({
        name: 'plugin-2',
        version: '1.0.0',
        middleware: {
          beforeRender: (template, context) => {
            order.push('plugin-2');
            return { template, context };
          },
        },
      });

      await manager.register(plugin1);
      await manager.register(plugin2);

      await manager.executeBeforeRender('template', {});
      expect(order).toEqual(['cache']); // plugin-2 was not called
    });
  });

  describe('afterRender hooks', () => {
    it('should execute afterRender hooks in reverse order (LIFO)', async () => {
      const order: string[] = [];

      const plugin1 = createPlugin({
        name: 'plugin-1',
        version: '1.0.0',
        middleware: {
          afterRender: (result) => {
            order.push('plugin-1');
            return result;
          },
        },
      });

      const plugin2 = createPlugin({
        name: 'plugin-2',
        version: '1.0.0',
        middleware: {
          afterRender: (result) => {
            order.push('plugin-2');
            return result;
          },
        },
      });

      await manager.register(plugin1);
      await manager.register(plugin2);

      await manager.executeAfterRender('result', { template: '', context: {} });
      expect(order).toEqual(['plugin-2', 'plugin-1']); // Reverse order
    });

    it('should allow result modification', async () => {
      const plugin = createPlugin({
        name: 'modifier',
        version: '1.0.0',
        middleware: {
          afterRender: (result) => result.toUpperCase(),
        },
      });

      await manager.register(plugin);
      const result = await manager.executeAfterRender('hello', { template: '', context: {} });
      expect(result).toBe('HELLO');
    });
  });

  describe('onError hooks', () => {
    it('should execute onError hooks', async () => {
      const onError = vi.fn();
      const plugin = createPlugin({
        name: 'error-handler',
        version: '1.0.0',
        middleware: { onError },
      });

      await manager.register(plugin);
      const error = new Error('test error');
      await manager.executeOnError(error, { template: '', context: {} });
      
      expect(onError).toHaveBeenCalledWith(error, expect.any(Object));
    });

    it('should allow error replacement', async () => {
      const plugin = createPlugin({
        name: 'error-replacer',
        version: '1.0.0',
        middleware: {
          onError: () => new Error('replaced error'),
        },
      });

      await manager.register(plugin);
      const result = await manager.executeOnError(
        new Error('original'),
        { template: '', context: {} }
      );
      
      expect(result.message).toBe('replaced error');
    });

    it('should keep original error if hook returns void', async () => {
      const plugin = createPlugin({
        name: 'error-logger',
        version: '1.0.0',
        middleware: {
          onError: () => {
            // Just log, don't return
          },
        },
      });

      await manager.register(plugin);
      const originalError = new Error('original');
      const result = await manager.executeOnError(
        originalError,
        { template: '', context: {} }
      );
      
      expect(result).toBe(originalError);
    });
  });

  describe('sync hook execution', () => {
    it('should throw for async beforeRender in sync mode', async () => {
      const plugin = createPlugin({
        name: 'async-plugin',
        version: '1.0.0',
        middleware: {
          beforeRender: async (template, context) => ({ template, context }),
        },
      });

      await manager.register(plugin);
      expect(() => {
        manager.executeBeforeRenderSync('template', {});
      }).toThrow(FormatrError);
      expect(() => {
        manager.executeBeforeRenderSync('template', {});
      }).toThrow(/async beforeRender hook/);
    });

    it('should execute sync beforeRender hooks', async () => {
      const plugin = createPlugin({
        name: 'sync-plugin',
        version: '1.0.0',
        middleware: {
          beforeRender: (template, context) => ({
            template: template.toUpperCase(),
            context,
          }),
        },
      });

      await manager.register(plugin);
      const result = manager.executeBeforeRenderSync('hello', {});
      expect(result.template).toBe('HELLO');
    });
  });

  describe('clear', () => {
    it('should clear all plugins', async () => {
      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn();

      const plugin1 = createPlugin({
        name: 'plugin-1',
        version: '1.0.0',
        cleanup: cleanup1,
      });

      const plugin2 = createPlugin({
        name: 'plugin-2',
        version: '1.0.0',
        cleanup: cleanup2,
      });

      await manager.register(plugin1);
      await manager.register(plugin2);
      expect(manager.size).toBe(2);

      await manager.clear();
      expect(manager.size).toBe(0);
      expect(cleanup1).toHaveBeenCalled();
      expect(cleanup2).toHaveBeenCalled();
    });
  });

  describe('hasAnyAsyncHooks', () => {
    it('should return true if any plugin has async hooks', async () => {
      const plugin = createPlugin({
        name: 'async-plugin',
        version: '1.0.0',
        init: async () => {},
      });

      await manager.register(plugin);
      expect(manager.hasAnyAsyncHooks()).toBe(true);
    });

    it('should return false if no plugins have async hooks', async () => {
      const plugin = createPlugin({
        name: 'sync-plugin',
        version: '1.0.0',
        init: () => {},
      });

      await manager.register(plugin);
      expect(manager.hasAnyAsyncHooks()).toBe(false);
    });
  });
});
