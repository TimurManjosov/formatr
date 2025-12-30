// test/plugin.factory.test.ts
import { describe, expect, it } from 'vitest';
import { createPlugin, isAsyncFunction, hasAsyncHooks } from '../src/plugin/factory';
import { FormatrError } from '../src/core/errors';

describe('Plugin Factory', () => {
  describe('createPlugin', () => {
    it('should create a plugin with required fields', () => {
      const plugin = createPlugin({
        name: 'test-plugin',
        version: '1.0.0',
      });

      expect(plugin.name).toBe('test-plugin');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.filters).toEqual({});
      expect(plugin.loaders).toEqual({});
      expect(plugin.parsers).toEqual({});
      expect(plugin.formatters).toEqual({});
      expect(plugin.middleware).toEqual({});
      expect(plugin.transforms).toEqual({});
      expect(plugin.methods).toEqual({});
    });

    it('should create a plugin with all optional fields', () => {
      const myFilter = (v: unknown) => String(v).toUpperCase();
      const myLoader = async (source: string) => source;
      
      const plugin = createPlugin({
        name: 'full-plugin',
        version: '2.1.0',
        description: 'A fully-featured plugin',
        author: 'Test Author',
        dependencies: { 'base-plugin': '^1.0.0' },
        filters: { myFilter },
        loaders: { myLoader },
        init: () => {},
        cleanup: () => {},
      });

      expect(plugin.name).toBe('full-plugin');
      expect(plugin.version).toBe('2.1.0');
      expect(plugin.description).toBe('A fully-featured plugin');
      expect(plugin.author).toBe('Test Author');
      expect(plugin.dependencies).toEqual({ 'base-plugin': '^1.0.0' });
      expect(plugin.filters?.myFilter).toBe(myFilter);
      expect(plugin.loaders?.myLoader).toBe(myLoader);
      expect(plugin.init).toBeDefined();
      expect(plugin.cleanup).toBeDefined();
    });

    it('should throw on missing name', () => {
      expect(() => {
        createPlugin({
          name: '',
          version: '1.0.0',
        });
      }).toThrow(FormatrError);
      expect(() => {
        createPlugin({
          name: '',
          version: '1.0.0',
        });
      }).toThrow('Plugin must have a name');
    });

    it('should throw on invalid name characters', () => {
      expect(() => {
        createPlugin({
          name: 'invalid plugin name',
          version: '1.0.0',
        });
      }).toThrow(/Invalid plugin name/);
      
      expect(() => {
        createPlugin({
          name: 'plugin@special',
          version: '1.0.0',
        });
      }).toThrow(/Invalid plugin name/);
    });

    it('should allow valid name characters', () => {
      expect(() => {
        createPlugin({
          name: 'my-plugin_v2',
          version: '1.0.0',
        });
      }).not.toThrow();

      expect(() => {
        createPlugin({
          name: 'Plugin123',
          version: '1.0.0',
        });
      }).not.toThrow();
    });

    it('should throw on missing version', () => {
      expect(() => {
        createPlugin({
          name: 'test',
          version: '',
        });
      }).toThrow(FormatrError);
      expect(() => {
        createPlugin({
          name: 'test',
          version: '',
        });
      }).toThrow('Plugin must have a version');
    });

    it('should throw on invalid version format', () => {
      expect(() => {
        createPlugin({
          name: 'test',
          version: '1.0',
        });
      }).toThrow(/Invalid plugin version/);

      expect(() => {
        createPlugin({
          name: 'test',
          version: 'v1.0.0',
        });
      }).toThrow(/Invalid plugin version/);

      expect(() => {
        createPlugin({
          name: 'test',
          version: 'not-a-version',
        });
      }).toThrow(/Invalid plugin version/);
    });

    it('should allow valid semver versions', () => {
      expect(() => {
        createPlugin({ name: 'test', version: '1.0.0' });
      }).not.toThrow();

      expect(() => {
        createPlugin({ name: 'test', version: '0.0.1' });
      }).not.toThrow();

      expect(() => {
        createPlugin({ name: 'test', version: '10.20.30' });
      }).not.toThrow();

      expect(() => {
        createPlugin({ name: 'test', version: '1.0.0-beta.1' });
      }).not.toThrow();

      expect(() => {
        createPlugin({ name: 'test', version: '1.0.0-alpha' });
      }).not.toThrow();
    });

    it('should include middleware hooks', () => {
      const beforeRender = (template: string, context: Record<string, unknown>) => ({
        template,
        context,
      });
      const afterRender = (result: string) => result;
      const onError = () => {};

      const plugin = createPlugin({
        name: 'middleware-plugin',
        version: '1.0.0',
        middleware: {
          beforeRender,
          afterRender,
          onError,
        },
      });

      expect(plugin.middleware?.beforeRender).toBe(beforeRender);
      expect(plugin.middleware?.afterRender).toBe(afterRender);
      expect(plugin.middleware?.onError).toBe(onError);
    });

    it('should include custom methods', () => {
      const customMethod = () => 'hello';

      const plugin = createPlugin({
        name: 'method-plugin',
        version: '1.0.0',
        methods: { customMethod },
      });

      expect(plugin.methods?.customMethod).toBe(customMethod);
    });
  });

  describe('isAsyncFunction', () => {
    it('should detect async functions', () => {
      const asyncFn = async () => {};
      expect(isAsyncFunction(asyncFn)).toBe(true);
    });

    it('should detect sync functions as not async', () => {
      const syncFn = () => {};
      expect(isAsyncFunction(syncFn)).toBe(false);
    });

    it('should return false for non-functions', () => {
      expect(isAsyncFunction(null)).toBe(false);
      expect(isAsyncFunction(undefined)).toBe(false);
      expect(isAsyncFunction('string')).toBe(false);
      expect(isAsyncFunction(123)).toBe(false);
      expect(isAsyncFunction({})).toBe(false);
    });
  });

  describe('hasAsyncHooks', () => {
    it('should detect async init', () => {
      const plugin = createPlugin({
        name: 'test',
        version: '1.0.0',
        init: async () => {},
      });
      expect(hasAsyncHooks(plugin)).toBe(true);
    });

    it('should detect async cleanup', () => {
      const plugin = createPlugin({
        name: 'test',
        version: '1.0.0',
        cleanup: async () => {},
      });
      expect(hasAsyncHooks(plugin)).toBe(true);
    });

    it('should detect async beforeRender', () => {
      const plugin = createPlugin({
        name: 'test',
        version: '1.0.0',
        middleware: {
          beforeRender: async (template, context) => ({ template, context }),
        },
      });
      expect(hasAsyncHooks(plugin)).toBe(true);
    });

    it('should detect async afterRender', () => {
      const plugin = createPlugin({
        name: 'test',
        version: '1.0.0',
        middleware: {
          afterRender: async (result) => result,
        },
      });
      expect(hasAsyncHooks(plugin)).toBe(true);
    });

    it('should detect async onError', () => {
      const plugin = createPlugin({
        name: 'test',
        version: '1.0.0',
        middleware: {
          onError: async () => {},
        },
      });
      expect(hasAsyncHooks(plugin)).toBe(true);
    });

    it('should return false for all sync hooks', () => {
      const plugin = createPlugin({
        name: 'test',
        version: '1.0.0',
        init: () => {},
        cleanup: () => {},
        middleware: {
          beforeRender: (template, context) => ({ template, context }),
          afterRender: (result) => result,
          onError: () => {},
        },
      });
      expect(hasAsyncHooks(plugin)).toBe(false);
    });

    it('should return false for plugin with no hooks', () => {
      const plugin = createPlugin({
        name: 'test',
        version: '1.0.0',
      });
      expect(hasAsyncHooks(plugin)).toBe(false);
    });
  });
});
