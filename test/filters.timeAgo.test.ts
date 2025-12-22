import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { template } from '../src';

describe('timeAgo filter', () => {
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
    it('formats time 15 minutes ago', () => {
      const t = template('{date|timeAgo}');
      const past = new Date('2025-12-20T11:45:00Z');
      const result = t({ date: past });
      expect(result).toMatch(/15\s+minutes?\s+ago/i);
    });

    it('formats time 1 hour ago', () => {
      const t = template('{date|timeAgo}');
      const past = new Date('2025-12-20T11:00:00Z');
      const result = t({ date: past });
      expect(result).toMatch(/1\s+hour\s+ago/i);
    });

    it('formats time 2 hours ago', () => {
      const t = template('{date|timeAgo}');
      const past = new Date('2025-12-20T10:00:00Z');
      const result = t({ date: past });
      expect(result).toMatch(/2\s+hours?\s+ago/i);
    });

    it('formats time 1 day ago', () => {
      const t = template('{date|timeAgo}');
      const past = new Date('2025-12-19T12:00:00Z');
      const result = t({ date: past });
      expect(result).toMatch(/1\s+day\s+ago/i);
    });

    it('formats time 1 week ago', () => {
      const t = template('{date|timeAgo}');
      const past = new Date('2025-12-13T12:00:00Z');
      const result = t({ date: past });
      expect(result).toMatch(/1\s+week\s+ago/i);
    });

    it('formats time 1 month ago', () => {
      const t = template('{date|timeAgo}');
      const past = new Date('2025-11-20T12:00:00Z');
      const result = t({ date: past });
      expect(result).toMatch(/1\s+month\s+ago/i);
    });

    it('formats time 1 year ago', () => {
      const t = template('{date|timeAgo}');
      const past = new Date('2024-12-20T12:00:00Z');
      const result = t({ date: past });
      expect(result).toMatch(/1\s+year\s+ago/i);
    });
  });

  describe('just now threshold', () => {
    it('shows "just now" for very recent times (< 10 seconds by default)', () => {
      const t = template('{date|timeAgo}');
      const past = new Date('2025-12-20T11:59:55Z'); // 5 seconds ago
      const result = t({ date: past });
      expect(result).toBe('just now');
    });

    it('shows seconds for times beyond just now threshold', () => {
      const t = template('{date|timeAgo}');
      const past = new Date('2025-12-20T11:59:45Z'); // 15 seconds ago
      const result = t({ date: past });
      expect(result).toMatch(/15\s+seconds?\s+ago/i);
    });
  });

  describe('input types', () => {
    it('accepts Date objects', () => {
      const t = template('{date|timeAgo}');
      const past = new Date('2025-12-20T11:30:00Z');
      const result = t({ date: past });
      expect(result).toMatch(/30\s+minutes?\s+ago/i);
    });

    it('accepts timestamps (numbers)', () => {
      const t = template('{date|timeAgo}');
      const past = new Date('2025-12-20T11:30:00Z').getTime();
      const result = t({ date: past });
      expect(result).toMatch(/30\s+minutes?\s+ago/i);
    });

    it('accepts ISO strings', () => {
      const t = template('{date|timeAgo}');
      const result = t({ date: '2025-12-20T11:30:00Z' });
      expect(result).toMatch(/30\s+minutes?\s+ago/i);
    });
  });

  describe('invalid inputs', () => {
    it('handles invalid date strings', () => {
      const t = template('{date|timeAgo}');
      expect(t({ date: 'invalid' })).toBe('Invalid date');
    });

    it('handles invalid Date objects', () => {
      const t = template('{date|timeAgo}');
      expect(t({ date: new Date('invalid') })).toBe('Invalid date');
    });

    it('handles NaN', () => {
      const t = template('{date|timeAgo}');
      expect(t({ date: NaN })).toBe('Invalid date');
    });

    it('handles non-date objects gracefully', () => {
      const t = template('{date|timeAgo}');
      expect(t({ date: {} as unknown })).toBe('Invalid date');
    });
  });

  describe('time ranges', () => {
    it('formats seconds correctly', () => {
      const t = template('{date|timeAgo}');
      const past = new Date('2025-12-20T11:59:30Z'); // 30 seconds ago
      const result = t({ date: past });
      expect(result).toMatch(/30\s+seconds?\s+ago/i);
    });

    it('formats minutes correctly', () => {
      const t = template('{date|timeAgo}');
      const past = new Date('2025-12-20T11:15:00Z'); // 45 minutes ago
      const result = t({ date: past });
      expect(result).toMatch(/45\s+minutes?\s+ago/i);
    });

    it('formats hours correctly', () => {
      const t = template('{date|timeAgo}');
      const past = new Date('2025-12-20T07:00:00Z'); // 5 hours ago
      const result = t({ date: past });
      expect(result).toMatch(/5\s+hours?\s+ago/i);
    });

    it('formats days correctly', () => {
      const t = template('{date|timeAgo}');
      const past = new Date('2025-12-17T12:00:00Z'); // 3 days ago
      const result = t({ date: past });
      expect(result).toMatch(/3\s+days?\s+ago/i);
    });

    it('formats weeks correctly', () => {
      const t = template('{date|timeAgo}');
      const past = new Date('2025-12-06T12:00:00Z'); // 2 weeks ago
      const result = t({ date: past });
      expect(result).toMatch(/2\s+weeks?\s+ago/i);
    });

    it('formats months correctly', () => {
      const t = template('{date|timeAgo}');
      const past = new Date('2025-10-20T12:00:00Z'); // ~2 months ago
      const result = t({ date: past });
      expect(result).toMatch(/2\s+months?\s+ago/i);
    });

    it('formats years correctly', () => {
      const t = template('{date|timeAgo}');
      const past = new Date('2023-12-20T12:00:00Z'); // 2 years ago
      const result = t({ date: past });
      expect(result).toMatch(/2\s+years?\s+ago/i);
    });
  });

  describe('future dates', () => {
    it('handles dates in the future', () => {
      const t = template('{date|timeAgo}');
      const future = new Date('2025-12-20T13:00:00Z'); // 1 hour in future
      const result = t({ date: future });
      // Should handle gracefully, showing "in 1 hour" or similar
      expect(result).toMatch(/1\s+hour/i);
    });
  });

  describe('edge cases', () => {
    it('handles same instant (0 difference)', () => {
      const t = template('{date|timeAgo}');
      const now = new Date('2025-12-20T12:00:00Z');
      const result = t({ date: now });
      expect(result).toBe('just now');
    });

    it('handles dates far in the past', () => {
      const t = template('{date|timeAgo}');
      const past = new Date('2020-01-01T00:00:00Z');
      const result = t({ date: past });
      expect(result).toMatch(/years?\s+ago/i);
    });

    it('handles very recent times (< 1 second)', () => {
      const t = template('{date|timeAgo}');
      const past = new Date('2025-12-20T11:59:59.500Z');
      const result = t({ date: past });
      expect(result).toBe('just now');
    });
  });

  describe('realistic scenarios', () => {
    it('formats post timestamp (5 minutes ago)', () => {
      const t = template('{date|timeAgo}');
      const past = new Date('2025-12-20T11:55:00Z');
      const result = t({ date: past });
      expect(result).toMatch(/5\s+minutes?\s+ago/i);
    });

    it('formats comment time (2 hours ago)', () => {
      const t = template('{date|timeAgo}');
      const past = new Date('2025-12-20T10:00:00Z');
      const result = t({ date: past });
      expect(result).toMatch(/2\s+hours?\s+ago/i);
    });

    it('formats notification time (1 day ago)', () => {
      const t = template('{date|timeAgo}');
      const past = new Date('2025-12-19T12:00:00Z');
      const result = t({ date: past });
      expect(result).toMatch(/1\s+day\s+ago/i);
    });

    it('formats video upload (3 weeks ago)', () => {
      const t = template('{date|timeAgo}');
      const past = new Date('2025-11-29T12:00:00Z');
      const result = t({ date: past });
      expect(result).toMatch(/3\s+weeks?\s+ago/i);
    });
  });

  describe('chaining', () => {
    it('can be chained with upper', () => {
      const t = template('{date|timeAgo|upper}');
      const past = new Date('2025-12-20T11:30:00Z');
      const result = t({ date: past });
      expect(result).toBe(result.toUpperCase());
      expect(result).toMatch(/AGO/i);
    });

    it('can be chained with replace', () => {
      const t = template('{date|timeAgo|replace:ago,earlier}');
      const past = new Date('2025-12-20T11:30:00Z');
      const result = t({ date: past });
      expect(result).toMatch(/earlier/i);
    });
  });
});
