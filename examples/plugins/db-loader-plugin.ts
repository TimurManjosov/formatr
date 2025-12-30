// examples/plugins/db-loader-plugin.ts
/**
 * Example: Database Loader Plugin
 * 
 * This plugin demonstrates async initialization, cleanup, and custom loader functionality.
 * It simulates database operations with mock data.
 * 
 * NOTE: Filter and loader functions use `this: any` because the plugin runtime context 
 * binding happens at registration time via `bindPluginToRuntime`. The actual runtime 
 * context implements `PluginRuntimeContext` interface with `state`, `options`, `methods`, 
 * and `getPlugin` properties. Using `any` here is a trade-off for simpler definitions
 * in example code. In production, you could create a typed wrapper or use type assertions.
 */

import { createPlugin, PluginManager } from '../../src/plugin';
import { templateAsync } from '../../src/api';

// Simulated database interface
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  connectionTimeout?: number;
}

// Mock data store (simulating a database)
const mockDatabase: Record<string, Record<number, Record<string, unknown>>> = {
  users: {
    1: { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' },
    2: { id: 2, name: 'Bob', email: 'bob@example.com', role: 'user' },
    3: { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'user' },
  },
  products: {
    1: { id: 1, name: 'Widget', price: 29.99, stock: 100 },
    2: { id: 2, name: 'Gadget', price: 49.99, stock: 50 },
    3: { id: 3, name: 'Gizmo', price: 19.99, stock: 200 },
  },
  orders: {
    1: { id: 1, userId: 1, productId: 2, quantity: 2, total: 99.98 },
    2: { id: 2, userId: 2, productId: 1, quantity: 5, total: 149.95 },
  },
};

// Simulate async database connection
async function createConnection(config: DatabaseConfig): Promise<{
  connected: boolean;
  config: DatabaseConfig;
  query: (sql: string) => Promise<unknown[]>;
  findOne: (table: string, id: number) => Promise<unknown | null>;
  findMany: (table: string, where?: Record<string, unknown>) => Promise<unknown[]>;
  close: () => Promise<void>;
}> {
  // Simulate connection delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log(`[DB] Connected to ${config.database}@${config.host}:${config.port}`);

  return {
    connected: true,
    config,
    
    async query(sql: string): Promise<unknown[]> {
      await new Promise(resolve => setTimeout(resolve, 10));
      console.log(`[DB] Query: ${sql}`);
      // Return all data for demo
      return Object.values(mockDatabase).flatMap(table => Object.values(table));
    },

    async findOne(table: string, id: number): Promise<unknown | null> {
      await new Promise(resolve => setTimeout(resolve, 10));
      console.log(`[DB] FindOne: ${table}[${id}]`);
      return mockDatabase[table]?.[id] ?? null;
    },

    async findMany(table: string, where?: Record<string, unknown>): Promise<unknown[]> {
      await new Promise(resolve => setTimeout(resolve, 10));
      console.log(`[DB] FindMany: ${table}`, where ?? '(all)');
      const rows = Object.values(mockDatabase[table] ?? {});
      
      if (!where) return rows;
      
      return rows.filter(row => {
        return Object.entries(where).every(([key, value]) => 
          (row as Record<string, unknown>)[key] === value
        );
      });
    },

    async close(): Promise<void> {
      await new Promise(resolve => setTimeout(resolve, 50));
      console.log(`[DB] Connection closed`);
    },
  };
}

// Create the database loader plugin
const dbLoaderPlugin = createPlugin<DatabaseConfig>({
  name: 'db-loader',
  version: '1.0.0',
  description: 'Provides database access for template data loading',
  author: 'formatr',

  async init(config) {
    console.log('[DB Loader] Initializing...');
    
    // Create database connection
    this.state.connection = await createConnection(config);
    console.log('[DB Loader] Ready');
  },

  filters: {
    // Load a single record by table and ID
    loadRecord: async function(this: any, id: unknown, table: string) {
      const conn = this.state.connection;
      if (!conn) throw new Error('Database not connected');
      
      const record = await conn.findOne(table, Number(id));
      return record ?? {};
    },

    // Load multiple records
    loadMany: async function(this: any, table: unknown) {
      const conn = this.state.connection;
      if (!conn) throw new Error('Database not connected');
      
      return await conn.findMany(String(table));
    },

    // Get a property from an object
    get: (obj: unknown, prop: string) => {
      if (typeof obj !== 'object' || obj === null) return '';
      return (obj as Record<string, unknown>)[prop] ?? '';
    },

    // Format price
    price: (value: unknown) => {
      const num = Number(value);
      return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
    },
  },

  loaders: {
    // Custom template loader from "database"
    db: async function(this: any, templateName: string): Promise<string> {
      console.log(`[DB Loader] Loading template: ${templateName}`);
      
      // Simulate loading templates from database
      const templates: Record<string, string> = {
        'user-card': 'User: {name} ({email})',
        'product-card': 'Product: {name} - {price|price}',
        'order-summary': 'Order #{id}: {quantity}x items = {total|price}',
      };
      
      return templates[templateName] ?? `<!-- Template "${templateName}" not found -->`;
    },
  },

  methods: {
    async getUser(id: number): Promise<unknown | null> {
      const conn = this.state.connection;
      return conn ? await conn.findOne('users', id) : null;
    },

    async getProduct(id: number): Promise<unknown | null> {
      const conn = this.state.connection;
      return conn ? await conn.findOne('products', id) : null;
    },

    async query(sql: string): Promise<unknown[]> {
      const conn = this.state.connection;
      return conn ? await conn.query(sql) : [];
    },

    isConnected(): boolean {
      return !!(this.state.connection as any)?.connected;
    },
  },

  async cleanup() {
    console.log('[DB Loader] Cleaning up...');
    const conn = this.state.connection as any;
    if (conn) {
      await conn.close();
    }
    this.state.connection = null;
    console.log('[DB Loader] Cleanup complete');
  },
});

// Usage demonstration
async function main() {
  console.log('=== Database Loader Plugin Example ===\n');

  const manager = new PluginManager();
  
  // Register with database configuration
  await manager.register(dbLoaderPlugin, {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
  });

  const filters = manager.collectFilters();

  // Load and display user
  console.log('\n--- Load User ---');
  const userTemplate = templateAsync('{userId|loadRecord:users|get:name}', { filters });
  const userName = await userTemplate({ userId: 1 });
  console.log('User 1 name:', userName);

  // Load and display product with price formatting
  console.log('\n--- Load Product ---');
  const productTemplate = templateAsync(
    '{productId|loadRecord:products|get:name} costs {productId|loadRecord:products|get:price|price}',
    { filters }
  );
  const productInfo = await productTemplate({ productId: 2 });
  console.log('Product info:', productInfo);

  // Access plugin methods directly
  console.log('\n--- Direct Method Access ---');
  const plugin = manager.get('db-loader');
  const methods = plugin?.methods as any;
  
  console.log('Is connected:', methods.isConnected());
  
  const user = await methods.getUser(2);
  console.log('User 2:', user);

  const product = await methods.getProduct(3);
  console.log('Product 3:', product);

  // Use custom loader
  console.log('\n--- Custom Template Loader ---');
  const loaders = (manager.get('db-loader')?.loaders ?? {}) as Record<string, (name: string) => Promise<string>>;
  if (loaders.db) {
    const userCardTemplate = await loaders.db('user-card');
    console.log('Loaded template:', userCardTemplate);
    
    // Render with loaded template
    const t = templateAsync(userCardTemplate);
    const rendered = await t({ name: 'Alice', email: 'alice@example.com' });
    console.log('Rendered:', rendered);
  }

  // Cleanup - this will close the database connection
  console.log('\n--- Cleanup ---');
  await manager.clear();
}

main().catch(console.error);
