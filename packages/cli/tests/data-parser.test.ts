import { describe, it, expect } from 'vitest';
import { 
  parseData, 
  parseDataString,
} from '../src/utils/data-parser';

describe('data-parser', () => {
  describe('parseDataString', () => {
    it('should parse JSON string', async () => {
      const result = await parseDataString('{"name": "test"}');
      expect(result).toEqual({ name: 'test' });
    });

    it('should parse JSON array', async () => {
      const result = await parseDataString('[1, 2, 3]');
      expect(result).toEqual([1, 2, 3]);
    });

    it('should throw on invalid JSON', async () => {
      await expect(parseDataString('{invalid}')).rejects.toThrow('Invalid JSON');
    });

    it('should parse explicit JSON format', async () => {
      const result = await parseDataString('{"a": 1}', 'json');
      expect(result).toEqual({ a: 1 });
    });
  });

  describe('parseData', () => {
    it('should parse inline JSON', async () => {
      const result = await parseData('{"inline": true}');
      expect(result).toEqual({ inline: true });
    });

    it('should parse inline JSON array', async () => {
      const result = await parseData('[1, 2, 3]');
      expect(result).toEqual([1, 2, 3]);
    });
  });
});
