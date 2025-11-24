import type { Filter } from './text';

/**
 * Helper function to safely convert a value to a finite number.
 * 
 * @param v - Any value to convert
 * @returns A finite number, or null if conversion fails
 */
const toNumber = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * Creates a set of internationalization (Intl) filters for the specified locale.
 * 
 * These filters use the Intl API for locale-aware formatting of numbers, percentages,
 * currency, and dates. All filters gracefully handle invalid inputs by returning
 * the string representation of the input value.
 * 
 * @param locale - The locale to use for formatting (e.g., 'en', 'de', 'fr')
 * @returns A record of filter functions keyed by filter name
 */
export function makeIntlFilters(locale?: string): Record<string, Filter> {
  /**
   * Formats a number with optional fraction digits.
   * 
   * If the input is not a finite number, returns the string representation of the input.
   * The filter accepts 0, 1, or 2 arguments:
   * - No arguments: Uses default locale formatting
   * - 1 argument: Can be a range like "2-4" or a single digit for both min and max
   * - 2 arguments: Minimum and maximum fraction digits
   * 
   * @param v - The value to format (should be a number)
   * @param rangeOrMinFrac - Range (e.g., "2-4") or minimum fraction digits
   * @param maxFrac - Maximum fraction digits (if rangeOrMinFrac is not a range)
   * @returns Formatted number string, or string representation of input if not a number
   * 
   * @example
   * ```typescript
   * number(12345.6) // => '12,345.6' (en locale)
   * number(12345.6, '2') // => '12,345.60'
   * number(12345.6789, '2-3') // => '12,345.679'
   * number('not a number') // => 'not a number' (fallback)
   * ```
   */
  const number: Filter = (v, rangeOrMinFrac?: string, maxFrac?: string) => {
    const n = toNumber(v);
    if (n === null) return String(v);

    let min: number | undefined;
    let max: number | undefined;

    if (rangeOrMinFrac != null) {
      const s = String(rangeOrMinFrac);
      if (s.includes('-')) {
        const [a, b] = s.split('-');
        min = Number(a);
        max = Number(b);
      } else {
        min = Number(s);
        max = maxFrac != null ? Number(maxFrac) : min;
      }
    }

    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: min,
      maximumFractionDigits: max,
    }).format(n);
  };

  /**
   * Formats a number as a percentage with optional fraction digits.
   * 
   * If the input is not a finite number, returns the string representation of the input.
   * The value is multiplied by 100 and formatted with a percent sign according to the locale.
   * 
   * @param v - The value to format (should be a decimal number, e.g., 0.256 for 25.6%)
   * @param frac - Number of fraction digits to display (default: 0)
   * @returns Formatted percentage string, or string representation of input if not a number
   * 
   * @example
   * ```typescript
   * percent(0.256) // => '26%'
   * percent(0.256, '1') // => '25.6%'
   * percent(0.12345, '2') // => '12.35%'
   * percent('not a number') // => 'not a number' (fallback)
   * ```
   */
  const percent: Filter = (v, frac?: string) => {
    const n = toNumber(v);
    if (n === null) return String(v);
    const digits = frac != null ? Number(frac) : 0;
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(n);
  };

  /**
   * Formats a number as currency with the specified currency code.
   * 
   * If the input is not a finite number, returns the string representation of the input.
   * This filter requires at least 1 argument (the currency code) and accepts an optional
   * second argument for fraction digits.
   * 
   * The currency code can be provided in two formats:
   * - Separate arguments: currency:USD or currency:USD:2
   * - Combined format: currency:USD:2 (parsed as a single argument)
   * 
   * The filter attempts to recover from invalid currency codes by extracting 3-letter
   * uppercase sequences, but will throw an error if no valid code can be found.
   * 
   * @param v - The value to format (should be a number)
   * @param code - Currency code (e.g., 'USD', 'EUR', 'GBP') or combined 'CODE:digits'
   * @param frac - Number of fraction digits (optional)
   * @returns Formatted currency string, or string representation of input if not a number
   * @throws {Error} If currency code is missing or invalid
   * 
   * @example
   * ```typescript
   * currency(12.5, 'USD') // => '$12.50'
   * currency(12.5, 'EUR', '2') // => '12,50 €' (de locale)
   * currency(1000, 'JPY') // => '¥1,000'
   * currency('not a number', 'USD') // => 'not a number' (fallback)
   * ```
   */
  const currency: Filter = (v, code?: string, frac?: string) => {
    const n = toNumber(v);
    if (n === null) return String(v);
    if (!code) throw new Error(`currency filter requires code, e.g., currency:EUR`);

    // support combined "CODE:digits" syntax (some template parsers supply "EUR:2" as a single arg)
    let currencyCode = String(code).trim();
    let fraction = frac;
    if (currencyCode.includes(':')) {
      const [c, f] = currencyCode.split(':');
      currencyCode = (c ?? '').trim();
      // only adopt f if fraction not already provided; treat empty string as "not provided"
      if (f !== undefined && (fraction == null || fraction === '')) fraction = f;
    }

    // normalize
    currencyCode = currencyCode.toUpperCase();

    // validate / attempt to recover a 3-letter code
    if (!/^[A-Z]{3}$/.test(currencyCode)) {
      const letters = currencyCode.match(/[A-Z]{3,}/);
      if (letters && letters[0].length >= 3) {
        currencyCode = letters[0].slice(0, 3);
      } else {
        throw new Error(`currency filter received invalid currency code: ${String(code)}`);
      }
    }

    // parse fraction only if present and finite
    let digits: number | undefined = undefined;
    if (fraction != null && fraction !== '') {
      const d = Number(fraction);
      if (Number.isFinite(d)) digits = d;
    }

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        ...(digits != null ? { minimumFractionDigits: digits, maximumFractionDigits: digits } : {}),
      }).format(n);
    } catch {
      // fallback instead of letting Intl throw (keeps templating robust in edge cases)
      return String(v);
    }
  };

  /**
   * Formats a date value according to the specified style.
   * 
   * If the input is not a valid date, returns the string representation of the input.
   * The filter accepts Date objects, numeric timestamps (milliseconds since epoch),
   * or ISO date strings. Invalid dates (e.g., new Date('invalid')) return 'Invalid Date'.
   * 
   * @param v - The value to format (Date object, timestamp, or date string)
   * @param style - Date style: 'short', 'medium', 'long', or 'full' (default: 'medium')
   * @returns Formatted date string, or string representation of input if not a valid date
   * 
   * @example
   * ```typescript
   * date(new Date('2025-10-13'), 'short') // => '10/13/25' (en locale)
   * date(new Date('2025-10-13'), 'long') // => 'October 13, 2025' (en locale)
   * date(1697155200000, 'medium') // => 'Oct 13, 2023' (en locale)
   * date('invalid') // => 'invalid' (fallback)
   * date(new Date('invalid')) // => 'Invalid Date'
   * ```
   */
  const date: Filter = (v, style?: string) => {
    const d = v instanceof Date ? v : typeof v === 'number' ? new Date(v) : new Date(String(v));
    if (Number.isNaN(d.getTime())) return String(v);

    const map: Record<string, Intl.DateTimeFormatOptions> = {
      short: { dateStyle: 'short' },
      medium: { dateStyle: 'medium' },
      long: { dateStyle: 'long' },
      full: { dateStyle: 'full' },
    };
    const opts = map[style ?? 'medium'] ?? map.medium;
    return new Intl.DateTimeFormat(locale, opts).format(d);
  };

  return { number, percent, currency, date };
}
