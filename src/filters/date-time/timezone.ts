import { parseDate, type DateInput } from './utils/dateParser';
import type { Filter } from '../text';

/**
 * Options for timezone conversion
 */
export interface TimezoneOptions {
  /**
   * Format pattern for the output (default: 'yyyy-MM-dd HH:mm:ss zzz')
   */
  format?: string;

  /**
   * Whether to show the timezone abbreviation (default: true)
   */
  showTimezone?: boolean;

  /**
   * Whether to return a Date object instead of a formatted string (default: false)
   * Note: This returns the same instant in time, just displayed in the target timezone
   */
  returnDate?: boolean;

  /**
   * Locale for formatting (default: system locale)
   */
  locale?: string;
}

/**
 * Converts a date to a specific timezone and formats it.
 * 
 * Uses Intl.DateTimeFormat with timeZone option to convert dates between timezones.
 * Supports all IANA timezone identifiers (e.g., 'America/New_York', 'Europe/London').
 * Handles DST transitions correctly.
 * 
 * This filter accepts Date objects, timestamps (milliseconds), or ISO strings.
 * Invalid inputs return "Invalid date" (or Invalid Date object if returnDate is true).
 * 
 * @param value - Date to convert
 * @param targetTimezone - IANA timezone identifier
 * @param options - Formatting options
 * @returns Formatted date string or Date object (if returnDate is true)
 * 
 * @example
 * ```typescript
 * timezone(new Date('2025-12-20T15:30:00Z'), 'America/New_York')
 * // => "2025-12-20 10:30:00 EST"
 * 
 * timezone(date, 'Asia/Tokyo', { format: 'full' })
 * // => "Saturday, December 20, 2025 at 12:30:00 AM JST"
 * 
 * timezone('invalid', 'UTC') // => "Invalid date"
 * ```
 */
export const timezone: Filter = (value: unknown, ...args: string[]) => {
  const targetTimezone = args[0];
  let options: TimezoneOptions = {};

  // Parse options if provided as JSON string (from template system)
  if (args.length > 1 && args[1]) {
    try {
      options = JSON.parse(args[1]) as TimezoneOptions;
    } catch {
      // If not JSON, ignore
    }
  }

  const {
    format = 'yyyy-MM-dd HH:mm:ss zzz',
    showTimezone = true,
    returnDate = false,
    locale,
  } = options;

  const parsed = parseDate(value as DateInput);

  if (!parsed) {
    return returnDate ? new Date(NaN) : 'Invalid date';
  }

  if (!targetTimezone) {
    return returnDate ? parsed : 'Invalid timezone';
  }

  try {
    if (returnDate) {
      // Return a Date object representing the same instant
      // Note: Date objects don't have timezone info, but we can create one
      // that will display correctly in the target timezone
      return parsed;
    }

    // Format the date in the target timezone
    if (format === 'short' || format === 'medium' || format === 'long' || format === 'full') {
      const dateStyle = format as 'short' | 'medium' | 'long' | 'full';
      return new Intl.DateTimeFormat(locale, {
        dateStyle,
        timeStyle: 'long',
        timeZone: targetTimezone,
      }).format(parsed);
    }

    // Custom format using Intl.DateTimeFormat
    return formatInTimezone(parsed, targetTimezone, format, showTimezone, locale);
  } catch {
    return returnDate ? new Date(NaN) : 'Invalid timezone';
  }
};

/**
 * Formats a date in a specific timezone using a pattern
 * 
 * @param date - Date to format
 * @param timeZone - IANA timezone identifier
 * @param pattern - Format pattern
 * @param showTimezone - Whether to include timezone abbreviation
 * @param locale - Locale for formatting
 * @returns Formatted string
 */
function formatInTimezone(
  date: Date,
  timeZone: string,
  pattern: string,
  showTimezone: boolean,
  locale?: string
): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: showTimezone ? 'short' : undefined,
  });

  const parts = formatter.formatToParts(date);
  const partsMap: Record<string, string> = {};

  for (const part of parts) {
    partsMap[part.type] = part.value;
  }

  // Build a simple format based on the pattern
  let result = pattern;

  // Replace common tokens
  result = result.replace(/yyyy/g, partsMap.year || '');
  result = result.replace(/MM/g, partsMap.month || '');
  result = result.replace(/dd/g, partsMap.day || '');
  result = result.replace(/HH/g, partsMap.hour || '');
  result = result.replace(/mm/g, partsMap.minute || '');
  result = result.replace(/ss/g, partsMap.second || '');
  result = result.replace(/zzz/g, partsMap.timeZoneName || '');

  return result;
}
