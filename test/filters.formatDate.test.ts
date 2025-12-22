import { describe, expect, it } from 'vitest';
import { template } from '../src';

describe('formatDate filter', () => {
  const testDate = new Date('2025-12-20T15:30:45Z');

  describe('preset formats', () => {
    it('formats with short style', () => {
      const t = template('{date|formatDate:short}');
      const result = t({ date: testDate });
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(4);
    });

    it('formats with medium style (default)', () => {
      const t = template('{date|formatDate:medium}');
      const result = t({ date: testDate });
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(4);
    });

    it('formats with long style', () => {
      const t = template('{date|formatDate:long}');
      const result = t({ date: testDate });
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(10);
    });

    it('formats with full style', () => {
      const t = template('{date|formatDate:full}');
      const result = t({ date: testDate });
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(15);
    });

    it('uses medium as default format', () => {
      const t = template('{date|formatDate}');
      const result = t({ date: testDate });
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(4);
    });
  });

  describe('custom patterns', () => {
    it('formats with yyyy-MM-dd pattern', () => {
      const t = template('{date|formatDate:yyyy-MM-dd}');
      const result = t({ date: testDate });
      expect(result).toBe('2025-12-20');
    });

    it('formats with dd/MM/yyyy pattern', () => {
      const t = template('{date|formatDate:dd/MM/yyyy}');
      const result = t({ date: testDate });
      expect(result).toBe('20/12/2025');
    });

    it('formats with HH:mm:ss pattern (24-hour)', () => {
      const t = template('{date|formatDate:HH:mm:ss}');
      const result = t({ date: testDate });
      expect(result).toMatch(/15:30:45/);
    });

    it('formats with h:mm a pattern (12-hour)', () => {
      const t = template('{date|formatDate:h:mm a}');
      const result = t({ date: testDate });
      expect(result).toMatch(/3:30\s*PM/i);
    });

    it('formats with month names (MMMM)', () => {
      const t = template('{date|formatDate:MMMM yyyy}');
      const result = t({ date: testDate });
      expect(result).toMatch(/December 2025/);
    });

    it('formats with abbreviated month (MMM)', () => {
      const t = template('{date|formatDate:MMM yyyy}');
      const result = t({ date: testDate });
      expect(result).toMatch(/Dec 2025/);
    });

    it('formats with weekday (EEEE)', () => {
      const t = template('{date|formatDate:EEEE}');
      const result = t({ date: testDate });
      expect(result).toMatch(/Saturday/i);
    });

    it('formats with abbreviated weekday (EEE)', () => {
      const t = template('{date|formatDate:EEE}');
      const result = t({ date: testDate });
      expect(result).toMatch(/Sat/i);
    });

    it('formats with single-digit day (d)', () => {
      const singleDigitDate = new Date('2025-12-05T12:00:00Z');
      const t = template('{date|formatDate:d}');
      const result = t({ date: singleDigitDate });
      expect(result).toBe('5');
    });

    it('formats with single-digit month (M)', () => {
      const janDate = new Date('2025-01-15T12:00:00Z');
      const t = template('{date|formatDate:M}');
      const result = t({ date: janDate });
      expect(result).toBe('1');
    });

    it('formats with two-digit year (yy)', () => {
      const t = template('{date|formatDate:yy}');
      const result = t({ date: testDate });
      expect(result).toBe('25');
    });
  });

  describe('literal text in patterns', () => {
    it('handles quoted literals with simple patterns', () => {
      const t = template('{date|formatDate:yyyy-MM-dd}');
      const result = t({ date: testDate });
      expect(result).toBe('2025-12-20');
    });

    it('preserves text without special formatting', () => {
      const t = template('{date|formatDate:MMMM yyyy}');
      const result = t({ date: testDate });
      expect(result).toMatch(/December 2025/);
    });
  });

  describe('input types', () => {
    it('accepts Date objects', () => {
      const t = template('{date|formatDate:yyyy-MM-dd}');
      const result = t({ date: testDate });
      expect(result).toBe('2025-12-20');
    });

    it('accepts timestamps (numbers)', () => {
      const t = template('{date|formatDate:yyyy-MM-dd}');
      const timestamp = testDate.getTime();
      const result = t({ date: timestamp });
      expect(result).toBe('2025-12-20');
    });

    it('accepts ISO strings', () => {
      const t = template('{date|formatDate:yyyy-MM-dd}');
      const result = t({ date: '2025-12-20T15:30:45Z' });
      expect(result).toBe('2025-12-20');
    });
  });

  describe('invalid inputs', () => {
    it('handles invalid date strings', () => {
      const t = template('{date|formatDate}');
      expect(t({ date: 'invalid' })).toBe('Invalid date');
    });

    it('handles invalid Date objects', () => {
      const t = template('{date|formatDate}');
      expect(t({ date: new Date('invalid') })).toBe('Invalid date');
    });

    it('handles NaN', () => {
      const t = template('{date|formatDate}');
      expect(t({ date: NaN })).toBe('Invalid date');
    });

    it('handles non-date objects gracefully', () => {
      const t = template('{date|formatDate}');
      expect(t({ date: {} as unknown })).toBe('Invalid date');
    });

    it('handles arrays gracefully', () => {
      const t = template('{date|formatDate}');
      expect(t({ date: [] as unknown })).toBe('Invalid date');
    });
  });

  describe('locale support', () => {
    it('formats with en-US locale (default)', () => {
      const t = template('{date|formatDate:MMMM,en-US}');
      const result = t({ date: testDate });
      expect(result).toMatch(/December/);
    });

    it('formats with de-DE locale', () => {
      const t = template('{date|formatDate:MMMM,de-DE}');
      const result = t({ date: testDate });
      expect(result).toMatch(/Dezember/);
    });

    it('formats with es-ES locale', () => {
      const t = template('{date|formatDate:MMMM,es-ES}');
      const result = t({ date: testDate });
      expect(result).toMatch(/diciembre/);
    });

    it('formats with fr-FR locale', () => {
      const t = template('{date|formatDate:MMMM,fr-FR}');
      const result = t({ date: testDate });
      expect(result).toMatch(/décembre/i);
    });

    it('formats weekdays with locale', () => {
      const t = template('{date|formatDate:EEEE,de-DE}');
      const result = t({ date: testDate });
      expect(result).toMatch(/Samstag/i);
    });
  });

  describe('complex patterns', () => {
    it('formats full date', () => {
      const t = template('{date|formatDate:EEEE MMMM d yyyy}');
      const result = t({ date: testDate });
      expect(result).toMatch(/Saturday December 20 2025/);
    });

    it('formats date and time separately', () => {
      const t1 = template('{date|formatDate:yyyy-MM-dd}');
      const t2 = template('{date|formatDate:HH:mm:ss}');
      expect(t1({ date: testDate })).toBe('2025-12-20');
      expect(t2({ date: testDate })).toMatch(/15:30:45/);
    });

    it('formats with mixed separators', () => {
      const t = template('{date|formatDate:yyyy/MM/dd}');
      const result = t({ date: testDate });
      expect(result).toBe('2025/12/20');
    });

    it('handles multiple spaces', () => {
      const t = template('{date|formatDate:yyyy   MM   dd}');
      const result = t({ date: testDate });
      expect(result).toBe('2025   12   20');
    });
  });

  describe('edge cases', () => {
    it('handles leap year dates', () => {
      const leapDate = new Date('2024-02-29T12:00:00Z');
      const t = template('{date|formatDate:yyyy-MM-dd}');
      const result = t({ date: leapDate });
      expect(result).toBe('2024-02-29');
    });

    it('handles year boundaries', () => {
      const newYear = new Date('2025-01-01T00:00:00Z');
      const t = template('{date|formatDate:yyyy-MM-dd}');
      const result = t({ date: newYear });
      expect(result).toBe('2025-01-01');
    });

    it('handles midnight', () => {
      const midnight = new Date('2025-12-20T00:00:00Z');
      const t = template('{date|formatDate:HH:mm}');
      const result = t({ date: midnight });
      expect(result).toMatch(/00:00/);
    });

    it('handles noon', () => {
      const noon = new Date('2025-12-20T12:00:00Z');
      const t = template('{date|formatDate:h:mm a}');
      const result = t({ date: noon });
      expect(result).toMatch(/12:00\s*PM/i);
    });
  });

  describe('chaining', () => {
    it('can be chained with upper', () => {
      const t = template('{date|formatDate:MMMM|upper}');
      const result = t({ date: testDate });
      expect(result).toBe('DECEMBER');
    });

    it('can be chained with lower', () => {
      const t = template('{date|formatDate:EEEE|lower}');
      const result = t({ date: testDate });
      expect(result).toBe('saturday');
    });

    it('can be chained with truncate', () => {
      const t = template('{date|formatDate:EEEE, MMMM d, yyyy|truncate:15}');
      const result = t({ date: testDate });
      expect(result.length).toBeLessThanOrEqual(15);
    });
  });
});
