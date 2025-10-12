import { describe, expect, it } from 'vitest';
import { hello } from '../src/index';

describe('hello', () => {
  it('should return a greeting message', () => {
    expect(hello('World')).toBe('Hello, World!');
  });
});
