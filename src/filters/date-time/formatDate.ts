import { parseDate, type DateInput } from './utils/dateParser';
import { getLocale } from './utils/localeManager';
import { PRESET_DATE_FORMATS } from './utils/constants';
import type { Filter } from '../text';

/**
 * Type representing date format patterns
 */
export type DateFormat = 'short' | 'medium' | 'long' | 'full' | string;

/**
 * Token mapping for custom date format patterns
 * Supports a subset of commonly used tokens for date formatting
 */
const TOKEN_MAP: Record<string, (date: Date, locale: string) => string> = {
  // Year
  yyyy: (d) => d.getFullYear().toString(),
  yy: (d) => d.getFullYear().toString().slice(-2),

  // Month
  MMMM: (d, locale) => new Intl.DateTimeFormat(locale, { month: 'long' }).format(d),
  MMM: (d, locale) => new Intl.DateTimeFormat(locale, { month: 'short' }).format(d),
  MM: (d) => (d.getMonth() + 1).toString().padStart(2, '0'),
  M: (d) => (d.getMonth() + 1).toString(),

  // Day
  dd: (d) => d.getDate().toString().padStart(2, '0'),
  d: (d) => d.getDate().toString(),

  // Weekday
  EEEE: (d, locale) => new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(d),
  EEE: (d, locale) => new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d),

  // Hour (24-hour)
  HH: (d) => d.getHours().toString().padStart(2, '0'),
  H: (d) => d.getHours().toString(),

  // Hour (12-hour)
  hh: (d) => {
    const h = d.getHours() % 12 || 12;
    return h.toString().padStart(2, '0');
  },
  h: (d) => {
    const h = d.getHours() % 12 || 12;
    return h.toString();
  },

  // Minute
  mm: (d) => d.getMinutes().toString().padStart(2, '0'),
  m: (d) => d.getMinutes().toString(),

  // Second
  ss: (d) => d.getSeconds().toString().padStart(2, '0'),
  s: (d) => d.getSeconds().toString(),

  // AM/PM
  a: (d, locale) => {
    const hour = d.getHours();
    const ampm = new Intl.DateTimeFormat(locale, { hour: 'numeric', hour12: true })
      .format(d)
      .replace(/\d+/g, '')
      .trim();
    return ampm || (hour < 12 ? 'AM' : 'PM');
  },
  A: (d, locale) => {
    const aFormatter = TOKEN_MAP.a;
    return aFormatter ? aFormatter(d, locale).toUpperCase() : 'AM';
  },
};

/**
 * Formats a date using a pattern string or predefined format.
 * 
 * Supports both predefined formats ('short', 'medium', 'long', 'full') and
 * custom pattern strings using tokens like yyyy, MM, dd, HH, mm, ss, etc.
 * 
 * Custom patterns support:
 * - yyyy, yy: Year
 * - MMMM, MMM, MM, M: Month
 * - dd, d: Day
 * - EEEE, EEE: Weekday
 * - HH, H: Hour (24-hour)
 * - hh, h: Hour (12-hour)
 * - mm, m: Minute
 * - ss, s: Second
 * - a, A: AM/PM
 * - 'text': Literal text in quotes
 * 
 * This filter accepts Date objects, timestamps (milliseconds), or ISO strings.
 * Invalid inputs return "Invalid date".
 * 
 * @param value - Date to format
 * @param format - Format pattern or preset name (default: 'medium')
 * @param locale - Locale for formatting (default: system locale)
 * @returns Formatted date string
 * 
 * @example
 * ```typescript
 * formatDate(new Date('2025-12-20'), 'yyyy-MM-dd') // => "2025-12-20"
 * formatDate(new Date('2025-12-20'), 'EEEE, MMMM d, yyyy') // => "Saturday, December 20, 2025"
 * formatDate(new Date('2025-12-20'), 'full', 'de-DE') // => "Samstag, 20. Dezember 2025"
 * formatDate('invalid') // => "Invalid date"
 * ```
 */
export const formatDate: Filter = (value: unknown, ...args: string[]) => {
  const format: DateFormat = args[0] || 'medium';
  const locale = args[1];

  const parsed = parseDate(value as DateInput);

  if (!parsed) {
    return 'Invalid date';
  }

  const effectiveLocale = getLocale(locale);

  // Check for preset formats
  if (PRESET_DATE_FORMATS[format]) {
    try {
      return new Intl.DateTimeFormat(effectiveLocale, PRESET_DATE_FORMATS[format]).format(parsed);
    } catch {
      return 'Invalid date';
    }
  }

  // Custom pattern formatting
  try {
    return formatWithPattern(parsed, format, effectiveLocale);
  } catch {
    return 'Invalid format';
  }
};

/**
 * Formats a date using a custom pattern string
 * 
 * @param date - Date to format
 * @param pattern - Pattern string with tokens
 * @param locale - Locale for formatting
 * @returns Formatted string
 */
function formatWithPattern(date: Date, pattern: string, locale: string): string {
  let result = '';
  let i = 0;

  while (i < pattern.length) {
    // Handle quoted literals
    if (pattern[i] === "'" || pattern[i] === '"') {
      const quote = pattern[i];
      i++;
      let literal = '';
      while (i < pattern.length && pattern[i] !== quote) {
        literal += pattern[i];
        i++;
      }
      result += literal;
      i++; // Skip closing quote
      continue;
    }

    // Try to match tokens (longest first)
    let matched = false;
    const sortedTokens = Object.keys(TOKEN_MAP).sort((a, b) => b.length - a.length);

    for (const token of sortedTokens) {
      if (pattern.slice(i, i + token.length) === token) {
        const formatter = TOKEN_MAP[token];
        if (formatter) {
          result += formatter(date, locale);
        }
        i += token.length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      result += pattern[i];
      i++;
    }
  }

  return result;
}
