// examples/plugins/validation-plugin.ts
/**
 * Example: Validation Plugin
 * 
 * This plugin demonstrates context validation using beforeRender middleware.
 * It validates the context data before template rendering begins.
 */

import { createPlugin, PluginManager, RenderOptions } from '../../src/plugin';
import { template } from '../../src/api';

// Validation rule types
type Validator = (value: unknown) => boolean | string;

interface ValidationSchema {
  [key: string]: Validator | Validator[];
}

interface ValidationOptions {
  strict?: boolean; // Throw on validation failure vs. warn
  schemas?: Record<string, ValidationSchema>;
}

// Built-in validators
const validators = {
  required: (value: unknown) => 
    value !== null && value !== undefined && value !== '' || 'Value is required',
  
  string: (value: unknown) =>
    typeof value === 'string' || 'Must be a string',
  
  number: (value: unknown) =>
    typeof value === 'number' && !isNaN(value) || 'Must be a number',
  
  email: (value: unknown) =>
    typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Invalid email',
  
  minLength: (min: number) => (value: unknown) =>
    typeof value === 'string' && value.length >= min || `Minimum length is ${min}`,
  
  maxLength: (max: number) => (value: unknown) =>
    typeof value === 'string' && value.length <= max || `Maximum length is ${max}`,
  
  min: (min: number) => (value: unknown) =>
    typeof value === 'number' && value >= min || `Minimum value is ${min}`,
  
  max: (max: number) => (value: unknown) =>
    typeof value === 'number' && value <= max || `Maximum value is ${max}`,
  
  pattern: (regex: RegExp) => (value: unknown) =>
    typeof value === 'string' && regex.test(value) || `Does not match pattern`,
};

// Create the validation plugin
const validationPlugin = createPlugin<ValidationOptions>({
  name: 'validation',
  version: '1.0.0',
  description: 'Validates template context before rendering',
  author: 'formatr',

  init(options) {
    this.state.strict = options?.strict ?? false;
    this.state.schemas = options?.schemas ?? {};
    console.log('[Validation] Initialized with strict mode:', this.state.strict);
  },

  middleware: {
    beforeRender(tpl, context, options) {
      const schemaName = (options as any)?.schema;
      const schemas = this.state.schemas as Record<string, ValidationSchema>;
      
      if (schemaName && schemas[schemaName]) {
        const schema = schemas[schemaName]!;
        const errors: string[] = [];

        for (const [field, validatorOrArray] of Object.entries(schema)) {
          const validators = Array.isArray(validatorOrArray) ? validatorOrArray : [validatorOrArray];
          const value = context[field];

          for (const validator of validators) {
            const result = validator(value);
            if (result !== true) {
              errors.push(`${field}: ${result}`);
            }
          }
        }

        if (errors.length > 0) {
          const message = `Validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`;
          
          if (this.state.strict) {
            throw new Error(message);
          } else {
            console.warn('[Validation]', message);
          }
        }
      }

      return { template: tpl, context };
    },
  },

  filters: {
    // Validation filter - throws if invalid
    validate: function(this: any, value: unknown, validatorName: string) {
      const validator = (validators as any)[validatorName];
      if (!validator) {
        throw new Error(`Unknown validator: ${validatorName}`);
      }
      const result = validator(value);
      if (result !== true) {
        throw new Error(String(result));
      }
      return value;
    },

    // Safe validation filter - returns empty string if invalid
    validateSafe: function(value: unknown, validatorName: string) {
      const validator = (validators as any)[validatorName];
      if (!validator) return '';
      const result = validator(value);
      return result === true ? value : '';
    },
  },

  methods: {
    registerSchema(name: string, schema: ValidationSchema) {
      const schemas = this.state.schemas as Record<string, ValidationSchema>;
      schemas[name] = schema;
      console.log(`[Validation] Schema "${name}" registered`);
    },

    getSchema(name: string): ValidationSchema | undefined {
      const schemas = this.state.schemas as Record<string, ValidationSchema>;
      return schemas[name];
    },
  },
});

// Usage demonstration
async function main() {
  console.log('=== Validation Plugin Example ===\n');

  const manager = new PluginManager();
  await manager.register(validationPlugin, {
    strict: false, // Warn instead of throw
    schemas: {
      user: {
        name: [validators.required, validators.string, validators.minLength(2)],
        email: [validators.required, validators.email],
        age: [validators.number, validators.min(0)],
      },
    },
  });

  // Get the plugin to access its methods
  const plugin = manager.get('validation');
  const pluginMethods = plugin?.methods as any;

  // Register additional schema via method
  pluginMethods.registerSchema('contact', {
    phone: [validators.required, validators.pattern(/^\d{10,}$/)],
    message: [validators.required, validators.maxLength(500)],
  });

  // Simulate render with validation
  console.log('\n--- Valid user context ---');
  const validContext = {
    name: 'Alice',
    email: 'alice@example.com',
    age: 25,
  };

  const result1 = await manager.executeBeforeRender(
    'Hello, {name}! Email: {email}',
    validContext,
    { schema: 'user' } as RenderOptions
  );
  console.log('Validation passed, context:', result1.context);

  // Invalid context
  console.log('\n--- Invalid user context (will warn) ---');
  const invalidContext = {
    name: 'A', // Too short
    email: 'not-an-email',
    age: -5, // Negative
  };

  await manager.executeBeforeRender(
    'Hello, {name}!',
    invalidContext,
    { schema: 'user' } as RenderOptions
  );

  // Using validation filters
  console.log('\n--- Validation filters ---');
  const t = template('{email|validate:email}', {
    filters: manager.collectFilters(),
  });

  try {
    console.log('Valid email:', t({ email: 'test@example.com' }));
  } catch (e) {
    console.log('Validation error:', (e as Error).message);
  }

  try {
    t({ email: 'invalid' });
  } catch (e) {
    console.log('Validation error:', (e as Error).message);
  }

  // Cleanup
  await manager.clear();
}

main().catch(console.error);
