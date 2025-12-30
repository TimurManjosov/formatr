// examples/plugins/i18n-plugin.ts
/**
 * Example: Internationalization (i18n) Plugin
 * 
 * This plugin demonstrates adding i18n support with filters and context injection.
 * In production, you might use a library like i18next.
 * 
 * NOTE: Filter functions use `this: any` because the plugin runtime context binding
 * happens at registration time via `bindPluginToRuntime`. The actual runtime context
 * implements `PluginRuntimeContext` interface with `state`, `options`, `methods`, and
 * `getPlugin` properties. Using `any` here is a trade-off for simpler filter definitions
 * in example code. In production, you could create a typed wrapper or use type assertions.
 */

import { createPlugin, PluginManager } from '../../src/plugin';
import { template } from '../../src/api';

// i18n configuration
interface I18nOptions {
  defaultLanguage?: string;
  fallbackLanguage?: string;
  resources: Record<string, Record<string, string>>; // { en: { hello: 'Hello' }, es: { hello: 'Hola' } }
}

// Create the i18n plugin
const i18nPlugin = createPlugin<I18nOptions>({
  name: 'i18n',
  version: '1.0.0',
  description: 'Internationalization support with translations and locale-aware formatting',
  author: 'formatr',

  init(options) {
    this.state.language = options?.defaultLanguage ?? 'en';
    this.state.fallbackLanguage = options?.fallbackLanguage ?? 'en';
    this.state.resources = options?.resources ?? {};
    console.log(`[i18n] Initialized with language: ${this.state.language}`);
  },

  filters: {
    // Note: `this: any` is used because the runtime context is bound dynamically.
    // The actual `this` at runtime will be the PluginRuntimeContext with `state`, `options`, etc.
    
    // Translate a key
    t: function(this: any, key: unknown) {
      const keyStr = String(key);
      const lang = this.state.language as string;
      const fallback = this.state.fallbackLanguage as string;
      const resources = this.state.resources as Record<string, Record<string, string>>;

      // Try current language
      let translation = resources[lang]?.[keyStr];
      
      // Fall back if not found
      if (!translation && lang !== fallback) {
        translation = resources[fallback]?.[keyStr];
      }

      return translation ?? keyStr;
    },

    // Translate with specific language override
    tLang: function(this: any, key: unknown, lang: string) {
      const keyStr = String(key);
      const resources = this.state.resources as Record<string, Record<string, string>>;
      return resources[lang]?.[keyStr] ?? keyStr;
    },

    // Simple pluralization
    tPlural: function(this: any, key: unknown, count: string) {
      const keyStr = String(key);
      const n = parseInt(count, 10);
      const lang = this.state.language as string;
      const resources = this.state.resources as Record<string, Record<string, string>>;

      // Try singular/plural keys
      const pluralKey = n === 1 ? `${keyStr}_one` : `${keyStr}_other`;
      let translation = resources[lang]?.[pluralKey] ?? resources[lang]?.[keyStr];
      
      if (translation) {
        translation = translation.replace('{{count}}', String(n));
      }

      return translation ?? keyStr;
    },

    // Format number according to locale
    formatNumber: function(this: any, value: unknown) {
      const num = Number(value);
      const lang = this.state.language as string;
      
      try {
        return new Intl.NumberFormat(lang).format(num);
      } catch {
        return String(num);
      }
    },

    // Format currency
    formatCurrency: function(this: any, value: unknown, currency: string) {
      const num = Number(value);
      const lang = this.state.language as string;
      
      try {
        return new Intl.NumberFormat(lang, {
          style: 'currency',
          currency: currency ?? 'USD',
        }).format(num);
      } catch {
        return `${currency ?? '$'}${num.toFixed(2)}`;
      }
    },

    // Format date
    formatDate: function(this: any, value: unknown, style: string) {
      const date = value instanceof Date ? value : new Date(String(value));
      const lang = this.state.language as string;
      
      const options: Intl.DateTimeFormatOptions = 
        style === 'short' ? { dateStyle: 'short' } :
        style === 'long' ? { dateStyle: 'long' } :
        style === 'full' ? { dateStyle: 'full' } :
        { dateStyle: 'medium' };
      
      try {
        return new Intl.DateTimeFormat(lang, options).format(date);
      } catch {
        return date.toLocaleDateString();
      }
    },
  },

  middleware: {
    // Inject language info into context
    beforeRender(tpl, context) {
      return {
        template: tpl,
        context: {
          ...context,
          _lang: this.state.language,
          _fallbackLang: this.state.fallbackLanguage,
        },
      };
    },
  },

  methods: {
    setLanguage(lang: string) {
      this.state.language = lang;
      console.log(`[i18n] Language set to: ${lang}`);
    },

    getLanguage(): string {
      return this.state.language as string;
    },

    addTranslations(lang: string, translations: Record<string, string>) {
      const resources = this.state.resources as Record<string, Record<string, string>>;
      resources[lang] = { ...resources[lang], ...translations };
      console.log(`[i18n] Added ${Object.keys(translations).length} translations for ${lang}`);
    },
  },
});

