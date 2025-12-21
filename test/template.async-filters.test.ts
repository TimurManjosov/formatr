import { describe, expect, it } from 'vitest';
import { templateAsync, FilterExecutionError, FormatrError } from '../src';

// Helper to create delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('formatr: async filters', () => {
  describe('basic async filter support', () => {
    it('should handle single async filter', async () => {
      const t = templateAsync<{ value: number }>(
        '{value|asyncDouble}',
        {
          filters: {
            asyncDouble: async (n: unknown) => {
              await delay(10);
              return Number(n) * 2;
            },
          },
        }
      );
      
      const result = await t({ value: 5 });
      expect(result).toBe('10');
    });

    it('should handle async filter returning string', async () => {
      const t = templateAsync<{ userId: number }>(
        'User: {userId|fetchUser}',
        {
          filters: {
            fetchUser: async (id: unknown) => {
              await delay(5);
              return `User_${id}`;
            },
          },
        }
      );
      
      const result = await t({ userId: 123 });
      expect(result).toBe('User: User_123');
    });

    it('should handle async filter returning object', async () => {
      const t = templateAsync<{ id: number }>(
        '{id|fetchData|getName}',
        {
          filters: {
            fetchData: async (id: unknown) => {
              await delay(5);
              return { name: 'Alice', id };
            },
            getName: (obj: any) => obj.name,
          },
        }
      );
      
      const result = await t({ id: 1 });
      expect(result).toBe('Alice');
    });
  });

  describe('mixed sync and async filters', () => {
    it('should chain async and sync filters', async () => {
      const t = templateAsync<{ x: number }>(
        '{x|fetchData|getName|upper}',
        {
          filters: {
            fetchData: async () => ({ name: 'test' }),
            getName: (obj: any) => obj.name,
            upper: (str: unknown) => String(str).toUpperCase(),
          },
        }
      );
      
      const result = await t({ x: 1 });
      expect(result).toBe('TEST');
    });

    it('should handle sync filter followed by async filter', async () => {
      const t = templateAsync<{ value: string }>(
        '{value|upper|asyncAppend}',
        {
          filters: {
            upper: (str: unknown) => String(str).toUpperCase(),
            asyncAppend: async (str: unknown) => {
              await delay(5);
              return String(str) + '_ASYNC';
            },
          },
        }
      );
      
      const result = await t({ value: 'hello' });
      expect(result).toBe('HELLO_ASYNC');
    });

    it('should handle multiple async filters in chain', async () => {
      const t = templateAsync<{ value: number }>(
        '{value|async1|async2|async3}',
        {
          filters: {
            async1: async (n: unknown) => {
              await delay(5);
              return Number(n) + 1;
            },
            async2: async (n: unknown) => {
              await delay(5);
              return Number(n) * 2;
            },
            async3: async (n: unknown) => {
              await delay(5);
              return Number(n) + 10;
            },
          },
        }
      );
      
      const result = await t({ value: 5 });
      expect(result).toBe('22'); // ((5 + 1) * 2) + 10 = 22
    });
  });

  describe('parallel async execution', () => {
    it('should execute independent async filters in parallel', async () => {
      const startTime = Date.now();
      
      const t = templateAsync<{ a: number; b: number }>(
        '{a|delay} {b|delay}',
        {
          filters: {
            delay: async (val: unknown) => {
              await delay(100);
              return val;
            },
          },
        }
      );
      
      await t({ a: 1, b: 2 });
      
      const duration = Date.now() - startTime;
      // Should be ~100ms (parallel), not ~200ms (sequential)
      expect(duration).toBeLessThan(150);
    });

    it('should handle multiple placeholders with mixed sync/async', async () => {
      const t = templateAsync<{ a: string; b: number; c: string }>(
        'A: {a|upper} B: {b|asyncDouble} C: {c|lower}',
        {
          filters: {
            upper: (str: unknown) => String(str).toUpperCase(),
            lower: (str: unknown) => String(str).toLowerCase(),
            asyncDouble: async (n: unknown) => {
              await delay(10);
              return Number(n) * 2;
            },
          },
        }
      );
      
      const result = await t({ a: 'hello', b: 5, c: 'WORLD' });
      expect(result).toBe('A: HELLO B: 10 C: world');
    });

    it('should handle three independent async operations in parallel', async () => {
      const startTime = Date.now();
      
      const t = templateAsync<{ a: number; b: number; c: number }>(
        '{a|delay} {b|delay} {c|delay}',
        {
          filters: {
            delay: async (val: unknown) => {
              await delay(80);
              return val;
            },
          },
        }
      );
      
      const result = await t({ a: 1, b: 2, c: 3 });
      
      const duration = Date.now() - startTime;
      expect(result).toBe('1 2 3');
      // Should be ~80ms (parallel), not ~240ms (sequential)
      expect(duration).toBeLessThan(120);
    });
  });

  describe('error handling', () => {
    it('should catch async filter errors and provide context', async () => {
      const t = templateAsync<{ x: number }>(
        '{x|failingFilter}',
        {
          filters: {
            failingFilter: async () => {
              throw new Error('API Error');
            },
          },
        }
      );
      
      await expect(t({ x: 1 })).rejects.toThrow(FilterExecutionError);
      await expect(t({ x: 1 })).rejects.toThrow(/failingFilter/);
      await expect(t({ x: 1 })).rejects.toThrow(/API Error/);
    });

    it('should include placeholder info in error', async () => {
      const t = templateAsync<{ userId: number }>(
        '{userId|fetchUser}',
        {
          filters: {
            fetchUser: async () => {
              throw new Error('Network timeout');
            },
          },
        }
      );
      
      await expect(t({ userId: 123 })).rejects.toThrow(/\{userId\}/);
      await expect(t({ userId: 123 })).rejects.toThrow(/fetchUser/);
    });

    it('should catch errors in filter chains and identify which filter failed', async () => {
      const t = templateAsync<{ x: number }>(
        '{x|filter1|filter2|filter3}',
        {
          filters: {
            filter1: async (n: unknown) => Number(n) + 1,
            filter2: async () => {
              throw new Error('Filter2 failed');
            },
            filter3: async (n: unknown) => Number(n) * 2,
          },
        }
      );
      
      await expect(t({ x: 5 })).rejects.toThrow(/filter2/);
      await expect(t({ x: 5 })).rejects.toThrow(/Filter2 failed/);
    });

    it('should handle sync filter errors in async context', async () => {
      const t = templateAsync<{ x: number }>(
        '{x|syncFail}',
        {
          filters: {
            syncFail: () => {
              throw new Error('Sync error');
            },
          },
        }
      );
      
      await expect(t({ x: 1 })).rejects.toThrow(/syncFail/);
      await expect(t({ x: 1 })).rejects.toThrow(/Sync error/);
    });

    it('should preserve original error in FilterExecutionError', async () => {
      const originalError = new Error('Original');
      
      const t = templateAsync<{ x: number }>(
        '{x|failing}',
        {
          filters: {
            failing: async () => {
              throw originalError;
            },
          },
        }
      );
      
      try {
        await t({ x: 1 });
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FilterExecutionError);
        if (err instanceof FilterExecutionError) {
          expect(err.originalError).toBe(originalError);
          expect(err.filterName).toBe('failing');
          expect(err.inputValue).toBe(1);
        }
      }
    });
  });

  describe('sync render with async filters', () => {
    it('should throw error when using async filter with sync render', async () => {
      // Import template locally to test sync behavior
      const { template } = await import('../src/index.js');
      
      const t = template<{ x: number }>(
        '{x|asyncFilter}',
        {
          filters: {
            asyncFilter: async (n: unknown) => {
              await delay(10);
              return Number(n) * 2;
            },
          },
        }
      );
      
      // This should throw when trying to render
      expect(() => t({ x: 5 })).toThrow(FormatrError);
      expect(() => t({ x: 5 })).toThrow(/renderAsync/);
    });
  });

  describe('edge cases', () => {
    it('should handle async filter returning null', async () => {
      const t = templateAsync<{ x: number }>(
        'Result: {x|returnNull}',
        {
          filters: {
            returnNull: async () => {
              await delay(5);
              return null;
            },
          },
        }
      );
      
      const result = await t({ x: 1 });
      expect(result).toBe('Result: null');
    });

    it('should handle async filter returning undefined', async () => {
      const t = templateAsync<{ x: number }>(
        'Result: {x|returnUndefined}',
        {
          filters: {
            returnUndefined: async () => {
              await delay(5);
              return undefined;
            },
          },
        }
      );
      
      const result = await t({ x: 1 });
      expect(result).toBe('Result: undefined');
    });

    it('should handle async filter with arguments', async () => {
      const t = templateAsync<{ value: string }>(
        '{value|asyncReplace:o,a}',
        {
          filters: {
            asyncReplace: async (str: unknown, from?: string, to?: string) => {
              await delay(5);
              const s = String(str);
              if (!from) return s;
              return s.split(from).join(to || '');
            },
          },
        }
      );
      
      const result = await t({ value: 'hello' });
      expect(result).toBe('hella');
    });

    it('should handle empty template with async filters', async () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      const t = templateAsync<{}>('', {
        filters: {
          asyncFilter: async (n: unknown) => Number(n) * 2,
        },
      });
      
      const result = await t({});
      expect(result).toBe('');
    });

    it('should handle static template with async filters', async () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      const t = templateAsync<{}>('Static text', {
        filters: {
          asyncFilter: async (n: unknown) => Number(n) * 2,
        },
      });
      
      const result = await t({});
      expect(result).toBe('Static text');
    });

    it('should work with missing keys and async filters', async () => {
      const t = templateAsync<{ a?: number }>(
        '{a|asyncDouble} {b|asyncDouble}',
        {
          onMissing: 'keep',
          filters: {
            asyncDouble: async (n: unknown) => {
              await delay(5);
              return Number(n) * 2;
            },
          },
        }
      );
      
      const result = await t({ a: 5 });
      expect(result).toBe('10 {b}');
    });
  });

  describe('real-world-like scenarios', () => {
    it('should simulate fetching user data', async () => {
      // Simulate a user database
      const users = new Map([
        [1, { name: 'Alice', email: 'alice@example.com' }],
        [2, { name: 'Bob', email: 'bob@example.com' }],
      ]);
      
      const t = templateAsync<{ userId: number }>(
        'User: {userId|fetchUser|getName} ({userId|fetchUser|getEmail})',
        {
          filters: {
            fetchUser: async (id: unknown) => {
              await delay(10); // Simulate network delay
              return users.get(Number(id)) || { name: 'Unknown', email: 'unknown@example.com' };
            },
            getName: (user: any) => user.name,
            getEmail: (user: any) => user.email,
          },
        }
      );
      
      const result = await t({ userId: 1 });
      expect(result).toBe('User: Alice (alice@example.com)');
    });

    it('should simulate API integration with formatting', async () => {
      const t = templateAsync<{ productId: number }>(
        '{productId|fetchProduct|formatPrice|upper}',
        {
          filters: {
            fetchProduct: async (id: unknown) => {
              await delay(10);
              return { name: 'Wireless Mouse', price: 29.99, id };
            },
            formatPrice: (product: any) => {
              return `${product.name}: $${product.price.toFixed(2)}`;
            },
            upper: (str: unknown) => String(str).toUpperCase(),
          },
        }
      );
      
      const result = await t({ productId: 456 });
      expect(result).toBe('WIRELESS MOUSE: $29.99');
    });

    it('should handle concurrent data fetching', async () => {
      const startTime = Date.now();
      
      const t = templateAsync<{ userId: number }>(
        'User: {userId|fetchUser}, Orders: {userId|fetchOrders}, Cart: {userId|fetchCart}',
        {
          filters: {
            fetchUser: async (id: unknown) => {
              await delay(50);
              return `User${id}`;
            },
            fetchOrders: async () => {
              await delay(50);
              return `5 orders`;
            },
            fetchCart: async () => {
              await delay(50);
              return `$99.99`;
            },
          },
        }
      );
      
      const result = await t({ userId: 123 });
      const duration = Date.now() - startTime;
      
      expect(result).toBe('User: User123, Orders: 5 orders, Cart: $99.99');
      // Should be ~50ms (parallel), not ~150ms (sequential)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('performance', () => {
    it('should handle many async filters efficiently', async () => {
      const t = templateAsync<{ v1: number; v2: number; v3: number; v4: number; v5: number }>(
        '{v1|async} {v2|async} {v3|async} {v4|async} {v5|async}',
        {
          filters: {
            async: async (n: unknown) => {
              await delay(10);
              return Number(n) * 2;
            },
          },
        }
      );
      
      const startTime = Date.now();
      const result = await t({ v1: 1, v2: 2, v3: 3, v4: 4, v5: 5 });
      const duration = Date.now() - startTime;
      
      expect(result).toBe('2 4 6 8 10');
      // All 5 should run in parallel, so ~10ms not ~50ms
      expect(duration).toBeLessThan(30);
    });
  });
});
