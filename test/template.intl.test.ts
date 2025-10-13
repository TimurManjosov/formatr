import { describe, expect, it } from 'vitest';
import { template } from '../src';

describe('formatr: intl filters', () => {
  it('formats numbers (locale-sensitive)', () => {
    const t = template('{n|number}', { locale: 'de' });
    expect(t({ n: 12345.6 })).toBe('12.345,6');
  });

  it('formats percent with fraction digits', () => {
    const t = template('{n|percent:1}');
    expect(t({ n: 0.256 })).toBe('25.6%');
  });

  it('formats currency with code and digits', () => {
    const t = template('{p|currency:EUR:2}', { locale: 'de' });
    const out = t({ p: 12.5 });
    expect(out).toMatch(/12,50/); // decimal comma
    expect(out).toMatch(/€/); // euro symbol somewhere
  });

  it('formats date with styles', () => {
    const t = template('{d|date:short}', { locale: 'en' });
    const out = t({ d: new Date('2025-10-13T00:00:00Z') });
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(4);
  });
});
