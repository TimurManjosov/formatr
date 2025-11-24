import { describe, expect, it } from 'vitest';
import { analyze } from '../src/core/analyze';

describe('Analyze: Date Filter Validation', () => {
  it('reports error when date filter has no arguments', () => {
    const report = analyze('{date|date}');
    expect(report.messages).toHaveLength(1);
    expect(report.messages[0].code).toBe('bad-args');
    expect(report.messages[0].message).toContain('date');
    expect(report.messages[0].message).toContain('requires 1 argument');
    expect(report.messages[0].severity).toBe('error');
  });

  it('accepts date filter with short style', () => {
    const report = analyze('{date|date:short}');
    expect(report.messages).toHaveLength(0);
  });

  it('accepts date filter with medium style', () => {
    const report = analyze('{date|date:medium}');
    expect(report.messages).toHaveLength(0);
  });

  it('accepts date filter with long style', () => {
    const report = analyze('{date|date:long}');
    expect(report.messages).toHaveLength(0);
  });

  it('accepts date filter with full style', () => {
    const report = analyze('{date|date:full}');
    expect(report.messages).toHaveLength(0);
  });

  it('accepts date filter with any argument (non-validating at parse time)', () => {
    const report = analyze('{date|date:custom}');
    expect(report.messages).toHaveLength(0);
  });
});