// Usage demonstration
async function main() {
  console.log('=== i18n Plugin Example ===\n');

  const manager = new PluginManager();
  await manager.register(i18nPlugin, {
    defaultLanguage: 'en',
    fallbackLanguage: 'en',
    resources: {
      en: {
        greeting: 'Hello',
        farewell: 'Goodbye',
        welcome: 'Welcome, {{name}}!',
        items_one: '{{count}} item',
        items_other: '{{count}} items',
      },
      es: {
        greeting: 'Hola',
        farewell: 'Adiós',
        welcome: '¡Bienvenido, {{name}}!',
        items_one: '{{count}} artículo',
        items_other: '{{count}} artículos',
      },
      de: {
        greeting: 'Hallo',
        farewell: 'Auf Wiedersehen',
        items_one: '{{count}} Artikel',
        items_other: '{{count}} Artikel',
      },
    },
  });

  const filters = manager.collectFilters();

  // Basic translation
  console.log('--- Basic Translations ---');
  const t1 = template('{key|t}', { filters });
  console.log('English greeting:', t1({ key: 'greeting' }));
  console.log('English farewell:', t1({ key: 'farewell' }));

  // Change language
  const plugin = manager.get('i18n');
  const methods = plugin?.methods as any;
  
  methods.setLanguage('es');
  console.log('\nSpanish greeting:', t1({ key: 'greeting' }));
  console.log('Spanish farewell:', t1({ key: 'farewell' }));

  // Translate with specific language
  const t2 = template('{key|tLang:de}', { filters });
  console.log('\nGerman greeting:', t2({ key: 'greeting' }));

  // Pluralization - need to use a two-step approach since filter args are string literals
  console.log('\n--- Pluralization ---');
  // Create templates that use the count value directly
  const t3a = template('{count} {key|tPlural:1}', { filters });
  const t3b = template('{count} {key|tPlural:5}', { filters });
  console.log('1 item (es):', t3a({ key: 'items', count: 1 }));
  console.log('5 items (es):', t3b({ key: 'items', count: 5 }));

  // Number formatting
  methods.setLanguage('en');
  console.log('\n--- Number Formatting ---');
  const t4 = template('Number: {num|formatNumber}', { filters });
  console.log('English:', t4({ num: 1234567.89 }));
  
  methods.setLanguage('de');
  console.log('German:', t4({ num: 1234567.89 }));

  // Currency formatting
  console.log('\n--- Currency Formatting ---');
  const t5 = template('Price: {amount|formatCurrency:EUR}', { filters });
  console.log('German EUR:', t5({ amount: 42.99 }));

  methods.setLanguage('en');
  const t6 = template('Price: {amount|formatCurrency:USD}', { filters });
  console.log('English USD:', t6({ amount: 42.99 }));

  // Date formatting
  console.log('\n--- Date Formatting ---');
  const t7 = template('Date: {date|formatDate:long}', { filters });
  const now = new Date();
  console.log('English:', t7({ date: now }));
  
  methods.setLanguage('de');
  console.log('German:', t7({ date: now }));

  // Context injection
  console.log('\n--- Context Injection ---');
  const beforeResult = await manager.executeBeforeRender('test', { name: 'User' });
  console.log('Injected context:', beforeResult.context);

  // Cleanup
  await manager.clear();
}

main().catch(console.error);
