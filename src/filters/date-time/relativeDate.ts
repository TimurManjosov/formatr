import { parseDate, type DateInput } from './utils/dateParser';
import { getLocale } from './utils/localeManager';
import type { Filter } from '../text';

/**
 * Options for relative date formatting
 */
export interface RelativeDateOptions {
  /**
   * The length of the formatted string
   * - 'narrow': Shortest form (e.g., "in 3 d")
   * - 'short': Short form (e.g., "in 3 days")
   * - 'long': Long form (e.g., "in 3 days")
   */
  style?: 'narrow' | 'short' | 'long';

  /**
   * Whether to use numeric or natural language
   * - 'auto': Use natural language when possible (e.g., "yesterday", "tomorrow")
   * - 'always': Always use numeric form (e.g., "1 day ago", "in 1 day")
   */
  numeric?: 'auto' | 'always';

  /**
   * Locale for formatting (e.g., 'en-US', 'de-DE')
   */
  locale?: string;

  /**
   * Reference date for relative comparison (defaults to current time)
   */
  referenceDate?: DateInput;
}

/**
 * Formats a date relative to the current time or a reference date.
 * 
 * Uses Intl.RelativeTimeFormat for locale-aware formatting. Supports
 * contextual output like "yesterday", "today", "tomorrow" when numeric is 'auto'.
 * 
 * This filter accepts Date objects, timestamps (milliseconds), or ISO strings.
 * Invalid inputs return "Invalid date".
 * 
 * @param value - Date to format
 * @param options - Formatting options
 * @returns Formatted relative date string
 * 
 * @example
 * ```typescript
 * relativeDate(new Date('2025-12-23')) // => "in 3 days"
 * relativeDate(new Date('2025-12-19')) // => "yesterday"
 * relativeDate(futureDate, { style: 'short', locale: 'es-ES' }) // => "dentro de 3 días"
 * relativeDate('invalid') // => "Invalid date"
 * ```
 */
export const relativeDate: Filter = (value: unknown, ...args: string[]) => {
  // Parse options from filter arguments
  let style: 'narrow' | 'short' | 'long' = 'long';
  let numeric: 'auto' | 'always' = 'auto';
  let locale: string | undefined;
  let referenceDate: DateInput | undefined;

  // Parse options if provided as JSON string (from template system)
  if (args.length > 0 && args[0]) {
    try {
      const opts = JSON.parse(args[0]) as RelativeDateOptions;
      style = opts.style ?? style;
      numeric = opts.numeric ?? numeric;
      locale = opts.locale;
      referenceDate = opts.referenceDate;
    } catch {
      // If not JSON, treat as individual arguments
      // This supports both template usage and direct function calls
    }
  }

  const targetDate = parseDate(value as DateInput);
  const refDate = parseDate(referenceDate ?? Date.now());

  if (!targetDate || !refDate) {
    return 'Invalid date';
  }

  const rtf = new Intl.RelativeTimeFormat(getLocale(locale), {
    style,
    numeric,
  });

  const diffInMs = targetDate.getTime() - refDate.getTime();
  const diffInSeconds = diffInMs / 1000;
  const diffInMinutes = diffInSeconds / 60;
  const diffInHours = diffInMinutes / 60;
  const diffInDays = diffInHours / 24;
  const diffInWeeks = diffInDays / 7;
  const diffInMonths = diffInDays / 30;
  const diffInYears = diffInDays / 365;

  // Choose the most appropriate unit based on the time difference
  if (Math.abs(diffInSeconds) < 60) {
    return rtf.format(Math.round(diffInSeconds), 'second');
  } else if (Math.abs(diffInMinutes) < 60) {
    return rtf.format(Math.round(diffInMinutes), 'minute');
  } else if (Math.abs(diffInHours) < 24) {
    return rtf.format(Math.round(diffInHours), 'hour');
  } else if (Math.abs(diffInDays) < 7) {
    return rtf.format(Math.round(diffInDays), 'day');
  } else if (Math.abs(diffInWeeks) < 4) {
    return rtf.format(Math.round(diffInWeeks), 'week');
  } else if (Math.abs(diffInMonths) < 12) {
    return rtf.format(Math.round(diffInMonths), 'month');
  } else {
    return rtf.format(Math.round(diffInYears), 'year');
  }
};
