import { describe, expect, it } from 'vitest';
import { template } from '../src';

describe('formatr: precompile cache', () => {
  it('reuses compiled renderer for same source+options', () => {
    const t1 = template('Hello {name}', { locale: 'en', cacheSize: 50 });
    const t2 = template('Hello {name}', { locale: 'en', cacheSize: 50 });
    // same function instance if cached:
    expect(t1).toBe(t2);
    expect(t1({ name: 'A' })).toBe('Hello A');
  });

  it('differentiates by options (locale affects intl)', () => {
    const tEn = template('{n|number}', { locale: 'en', cacheSize: 50 });
    const tDe = template('{n|number}', { locale: 'de', cacheSize: 50 });
    expect(tEn).not.toBe(tDe);
    expect(tEn({ n: 1234.5 })).not.toBe(tDe({ n: 1234.5 }));
  });

  it('can be disabled with cacheSize=0', () => {
    const t1 = template('Hi {x}', { cacheSize: 0 });
    const t2 = template('Hi {x}', { cacheSize: 0 });
    expect(t1).not.toBe(t2); // new compile each time
  });
});
