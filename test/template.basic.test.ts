import { describe, expect, it } from 'vitest';
import { FormatrError, template } from '../src';

describe('formatr: basic {key} substitution', () => {
  it('replaces single key', () => {
    const greet = template<{ name: string }>('Hello, {name}!');
    expect(greet({ name: 'World' })).toBe('Hello, World!');
  });

  it('replaces multiple keys', () => {
    const t = template<{ a: string; b: number }>('A={a}, B={b}');
    expect(t({ a: 'X', b: 42 })).toBe('A=X, B=42');
  });

  it('throws on missing when onMissing="error"', () => {
    const t = template('Hello {name}', { onMissing: 'error' });
    expect(() => t({})).toThrow(FormatrError);
    expect(() => t({})).toThrow(/Missing key "name"/);
  });

  it('uses custom onMissing function', () => {
    const t = template('Hello {name}', {
      onMissing: (k) => `<${k}?>`,
    });
    expect(t({})).toBe('Hello <name?>');
  });

  it('leaves strings without placeholders unchanged', () => {
    const t = template('static text');
    expect(t({})).toBe('static text');
  });

  it("supports escaping '{{' and '}}'", () => {
    const t = template('{{ {key} }}');
    expect(t({ key: 'X' })).toBe('{ X }');
  });

  it('errors if identifier is invalid', () => {
    const bad = '{9abc}';
    expect(() => template(bad)({})).toThrow(/Expected identifier/);
  });

  it("errors if '}' is missing", () => {
    const bad = 'Hello {name';
    expect(() => template(bad)({})).toThrow(/Expected '}'/);
  });
});
