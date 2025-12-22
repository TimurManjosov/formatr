import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { template } from '../src';

describe('relativeDate filter', () => {
  beforeEach(() => {
    // Use fake timers for deterministic tests
    vi.useFakeTimers();
    // Set a fixed reference time: 2025-12-20 12:00:00 UTC
    vi.setSystemTime(new Date('2025-12-20T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic usage', () => {
    it('formats future dates', () => {
      const t = template('{date|relativeDate}');
      const futureDate = new Date('2025-12-23T12:00:00Z'); // 3 days in future
      const result = t({ date: futureDate });
      expect(result).toMatch(/3\s+days?/i);
      expect(result).toMatch(/in/i);
    });

    it('formats past dates', () => {
      const t = template('{date|relativeDate}');
      const pastDate = new Date('2025-12-19T12:00:00Z'); // 1 day ago
      const result = t({ date: pastDate });
      expect(result).toMatch(/(1\s+day|yesterday)/i);
    });

    it('formats dates a few hours ago', () => {
      const t = template('{date|relativeDate}');
      const recentDate = new Date('2025-12-20T10:00:00Z'); // 2 hours ago
      const result = t({ date: recentDate });
      expect(result).toMatch(/2\s+hours?/i);
      expect(result).toMatch(/ago/i);
    });

    it('formats dates a few minutes ago', () => {
      const t = template('{date|relativeDate}');
      const recentDate = new Date('2025-12-20T11:45:00Z'); // 15 minutes ago
      const result = t({ date: recentDate });
      expect(result).toMatch(/15\s+minutes?/i);
    });

    it('formats dates a few seconds ago', () => {
      const t = template('{date|relativeDate}');
      const recentDate = new Date('2025-12-20T11:59:30Z'); // 30 seconds ago
      const result = t({ date: recentDate });
      expect(result).toMatch(/30\s+seconds?/i);
    });
  });

  describe('input types', () => {
    it('accepts Date objects', () => {
      const t = template('{date|relativeDate}');
      const date = new Date('2025-12-21T12:00:00Z');
      const result = t({ date });
      // With numeric: 'auto', may show "tomorrow" instead of "in 1 day"
      expect(result).toMatch(/(in|tomorrow)/i);
    });

    it('accepts timestamps (numbers)', () => {
      const t = template('{date|relativeDate}');
      const timestamp = new Date('2025-12-21T12:00:00Z').getTime();
      const result = t({ date: timestamp });
      expect(result).toMatch(/(in|tomorrow)/i);
    });

    it('accepts ISO strings', () => {
      const t = template('{date|relativeDate}');
      const result = t({ date: '2025-12-21T12:00:00Z' });
      expect(result).toMatch(/(in|tomorrow)/i);
    });
  });

  describe('invalid inputs', () => {
    it('handles invalid date strings', () => {
      const t = template('{date|relativeDate}');
      expect(t({ date: 'invalid' })).toBe('Invalid date');
    });

    it('handles invalid Date objects', () => {
      const t = template('{date|relativeDate}');
      expect(t({ date: new Date('invalid') })).toBe('Invalid date');
    });

    it('handles NaN', () => {
      const t = template('{date|relativeDate}');
      expect(t({ date: NaN })).toBe('Invalid date');
    });

    it('handles non-date objects gracefully', () => {
      const t = template('{date|relativeDate}');
      expect(t({ date: {} as unknown })).toBe('Invalid date');
    });
  });

  describe('time ranges', () => {
    it('formats seconds correctly', () => {
      const t = template('{date|relativeDate}');
      const date = new Date('2025-12-20T11:59:45Z'); // 15 seconds ago
      const result = t({ date });
      expect(result).toMatch(/15\s+seconds?/i);
    });

    it('formats minutes correctly', () => {
      const t = template('{date|relativeDate}');
      const date = new Date('2025-12-20T11:30:00Z'); // 30 minutes ago
      const result = t({ date });
      expect(result).toMatch(/30\s+minutes?/i);
    });

    it('formats hours correctly', () => {
      const t = template('{date|relativeDate}');
      const date = new Date('2025-12-20T07:00:00Z'); // 5 hours ago
      const result = t({ date });
      expect(result).toMatch(/5\s+hours?/i);
    });

    it('formats days correctly', () => {
      const t = template('{date|relativeDate}');
      const date = new Date('2025-12-17T12:00:00Z'); // 3 days ago
      const result = t({ date });
      expect(result).toMatch(/3\s+days?/i);
    });

    it('formats weeks correctly', () => {
      const t = template('{date|relativeDate}');
      const date = new Date('2025-12-06T12:00:00Z'); // 2 weeks ago
      const result = t({ date });
      expect(result).toMatch(/2\s+weeks?/i);
    });

    it('formats months correctly', () => {
      const t = template('{date|relativeDate}');
      const date = new Date('2025-10-20T12:00:00Z'); // ~2 months ago
      const result = t({ date });
      expect(result).toMatch(/2\s+months?/i);
    });

    it('formats years correctly', () => {
      const t = template('{date|relativeDate}');
      const date = new Date('2024-12-20T12:00:00Z'); // 1 year ago
      const result = t({ date });
      // With numeric: 'auto', may show "last year" instead of "1 year ago"
      expect(result).toMatch(/(1\s+year|last year)/i);
    });
  });

  describe('edge cases', () => {
    it('handles dates far in the past', () => {
      const t = template('{date|relativeDate}');
      const date = new Date('2020-01-01T00:00:00Z');
      const result = t({ date });
      expect(result).toMatch(/years?/i);
    });

    it('handles dates far in the future', () => {
      const t = template('{date|relativeDate}');
      const date = new Date('2030-01-01T00:00:00Z');
      const result = t({ date });
      expect(result).toMatch(/years?/i);
    });

    it('handles very recent times (< 1 second)', () => {
      const t = template('{date|relativeDate}');
      const date = new Date('2025-12-20T11:59:59.500Z'); // 0.5 seconds ago
      const result = t({ date });
      // With numeric: 'auto', may show "now" for 0 seconds
      expect(result).toMatch(/(seconds?|now)/i);
    });

    it('handles same instant (0 difference)', () => {
      const t = template('{date|relativeDate}');
      const date = new Date('2025-12-20T12:00:00Z');
      const result = t({ date });
      expect(result).toMatch(/(seconds?|now)/i);
    });
  });

  describe('chaining with other filters', () => {
    it('can be chained with upper', () => {
      const t = template('{date|relativeDate|upper}');
      const date = new Date('2025-12-21T12:00:00Z');
      const result = t({ date });
      expect(result).toBe(result.toUpperCase());
      // May show TOMORROW or IN 1 DAY depending on numeric setting
      expect(result).toMatch(/(IN|TOMORROW|DAY)/i);
    });
  });
});
