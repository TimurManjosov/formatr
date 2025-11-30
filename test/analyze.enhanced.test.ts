import { describe, expect, it } from 'vitest';
import { analyze } from '../src/core/analyze';

describe('analyze: enhanced diagnostics', () => {
  describe('range field', () => {
    it('includes range for unknown filter', () => {
      const src = '{name|nope}';
      const r = analyze(src);
      const m = r.messages.find((x) => x.code === 'unknown-filter');
      expect(m).toBeTruthy();
      expect(m?.range).toBeDefined();
      expect(m?.range.start).toEqual({ line: 1, column: 6 });
      expect(m?.range.end).toEqual({ line: 1, column: 11 });
    });

    it('includes range for bad-args', () => {
      const src = '{count|plural:one}';
      const r = analyze(src);
      const m = r.messages.find((x) => x.code === 'bad-args');
      expect(m).toBeTruthy();
      expect(m?.range).toBeDefined();
      expect(m?.range.start).toEqual({ line: 1, column: 7 });
      expect(m?.range.end).toEqual({ line: 1, column: 18 });
    });

    it('includes range for parse-error', () => {
      const src = 'Hello {name';
      const r = analyze(src);
      const m = r.messages.find((x) => x.code === 'parse-error');
      expect(m).toBeTruthy();
      expect(m?.range).toBeDefined();
      expect(m?.range.start.line).toBeGreaterThan(0);
    });
  });

  describe('severity field', () => {
    it('sets error severity for unknown filter', () => {
      const r = analyze('{x|nope}');
      const m = r.messages.find((x) => x.code === 'unknown-filter');
      expect(m?.severity).toBe('error');
    });

    it('sets error severity for bad-args', () => {
      const r = analyze('{n|plural:one}');
      const m = r.messages.find((x) => x.code === 'bad-args');
      expect(m?.severity).toBe('error');
    });

    it('sets error severity for parse-error', () => {
      const r = analyze('{name');
      const m = r.messages.find((x) => x.code === 'parse-error');
      expect(m?.severity).toBe('error');
    });

    it('sets warning severity for suspicious-filter', () => {
      const r = analyze('{username|number}');
      const m = r.messages.find((x) => x.code === 'suspicious-filter');
      expect(m?.severity).toBe('warning');
    });

    it('sets error severity for missing-key', () => {
      const r = analyze('{name}', { context: {}, onMissing: 'error' });
      const m = r.messages.find((x) => x.code === 'missing-key');
      expect(m?.severity).toBe('error');
    });
  });

  describe('backwards compatibility', () => {
    it('still includes pos, line, column for unknown filter', () => {
      const r = analyze('{x|nope}');
      const m = r.messages.find((x) => x.code === 'unknown-filter');
      expect(typeof m?.pos).toBe('number');
      expect(typeof m?.line).toBe('number');
      expect(typeof m?.column).toBe('number');
    });

    it('still includes pos, line, column for bad-args', () => {
      const r = analyze('{n|plural:one}');
      const m = r.messages.find((x) => x.code === 'bad-args');
      expect(typeof m?.pos).toBe('number');
      expect(typeof m?.line).toBe('number');
      expect(typeof m?.column).toBe('number');
    });
  });

  describe('enhanced error messages', () => {
    it('includes example for plural bad-args', () => {
      const r = analyze('{n|plural:one}');
      const m = r.messages.find((x) => x.code === 'bad-args');
      expect(m?.message).toMatch(/e\.g\./);
      expect(m?.message).toMatch(/2 arguments/);
    });

    it('includes example for currency bad-args', () => {
      const r = analyze('{p|currency}');
      const m = r.messages.find((x) => x.code === 'bad-args');
      expect(m?.message).toMatch(/USD/);
      expect(m?.message).toMatch(/at least 1 argument/);
    });

    it('includes data with expected/got for bad-args', () => {
      const r = analyze('{n|plural:one}');
      const m = r.messages.find((x) => x.code === 'bad-args');
      expect(m?.data).toEqual({ filter: 'plural', expected: 2, got: 1 });
    });
  });

  describe('suspicious filter detection', () => {
    it('warns when using number filter on string-like placeholder', () => {
      const r = analyze('{username|number}');
      const m = r.messages.find((x) => x.code === 'suspicious-filter');
      expect(m).toBeTruthy();
      expect(m?.message).toMatch(/number/);
      expect(m?.message).toMatch(/username/);
      expect(m?.message).toMatch(/string/);
      expect(m?.severity).toBe('warning');
      expect(m?.data).toEqual({
        filter: 'number',
        placeholder: 'username',
        expectedType: 'number',
      });
    });

    it('warns when using upper filter on number-like placeholder', () => {
      const r = analyze('{count|upper}');
      const m = r.messages.find((x) => x.code === 'suspicious-filter');
      expect(m).toBeTruthy();
      expect(m?.message).toMatch(/upper/);
      expect(m?.message).toMatch(/count/);
      expect(m?.message).toMatch(/number/);
    });

    it('warns when using plural filter on string-like placeholder', () => {
      const r = analyze('{title|plural:one,other}');
      const m = r.messages.find((x) => x.code === 'suspicious-filter');
      expect(m).toBeTruthy();
      expect(m?.message).toMatch(/plural/);
      expect(m?.message).toMatch(/title/);
    });

    it('warns when using currency on string-like placeholder', () => {
      const r = analyze('{name|currency:USD}');
      const m = r.messages.find((x) => x.code === 'suspicious-filter');
      expect(m).toBeTruthy();
      expect(m?.message).toMatch(/currency/);
      expect(m?.message).toMatch(/name/);
    });

    it('does not warn when using number filter on count placeholder', () => {
      const r = analyze('{count|number}');
      const m = r.messages.find((x) => x.code === 'suspicious-filter');
      expect(m).toBeUndefined();
    });

    it('does not warn when using upper filter on name placeholder', () => {
      const r = analyze('{name|upper}');
      const m = r.messages.find((x) => x.code === 'suspicious-filter');
      expect(m).toBeUndefined();
    });

    it('does not warn when using currency on price placeholder', () => {
      const r = analyze('{price|currency:USD}');
      const m = r.messages.find((x) => x.code === 'suspicious-filter');
      expect(m).toBeUndefined();
    });

    it('recognizes various number indicators', () => {
      const templates = [
        '{quantity|upper}',
        '{amount|lower}',
        '{total|trim}',
        '{sum|slice:0,5}',
      ];

      for (const t of templates) {
        const r = analyze(t);
        const m = r.messages.find((x) => x.code === 'suspicious-filter');
        expect(m).toBeTruthy();
      }
    });

    it('recognizes various string indicators', () => {
      const templates = ['{description|number}', '{label|percent}'];

      for (const t of templates) {
        const r = analyze(t);
        const m = r.messages.find((x) => x.code === 'suspicious-filter');
        expect(m).toBeTruthy();
      }
    });

    it('does not warn for unknown types', () => {
      const r = analyze('{xyz|upper}');
      const m = r.messages.find((x) => x.code === 'suspicious-filter');
      expect(m).toBeUndefined();
    });
  });

  describe('missing placeholder detection', () => {
    it('detects missing placeholder when context provided', () => {
      const context = { foo: 'bar' };
      const r = analyze('{name}', { context, onMissing: 'error' });
      const m = r.messages.find((x) => x.code === 'missing-key');
      expect(m).toBeTruthy();
      expect(m?.message).toMatch(/Missing key/);
      expect(m?.message).toMatch(/name/);
      expect(m?.data).toEqual({ path: ['name'] });
      expect(m?.severity).toBe('error');
    });

    it('detects missing nested placeholder', () => {
      const context = { user: { age: 30 } };
      const r = analyze('{user.name}', { context, onMissing: 'error' });
      const m = r.messages.find((x) => x.code === 'missing-key');
      expect(m).toBeTruthy();
      expect(m?.message).toMatch(/user\.name/);
      expect(m?.data).toEqual({ path: ['user', 'name'] });
    });

    it('does not report error when placeholder exists', () => {
      const context = { name: 'John' };
      const r = analyze('{name}', { context, onMissing: 'error' });
      const m = r.messages.find((x) => x.code === 'missing-key');
      expect(m).toBeUndefined();
    });

    it('does not report error when nested placeholder exists', () => {
      const context = { user: { name: 'John' } };
      const r = analyze('{user.name}', { context, onMissing: 'error' });
      const m = r.messages.find((x) => x.code === 'missing-key');
      expect(m).toBeUndefined();
    });

    it('does not check when context not provided', () => {
      const r = analyze('{name}', { onMissing: 'error' });
      const m = r.messages.find((x) => x.code === 'missing-key');
      expect(m).toBeUndefined();
    });

    it('does not check when onMissing is not error', () => {
      const context = {};
      const r = analyze('{name}', { context, onMissing: 'keep' });
      const m = r.messages.find((x) => x.code === 'missing-key');
      expect(m).toBeUndefined();
    });

    it('includes range for missing-key diagnostic', () => {
      const context = {};
      const r = analyze('{name}', { context, onMissing: 'error' });
      const m = r.messages.find((x) => x.code === 'missing-key');
      expect(m?.range).toBeDefined();
      expect(m?.range.start).toEqual({ line: 1, column: 1 });
      expect(m?.range.end).toEqual({ line: 1, column: 7 });
    });

    it('handles null values correctly', () => {
      const context = { value: null };
      const r = analyze('{value}', { context, onMissing: 'error' });
      const m = r.messages.find((x) => x.code === 'missing-key');
      // null is treated as missing (same as runtime behavior)
      expect(m).toBeDefined();
      expect(m?.code).toBe('missing-key');
    });

    it('handles zero values correctly', () => {
      const context = { count: 0 };
      const r = analyze('{count}', { context, onMissing: 'error' });
      const m = r.messages.find((x) => x.code === 'missing-key');
      // 0 is a valid value, should not report missing
      expect(m).toBeUndefined();
    });

    it('detects multiple missing keys', () => {
      const context = { foo: 'bar' };
      const r = analyze('{name} {age}', { context, onMissing: 'error' });
      const missing = r.messages.filter((x) => x.code === 'missing-key');
      expect(missing.length).toBe(2);
      expect(missing[0]?.data).toEqual({ path: ['name'] });
      expect(missing[1]?.data).toEqual({ path: ['age'] });
    });
  });

  describe('combined diagnostics', () => {
    it('reports both suspicious usage and bad args', () => {
      const r = analyze('{username|plural:one}');
      const suspicious = r.messages.find((x) => x.code === 'suspicious-filter');
      const badArgs = r.messages.find((x) => x.code === 'bad-args');
      expect(suspicious).toBeTruthy();
      expect(badArgs).toBeTruthy();
    });

    it('reports suspicious usage, bad args, and missing key', () => {
      const r = analyze('{username|plural:one}', { context: {}, onMissing: 'error' });
      const suspicious = r.messages.find((x) => x.code === 'suspicious-filter');
      const badArgs = r.messages.find((x) => x.code === 'bad-args');
      const missing = r.messages.find((x) => x.code === 'missing-key');
      expect(suspicious).toBeTruthy();
      expect(badArgs).toBeTruthy();
      expect(missing).toBeTruthy();
    });

    it('does not report suspicious usage for unknown filters', () => {
      const r = analyze('{username|nope}');
      const unknown = r.messages.find((x) => x.code === 'unknown-filter');
      const suspicious = r.messages.find((x) => x.code === 'suspicious-filter');
      expect(unknown).toBeTruthy();
      expect(suspicious).toBeUndefined();
    });
  });

  describe('multi-line templates', () => {
    it('reports correct line and column for multi-line template', () => {
      const src = 'Hello\n{name|nope}\nWorld';
      const r = analyze(src);
      const m = r.messages.find((x) => x.code === 'unknown-filter');
      expect(m?.range.start.line).toBe(2);
      expect(m?.range.start.column).toBe(6);
    });

    it('handles multiple errors on different lines', () => {
      const src = '{foo|nope}\n{bar|nope}';
      const r = analyze(src);
      const errors = r.messages.filter((x) => x.code === 'unknown-filter');
      expect(errors.length).toBe(2);
      expect(errors[0]?.range.start.line).toBe(1);
      expect(errors[1]?.range.start.line).toBe(2);
    });
  });

  describe('data enrichment', () => {
    it('includes filter name in unknown-filter data', () => {
      const r = analyze('{x|customFilter}');
      const m = r.messages.find((x) => x.code === 'unknown-filter');
      expect(m?.data?.filter).toBe('customFilter');
      expect(m?.data?.suggestions).toBeDefined();
      expect(Array.isArray(m?.data?.suggestions)).toBe(true);
    });

    it('includes expected/got in bad-args data', () => {
      const r = analyze('{x|slice}');
      const m = r.messages.find((x) => x.code === 'bad-args');
      expect(m?.data?.filter).toBe('slice');
      expect(m?.data?.expected).toBe('1-2');
      expect(m?.data?.got).toBe(0);
    });

    it('includes path in missing-key data', () => {
      const r = analyze('{user.profile.name}', { context: {}, onMissing: 'error' });
      const m = r.messages.find((x) => x.code === 'missing-key');
      expect(m?.data?.path).toEqual(['user', 'profile', 'name']);
    });
  });
});
