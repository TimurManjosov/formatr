import { describe, expect, it } from 'vitest';
import { FormatrError, template } from '../src';
import { analyze } from '../src/core/analyze';

describe('formatr: strictKeys option', () => {
  describe('runtime validation', () => {
    it('throws error when key is missing with strictKeys: true', () => {
      const t = template<{ name: string; count: number }>('Hello {name}, you have {count} messages', {
        strictKeys: true,
      });
      expect(() => t({ name: 'Alice' } as any)).toThrow(FormatrError);
      expect(() => t({ name: 'Alice' } as any)).toThrow(/Missing key "count"/);
    });

    it('works correctly when all keys are present with strictKeys: true', () => {
      const t = template<{ name: string; count: number }>('Hello {name}, you have {count} messages', {
        strictKeys: true,
      });
      expect(t({ name: 'Alice', count: 5 })).toBe('Hello Alice, you have 5 messages');
    });

    it('throws error for null values with strictKeys: true', () => {
      const t = template<{ name: string; count: number }>('Hello {name}, count: {count}', {
        strictKeys: true,
      });
      expect(() => t({ name: 'Alice', count: null as any })).toThrow(FormatrError);
      expect(() => t({ name: 'Alice', count: null as any })).toThrow(/Missing key "count"/);
    });

    it('throws error for undefined values with strictKeys: true', () => {
      const t = template<{ name: string; count: number }>('Hello {name}, count: {count}', {
        strictKeys: true,
      });
      expect(() => t({ name: 'Alice', count: undefined as any })).toThrow(FormatrError);
      expect(() => t({ name: 'Alice', count: undefined as any })).toThrow(/Missing key "count"/);
    });

    it('validates dot-paths correctly with strictKeys: true', () => {
      const t = template<{ user: { name: string; address: { city: string } } }>(
        'User: {user.name}, City: {user.address.city}',
        { strictKeys: true }
      );
      expect(() => t({ user: { name: 'Alice' } } as any)).toThrow(FormatrError);
      expect(() => t({ user: { name: 'Alice' } } as any)).toThrow(/Missing key "user.address.city"/);
    });

    it('works with valid dot-paths with strictKeys: true', () => {
      const t = template<{ user: { name: string; address: { city: string } } }>(
        'User: {user.name}, City: {user.address.city}',
        { strictKeys: true }
      );
      expect(t({ user: { name: 'Alice', address: { city: 'NYC' } } })).toBe('User: Alice, City: NYC');
    });

    it('strictKeys takes precedence over onMissing', () => {
      const t = template('Hello {name}', {
        strictKeys: true,
        onMissing: 'keep',
      });
      expect(() => t({})).toThrow(FormatrError);
      expect(() => t({})).toThrow(/Missing key "name"/);
    });

    it('does not error on extra keys in context with strictKeys: true', () => {
      const t = template<{ name: string }>('Hello {name}', { strictKeys: true });
      expect(t({ name: 'Alice', extraKey: 'ignored' } as any)).toBe('Hello Alice');
    });

    it('works with empty template with strictKeys: true', () => {
      const t = template('static text', { strictKeys: true });
      expect(t({})).toBe('static text');
    });

    it('works with filters when strictKeys: true', () => {
      const t = template<{ name: string }>('Hello {name|upper}', { strictKeys: true });
      expect(t({ name: 'alice' })).toBe('Hello ALICE');
    });

    it('throws error for missing key even with filters when strictKeys: true', () => {
      const t = template('Hello {name|upper}', { strictKeys: true });
      expect(() => t({})).toThrow(FormatrError);
      expect(() => t({})).toThrow(/Missing key "name"/);
    });
  });

  describe('analysis-time validation', () => {
    it('reports missing keys with strictKeys: true and context provided', () => {
      const source = 'Hello {name}, you have {count} messages';
      const { messages } = analyze(source, {
        context: { name: 'Alice' },
        strictKeys: true,
      });
      expect(messages.length).toBe(1);
      expect(messages[0].code).toBe('missing-key');
      expect(messages[0].message).toMatch(/Missing key "count"/);
      expect(messages[0].severity).toBe('error');
    });

    it('reports no errors when all keys are present with strictKeys: true', () => {
      const source = 'Hello {name}, you have {count} messages';
      const { messages } = analyze(source, {
        context: { name: 'Alice', count: 5 },
        strictKeys: true,
      });
      expect(messages.length).toBe(0);
    });

    it('reports multiple missing keys with strictKeys: true', () => {
      const source = 'Hello {name}, you have {count} messages, from {sender}';
      const { messages } = analyze(source, {
        context: { name: 'Alice' },
        strictKeys: true,
      });
      expect(messages.length).toBe(2);
      expect(messages.some((m) => m.code === 'missing-key' && m.message.includes('count'))).toBe(true);
      expect(messages.some((m) => m.code === 'missing-key' && m.message.includes('sender'))).toBe(true);
    });

    it('validates dot-paths in analysis mode with strictKeys: true', () => {
      const source = 'User: {user.name}, City: {user.address.city}';
      const { messages } = analyze(source, {
        context: { user: { name: 'Alice' } },
        strictKeys: true,
      });
      expect(messages.length).toBe(1);
      expect(messages[0].code).toBe('missing-key');
      expect(messages[0].message).toMatch(/Missing key "user.address.city"/);
    });

    it('does not report errors when context is not provided even with strictKeys: true', () => {
      const source = 'Hello {name}';
      const { messages } = analyze(source, {
        strictKeys: true,
      });
      expect(messages.length).toBe(0);
    });

    it('works with onMissing: error for backwards compatibility', () => {
      const source = 'Hello {name}, you have {count} messages';
      const { messages } = analyze(source, {
        context: { name: 'Alice' },
        onMissing: 'error',
      });
      expect(messages.length).toBe(1);
      expect(messages[0].code).toBe('missing-key');
      expect(messages[0].message).toMatch(/Missing key "count"/);
    });

    it('strictKeys takes precedence over onMissing in analyze', () => {
      const source = 'Hello {name}';
      const { messages } = analyze(source, {
        context: {},
        strictKeys: true,
        onMissing: 'keep',
      });
      expect(messages.length).toBe(1);
      expect(messages[0].code).toBe('missing-key');
    });

    it('provides accurate range information for missing keys', () => {
      const source = 'Hello {name}, you have {count} messages';
      const { messages } = analyze(source, {
        context: { name: 'Alice' },
        strictKeys: true,
      });
      expect(messages[0].range).toBeDefined();
      expect(messages[0].range.start).toBeDefined();
      expect(messages[0].range.end).toBeDefined();
      expect(messages[0].range.start.line).toBe(1);
      expect(messages[0].range.start.column).toBeGreaterThan(0);
    });

    it('includes path in diagnostic data', () => {
      const source = 'Hello {user.name}';
      const { messages } = analyze(source, {
        context: {},
        strictKeys: true,
      });
      expect(messages[0].data?.path).toEqual(['user', 'name']);
    });

    it('works with filters in analysis mode', () => {
      const source = 'Hello {name|upper}';
      const { messages } = analyze(source, {
        context: {},
        strictKeys: true,
      });
      expect(messages.length).toBe(1);
      expect(messages[0].code).toBe('missing-key');
    });

    it('does not error on extra keys in context during analysis', () => {
      const source = 'Hello {name}';
      const { messages } = analyze(source, {
        context: { name: 'Alice', extraKey: 'ignored' },
        strictKeys: true,
      });
      expect(messages.length).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('handles context with null values at analysis time', () => {
      const source = 'Hello {name}';
      const { messages } = analyze(source, {
        context: { name: null },
        strictKeys: true,
      });
      // null is treated as missing (same as runtime behavior)
      expect(messages.length).toBe(1);
      expect(messages[0].code).toBe('missing-key');
    });

    it('handles deeply nested missing paths', () => {
      const t = template('Data: {a.b.c.d.e}', { strictKeys: true });
      expect(() => t({ a: { b: {} } })).toThrow(FormatrError);
      expect(() => t({ a: { b: {} } })).toThrow(/Missing key "a.b.c.d.e"/);
    });

    it('strictKeys: false uses default behavior', () => {
      const t = template('Hello {name}', { strictKeys: false });
      expect(t({})).toBe('Hello {name}');
    });

    it('strictKeys defaults to false', () => {
      const t = template('Hello {name}');
      expect(t({})).toBe('Hello {name}');
    });
  });
});
