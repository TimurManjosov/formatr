import { describe, expect, it } from 'vitest';
import { analyze } from '../src/core/analyze';

describe('analyze: positions on all diagnostics', () => {
  it('unknown filter has line/column', () => {
    const src = 'Hello {name|nope}\nNext line';
    const r = analyze(src);
    const m = r.messages.find((x) => x.code === 'unknown-filter');
    expect(m).toBeTruthy();
    expect(typeof m?.line).toBe('number');
    expect(typeof m?.column).toBe('number');
  });

  it('bad args for plural has line/column', () => {
    const src = 'X={n|plural:one}';
    const r = analyze(src);
    const m = r.messages.find((x) => x.code === 'bad-args');
    expect(m).toBeTruthy();
    expect(m?.message).toMatch(/plural/);
    expect(m?.line).toBeGreaterThan(0);
  });
});
