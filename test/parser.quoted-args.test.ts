import { describe, expect, it } from 'vitest';
import { template } from '../src';
import { parseTemplate } from '../src/core/parser';

describe('parser: quoted filter arguments', () => {
  describe('double-quoted arguments', () => {
    it('parses double-quoted argument', () => {
      const ast = parseTemplate('{text|filter:"arg"}');
      const placeholder = ast.nodes[0];
      expect(placeholder.kind).toBe('Placeholder');
      if (placeholder.kind === 'Placeholder' && placeholder.filters) {
        expect(placeholder.filters[0].args).toEqual(['arg']);
      }
    });

    it('parses double-quoted argument with commas', () => {
      const ast = parseTemplate('{text|filter:"a,b,c"}');
      const placeholder = ast.nodes[0];
      expect(placeholder.kind).toBe('Placeholder');
      if (placeholder.kind === 'Placeholder' && placeholder.filters) {
        expect(placeholder.filters[0].args).toEqual(['a,b,c']);
      }
    });

    it('parses double-quoted argument with colons', () => {
      const ast = parseTemplate('{text|filter:"a:b:c"}');
      const placeholder = ast.nodes[0];
      expect(placeholder.kind).toBe('Placeholder');
      if (placeholder.kind === 'Placeholder' && placeholder.filters) {
        expect(placeholder.filters[0].args).toEqual(['a:b:c']);
      }
    });

    it('parses double-quoted argument with pipes', () => {
      const ast = parseTemplate('{text|filter:"a|b"}');
      const placeholder = ast.nodes[0];
      expect(placeholder.kind).toBe('Placeholder');
      if (placeholder.kind === 'Placeholder' && placeholder.filters) {
        expect(placeholder.filters[0].args).toEqual(['a|b']);
      }
    });

    it('parses double-quoted argument with closing braces', () => {
      const ast = parseTemplate('{text|filter:"a}b"}');
      const placeholder = ast.nodes[0];
      expect(placeholder.kind).toBe('Placeholder');
      if (placeholder.kind === 'Placeholder' && placeholder.filters) {
        expect(placeholder.filters[0].args).toEqual(['a}b']);
      }
    });
  });

  describe('single-quoted arguments', () => {
    it('parses single-quoted argument', () => {
      const ast = parseTemplate("{text|filter:'arg'}");
      const placeholder = ast.nodes[0];
      expect(placeholder.kind).toBe('Placeholder');
      if (placeholder.kind === 'Placeholder' && placeholder.filters) {
        expect(placeholder.filters[0].args).toEqual(['arg']);
      }
    });

    it('parses single-quoted argument with commas', () => {
      const ast = parseTemplate("{text|filter:'a,b,c'}");
      const placeholder = ast.nodes[0];
      expect(placeholder.kind).toBe('Placeholder');
      if (placeholder.kind === 'Placeholder' && placeholder.filters) {
        expect(placeholder.filters[0].args).toEqual(['a,b,c']);
      }
    });

    it('parses single-quoted argument with colons', () => {
      const ast = parseTemplate("{text|filter:'a:b:c'}");
      const placeholder = ast.nodes[0];
      expect(placeholder.kind).toBe('Placeholder');
      if (placeholder.kind === 'Placeholder' && placeholder.filters) {
        expect(placeholder.filters[0].args).toEqual(['a:b:c']);
      }
    });
  });

  describe('escape sequences', () => {
    it('parses escaped double quote inside double-quoted string', () => {
      const ast = parseTemplate('{text|filter:"He said, \\"Hello\\""}');
      const placeholder = ast.nodes[0];
      expect(placeholder.kind).toBe('Placeholder');
      if (placeholder.kind === 'Placeholder' && placeholder.filters) {
        expect(placeholder.filters[0].args).toEqual(['He said, "Hello"']);
      }
    });

    it('parses escaped single quote inside single-quoted string', () => {
      const ast = parseTemplate("{text|filter:'It\\'s working'}");
      const placeholder = ast.nodes[0];
      expect(placeholder.kind).toBe('Placeholder');
      if (placeholder.kind === 'Placeholder' && placeholder.filters) {
        expect(placeholder.filters[0].args).toEqual(["It's working"]);
      }
    });

    it('parses escaped backslash', () => {
      const ast = parseTemplate('{text|filter:"C:\\\\path\\\\to\\\\file"}');
      const placeholder = ast.nodes[0];
      expect(placeholder.kind).toBe('Placeholder');
      if (placeholder.kind === 'Placeholder' && placeholder.filters) {
        expect(placeholder.filters[0].args).toEqual(['C:\\path\\to\\file']);
      }
    });

    it('parses escaped comma inside quoted string', () => {
      const ast = parseTemplate('{text|filter:"a\\,b"}');
      const placeholder = ast.nodes[0];
      expect(placeholder.kind).toBe('Placeholder');
      if (placeholder.kind === 'Placeholder' && placeholder.filters) {
        expect(placeholder.filters[0].args).toEqual(['a,b']);
      }
    });

    it('parses escaped colon inside quoted string', () => {
      const ast = parseTemplate('{text|filter:"a\\:b"}');
      const placeholder = ast.nodes[0];
      expect(placeholder.kind).toBe('Placeholder');
      if (placeholder.kind === 'Placeholder' && placeholder.filters) {
        expect(placeholder.filters[0].args).toEqual(['a:b']);
      }
    });
  });

  describe('mixed quoted and unquoted arguments', () => {
    it('parses mixed arguments: unquoted, quoted, unquoted', () => {
      const ast = parseTemplate('{text|filter:unquoted,"quoted",another}');
      const placeholder = ast.nodes[0];
      expect(placeholder.kind).toBe('Placeholder');
      if (placeholder.kind === 'Placeholder' && placeholder.filters) {
        expect(placeholder.filters[0].args).toEqual(['unquoted', 'quoted', 'another']);
      }
    });

    it('parses multiple quoted arguments', () => {
      const ast = parseTemplate('{text|filter:"first","second","third"}');
      const placeholder = ast.nodes[0];
      expect(placeholder.kind).toBe('Placeholder');
      if (placeholder.kind === 'Placeholder' && placeholder.filters) {
        expect(placeholder.filters[0].args).toEqual(['first', 'second', 'third']);
      }
    });

    it('parses quoted then unquoted argument', () => {
      const ast = parseTemplate('{text|filter:"quoted",unquoted}');
      const placeholder = ast.nodes[0];
      expect(placeholder.kind).toBe('Placeholder');
      if (placeholder.kind === 'Placeholder' && placeholder.filters) {
        expect(placeholder.filters[0].args).toEqual(['quoted', 'unquoted']);
      }
    });
  });

  describe('error handling', () => {
    it('throws on unterminated double-quoted string', () => {
      expect(() => parseTemplate('{text|filter:"hello}')).toThrow('Unterminated string');
    });

    it('throws on unterminated single-quoted string', () => {
      expect(() => parseTemplate("{text|filter:'hello}")).toThrow('Unterminated string');
    });

    it('throws on invalid escape sequence', () => {
      expect(() => parseTemplate('{text|filter:"\\x"}')).toThrow('Invalid escape sequence: \\x');
    });

    it('throws on unexpected end of input in escape sequence', () => {
      expect(() => parseTemplate('{text|filter:"\\')).toThrow(
        'Unexpected end of input in escape sequence'
      );
    });
  });

  describe('backwards compatibility', () => {
    it('parses unquoted arguments as before', () => {
      const ast = parseTemplate('{count|plural:item,items}');
      const placeholder = ast.nodes[0];
      expect(placeholder.kind).toBe('Placeholder');
      if (placeholder.kind === 'Placeholder' && placeholder.filters) {
        expect(placeholder.filters[0].args).toEqual(['item', 'items']);
      }
    });

    it('handles trailing comma for empty argument', () => {
      const ast = parseTemplate('{text|truncate:5,}');
      const placeholder = ast.nodes[0];
      expect(placeholder.kind).toBe('Placeholder');
      if (placeholder.kind === 'Placeholder' && placeholder.filters) {
        expect(placeholder.filters[0].args).toEqual(['5', '']);
      }
    });

    it('handles leading comma for empty first argument', () => {
      const ast = parseTemplate('{text|filter:,b}');
      const placeholder = ast.nodes[0];
      expect(placeholder.kind).toBe('Placeholder');
      if (placeholder.kind === 'Placeholder' && placeholder.filters) {
        expect(placeholder.filters[0].args).toEqual(['', 'b']);
      }
    });

    it('handles comma-only for two empty arguments', () => {
      const ast = parseTemplate('{text|filter:,}');
      const placeholder = ast.nodes[0];
      expect(placeholder.kind).toBe('Placeholder');
      if (placeholder.kind === 'Placeholder' && placeholder.filters) {
        expect(placeholder.filters[0].args).toEqual(['', '']);
      }
    });

    it('works with existing templates', () => {
      const t = template('{n|plural:apple,apples}');
      expect(t({ n: 1 })).toBe('apple');
      expect(t({ n: 2 })).toBe('apples');
    });
  });
});

