/**
 * Time unit types supported for duration formatting
 */
export type DurationUnit =
  | 'years'
  | 'months'
  | 'weeks'
  | 'days'
  | 'hours'
  | 'minutes'
  | 'seconds'
  | 'milliseconds';

/**
 * Duration format styles
 */
export type DurationFormat = 'narrow' | 'short' | 'long' | 'colon';

/**
 * Conversion factors from milliseconds to each time unit
 */
export const UNIT_DIVISORS: Record<DurationUnit, number> = {
  years: 365 * 24 * 60 * 60 * 1000,
  months: 30 * 24 * 60 * 60 * 1000,
  weeks: 7 * 24 * 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
  hours: 60 * 60 * 1000,
  minutes: 60 * 1000,
  seconds: 1000,
  milliseconds: 1,
};

/**
 * Default units order for duration formatting
 */
export const DEFAULT_DURATION_UNITS: DurationUnit[] = [
  'days',
  'hours',
  'minutes',
  'seconds',
];

/**
 * Format patterns for predefined date formats
 */
export const PRESET_DATE_FORMATS: Record<string, Intl.DateTimeFormatOptions> = {
  short: { dateStyle: 'short' },
  medium: { dateStyle: 'medium' },
  long: { dateStyle: 'long' },
  full: { dateStyle: 'full' },
};
