// Re-export filter types for external use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Filter, AsyncFilter, SyncOrAsyncFilter } from './text';
import { lower, pad, plural, replace, slice, trim, truncate, upper } from './text';
import { relativeDate, formatDate, timezone, duration, timeAgo } from './date-time';
export { makeIntlFilters } from './intl';
export type { Filter, AsyncFilter, SyncOrAsyncFilter } from './text';

// Export date-time filters and types
export { relativeDate, formatDate, timezone, duration, timeAgo } from './date-time';
export type {
  RelativeDateOptions,
  DateFormat,
  TimezoneOptions,
  DurationOptions,
  TimeAgoOptions,
  DateInput,
  DurationUnit,
  DurationFormat,
} from './date-time';

export const builtinFilters: Record<string, Filter> = {
  upper,
  lower,
  trim,
  plural,
  slice,
  pad,
  truncate,
  replace,
  relativeDate,
  formatDate,
  timezone,
  duration,
  timeAgo,
};
