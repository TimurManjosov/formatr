import { describe, expect, it } from 'vitest';
import { template } from '../src';

describe('timezone filter', () => {
  const testDate = new Date('2025-12-20T15:30:00Z');

  describe('basic usage', () => {
    it('converts to America/New_York timezone', () => {
      const t = template('{date|timezone:America/New_York}');
      const result = t({ date: testDate });
      expect(typeof result).toBe('string');
      // EST is UTC-5, so 15:30 UTC = 10:30 EST
      expect(result).toMatch(/10:30:00/);
    });

    it('converts to Europe/London timezone', () => {
      const t = template('{date|timezone:Europe/London}');
      const result = t({ date: testDate });
      expect(typeof result).toBe('string');
      // GMT is UTC+0, so 15:30 UTC = 15:30 GMT  
      expect(result).toMatch(/15:30:00/);
    });

    it('converts to Asia/Tokyo timezone', () => {
      const t = template('{date|timezone:Asia/Tokyo}');
      const result = t({ date: testDate });
      expect(typeof result).toBe('string');
      // JST is UTC+9, so 15:30 UTC = 00:30 JST (next day)
      // Note: Intl may format midnight as 24:30 on previous day or 00:30 on next day
      expect(result).toMatch(/(24:30:00|00:30:00)/);
      expect(result).toMatch(/2025-12-2[01]/); // Could be shown as either day
    });

    it('converts to Australia/Sydney timezone', () => {
      const t = template('{date|timezone:Australia/Sydney}');
      const result = t({ date: testDate });
      expect(typeof result).toBe('string');
      // AEDT is UTC+11, so 15:30 UTC = 02:30 AEDT (next day)
      expect(result).toMatch(/02:30:00/);
    });
  });

  describe('input types', () => {
    it('accepts Date objects', () => {
      const t = template('{date|timezone:UTC}');
      const result = t({ date: testDate });
      expect(typeof result).toBe('string');
      expect(result).toMatch(/15:30:00/);
    });

    it('accepts timestamps (numbers)', () => {
      const t = template('{date|timezone:UTC}');
      const timestamp = testDate.getTime();
      const result = t({ date: timestamp });
      expect(typeof result).toBe('string');
      expect(result).toMatch(/15:30:00/);
    });

    it('accepts ISO strings', () => {
      const t = template('{date|timezone:UTC}');
      const result = t({ date: '2025-12-20T15:30:00Z' });
      expect(typeof result).toBe('string');
      expect(result).toMatch(/15:30:00/);
    });
  });

  describe('invalid inputs', () => {
    it('handles invalid date strings', () => {
      const t = template('{date|timezone:UTC}');
      expect(t({ date: 'invalid' })).toBe('Invalid date');
    });

    it('handles invalid Date objects', () => {
      const t = template('{date|timezone:UTC}');
      expect(t({ date: new Date('invalid') })).toBe('Invalid date');
    });

    it('handles NaN', () => {
      const t = template('{date|timezone:UTC}');
      expect(t({ date: NaN })).toBe('Invalid date');
    });

    it('handles missing timezone parameter', () => {
      const t = template('{date|timezone}');
      const result = t({ date: testDate });
      expect(result).toBe('Invalid timezone');
    });

    it('handles non-date objects gracefully', () => {
      const t = template('{date|timezone:UTC}');
      expect(t({ date: {} as unknown })).toBe('Invalid date');
    });
  });

  describe('edge cases', () => {
    it('handles UTC timezone', () => {
      const t = template('{date|timezone:UTC}');
      const result = t({ date: testDate });
      expect(result).toMatch(/15:30:00/);
    });

    it('handles dates at day boundaries', () => {
      const midnight = new Date('2025-12-20T00:00:00Z');
      const t = template('{date|timezone:America/New_York}');
      const result = t({ date: midnight });
      // Should show previous day's evening (19:00)
      expect(result).toMatch(/19:00:00/);
      expect(result).toMatch(/2025-12-19/); // Previous day
    });

    it('handles dates crossing year boundaries', () => {
      const newYear = new Date('2025-01-01T00:30:00Z');
      const t = template('{date|timezone:Asia/Tokyo}');
      const result = t({ date: newYear });
      // JST is UTC+9, so 00:30 UTC Jan 1 = 09:30 JST Jan 1
      expect(result).toMatch(/09:30:00/);
    });
  });

  describe('timezone abbreviations', () => {
    it('includes timezone abbreviation by default', () => {
      const t = template('{date|timezone:America/New_York}');
      const result = t({ date: testDate });
      // Should include EST or similar
      expect(result).toMatch(/(EST|ET|EDT)/i);
    });

    it('handles Pacific timezone', () => {
      const t = template('{date|timezone:America/Los_Angeles}');
      const result = t({ date: testDate });
      // PST is UTC-8, so 15:30 UTC = 07:30 PST
      expect(result).toMatch(/07:30:00/);
    });

    it('handles multiple timezone formats', () => {
      const timezones = [
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'Australia/Sydney',
      ];

      for (const tz of timezones) {
        const t = template(`{date|timezone:${tz}}`);
        const result = t({ date: testDate });
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(10);
      }
    });
  });

  describe('chaining', () => {
    it('can be chained with upper', () => {
      const t = template('{date|timezone:UTC|upper}');
      const result = t({ date: testDate });
      expect(result).toBe(result.toUpperCase());
    });

    it('can be chained with truncate', () => {
      const t = template('{date|timezone:America/New_York|truncate:20}');
      const result = t({ date: testDate });
      expect(result.length).toBeLessThanOrEqual(20);
    });
  });
});
