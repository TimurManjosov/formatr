import { describe, expect, it } from 'vitest';
import { template } from '../src';

describe('formatr: compiler optimizations', () => {
  describe('static text merging', () => {
    it('handles empty template', () => {
      const t = template('');
      expect(t({})).toBe('');
    });

    it('handles pure static text (no placeholders)', () => {
      const t = template('Hello World! This is static.');
      expect(t({})).toBe('Hello World! This is static.');
    });

    it('handles template with only placeholder', () => {
      const t = template<{ name: string }>('{name}');
      expect(t({ name: 'Alice' })).toBe('Alice');
    });

    it('merges consecutive static text around placeholders', () => {
      const t = template<{ name: string }>('Hello {name}!!! Welcome.');
      expect(t({ name: 'Bob' })).toBe('Hello Bob!!! Welcome.');
    });

    it('handles multiple placeholders with static text', () => {
      const t = template<{ a: string; b: string; c: string }>(
        'Start {a} middle {b} end {c} finish'
      );
      expect(t({ a: 'A', b: 'B', c: 'C' })).toBe('Start A middle B end C finish');
    });

    it('handles escaped braces with static text', () => {
      const t = template<{ name: string }>('{{ Hello {name} }}');
      expect(t({ name: 'World' })).toBe('{ Hello World }');
    });
  });

  describe('filter pre-resolution', () => {
    it('pre-resolves built-in filters', () => {
      const t = template<{ name: string }>('{name|upper}');
      expect(t({ name: 'alice' })).toBe('ALICE');
    });

    it('pre-resolves multiple chained filters', () => {
      const t = template<{ text: string }>('{text|trim|upper|lower}');
      expect(t({ text: '  HELLO  ' })).toBe('hello');
    });

    it('pre-resolves custom filters', () => {
      const t = template<{ name: string }>('{name|reverse}', {
        filters: {
          reverse: (v: unknown) => String(v).split('').reverse().join(''),
        },
      });
      expect(t({ name: 'hello' })).toBe('olleh');
    });

    it('pre-resolves intl filters with locale', () => {
      const t = template<{ price: number }>('{price|currency:USD}', {
        locale: 'en-US',
      });
      expect(t({ price: 99.99 })).toContain('99.99');
    });

    it('handles filters with arguments', () => {
      const t = template<{ count: number }>('{count|plural:item,items}');
      expect(t({ count: 1 })).toBe('item');
      expect(t({ count: 5 })).toBe('items');
    });
  });

  describe('keyStr pre-computation', () => {
    it('uses pre-computed keyStr in error messages', () => {
      const t = template<{ user: { name: string } }>('{user.name}', {
        onMissing: 'error',
      });
      expect(() => t({} as any)).toThrow(/Missing key "user.name"/);
    });

    it('uses pre-computed keyStr in keep mode', () => {
      const t = template<{ user: { profile: { name: string } } }>('{user.profile.name}', {
        onMissing: 'keep',
      });
      expect(t({} as any)).toBe('{user.profile.name}');
    });

    it('uses pre-computed keyStr in custom handler', () => {
      const t = template<{ a: { b: { c: string } } }>('{a.b.c}', {
        onMissing: (key) => `[${key}]`,
      });
      expect(t({} as any)).toBe('[a.b.c]');
    });
  });

  describe('edge cases', () => {
    it('handles template with many consecutive static parts', () => {
      // Parser generates multiple text nodes for escaped braces
      const t = template('{{ }} {{ }}');
      expect(t({})).toBe('{ } { }');
    });

    it('handles placeholder at start', () => {
      const t = template<{ name: string }>('{name} is here');
      expect(t({ name: 'Alice' })).toBe('Alice is here');
    });

    it('handles placeholder at end', () => {
      const t = template<{ name: string }>('Hello {name}');
      expect(t({ name: 'Bob' })).toBe('Hello Bob');
    });

    it('handles adjacent placeholders', () => {
      const t = template<{ a: string; b: string }>('{a}{b}');
      expect(t({ a: 'X', b: 'Y' })).toBe('XY');
    });

    it('handles adjacent placeholders with filters', () => {
      const t = template<{ a: string; b: string }>('{a|upper}{b|lower}');
      expect(t({ a: 'hello', b: 'WORLD' })).toBe('HELLOworld');
    });

    it('handles very long static text', () => {
      const longText = 'a'.repeat(10000);
      const t = template(longText);
      expect(t({})).toBe(longText);
    });

    it('handles template with whitespace-only static text', () => {
      const t = template<{ name: string }>('   {name}   ');
      expect(t({ name: 'X' })).toBe('   X   ');
    });

    it('handles template with special characters', () => {
      const t = template<{ name: string }>('Hello\n{name}\t!');
      expect(t({ name: 'World' })).toBe('Hello\nWorld\t!');
    });
  });

  describe('performance optimization verification', () => {
    it('static template returns same result on multiple calls', () => {
      const t = template('Static Result');
      expect(t({})).toBe('Static Result');
      expect(t({})).toBe('Static Result');
      expect(t({})).toBe('Static Result');
    });

    it('empty template returns empty string', () => {
      const t = template('');
      expect(t({})).toBe('');
      expect(t({})).toBe('');
    });

    it('template function is reusable', () => {
      const t = template<{ name: string }>('Hello {name}');
      expect(t({ name: 'A' })).toBe('Hello A');
      expect(t({ name: 'B' })).toBe('Hello B');
      expect(t({ name: 'C' })).toBe('Hello C');
    });

    it('complex template with all features', () => {
      const t = template<{
        user: { name: string };
        count: number;
        price: number;
      }>(
        'Hello {user.name|upper}, you have {count|plural:item,items}.',
        { locale: 'en-US' }
      );
      expect(t({ user: { name: 'alice' }, count: 1, price: 10 })).toBe(
        'Hello ALICE, you have item.'
      );
      expect(t({ user: { name: 'bob' }, count: 5, price: 20 })).toBe(
        'Hello BOB, you have items.'
      );
    });
  });
});
