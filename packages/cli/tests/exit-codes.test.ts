import { describe, it, expect } from 'vitest';
import { EXIT_CODES } from '../src/utils/exit-codes';

describe('exit-codes', () => {
  it('should have correct values', () => {
    expect(EXIT_CODES.SUCCESS).toBe(0);
    expect(EXIT_CODES.FAILURE).toBe(1);
    expect(EXIT_CODES.INVALID_USAGE).toBe(2);
  });
});
