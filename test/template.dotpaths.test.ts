import { describe, expect, it } from 'vitest';
import { template } from '../src';

describe('formatr: dot-path placeholders', () => {
  it('reads a single-level key (backward compatible)', () => {
    const t = template('{name}');
    expect(t({ name: 'A' })).toBe('A');
  });

  it('reads nested keys', () => {
    const t = template('User={user.name}, City={user.address.city}');
    const out = t({ user: { name: 'Lara', address: { city: 'Berlin' } } });
    expect(out).toBe('User=Lara, City=Berlin');
  });

  it('respects onMissing=keep for missing nested seg', () => {
    const t = template('City={user.address.city}', { onMissing: 'keep' });
    const out = t({ user: { address: null } });
    expect(out).toBe('City={user.address.city}');
  });

  it('throws onMissing=error when path missing', () => {
    const t = template('{a.b.c}', { onMissing: 'error' });
    expect(() => t({ a: {} })).toThrow(/Missing key "a\.b\.c"/);
  });

  it('works with filters after path', () => {
    const t = template('{user.name|upper}');
    expect(t({ user: { name: 'lara' } })).toBe('LARA');
  });
});