describe('template: quoted filter arguments in action', () => {
  it('works with truncate filter using quoted ellipsis', () => {
    const t = template<{ text: string }>('{text|truncate:30,"..."}');
    expect(t({ text: 'This is a very long text that needs to be truncated' })).toBe(
      'This is a very long text th...'
    );
  });

  it('works with replace filter using quoted strings with colons', () => {
    const t = template<{ url: string }>('{url|replace:"http:","https:"}');
    expect(t({ url: 'http://example.com' })).toBe('https://example.com');
  });

  it('works with custom filter using escaped quotes', () => {
    const t = template<{ name: string }>('{name|prepend:"He said, \\"Hello\\" "}', {
      filters: {
        prepend: (value: unknown, prefix: string) => `${prefix}${String(value)}`,
      },
    });
    expect(t({ name: 'Alice' })).toBe('He said, "Hello" Alice');
  });

  it('works with pad filter using quoted character', () => {
    const t = template<{ text: string }>('{text|pad:10,left," "}');
    expect(t({ text: 'Hello' })).toBe('     Hello');
  });

  it('works with custom filter receiving argument with pipe character', () => {
    const t = template<{ text: string }>('{text|wrap:"<div>|</div>"}', {
      filters: {
        wrap: (value: unknown, wrapper: string) => {
          const [before, after] = wrapper.split('|');
          return `${before}${String(value)}${after}`;
        },
      },
    });
    expect(t({ text: 'content' })).toBe('<div>content</div>');
  });

  it('works with custom filter receiving argument with closing brace', () => {
    const t = template<{ text: string }>('{text|wrap:"{}"}', {
      filters: {
        wrap: (value: unknown, chars: string) => `${chars[0]}${String(value)}${chars[1]}`,
      },
    });
    expect(t({ text: 'x' })).toBe('{x}');
  });

  it('works with mixed quoted and unquoted in real filter', () => {
    const t = template<{ text: string }>('{text|truncate:10,"→"}');
    expect(t({ text: 'Hello, World!' })).toBe('Hello, Wo→');
  });
});
