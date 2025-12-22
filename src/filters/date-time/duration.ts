import { getLocale } from './utils/localeManager';
import { UNIT_DIVISORS, DEFAULT_DURATION_UNITS, type DurationUnit, type DurationFormat } from './utils/constants';
import type { Filter } from '../text';

/**
 * Options for duration formatting
 */
export interface DurationOptions {
  /**
   * Format style for the duration
   * - 'narrow': Minimal form (e.g., "1h30m")
   * - 'short': Short form (e.g., "1h 30m")
   * - 'long': Long form (e.g., "1 hour, 30 minutes")
   * - 'colon': Colon-separated form (e.g., "1:30:00")
   */
  format?: DurationFormat;

  /**
   * Input unit (default: 'milliseconds')
   */
  inputUnit?: 'milliseconds' | 'seconds';

  /**
   * Maximum number of units to display
   */
  maxUnits?: number;

  /**
   * Minimum units to always display (even if zero)
   */
  minUnits?: DurationUnit[];

  /**
   * Specific units to display
   */
  units?: DurationUnit[];

  /**
   * Locale for long format (default: system locale)
   */
  locale?: string;

  /**
   * Zero-pad values in colon format (default: false)
   */
  padStart?: boolean;
}

/**
 * Formats a time duration in human-readable format.
 * 
 * Converts milliseconds or seconds into readable durations like "1h 30m" or "1:30:00".
 * Supports multiple format styles and unit configurations.
 * 
 * This filter accepts numeric values (milliseconds by default).
 * Invalid or negative values are handled gracefully.
 * 
 * @param value - Duration in milliseconds (or seconds if inputUnit is 'seconds')
 * @param options - Formatting options
 * @returns Formatted duration string
 * 
 * @example
 * ```typescript
 * duration(5400000) // => "1h 30m" (1.5 hours)
 * duration(90000) // => "1m 30s" (90 seconds)
 * duration(5400000, { format: 'long' }) // => "1 hour, 30 minutes"
 * duration(5400000, { format: 'colon' }) // => "1:30:00"
 * duration(3665, { inputUnit: 'seconds' }) // => "1h 1m 5s"
 * duration(185000, { format: 'colon', padStart: true }) // => "0:03:05"
 * ```
 */
export const duration: Filter = (value: unknown, ...args: string[]) => {
  let options: DurationOptions = {};

  // Parse options if provided as JSON string (from template system)
  if (args.length > 0 && args[0]) {
    try {
      options = JSON.parse(args[0]) as DurationOptions;
    } catch {
      // If not JSON, ignore
    }
  }

  const {
    format = 'short',
    inputUnit = 'milliseconds',
    maxUnits = Infinity,
    minUnits = [],
    units,
    locale,
    padStart = false,
  } = options;

  const numValue = Number(value);
  if (!Number.isFinite(numValue)) {
    return String(value);
  }

  // Convert to milliseconds
  const ms = inputUnit === 'seconds' ? numValue * 1000 : numValue;

  // Handle negative durations
  const isNegative = ms < 0;
  const absMs = Math.abs(ms);

  if (format === 'colon') {
    return (isNegative ? '-' : '') + formatColonDuration(absMs, padStart);
  }

  const parts = calculateDurationParts(absMs, units);
  return (isNegative ? '-' : '') + formatDurationParts(parts, format, maxUnits, minUnits, locale);
};

/**
 * Calculates duration parts (days, hours, minutes, etc.) from milliseconds
 */
function calculateDurationParts(
  ms: number,
  allowedUnits?: DurationUnit[]
): Map<DurationUnit, number> {
  const parts = new Map<DurationUnit, number>();
  const unitsToUse = allowedUnits || DEFAULT_DURATION_UNITS;

  let remaining = ms;

  for (const unit of unitsToUse) {
    if (UNIT_DIVISORS[unit]) {
      const value = Math.floor(remaining / UNIT_DIVISORS[unit]);
      parts.set(unit, value);
      remaining -= value * UNIT_DIVISORS[unit];
    }
  }

  return parts;
}

/**
 * Formats duration parts into a human-readable string
 */
function formatDurationParts(
  parts: Map<DurationUnit, number>,
  format: DurationFormat,
  maxUnits: number,
  minUnits: DurationUnit[],
  locale?: string
): string {
  const effectiveLocale = getLocale(locale);
  const segments: string[] = [];

  let unitsDisplayed = 0;

  for (const [unit, value] of parts) {
    const shouldDisplay = value > 0 || minUnits.includes(unit);

    if (shouldDisplay && unitsDisplayed < maxUnits) {
      segments.push(formatUnitValue(value, unit, format, effectiveLocale));
      unitsDisplayed++;
    }
  }

  if (segments.length === 0) {
    // Return zero with the first unit
    const firstUnit = Array.from(parts.keys())[0] || 'seconds';
    return formatUnitValue(0, firstUnit, format, effectiveLocale);
  }

  if (format === 'long') {
    return segments.join(', ');
  }

  return segments.join(format === 'narrow' ? '' : ' ');
}

/**
 * Formats a single unit value
 */
function formatUnitValue(value: number, unit: DurationUnit, format: DurationFormat, locale: string): string {
  if (format === 'long') {
    const unitName = getUnitName(unit, value, locale);
    return `${value} ${unitName}`;
  }

  const abbr = getUnitAbbreviation(unit);
  return format === 'narrow' ? `${value}${abbr}` : `${value}${abbr}`;
}

/**
 * Gets the unit name for long format
 */
function getUnitName(unit: DurationUnit, value: number, locale: string): string {
  // Use Intl.RelativeTimeFormat to get localized unit names
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'always', style: 'long' });
    const formatted = rtf.format(value, unit as Intl.RelativeTimeFormatUnit);
    // Extract the unit name (words that are not digits or minus signs)
    const words = formatted.split(/[\s,]+/).filter(word => !/^-?\d+$/.test(word));
    return words.length > 0 ? words.join(' ') : unit;
  } catch {
    return value === 1 ? unit.slice(0, -1) : unit;
  }
}

/**
 * Gets the unit abbreviation for short/narrow format
 */
function getUnitAbbreviation(unit: DurationUnit): string {
  const abbr: Record<DurationUnit, string> = {
    years: 'y',
    months: 'mo',
    weeks: 'w',
    days: 'd',
    hours: 'h',
    minutes: 'm',
    seconds: 's',
    milliseconds: 'ms',
  };

  return abbr[unit] || unit.charAt(0);
}

/**
 * Formats duration in colon-separated format (HH:MM:SS or MM:SS)
 */
function formatColonDuration(ms: number, padStart: boolean): string {
  const hours = Math.floor(ms / UNIT_DIVISORS.hours);
  const minutes = Math.floor((ms % UNIT_DIVISORS.hours) / UNIT_DIVISORS.minutes);
  const seconds = Math.floor((ms % UNIT_DIVISORS.minutes) / UNIT_DIVISORS.seconds);

  if (hours > 0 || padStart) {
    const h = padStart ? hours.toString().padStart(1, '0') : hours.toString();
    const m = minutes.toString().padStart(2, '0');
    const s = seconds.toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  const m = minutes.toString();
  const s = seconds.toString().padStart(2, '0');
  return `${m}:${s}`;
}
