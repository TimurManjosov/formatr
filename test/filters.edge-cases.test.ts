import { describe, expect, it } from 'vitest';
import { template } from '../src';

describe('Text Filters: Edge Cases', () => {
  describe('upper filter', () => {
    it('handles numbers', () => {
      const t = template('{value|upper}');
      expect(t({ value: 42 })).toBe('42');
      expect(t({ value: 0 })).toBe('0');
      expect(t({ value: -123 })).toBe('-123');
    });

    it('handles NaN', () => {
      const t = template('{value|upper}');
      expect(t({ value: NaN })).toBe('NAN');
    });

    it('handles Infinity', () => {
      const t = template('{value|upper}');
      expect(t({ value: Infinity })).toBe('INFINITY');
      expect(t({ value: -Infinity })).toBe('-INFINITY');
    });

    it('handles objects', () => {
      const t = template('{value|upper}');
      expect(t({ value: { obj: true } })).toBe('[OBJECT OBJECT]');
    });

    it('handles arrays', () => {
      const t = template('{value|upper}');
      expect(t({ value: [1, 2, 3] })).toBe('1,2,3');
      expect(t({ value: ['a', 'b', 'c'] })).toBe('A,B,C');
    });

    it('handles boolean values', () => {
      const t = template('{value|upper}');
      expect(t({ value: true })).toBe('TRUE');
      expect(t({ value: false })).toBe('FALSE');
    });

    it('handles empty string', () => {
      const t = template('{value|upper}');
      expect(t({ value: '' })).toBe('');
    });
  });

  describe('lower filter', () => {
    it('handles numbers', () => {
      const t = template('{value|lower}');
      expect(t({ value: 42 })).toBe('42');
    });

    it('handles NaN', () => {
      const t = template('{value|lower}');
      expect(t({ value: NaN })).toBe('nan');
    });

    it('handles Infinity', () => {
      const t = template('{value|lower}');
      expect(t({ value: Infinity })).toBe('infinity');
    });

    it('handles objects', () => {
      const t = template('{value|lower}');
      expect(t({ value: { obj: true } })).toBe('[object object]');
    });

    it('handles arrays', () => {
      const t = template('{value|lower}');
      expect(t({ value: [1, 2, 3] })).toBe('1,2,3');
      expect(t({ value: ['A', 'B', 'C'] })).toBe('a,b,c');
    });

    it('handles boolean values', () => {
      const t = template('{value|lower}');
      expect(t({ value: true })).toBe('true');
      expect(t({ value: false })).toBe('false');
    });
  });

  describe('trim filter', () => {
    it('handles numbers', () => {
      const t = template('{value|trim}');
      expect(t({ value: 42 })).toBe('42');
    });

    it('handles NaN', () => {
      const t = template('{value|trim}');
      expect(t({ value: NaN })).toBe('NaN');
    });

    it('handles objects', () => {
      const t = template('{value|trim}');
      expect(t({ value: { obj: true } })).toBe('[object Object]');
    });

    it('handles arrays with whitespace in string representation', () => {
      const t = template('{value|trim}');
      expect(t({ value: [1, 2, 3] })).toBe('1,2,3');
    });
  });
});

