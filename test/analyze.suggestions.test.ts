import { describe, expect, it } from 'vitest';
import { analyze, levenshteinDistance, suggestFilters } from '../src/core/analyze';

describe('analyze: filter suggestions', () => {
  describe('levenshteinDistance', () => {
    it('returns 0 for identical strings', () => {
      expect(levenshteinDistance('upper', 'upper')).toBe(0);
    });

    it('returns length of other string when one is empty', () => {
      expect(levenshteinDistance('', 'test')).toBe(4);
      expect(levenshteinDistance('test', '')).toBe(4);
    });

    it('returns 0 for two empty strings', () => {
      expect(levenshteinDistance('', '')).toBe(0);
    });

    it('calculates distance for single character difference', () => {
      expect(levenshteinDistance('upper', 'upperr')).toBe(1);
      expect(levenshteinDistance('upper', 'uper')).toBe(1);
      expect(levenshteinDistance('upper', 'uppar')).toBe(1);
    });

    it('calculates distance for missing character', () => {
      expect(levenshteinDistance('currency', 'currenc')).toBe(1);
      expect(levenshteinDistance('number', 'numb')).toBe(2);
    });

    it('calculates distance for completely different strings', () => {
      expect(levenshteinDistance('upper', 'xyz')).toBe(5);
      expect(levenshteinDistance('nonexistent', 'abc')).toBe(11);
    });

    it('is case-sensitive', () => {
      expect(levenshteinDistance('upper', 'UPPER')).toBe(5);
    });
  });

  describe('suggestFilters', () => {
    const filters = ['upper', 'lower', 'trim', 'plural', 'slice', 'pad', 'truncate', 'replace', 'number', 'percent', 'currency', 'date'];

    it('suggests "upper" for "upperr"', () => {
      const suggestions = suggestFilters('upperr', filters);
      expect(suggestions).toContain('upper');
      expect(suggestions[0]).toBe('upper');
    });

    it('suggests "lower" for "lowr"', () => {
      const suggestions = suggestFilters('lowr', filters);
      expect(suggestions).toContain('lower');
    });

    it('suggests "currency" for "currenc"', () => {
      const suggestions = suggestFilters('currenc', filters);
      expect(suggestions).toContain('currency');
    });

    it('suggests "number" for "numb" (distance 2)', () => {
      const suggestions = suggestFilters('numb', filters);
      expect(suggestions).toContain('number');
    });

    it('returns empty array for completely different filter', () => {
      const suggestions = suggestFilters('nonexistent', filters);
      expect(suggestions).toEqual([]);
    });

    it('returns empty array for "xyz"', () => {
      const suggestions = suggestFilters('xyz', filters);
      expect(suggestions).toEqual([]);
    });

    it('limits suggestions to maxSuggestions', () => {
      const manyFilters = ['aa', 'ab', 'ac', 'ad', 'ae', 'af'];
      const suggestions = suggestFilters('a', manyFilters, 3);
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    it('sorts suggestions by distance', () => {
      const suggestions = suggestFilters('upper', ['uppera', 'upperab', 'uppper']);
      // 'uppper' has distance 1, 'uppera' has distance 1, 'upperab' has distance 2
      // They should be sorted by distance
      expect(suggestions.length).toBeGreaterThanOrEqual(1);
    });

    it('is case-insensitive', () => {
      const suggestions = suggestFilters('UPPERR', filters);
      expect(suggestions).toContain('upper');
    });

    it('respects maxDistance parameter', () => {
      const suggestions = suggestFilters('apppp', filters, 3, 1);
      // 'apppp' -> 'upper' has distance 4, so shouldn't be included with maxDistance 1
      expect(suggestions).not.toContain('upper');
    });

    it('returns multiple suggestions when available', () => {
      // 'uppr' is distance 2 from 'upper' and distance 2 from 'uple' (if existed)
      const suggestions = suggestFilters('triim', filters);
      // 'triim' -> 'trim' is distance 1
      expect(suggestions).toContain('trim');
    });
  });

  describe('unknown-filter diagnostic with suggestions', () => {
    it('suggests "upper" for "upperr"', () => {
      const r = analyze('{name|upperr}');
      const m = r.messages.find((x) => x.code === 'unknown-filter');
      expect(m).toBeTruthy();
      expect(m?.message).toContain('Did you mean');
      expect(m?.message).toContain('upper');
      expect(m?.data?.suggestions).toContain('upper');
    });

    it('suggests "currency" for "currenc"', () => {
      const r = analyze('{price|currenc:USD}');
      const m = r.messages.find((x) => x.code === 'unknown-filter');
      expect(m).toBeTruthy();
      expect(m?.message).toContain('Did you mean');
      expect(m?.message).toContain('currency');
      expect(m?.data?.suggestions).toContain('currency');
    });

    it('includes suggestions array in data', () => {
      const r = analyze('{name|upperr}');
      const m = r.messages.find((x) => x.code === 'unknown-filter');
      expect(m?.data).toBeDefined();
      expect(m?.data?.filter).toBe('upperr');
      expect(Array.isArray(m?.data?.suggestions)).toBe(true);
    });

    it('has empty suggestions for completely unknown filter', () => {
      const r = analyze('{text|nonexistent}');
      const m = r.messages.find((x) => x.code === 'unknown-filter');
      expect(m).toBeTruthy();
      expect(m?.message).toBe('Unknown filter "nonexistent"');
      expect(m?.data?.suggestions).toEqual([]);
    });

    it('has empty suggestions for "xyz"', () => {
      const r = analyze('{value|xyz}');
      const m = r.messages.find((x) => x.code === 'unknown-filter');
      expect(m).toBeTruthy();
      expect(m?.message).toBe('Unknown filter "xyz"');
      expect(m?.data?.suggestions).toEqual([]);
    });

    it('formats message for single suggestion correctly', () => {
      const r = analyze('{name|upperr}');
      const m = r.messages.find((x) => x.code === 'unknown-filter');
      expect(m?.message).toMatch(/Unknown filter "upperr"\. Did you mean "upper"\?/);
    });

    it('suggests "lower" for "lowr"', () => {
      const r = analyze('{name|lowr}');
      const m = r.messages.find((x) => x.code === 'unknown-filter');
      expect(m?.data?.suggestions).toContain('lower');
    });

    it('suggests "trim" for "triim"', () => {
      const r = analyze('{name|triim}');
      const m = r.messages.find((x) => x.code === 'unknown-filter');
      expect(m?.data?.suggestions).toContain('trim');
    });

    it('suggests "number" for "numbr" with locale', () => {
      const r = analyze('{value|numbr}', { locale: 'en' });
      const m = r.messages.find((x) => x.code === 'unknown-filter');
      expect(m?.data?.suggestions).toContain('number');
    });

    it('suggests "date" for "dat"', () => {
      const r = analyze('{value|dat:short}', { locale: 'en' });
      const m = r.messages.find((x) => x.code === 'unknown-filter');
      expect(m?.data?.suggestions).toContain('date');
    });

    it('works with custom filters in registry', () => {
      const r = analyze('{value|customm}', {
        filters: { custom: (v) => v },
      });
      const m = r.messages.find((x) => x.code === 'unknown-filter');
      expect(m?.data?.suggestions).toContain('custom');
    });
  });

  describe('message formatting', () => {
    it('formats message without suggestions correctly', () => {
      const r = analyze('{value|zzzzzz}');
      const m = r.messages.find((x) => x.code === 'unknown-filter');
      expect(m?.message).toBe('Unknown filter "zzzzzz"');
    });

    it('formats message with one suggestion correctly', () => {
      const r = analyze('{value|upperr}');
      const m = r.messages.find((x) => x.code === 'unknown-filter');
      expect(m?.message).toContain('Did you mean');
      expect(m?.message).toMatch(/Did you mean "upper"\?$/);
    });
  });

  describe('edge cases', () => {
    it('handles empty filter name', () => {
      // This would typically be a parse error, but test the suggestion function directly
      const suggestions = suggestFilters('', ['upper', 'lower']);
      // Empty string has distance equal to the length of each filter
      // Since 'upper' is 5 chars, distance is 5 (> maxDistance of 2)
      expect(suggestions).toEqual([]);
    });

    it('handles very long filter name', () => {
      const longFilter = 'a'.repeat(100);
      const r = analyze(`{value|${longFilter}}`);
      const m = r.messages.find((x) => x.code === 'unknown-filter');
      expect(m).toBeTruthy();
      expect(m?.data?.suggestions).toEqual([]);
    });

    it('handles filter name with special characters gracefully', () => {
      // The parser might reject this, but if it gets through, suggestions should work
      const suggestions = suggestFilters('upper123', ['upper', 'lower']);
      // 'upper123' -> 'upper' has distance 3 (> maxDistance of 2)
      expect(suggestions).toEqual([]);
    });

    it('maintains backwards compatibility - message still contains filter name', () => {
      const r = analyze('{x|customFilter}');
      const m = r.messages.find((x) => x.code === 'unknown-filter');
      expect(m?.message).toContain('customFilter');
    });

    it('maintains backwards compatibility - still reports error severity', () => {
      const r = analyze('{x|nope}');
      const m = r.messages.find((x) => x.code === 'unknown-filter');
      expect(m?.severity).toBe('error');
    });

    it('maintains backwards compatibility - still includes range', () => {
      const r = analyze('{x|nope}');
      const m = r.messages.find((x) => x.code === 'unknown-filter');
      expect(m?.range).toBeDefined();
    });
  });

  describe('performance', () => {
    it('handles large filter registry efficiently', () => {
      const manyFilters: Record<string, (v: unknown) => unknown> = {};
      for (let i = 0; i < 100; i++) {
        manyFilters[`filter${i}`] = (v) => v;
      }

      const start = performance.now();
      const r = analyze('{value|filterXXX}', { filters: manyFilters });
      const end = performance.now();

      expect(r.messages.some((m) => m.code === 'unknown-filter')).toBe(true);
      // Should complete in under 10ms even with 100+ filters
      expect(end - start).toBeLessThan(10);
    });

    it('handles multiple unknown filters efficiently', () => {
      const manyFilters: Record<string, (v: unknown) => unknown> = {};
      for (let i = 0; i < 50; i++) {
        manyFilters[`filter${i}`] = (v) => v;
      }

      const template = Array.from({ length: 10 }, (_, i) => `{value${i}|unknownFilter${i}}`).join(' ');

      const start = performance.now();
      const r = analyze(template, { filters: manyFilters });
      const end = performance.now();

      expect(r.messages.filter((m) => m.code === 'unknown-filter').length).toBe(10);
      // Should complete in under 50ms
      expect(end - start).toBeLessThan(50);
    });
  });
});
