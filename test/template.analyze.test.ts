import { describe, expect, it } from 'vitest';
import { analyze } from '../src';

describe('formatr: analyze()', () => {
  it('reports unknown filters', () => {
    const { messages } = analyze('Hi {x|nope}');
    expect(messages.some((m) => m.code === 'unknown-filter' && /nope/.test(m.message))).toBe(true);
  });

  it('reports bad args for plural', () => {
    const { messages } = analyze('{n|plural:one}');
    const m = messages.find((m) => m.code === 'bad-args');
    expect(m?.message).toMatch(/plural/);
  });

  it('reports bad args for currency', () => {
    const { messages } = analyze('{p|currency}');
    const m = messages.find((m) => m.code === 'bad-args');
    expect(m?.message).toMatch(/currency/);
  });

  it('accepts custom filters via options', () => {
    const { messages } = analyze('{x|custom:a,b}', {
      filters: { custom: (v: unknown) => v },
    });
    expect(messages.length).toBe(0);
  });

  it('recognizes intl filters via locale registry', () => {
    const { messages } = analyze('{n|number}', { locale: 'de' });
    expect(messages.length).toBe(0);
  });
});