describe('Plural Filter: Edge Cases', () => {
  it('returns string representation for NaN', () => {
    const t = template('{count|plural:item,items}');
    expect(t({ count: NaN })).toBe('NaN');
  });

  it('returns string representation for Infinity', () => {
    const t = template('{count|plural:item,items}');
    expect(t({ count: Infinity })).toBe('Infinity');
    expect(t({ count: -Infinity })).toBe('-Infinity');
  });

  it('returns string representation for non-numeric strings', () => {
    const t = template('{count|plural:item,items}');
    expect(t({ count: 'not a number' as unknown })).toBe('not a number');
  });

  it('returns string representation for objects', () => {
    const t = template('{count|plural:item,items}');
    expect(t({ count: { obj: true } as unknown })).toBe('[object Object]');
  });

  it('throws error when singular argument is missing', () => {
    expect(() => {
      const t = template('{count|plural:item}');
      t({ count: 1 });
    }).toThrow(/plural filter requires two args/);
  });

  it('throws error when both arguments are missing', () => {
    expect(() => {
      const t = template('{count|plural}');
      t({ count: 1 });
    }).toThrow(/plural filter requires two args/);
  });

  it('handles zero correctly', () => {
    const t = template('{count|plural:item,items}');
    expect(t({ count: 0 })).toBe('items');
  });

  it('handles one correctly', () => {
    const t = template('{count|plural:item,items}');
    expect(t({ count: 1 })).toBe('item');
  });

  it('handles negative numbers', () => {
    const t = template('{count|plural:item,items}');
    // -1 is not equal to 1, so it returns plural form
    expect(t({ count: -1 })).toBe('items');
    expect(t({ count: -2 })).toBe('items');
  });

  it('handles decimal numbers', () => {
    const t = template('{count|plural:item,items}');
    expect(t({ count: 1.0 })).toBe('item');
    expect(t({ count: 1.5 })).toBe('items');
  });
});

describe('Number Filters: Edge Cases', () => {
  describe('number filter', () => {
    it('returns string representation for non-numeric strings', () => {
      const t = template('{value|number}');
      expect(t({ value: 'not a number' as unknown })).toBe('not a number');
    });

    it('returns string representation for objects', () => {
      const t = template('{value|number}');
      expect(t({ value: { obj: true } as unknown })).toBe('[object Object]');
    });

    it('returns string representation for arrays', () => {
      const t = template('{value|number}');
      expect(t({ value: [1, 2, 3] as unknown })).toBe('1,2,3');
    });

    it('returns string representation for NaN', () => {
      const t = template('{value|number}');
      expect(t({ value: NaN })).toBe('NaN');
    });

    it('returns string representation for Infinity', () => {
      const t = template('{value|number}');
      expect(t({ value: Infinity })).toBe('Infinity');
      expect(t({ value: -Infinity })).toBe('-Infinity');
    });

    it('formats numeric strings correctly', () => {
      const t = template('{value|number}');
      expect(t({ value: '123' as unknown })).toMatch(/123/);
    });

    it('formats zero correctly', () => {
      const t = template('{value|number}');
      expect(t({ value: 0 })).toBe('0');
    });

    it('formats negative numbers correctly', () => {
      const t = template('{value|number}');
      const result = t({ value: -42 });
      expect(result).toMatch(/-42/);
    });

    it('handles boolean values', () => {
      const t = template('{value|number}');
      expect(t({ value: true as unknown })).toMatch(/1/);
      expect(t({ value: false as unknown })).toBe('0');
    });
  });

  describe('percent filter', () => {
    it('returns string representation for non-numeric strings', () => {
      const t = template('{value|percent}');
      expect(t({ value: 'not a number' as unknown })).toBe('not a number');
    });

    it('returns string representation for NaN', () => {
      const t = template('{value|percent}');
      expect(t({ value: NaN })).toBe('NaN');
    });

    it('returns string representation for Infinity', () => {
      const t = template('{value|percent}');
      expect(t({ value: Infinity })).toBe('Infinity');
    });

    it('formats zero correctly', () => {
      const t = template('{value|percent}');
      expect(t({ value: 0 })).toBe('0%');
    });

    it('formats negative percentages correctly', () => {
      const t = template('{value|percent}');
      const result = t({ value: -0.5 });
      expect(result).toMatch(/-50%/);
    });

    it('handles numeric strings correctly', () => {
      const t = template('{value|percent}');
      const result = t({ value: '0.5' as unknown });
      expect(result).toMatch(/50%/);
    });
  });

  describe('currency filter', () => {
    it('returns string representation for non-numeric strings', () => {
      const t = template('{value|currency:USD}');
      expect(t({ value: 'not a number' as unknown })).toBe('not a number');
    });

    it('returns string representation for NaN', () => {
      const t = template('{value|currency:USD}');
      expect(t({ value: NaN })).toBe('NaN');
    });

    it('returns string representation for Infinity', () => {
      const t = template('{value|currency:USD}');
      expect(t({ value: Infinity })).toBe('Infinity');
    });

    it('throws error when currency code is missing', () => {
      expect(() => {
        const t = template('{value|currency}');
        t({ value: 42 });
      }).toThrow(/currency filter requires code/);
    });

    it('formats zero correctly', () => {
      const t = template('{value|currency:USD}');
      const result = t({ value: 0 });
      expect(result).toMatch(/0/);
    });

    it('formats negative amounts correctly', () => {
      const t = template('{value|currency:USD}');
      const result = t({ value: -42 });
      expect(result).toMatch(/-/);
      expect(result).toMatch(/42/);
    });

    it('handles numeric strings correctly', () => {
      const t = template('{value|currency:USD}');
      const result = t({ value: '42.50' as unknown });
      expect(result).toMatch(/42/);
    });

    it('handles invalid currency codes gracefully', () => {
      const t = template('{value|currency:INVALID}');
      // The try-catch in currency filter falls back to string representation
      // However, some invalid codes may still be accepted by Intl.NumberFormat
      // This test just verifies it doesn't crash
      const result = t({ value: 42 });
      expect(typeof result).toBe('string');
      // Either it formats or falls back
      expect(result.length).toBeGreaterThan(0);
    });

    it('handles objects gracefully', () => {
      const t = template('{value|currency:USD}');
      expect(t({ value: { obj: true } as unknown })).toBe('[object Object]');
    });
  });
});

