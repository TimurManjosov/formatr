import { describe, expect, it } from 'vitest';
import { template } from '../src';

describe('formatr: filters', () => {
  it('applies a single filter', () => {
    const t = template('Hello {name|upper}');
    expect(t({ name: 'alex' })).toBe('Hello ALEX');
  });

  it('applies multiple filters in order', () => {
    const t = template('X={x|trim|upper}');
    expect(t({ x: '  hi ' })).toBe('X=HI');
  });

  it('passes arguments to filters', () => {
    const t = template('{n|plural:apple,apples}');
    expect(t({ n: 1 })).toBe('apple');
    expect(t({ n: 2 })).toBe('apples');
  });

  it('throws for unknown filters', () => {
    const t = template('Hi {x|doesnotexist}');
    expect(() => t({ x: 'A' })).toThrow(/Unknown filter "doesnotexist"/);
  });

  it('keeps missing key behavior even with filters', () => {
    const t = template('Hi {name|upper}', { onMissing: 'keep' });
    expect(t({})).toBe('Hi {name}');
  });
});
