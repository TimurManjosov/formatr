import { describe, expect, it } from 'vitest';
import { analyze } from '../src/core/analyze';

describe('analyze: parse-error with positions', () => {
  it('reports unterminated placeholder with line/column', () => {
    const r = analyze('Hello {name');
    const m = r.messages.find((x) => x.code === 'parse-error');
    expect(m).toBeTruthy();
    expect(m?.message).toMatch(/Expected '}'/);
    expect(typeof m?.line).toBe('number');
    expect(typeof m?.column).toBe('number');
  });

  it('reports invalid identifier', () => {
    const r = analyze('{9abc}');
    const m = r.messages.find((x) => x.code === 'parse-error');
    expect(m).toBeTruthy();
    expect(m?.message).toMatch(/Expected identifier/);
  });
});
