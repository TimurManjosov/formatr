import { parseDate, type DateInput } from './utils/dateParser';
import { getLocale } from './utils/localeManager';
import { UNIT_ABBREVIATIONS } from './utils/constants';
import { formatDate } from './formatDate';
import type { Filter } from '../text';

/**
 * Options for time ago formatting
 */
export interface TimeAgoOptions {
  /**
   * Format style
   * - 'narrow': Minimal form (e.g., "15m")
   * - 'short': Short form (e.g., "15m ago")
   * - 'long': Long form (e.g., "15 minutes ago")
   */
  format?: 'narrow' | 'short' | 'long';

  /**
   * Threshold in days - beyond this, use fallback format instead
   */
  threshold?: number;

  /**
   * Fallback date format to use when beyond threshold
   */
  fallbackFormat?: string;

  /**
   * Threshold in seconds for "just now" (default: 10)
   */
  justNowThreshold?: number;

  /**
   * Reference date for comparison (default: current time)
   */
  referenceDate?: DateInput;

  /**
   * Locale for formatting
   */
  locale?: string;
}

/**
 * Displays elapsed time since a date in human-readable format.
 * 
 * Optimized for displaying past dates relative to now (e.g., "5 minutes ago").
 * Supports thresholds for falling back to absolute dates and "just now" for
 * very recent times.
 * 
 * This filter accepts Date objects, timestamps (milliseconds), or ISO strings.
 * Invalid inputs return "Invalid date".
 * 
 * @param value - Date to format
 * @param options - Formatting options
 * @returns Formatted time ago string
 * 
 * @example
 * ```typescript
 * timeAgo(new Date('2025-12-20T11:45:00')) // => "15 minutes ago"
 * timeAgo(new Date('2025-12-20T11:59:50'), { justNowThreshold: 30 }) // => "just now"
 * timeAgo(new Date('2024-01-01'), { threshold: 30, fallbackFormat: 'MMM d, yyyy' })
 * // => "Jan 1, 2024"
 * timeAgo(recentDate, { format: 'short' }) // => "15m ago"
 * timeAgo('invalid') // => "Invalid date"
 * ```
 */
export const timeAgo: Filter = (value: unknown, ...args: string[]) => {
  let options: TimeAgoOptions = {};

  // Parse options if provided as JSON string (from template system)
  if (args.length > 0 && args[0]) {
    try {
      options = JSON.parse(args[0]) as TimeAgoOptions;
    } catch {
      // If not JSON, ignore
    }
  }

  const {
    format = 'long',
    threshold,
    fallbackFormat = 'medium',
    justNowThreshold = 10,
    referenceDate,
    locale,
  } = options;

  const targetDate = parseDate(value as DateInput);
  const refDate = parseDate(referenceDate ?? Date.now());

  if (!targetDate || !refDate) {
    return 'Invalid date';
  }

  const effectiveLocale = getLocale(locale);
  const diffInMs = refDate.getTime() - targetDate.getTime();
  const diffInSeconds = diffInMs / 1000;
  const diffInMinutes = diffInSeconds / 60;
  const diffInHours = diffInMinutes / 60;
  const diffInDays = diffInHours / 24;
  const diffInWeeks = diffInDays / 7;
  const diffInMonths = diffInDays / 30;
  const diffInYears = diffInDays / 365;

  // Check threshold (if set) - fallback to absolute date
  if (threshold !== undefined && diffInDays > threshold) {
    return formatDate(targetDate, fallbackFormat, locale ?? '');
  }

  // "Just now" threshold
  if (diffInSeconds >= 0 && diffInSeconds < justNowThreshold) {
    return 'just now';
  }

  // Handle future dates (rare but supported)
  if (diffInSeconds < 0) {
    const absDiffInSeconds = Math.abs(diffInSeconds);
    if (absDiffInSeconds < 60) {
      return formatTimeAgo(Math.round(absDiffInSeconds), 'second', format, effectiveLocale, false);
    } else if (Math.abs(diffInMinutes) < 60) {
      return formatTimeAgo(Math.round(Math.abs(diffInMinutes)), 'minute', format, effectiveLocale, false);
    } else if (Math.abs(diffInHours) < 24) {
      return formatTimeAgo(Math.round(Math.abs(diffInHours)), 'hour', format, effectiveLocale, false);
    } else {
      return formatTimeAgo(Math.round(Math.abs(diffInDays)), 'day', format, effectiveLocale, false);
    }
  }

  // Select appropriate unit for past dates
  if (diffInSeconds < 60) {
    return formatTimeAgo(Math.round(diffInSeconds), 'second', format, effectiveLocale, true);
  } else if (diffInMinutes < 60) {
    return formatTimeAgo(Math.round(diffInMinutes), 'minute', format, effectiveLocale, true);
  } else if (diffInHours < 24) {
    return formatTimeAgo(Math.round(diffInHours), 'hour', format, effectiveLocale, true);
  } else if (diffInDays < 7) {
    return formatTimeAgo(Math.round(diffInDays), 'day', format, effectiveLocale, true);
  } else if (diffInWeeks < 4) {
    return formatTimeAgo(Math.round(diffInWeeks), 'week', format, effectiveLocale, true);
  } else if (diffInMonths < 12) {
    return formatTimeAgo(Math.round(diffInMonths), 'month', format, effectiveLocale, true);
  } else {
    return formatTimeAgo(Math.round(diffInYears), 'year', format, effectiveLocale, true);
  }
};

/**
 * Formats a time ago value with the specified unit
 */
function formatTimeAgo(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  format: 'narrow' | 'short' | 'long',
  locale: string,
  isPast: boolean
): string {
  if (format === 'narrow') {
    // Narrow format: just the value and abbreviated unit (no "ago")
    const abbr = getUnitAbbr(unit);
    return `${value}${abbr}`;
  }

  if (format === 'short') {
    // Short format: value, abbreviated unit, and "ago"
    const abbr = getUnitAbbr(unit);
    return isPast ? `${value}${abbr} ago` : `in ${value}${abbr}`;
  }

  // Long format: use Intl.RelativeTimeFormat
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, {
      style: 'long',
      numeric: 'always',
    });
    return rtf.format(isPast ? -value : value, unit);
  } catch {
    // Fallback for unsupported locales
    const unitName = value === 1 ? unit : `${unit}s`;
    return isPast ? `${value} ${unitName} ago` : `in ${value} ${unitName}`;
  }
}

/**
 * Gets abbreviated unit name for narrow/short formats
 */
function getUnitAbbr(unit: Intl.RelativeTimeFormatUnit): string {
  return UNIT_ABBREVIATIONS[unit] || unit.charAt(0);
}