describe('Date Filter: Edge Cases', () => {
  it('returns string representation for non-date strings', () => {
    const t = template('{value|date:short}');
    expect(t({ value: 'not a date' as unknown })).toBe('not a date');
  });

  it('returns Invalid Date string for invalid Date objects', () => {
    const t = template('{value|date:short}');
    expect(t({ value: new Date('invalid') })).toBe('Invalid Date');
  });

  it('returns string representation for NaN', () => {
    const t = template('{value|date:short}');
    expect(t({ value: NaN as unknown })).toBe('NaN');
  });

  it('returns string representation for objects', () => {
    const t = template('{value|date:short}');
    expect(t({ value: { obj: true } as unknown })).toBe('[object Object]');
  });

  it('formats valid Date objects', () => {
    const t = template('{value|date:short}');
    const date = new Date('2025-10-13T00:00:00Z');
    const result = t({ value: date });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(4);
  });

  it('formats numeric timestamps', () => {
    const t = template('{value|date:short}');
    const timestamp = Date.now();
    const result = t({ value: timestamp });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(4);
  });

  it('formats ISO date strings', () => {
    const t = template('{value|date:short}');
    const result = t({ value: '2025-10-13T00:00:00Z' as unknown });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(4);
  });

  it('handles all date styles', () => {
    const date = new Date('2025-10-13T00:00:00Z');
    const styles = ['short', 'medium', 'long', 'full'];
    for (const style of styles) {
      const t = template(`{value|date:${style}}`);
      const result = t({ value: date });
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(4);
    }
  });

  it('uses medium style as default for unrecognized styles', () => {
    const t = template('{value|date:unknown}');
    const date = new Date('2025-10-13T00:00:00Z');
    const result = t({ value: date });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(4);
  });
});

describe('Filter Chaining with Edge Cases', () => {
  it('chains filters with type conversions', () => {
    const t = template('{value|number|upper}');
    // number returns '123', upper converts to '123'
    expect(t({ value: 123 })).toBe('123');
  });

  it('chains text filters on numbers', () => {
    const t = template('{value|upper|trim|lower}');
    expect(t({ value: 42 })).toBe('42');
  });

  it('chains filters with NaN', () => {
    const t = template('{value|number|upper}');
    expect(t({ value: NaN })).toBe('NAN');
  });

  it('chains plural with upper', () => {
    const t = template('{count|plural:item,items|upper}');
    expect(t({ count: 1 })).toBe('ITEM');
    expect(t({ count: 2 })).toBe('ITEMS');
  });

  it('chains slice with upper on invalid input', () => {
    const t = template('{value|slice:0,3|upper}');
    expect(t({ value: NaN })).toBe('NAN');
  });
});
