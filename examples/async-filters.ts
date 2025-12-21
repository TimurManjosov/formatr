/**
 * Async Filters Example
 * 
 * This example demonstrates how to use async filters in formatr to fetch data
 * from external sources during template rendering.
 */

import { templateAsync } from '../src/index.js';

// Simulated delay to mimic network/database latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ===== Example 1: Basic Async Filter =====
console.log('===== Example 1: Basic Async Filter =====');

const userDatabase = new Map([
  [1, { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin' }],
  [2, { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'User' }],
  [3, { id: 3, name: 'Carol White', email: 'carol@example.com', role: 'Manager' }],
]);

const greetingTemplate = templateAsync<{ userId: number }>(
  'Hello, {userId|fetchUser|getName}!',
  {
    filters: {
      fetchUser: async (id: unknown) => {
        console.log(`  Fetching user ${id}...`);
        await delay(100); // Simulate network delay
        return userDatabase.get(Number(id));
      },
      getName: (user: any) => user?.name || 'Unknown',
    },
  }
);

greetingTemplate({ userId: 1 }).then(result => {
  console.log(`Result: ${result}\n`);
});

// ===== Example 2: Mixed Sync and Async Filters =====
console.log('===== Example 2: Mixed Sync and Async Filters =====');

const productTemplate = templateAsync<{ productId: number }>(
  '{productId|fetchProduct|formatPrice|upper}',
  {
    filters: {
      fetchProduct: async (id: unknown) => {
        console.log(`  Fetching product ${id}...`);
        await delay(80);
        const products = {
          101: { name: 'Wireless Mouse', price: 29.99 },
          102: { name: 'Mechanical Keyboard', price: 89.99 },
          103: { name: 'USB-C Hub', price: 49.99 },
        };
        return products[id as keyof typeof products];
      },
      formatPrice: (product: any) => {
        if (!product) return 'Product not found';
        return `${product.name}: $${product.price.toFixed(2)}`;
      },
      upper: (str: unknown) => String(str).toUpperCase(),
    },
  }
);

productTemplate({ productId: 102 }).then(result => {
  console.log(`Result: ${result}\n`);
});

// ===== Example 3: Parallel Async Operations =====
console.log('===== Example 3: Parallel Async Operations =====');
console.log('(Notice how all fetches happen in parallel, not sequentially)');

const dashboardTemplate = templateAsync<{ userId: number }>(
  'Dashboard for {userId|fetchUser|getName}:\n' +
  '  Orders: {userId|fetchOrders}\n' +
  '  Cart Total: {userId|fetchCartTotal}\n' +
  '  Notifications: {userId|fetchNotifications}',
  {
    filters: {
      fetchUser: async (id: unknown) => {
        console.log(`  [${Date.now() % 10000}ms] Fetching user...`);
        await delay(50);
        return userDatabase.get(Number(id));
      },
      getName: (user: any) => user?.name || 'Unknown',
      fetchOrders: async (id: unknown) => {
        console.log(`  [${Date.now() % 10000}ms] Fetching orders...`);
        await delay(50);
        return `${Math.floor(Math.random() * 10) + 1} orders`;
      },
      fetchCartTotal: async (id: unknown) => {
        console.log(`  [${Date.now() % 10000}ms] Fetching cart...`);
        await delay(50);
        return `$${(Math.random() * 200).toFixed(2)}`;
      },
      fetchNotifications: async (id: unknown) => {
        console.log(`  [${Date.now() % 10000}ms] Fetching notifications...`);
        await delay(50);
        return `${Math.floor(Math.random() * 5)} new`;
      },
    },
  }
);

const startTime = Date.now();
dashboardTemplate({ userId: 1 }).then(result => {
  const duration = Date.now() - startTime;
  console.log(`Result:\n${result}`);
  console.log(`\nCompleted in ${duration}ms (parallel execution)\n`);
});

// ===== Example 4: Error Handling =====
setTimeout(() => {
  console.log('===== Example 4: Error Handling =====');

  const errorTemplate = templateAsync<{ apiUrl: string }>(
    'Data: {apiUrl|safeApiFetch}',
    {
      filters: {
        safeApiFetch: async (url: unknown) => {
          console.log(`  Attempting to fetch from ${url}...`);
          await delay(30);
          
          // Simulate API error
          if (String(url).includes('error')) {
            throw new Error('Network timeout');
          }
          
          return 'Success: { data: "example" }';
        },
      },
    }
  );

  // Success case
  errorTemplate({ apiUrl: 'https://api.example.com/data' }).then(result => {
    console.log(`Success: ${result}`);
  });

  // Error case
  errorTemplate({ apiUrl: 'https://api.example.com/error' }).catch(err => {
    console.log(`Error caught: ${err.message}`);
    if (err.filterName) {
      console.log(`  Failed in filter: ${err.filterName}`);
    }
  });
}, 300);

// ===== Example 5: Chaining Multiple Async Filters =====
setTimeout(() => {
  console.log('\n===== Example 5: Chaining Multiple Async Filters =====');

  const chainTemplate = templateAsync<{ value: number }>(
    'Result: {value|async1|async2|async3}',
    {
      filters: {
        async1: async (n: unknown) => {
          await delay(20);
          console.log(`  async1: ${n} + 1 = ${Number(n) + 1}`);
          return Number(n) + 1;
        },
        async2: async (n: unknown) => {
          await delay(20);
          console.log(`  async2: ${n} * 2 = ${Number(n) * 2}`);
          return Number(n) * 2;
        },
        async3: async (n: unknown) => {
          await delay(20);
          console.log(`  async3: ${n} + 10 = ${Number(n) + 10}`);
          return Number(n) + 10;
        },
      },
    }
  );

  chainTemplate({ value: 5 }).then(result => {
    console.log(`Final result: ${result}`);
    console.log('Calculation: ((5 + 1) * 2) + 10 = 22\n');
  });
}, 600);

// ===== Example 6: Real-World Scenario - User Profile Card =====
setTimeout(() => {
  console.log('\n===== Example 6: Real-World User Profile Card =====');

  const profileTemplate = templateAsync<{ userId: number }>(
    '┌────────────────────────────────────────┐\n' +
    '│ User Profile                           │\n' +
    '├────────────────────────────────────────┤\n' +
    '│ Name:   {userId|fetchUser|getName|pad:30}│\n' +
    '│ Email:  {userId|fetchUser|getEmail|pad:30}│\n' +
    '│ Role:   {userId|fetchUser|getRole|pad:30}│\n' +
    '│ Status: {userId|fetchStatus|pad:30}│\n' +
    '└────────────────────────────────────────┘',
    {
      filters: {
        fetchUser: async (id: unknown) => {
          await delay(40);
          return userDatabase.get(Number(id));
        },
        getName: (user: any) => user?.name || 'Unknown',
        getEmail: (user: any) => user?.email || 'N/A',
        getRole: (user: any) => user?.role || 'N/A',
        fetchStatus: async (id: unknown) => {
          await delay(40);
          return Math.random() > 0.5 ? 'Online' : 'Offline';
        },
        pad: (str: unknown, length?: string) => {
          const s = String(str);
          const len = length ? parseInt(length, 10) : s.length;
          return s.length >= len ? s : s + ' '.repeat(len - s.length);
        },
      },
    }
  );

  profileTemplate({ userId: 3 }).then(result => {
    console.log(result);
    console.log('\nNote: fetchUser and fetchStatus ran in parallel!\n');
  });
}, 900);

// Note: Using setTimeout to sequence examples for readability in output
// In real code, you would likely not chain async operations like this
