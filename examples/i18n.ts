import { template } from '../src';

// Define messages for different locales
const messages = {
  en: template<{ name: string; count: number }>(
    "Hello {name}, you have {count|plural:message,messages}",
    { locale: "en-US" }
  ),
  es: template<{ name: string; count: number }>(
    "Hola {name}, tienes {count|plural:mensaje,mensajes}",
    { locale: "es-ES" }
  ),
  de: template<{ name: string; count: number }>(
    "Hallo {name}, du hast {count|plural:Nachricht,Nachrichten}",
    { locale: "de-DE" }
  ),
  fr: template<{ name: string; count: number }>(
    "Bonjour {name}, vous avez {count|plural:message,messages}",
    { locale: "fr-FR" }
  ),
};

console.log('=== Internationalization (i18n) Examples ===\n');

// Test English
console.log('English:');
console.log(messages.en({ name: "John", count: 1 }));
console.log(messages.en({ name: "John", count: 5 }));

console.log('\nSpanish:');
console.log(messages.es({ name: "Carlos", count: 1 }));
console.log(messages.es({ name: "Carlos", count: 3 }));

console.log('\nGerman:');
console.log(messages.de({ name: "Hans", count: 1 }));
console.log(messages.de({ name: "Hans", count: 4 }));

console.log('\nFrench:');
console.log(messages.fr({ name: "Marie", count: 1 }));
console.log(messages.fr({ name: "Marie", count: 2 }));

// Currency formatting with different locales
console.log('\n=== Currency Formatting by Locale ===\n');

const priceTemplates = {
  us: template<{ price: number }>("Price: {price|currency:USD}", { locale: "en-US" }),
  uk: template<{ price: number }>("Price: {price|currency:GBP}", { locale: "en-GB" }),
  de: template<{ price: number }>("Preis: {price|currency:EUR}", { locale: "de-DE" }),
  jp: template<{ price: number }>("価格: {price|currency:JPY}", { locale: "ja-JP" }),
};

const price = 1234.56;

console.log('US:', priceTemplates.us({ price }));
console.log('UK:', priceTemplates.uk({ price }));
console.log('Germany:', priceTemplates.de({ price }));
console.log('Japan:', priceTemplates.jp({ price }));

// Date formatting with different locales
console.log('\n=== Date Formatting by Locale ===\n');

const dateTemplates = {
  us: template<{ date: Date }>("Date: {date|date:long}", { locale: "en-US" }),
  uk: template<{ date: Date }>("Date: {date|date:long}", { locale: "en-GB" }),
  de: template<{ date: Date }>("Datum: {date|date:long}", { locale: "de-DE" }),
  jp: template<{ date: Date }>("日付: {date|date:long}", { locale: "ja-JP" }),
};

const today = new Date();

console.log('US:', dateTemplates.us({ date: today }));
console.log('UK:', dateTemplates.uk({ date: today }));
console.log('Germany:', dateTemplates.de({ date: today }));
console.log('Japan:', dateTemplates.jp({ date: today }));
