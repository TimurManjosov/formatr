import { describe, expect, it } from 'vitest';
import { template } from '../src';

describe('duration filter', () => {
  describe('basic usage - milliseconds', () => {
    it('formats 1.5 hours (5400000 ms)', () => {
      const t = template('{ms|duration}');
      const result = t({ ms: 5400000 });
      expect(result).toMatch(/1h 30m/);
    });

    it('formats 90 seconds (90000 ms)', () => {
      const t = template('{ms|duration}');
      const result = t({ ms: 90000 });
      expect(result).toMatch(/1m 30s/);
    });

    it('formats 1 hour (3600000 ms)', () => {
      const t = template('{ms|duration}');
      const result = t({ ms: 3600000 });
      expect(result).toMatch(/1h/);
    });

    it('formats 30 minutes (1800000 ms)', () => {
      const t = template('{ms|duration}');
      const result = t({ ms: 1800000 });
      expect(result).toMatch(/30m/);
    });

    it('formats 5 seconds (5000 ms)', () => {
      const t = template('{ms|duration}');
      const result = t({ ms: 5000 });
      expect(result).toMatch(/5s/);
    });
  });

  describe('input types', () => {
    it('accepts numeric values', () => {
      const t = template('{value|duration}');
      const result = t({ value: 60000 });
      expect(result).toMatch(/1m/);
    });

    it('handles zero', () => {
      const t = template('{value|duration}');
      const result = t({ value: 0 });
      expect(result).toMatch(/0/);
    });

    it('handles very large values', () => {
      const t = template('{value|duration}');
      const result = t({ value: 86400000 }); // 1 day
      expect(result).toMatch(/1d/);
    });
  });

  describe('invalid inputs', () => {
    it('handles NaN gracefully', () => {
      const t = template('{value|duration}');
      expect(t({ value: NaN })).toBe('NaN');
    });

    it('handles Infinity gracefully', () => {
      const t = template('{value|duration}');
      expect(t({ value: Infinity })).toBe('Infinity');
    });

    it('handles invalid strings', () => {
      const t = template('{value|duration}');
      expect(t({ value: 'invalid' as unknown })).toBe('invalid');
    });

    it('handles objects gracefully', () => {
      const t = template('{value|duration}');
      const result = t({ value: {} as unknown });
      expect(result).toBe('[object Object]');
    });
  });

  describe('negative durations', () => {
    it('handles negative milliseconds', () => {
      const t = template('{value|duration}');
      const result = t({ value: -5400000 });
      expect(result).toMatch(/-/);
      expect(result).toMatch(/1h 30m/);
    });

    it('handles negative seconds', () => {
      const t = template('{value|duration}');
      const result = t({ value: -90000 });
      expect(result).toMatch(/-/);
      expect(result).toMatch(/1m 30s/);
    });
  });

  describe('edge cases', () => {
    it('handles very small durations (< 1 second)', () => {
      const t = template('{value|duration}');
      const result = t({ value: 500 });
      // Should show 0d (days) or similar based on default units
      expect(result).toMatch(/0[dhms]/);
    });

    it('handles minimal durations', () => {
      const t = template('{value|duration}');
      const result = t({ value: 10 });
      expect(result).toMatch(/0[dhms]/);
    });

    it('handles one millisecond', () => {
      const t = template('{value|duration}');
      const result = t({ value: 1 });
      expect(result).toMatch(/0[dhms]/);
    });

    it('handles exact hour', () => {
      const t = template('{value|duration}');
      const result = t({ value: 3600000 }); // exactly 1 hour
      expect(result).toMatch(/1h/);
    });

    it('handles exact day', () => {
      const t = template('{value|duration}');
      const result = t({ value: 86400000 }); // exactly 1 day
      expect(result).toMatch(/1d/);
    });
  });

  describe('format combinations', () => {
    it('formats hours and minutes', () => {
      const t = template('{value|duration}');
      const result = t({ value: 5430000 }); // 1h 30m 30s
      expect(result).toMatch(/1h 30m/);
    });

    it('formats days, hours, and minutes', () => {
      const t = template('{value|duration}');
      const result = t({ value: 90000000 }); // 1d 1h 0m
      expect(result).toMatch(/1d 1h/);
    });

    it('formats complex durations', () => {
      const t = template('{value|duration}');
      const result = t({ value: 90061000 }); // 1d 1h 1m 1s
      expect(result).toMatch(/1d 1h/);
    });
  });

  describe('chaining', () => {
    it('can be chained with upper', () => {
      const t = template('{value|duration|upper}');
      const result = t({ value: 5400000 });
      expect(result).toBe(result.toUpperCase());
      expect(result).toMatch(/H/);
    });

    it('can be chained with replace', () => {
      const t = template('{value|duration|replace:h,hours}');
      const result = t({ value: 3600000 });
      expect(result).toMatch(/hours/);
    });
  });

  describe('realistic scenarios', () => {
    it('formats video duration (3 minutes 45 seconds)', () => {
      const t = template('{value|duration}');
      const result = t({ value: 225000 }); // 3m 45s
      expect(result).toMatch(/3m 45s/);
    });

    it('formats task duration (2 hours 15 minutes)', () => {
      const t = template('{value|duration}');
      const result = t({ value: 8100000 }); // 2h 15m
      expect(result).toMatch(/2h 15m/);
    });

    it('formats download time (30 seconds)', () => {
      const t = template('{value|duration}');
      const result = t({ value: 30000 });
      expect(result).toMatch(/30s/);
    });

    it('formats long process (5 days)', () => {
      const t = template('{value|duration}');
      const result = t({ value: 432000000 }); // 5 days
      expect(result).toMatch(/5d/);
    });
  });
});
