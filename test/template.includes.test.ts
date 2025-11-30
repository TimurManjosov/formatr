import { describe, expect, it, beforeEach } from 'vitest';
import {
  template,
  registerTemplate,
  clearTemplates,
  getTemplate,
  hasTemplate,
  listTemplates,
  FormatrError,
  analyze,
} from '../src';

describe('Template includes / partials', () => {
  beforeEach(() => {
    // Clear templates before each test to ensure isolation
    clearTemplates();
  });

  describe('registerTemplate', () => {
    it('registers a simple template', () => {
      registerTemplate('greeting', 'Hello {name}!');
      expect(hasTemplate('greeting')).toBe(true);
      expect(getTemplate('greeting')).toBe('Hello {name}!');
    });

    it('registers a template with dot-separated name', () => {
      registerTemplate('layout.header', '=== {title} ===');
      expect(hasTemplate('layout.header')).toBe(true);
      expect(getTemplate('layout.header')).toBe('=== {title} ===');
    });

    it('overwrites existing templates with the same name', () => {
      registerTemplate('test', 'Original');
      registerTemplate('test', 'Updated');
      expect(getTemplate('test')).toBe('Updated');
    });

    it('listTemplates returns all registered template names', () => {
      registerTemplate('a', 'A');
      registerTemplate('b', 'B');
      registerTemplate('c.d', 'CD');
      const names = listTemplates();
      expect(names).toContain('a');
      expect(names).toContain('b');
      expect(names).toContain('c.d');
      expect(names).toHaveLength(3);
    });

    it('clearTemplates removes all templates', () => {
      registerTemplate('x', 'X');
      registerTemplate('y', 'Y');
      clearTemplates();
      expect(listTemplates()).toHaveLength(0);
      expect(hasTemplate('x')).toBe(false);
    });
  });

  describe('basic include syntax', () => {
    it('parses {> templateName} syntax', () => {
      registerTemplate('greeting', 'Hello {name}!');
      const t = template<{ name: string }>('{> greeting}');
      expect(t({ name: 'World' })).toBe('Hello World!');
    });

    it('parses {> templateName} with surrounding text', () => {
      registerTemplate('greeting', 'Hello');
      const t = template('Prefix {> greeting} Suffix');
      expect(t({})).toBe('Prefix Hello Suffix');
    });

    it('handles whitespace around template name', () => {
      registerTemplate('test', 'Content');
      const t1 = template('{> test }');
      const t2 = template('{>  test  }');
      const t3 = template('{>	test	}'); // tabs
      expect(t1({})).toBe('Content');
      expect(t2({})).toBe('Content');
      expect(t3({})).toBe('Content');
    });

    it('parses dot-separated template names', () => {
      registerTemplate('layout.header', '=== HEADER ===');
      registerTemplate('layout.footer', '=== FOOTER ===');
      const t = template('{> layout.header}\nContent\n{> layout.footer}');
      expect(t({})).toBe('=== HEADER ===\nContent\n=== FOOTER ===');
    });
  });

  describe('context inheritance', () => {
    it('included templates inherit parent context', () => {
      registerTemplate('greeting', 'Hello {name|upper}!');
      const t = template<{ name: string }>('{> greeting} Welcome.');
      expect(t({ name: 'Alice' })).toBe('Hello ALICE! Welcome.');
    });

    it('deeply nested context paths work in included templates', () => {
      registerTemplate('userGreeting', 'Welcome, {user.profile.name}!');
      const t = template<{ user: { profile: { name: string } } }>('{> userGreeting}');
      expect(t({ user: { profile: { name: 'Bob' } } })).toBe('Welcome, Bob!');
    });

    it('filters work in included templates', () => {
      registerTemplate('price', 'Total: {amount|number}');
      const t = template<{ amount: number }>('{> price}', { locale: 'en-US' });
      expect(t({ amount: 1234.56 })).toBe('Total: 1,234.56');
    });
  });

  describe('nested includes', () => {
    it('supports templates that include other templates', () => {
      registerTemplate('inner', 'INNER');
      registerTemplate('outer', 'OUTER({> inner})');
      const t = template('{> outer}');
      expect(t({})).toBe('OUTER(INNER)');
    });

    it('supports deeply nested includes', () => {
      registerTemplate('level3', 'L3');
      registerTemplate('level2', 'L2[{> level3}]');
      registerTemplate('level1', 'L1[{> level2}]');
      const t = template('ROOT[{> level1}]');
      expect(t({})).toBe('ROOT[L1[L2[L3]]]');
    });

    it('nested includes share the same context', () => {
      registerTemplate('inner', '{name}');
      registerTemplate('outer', 'Hello {> inner}!');
      const t = template<{ name: string }>('{> outer}');
      expect(t({ name: 'World' })).toBe('Hello World!');
    });
  });

  describe('error handling', () => {
    it('throws error for unknown template', () => {
      expect(() => template('{> nonexistent}')({})).toThrow(FormatrError);
      expect(() => template('{> nonexistent}')({})).toThrow(/Unknown template "nonexistent"/);
    });

    it('throws error for empty include name', () => {
      expect(() => template('{>}')({})).toThrow(FormatrError);
      expect(() => template('{>}')({})).toThrow(/Include requires a template name/);
    });

    it('throws error for include without closing brace', () => {
      expect(() => template('{> test')({})).toThrow(FormatrError);
      expect(() => template('{> test')({})).toThrow(/Expected '}'/);
    });

    it('detects circular includes', () => {
      registerTemplate('a', '{> b}');
      registerTemplate('b', '{> a}');
      expect(() => template('{> a}')({})).toThrow(FormatrError);
      expect(() => template('{> a}')({})).toThrow(/Circular include/);
    });

    it('detects self-referential includes', () => {
      registerTemplate('self', 'Before {> self} After');
      expect(() => template('{> self}')({})).toThrow(/Circular include/);
    });

    it('detects circular includes in deep nesting', () => {
      registerTemplate('x', '{> y}');
      registerTemplate('y', '{> z}');
      registerTemplate('z', '{> x}');
      expect(() => template('{> x}')({})).toThrow(/Circular include/);
    });
  });

  describe('integration with other features', () => {
    it('works with escape sequences', () => {
      registerTemplate('braces', 'Use {{ and }} for literal braces');
      const t = template('{> braces}');
      expect(t({})).toBe('Use { and } for literal braces');
    });

    it('does not conflict with regular placeholders', () => {
      registerTemplate('partial', 'X');
      const t = template<{ name: string }>('{name} {> partial} {name}');
      expect(t({ name: 'Y' })).toBe('Y X Y');
    });

    it('works with custom filters', () => {
      registerTemplate('custom', '{text|reverse}');
      const t = template<{ text: string }>('{> custom}', {
        filters: {
          reverse: (val: unknown) => String(val).split('').reverse().join(''),
        },
      });
      expect(t({ text: 'hello' })).toBe('olleh');
    });

    it('works with onMissing option', () => {
      registerTemplate('partial', '{missing}');
      const t = template('{> partial}', {
        onMissing: (key) => `[${key}?]`,
      });
      expect(t({})).toBe('[missing?]');
    });

    it('works with strictKeys option', () => {
      registerTemplate('partial', '{required}');
      const t = template('{> partial}', { strictKeys: true });
      expect(() => t({})).toThrow(/Missing key "required"/);
    });
  });

  describe('example use cases from issue', () => {
    it('basic include example', () => {
      registerTemplate('greeting', 'Hello {name|upper}!');
      const t = template<{ name: string }>('{> greeting} Welcome to our platform.');
      expect(t({ name: 'Alice' })).toBe('Hello ALICE! Welcome to our platform.');
    });

    it('includes with nested context (layout example)', () => {
      registerTemplate('layout.header', '=== {title|upper} ===');
      registerTemplate('layout.footer', '--- End of {title} ---');
      const t = template<{ title: string; content: string }>(
        `{> layout.header}
{content}
{> layout.footer}`
      );
      const result = t({ title: 'Report', content: 'This is the main content.' });
      expect(result).toBe(`=== REPORT ===
This is the main content.
--- End of Report ---`);
    });

    it('email template composition example', () => {
      registerTemplate('email.header', '<html><head></head><body>');
      registerTemplate('email.footer', '<p>Regards,<br>The Team</p></body></html>');
      const welcomeEmail = template<{ user: { name: string } }>(
        `{> email.header}
<h1>Welcome, {user.name}!</h1>
<p>Thanks for signing up.</p>
{> email.footer}`
      );
      const result = welcomeEmail({ user: { name: 'Alice' } });
      expect(result).toContain('<html>');
      expect(result).toContain('Welcome, Alice!');
      expect(result).toContain('Regards');
      expect(result).toContain('</html>');
    });
  });

  describe('analyze support', () => {
    it('detects unknown template in analysis', () => {
      const report = analyze('{> unknown}');
      expect(report.messages).toHaveLength(1);
      expect(report.messages[0].code).toBe('unknown-template');
      expect(report.messages[0].message).toContain('Unknown template "unknown"');
    });

    it('no error for registered template', () => {
      registerTemplate('known', 'Hello');
      const report = analyze('{> known}');
      expect(report.messages.filter((m) => m.code === 'unknown-template')).toHaveLength(0);
    });

    it('detects unknown template with dot-separated name', () => {
      const report = analyze('{> layout.header}');
      expect(report.messages).toHaveLength(1);
      expect(report.messages[0].code).toBe('unknown-template');
    });
  });
});
