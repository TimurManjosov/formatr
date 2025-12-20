# RFC: Add Advanced Date & Time Formatters

**Issue Number:** #02  
**Status:** Draft  
**Created:** 2025-12-20  
**Author:** TimurManjosov

---

## Description

This RFC proposes the addition of a comprehensive suite of date and time formatting filters to the `formatr` library. The proposed filters will handle common date/time formatting scenarios including relative dates, absolute date formatting with locale support, timezone conversions, duration formatting, and human-readable time ago representations.

The following filters are proposed:
- `relativeDate` - Format dates relative to now (e.g., "in 3 days", "2 hours ago")
- `formatDate` - Format dates with customizable patterns and locale support
- `timezone` - Convert dates between timezones
- `duration` - Format time durations in human-readable format
- `timeAgo` - Display elapsed time since a date (e.g., "3 minutes ago")

---

## Motivation & Use Cases

### Why This Feature Matters

Date and time formatting is one of the most common requirements in modern applications. Developers frequently need to:

1. **Display user-friendly timestamps** - Show "5 minutes ago" instead of raw timestamps
2. **Support internationalization** - Format dates according to user locale preferences
3. **Handle timezone conversions** - Display times in user's local timezone
4. **Show relative timeframes** - Communicate deadlines ("due in 2 days") or history
5. **Format durations** - Display video lengths, task durations, or countdown timers

### Real-World Use Cases

#### Social Media & Communication
```typescript
// Show post timestamps
{{ post.createdAt | timeAgo }}  
// Output: "5 minutes ago"

// Display message times with full date for older items
{{ message.timestamp | relativeDate }}  
// Output: "Yesterday at 3:45 PM" or "March 15, 2025"
```

#### E-commerce & Booking
```typescript
// Show delivery estimates
{{ order.estimatedDelivery | relativeDate }}  
// Output: "Arrives in 3 days"

// Display booking dates with localization
{{ reservation.checkIn | formatDate('EEEE, MMMM d, yyyy', 'es-ES') }}  
// Output: "viernes, 20 de diciembre de 2025"
```

#### Project Management
```typescript
// Show task deadlines
{{ task.dueDate | relativeDate }}  
// Output: "Due in 2 hours" or "Overdue by 3 days"

// Display task duration
{{ task.timeSpent | duration }}  
// Output: "2h 30m"
```

#### Video & Media Platforms
```typescript
// Show video upload time
{{ video.uploadedAt | timeAgo }}  
// Output: "3 weeks ago"

// Display video duration
{{ video.length | duration('hms') }}  
// Output: "1:23:45"
```

---

## Example Usage

### 1. `relativeDate` Filter

Formats a date relative to the current time with smart contextual output.

```typescript
import { relativeDate } from '@formatr/filters';

// Basic usage
const futureDate = new Date('2025-12-23T15:00:00Z');
relativeDate(futureDate);
// Output: "in 3 days"

const pastDate = new Date('2025-12-19T10:00:00Z');
relativeDate(pastDate);
// Output: "yesterday"

// With options
relativeDate(futureDate, { 
  style: 'long',  // 'narrow', 'short', 'long'
  numeric: 'auto' // 'auto', 'always'
});
// Output: "in 3 days" (auto uses "yesterday", "today", etc.)

relativeDate(futureDate, { 
  style: 'short',
  numeric: 'always'
});
// Output: "in 3 days"

// With locale
relativeDate(futureDate, { locale: 'es-ES' });
// Output: "dentro de 3 días"

// Template usage
{{ event.startDate | relativeDate }}
{{ event.startDate | relativeDate({ style: 'long', locale: 'fr-FR' }) }}
```

### 2. `formatDate` Filter

Formats dates using flexible patterns with full locale support.

```typescript
import { formatDate } from '@formatr/filters';

const date = new Date('2025-12-20T15:30:00Z');

// Pattern-based formatting
formatDate(date, 'yyyy-MM-dd');
// Output: "2025-12-20"

formatDate(date, 'EEEE, MMMM d, yyyy');
// Output: "Saturday, December 20, 2025"

formatDate(date, "h:mm a 'on' MMM d");
// Output: "3:30 PM on Dec 20"

// Predefined formats
formatDate(date, 'short');      // "12/20/25"
formatDate(date, 'medium');     // "Dec 20, 2025"
formatDate(date, 'long');       // "December 20, 2025"
formatDate(date, 'full');       // "Saturday, December 20, 2025"

// With locale
formatDate(date, 'full', 'ja-JP');
// Output: "2025年12月20日土曜日"

formatDate(date, 'PPPP', 'de-DE');
// Output: "Samstag, 20. Dezember 2025"

// Time formatting
formatDate(date, 'HH:mm:ss');   // "15:30:00" (24-hour)
formatDate(date, 'h:mm a');     // "3:30 PM" (12-hour)

// Template usage
{{ user.birthday | formatDate('MMMM d') }}
{{ event.timestamp | formatDate('full', 'en-US') }}
{{ meeting.time | formatDate('h:mm a') }}
```

### 3. `timezone` Filter

Converts dates between timezones and formats them accordingly.

```typescript
import { timezone } from '@formatr/filters';

const date = new Date('2025-12-20T15:30:00Z'); // UTC time

// Convert to specific timezone
timezone(date, 'America/New_York');
// Output: "2025-12-20 10:30:00 EST"

timezone(date, 'Asia/Tokyo');
// Output: "2025-12-21 00:30:00 JST"

// With custom format
timezone(date, 'Europe/London', { 
  format: 'PPPP p' 
});
// Output: "Saturday, December 20, 2025 at 3:30 PM GMT"

// Just convert, return Date object
timezone(date, 'Australia/Sydney', { 
  returnDate: true 
});
// Output: Date object in Sydney timezone

// Show timezone name/abbreviation
timezone(date, 'America/Los_Angeles', { 
  showTimezone: true,
  format: 'short'
});
// Output: "12/20/25, 7:30 AM PST"

// Template usage
{{ webinar.startTime | timezone('America/New_York') }}
{{ event.time | timezone(userTimezone, { format: 'full' }) }}
```

### 4. `duration` Filter

Formats time durations in human-readable format.

```typescript
import { duration } from '@formatr/filters';

// From milliseconds
duration(5400000);  // 1.5 hours in ms
// Output: "1h 30m"

duration(90000);    // 90 seconds
// Output: "1m 30s"

// From seconds
duration(3665, { inputUnit: 'seconds' });
// Output: "1h 1m 5s"

// Different formats
duration(5400000, { format: 'long' });
// Output: "1 hour, 30 minutes"

duration(5400000, { format: 'short' });
// Output: "1h 30m"

duration(5400000, { format: 'narrow' });
// Output: "1h30m"

duration(5400000, { format: 'colon' });
// Output: "1:30:00"

// Maximum units
duration(90061000, { maxUnits: 2 });
// Output: "1d 1h" (doesn't show minutes/seconds)

// Minimum units (always show)
duration(3600000, { minUnits: ['hours', 'minutes'] });
// Output: "1h 0m"

// Specific unit display
duration(7200000, { units: ['hours', 'minutes'] });
// Output: "2h 0m"

// Localized
duration(5400000, { format: 'long', locale: 'es-ES' });
// Output: "1 hora, 30 minutos"

// Video duration style (always show hours)
duration(185000, { format: 'colon', padStart: true });
// Output: "0:03:05"

// Template usage
{{ video.duration | duration({ format: 'colon' }) }}
{{ task.timeSpent | duration({ format: 'long' }) }}
{{ countdown.remaining | duration({ maxUnits: 2 }) }}
```

### 5. `timeAgo` Filter

Displays elapsed time since a date in human-readable format (optimized for past dates).

```typescript
import { timeAgo } from '@formatr/filters';

const now = new Date('2025-12-20T12:00:00Z');
const past = new Date('2025-12-20T11:45:00Z');

// Basic usage
timeAgo(past); // assuming now is reference
// Output: "15 minutes ago"

// Different time ranges
timeAgo(new Date('2025-12-20T11:59:00Z'));  // "1 minute ago"
timeAgo(new Date('2025-12-20T10:00:00Z'));  // "2 hours ago"
timeAgo(new Date('2025-12-19T12:00:00Z'));  // "1 day ago"
timeAgo(new Date('2025-12-13T12:00:00Z'));  // "1 week ago"
timeAgo(new Date('2025-11-20T12:00:00Z'));  // "1 month ago"
timeAgo(new Date('2024-12-20T12:00:00Z'));  // "1 year ago"

// Short format
timeAgo(past, { format: 'short' });
// Output: "15m ago"

// Narrow format (minimal)
timeAgo(past, { format: 'narrow' });
// Output: "15m"

// Long format (verbose)
timeAgo(past, { format: 'long' });
// Output: "15 minutes ago"

// With threshold for fallback to date
timeAgo(new Date('2024-01-01'), { 
  threshold: 30, // days
  fallbackFormat: 'MMM d, yyyy'
});
// Output: "Jan 1, 2024" (beyond 30 days)

// Just now threshold
timeAgo(new Date('2025-12-20T11:59:50Z'), { 
  justNowThreshold: 30 // seconds
});
// Output: "just now"

// Localized
timeAgo(past, { locale: 'fr-FR' });
// Output: "il y a 15 minutes"

// Custom reference date
timeAgo(
  new Date('2025-12-20T10:00:00Z'), 
  { referenceDate: new Date('2025-12-20T12:00:00Z') }
);
// Output: "2 hours ago"

// Template usage
{{ post.createdAt | timeAgo }}
{{ comment.timestamp | timeAgo({ format: 'short' }) }}
{{ notification.time | timeAgo({ threshold: 7, fallbackFormat: 'short' }) }}
```

---

## Requirements

### Functional Requirements

1. **Filter Implementation**
   - All five filters must be implemented as pure functions
   - Support both programmatic usage and template syntax
   - Handle edge cases (null, undefined, invalid dates)
   - Provide sensible defaults for all optional parameters

2. **Internationalization (i18n)**
   - Support locale-specific formatting using `Intl` API
   - Accept locale as parameter (default to system locale)
   - Properly handle locale-specific date/time conventions
   - Support RTL languages

3. **Timezone Support**
   - Leverage IANA timezone database
   - Handle daylight saving time transitions
   - Support timezone abbreviations and full names
   - Provide UTC conversion capabilities

4. **Format Flexibility**
   - Support multiple format styles (narrow, short, long, full)
   - Allow custom format patterns (date-fns or similar syntax)
   - Provide predefined common formats
   - Enable format composition

5. **Performance**
   - Efficient date parsing and formatting
   - Minimize dependencies
   - Consider caching for frequently used formats
   - Lazy-load locale data when possible

### Non-Functional Requirements

1. **Browser Compatibility**
   - Support modern browsers (last 2 versions)
   - Provide polyfills for `Intl` API if needed
   - Test across different timezone environments

2. **Bundle Size**
   - Keep individual filter size minimal
   - Support tree-shaking
   - Consider separate timezone data package
   - Total filters bundle should be < 15KB gzipped

3. **Documentation**
   - Comprehensive API documentation
   - Multiple usage examples
   - Common pattern cookbook
   - Migration guide for users of other libraries

4. **Testing**
   - Unit tests for all filters
   - Edge case coverage
   - Timezone-specific tests
   - Locale-specific tests
   - Performance benchmarks

---

## Acceptance Criteria

### Core Functionality

- [ ] All five filters (`relativeDate`, `formatDate`, `timezone`, `duration`, `timeAgo`) are implemented
- [ ] Each filter handles null/undefined/invalid inputs gracefully
- [ ] Filters work with Date objects, timestamps (number), and ISO strings
- [ ] Default behavior is sensible without requiring options

### `relativeDate` Filter

- [ ] Supports 'narrow', 'short', 'long' styles
- [ ] Handles both past and future dates
- [ ] Respects locale parameter
- [ ] Uses contextual names ("yesterday", "today", "tomorrow") appropriately
- [ ] Numeric option works as expected ('auto' vs 'always')

### `formatDate` Filter

- [ ] Supports custom format patterns
- [ ] Implements predefined formats (short, medium, long, full)
- [ ] Locale parameter affects month names, day names, etc.
- [ ] Handles both date and time components
- [ ] Supports format tokens (yyyy, MM, dd, HH, mm, ss, etc.)

### `timezone` Filter

- [ ] Converts dates to specified timezone
- [ ] Displays timezone abbreviation when requested
- [ ] Supports all IANA timezone identifiers
- [ ] Handles DST transitions correctly
- [ ] Option to return Date object or formatted string

### `duration` Filter

- [ ] Formats milliseconds/seconds into readable durations
- [ ] Supports multiple format styles (narrow, short, long, colon)
- [ ] Respects maxUnits and minUnits options
- [ ] Handles unit selection (show only specific units)
- [ ] Locale parameter affects unit names
- [ ] Zero-padding option works for colon format

### `timeAgo` Filter

- [ ] Displays accurate elapsed time
- [ ] Supports format options (narrow, short, long)
- [ ] "Just now" threshold works correctly
- [ ] Falls back to absolute date beyond threshold
- [ ] Respects locale parameter
- [ ] Custom reference date option works

### Quality & Performance

- [ ] All filters have TypeScript type definitions
- [ ] Unit test coverage >= 90%
- [ ] No console errors or warnings
- [ ] Bundle size for all filters < 15KB gzipped
- [ ] Performance: Format 1000 dates in < 100ms

### Documentation

- [ ] README updated with all filters
- [ ] JSDoc comments on all public functions
- [ ] Examples provided for each filter
- [ ] Migration guide from moment.js/date-fns included
- [ ] Locale support documented

---

## Implementation Ideas

### Technology Stack

```typescript
// Suggested dependencies
{
  "dependencies": {
    // Core date manipulation (optional, evaluate alternatives)
    "date-fns": "^3.0.0",
    "date-fns-tz": "^2.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "vitest": "^1.0.0"
  }
}
```

### Project Structure

```
src/filters/date-time/
├── index.ts                 # Export all filters
├── relativeDate.ts          # Relative date filter
├── formatDate.ts            # Date formatting filter
├── timezone.ts              # Timezone conversion filter
├── duration.ts              # Duration formatting filter
├── timeAgo.ts               # Time ago filter
├── utils/
│   ├── dateParser.ts        # Unified date parsing
│   ├── localeManager.ts     # Locale handling
│   └── constants.ts         # Format patterns, defaults
└── __tests__/
    ├── relativeDate.test.ts
    ├── formatDate.test.ts
    ├── timezone.test.ts
    ├── duration.test.ts
    └── timeAgo.test.ts
```

### Implementation Outline

#### 1. Shared Utilities

```typescript
// src/filters/date-time/utils/dateParser.ts
export type DateInput = Date | number | string;

export function parseDate(input: DateInput): Date | null {
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  
  if (typeof input === 'number') {
    return new Date(input);
  }
  
  if (typeof input === 'string') {
    const parsed = new Date(input);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  return null;
}

export function isValidDate(date: any): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}
```

```typescript
// src/filters/date-time/utils/localeManager.ts
export function getLocale(locale?: string): string {
  return locale || navigator?.language || 'en-US';
}

export function isLocaleSupported(locale: string): boolean {
  try {
    new Intl.DateTimeFormat(locale);
    return true;
  } catch {
    return false;
  }
}
```

#### 2. `relativeDate` Implementation

```typescript
// src/filters/date-time/relativeDate.ts
import { parseDate, isValidDate } from './utils/dateParser';
import { getLocale } from './utils/localeManager';

export interface RelativeDateOptions {
  style?: 'narrow' | 'short' | 'long';
  numeric?: 'auto' | 'always';
  locale?: string;
  referenceDate?: DateInput;
}

export function relativeDate(
  date: DateInput,
  options: RelativeDateOptions = {}
): string {
  const {
    style = 'long',
    numeric = 'auto',
    locale,
    referenceDate = new Date()
  } = options;

  const targetDate = parseDate(date);
  const refDate = parseDate(referenceDate);

  if (!targetDate || !refDate) {
    return 'Invalid date';
  }

  const rtf = new Intl.RelativeTimeFormat(getLocale(locale), {
    style,
    numeric
  });

  const diffInSeconds = (targetDate.getTime() - refDate.getTime()) / 1000;
  const diffInMinutes = diffInSeconds / 60;
  const diffInHours = diffInMinutes / 60;
  const diffInDays = diffInHours / 24;
  const diffInWeeks = diffInDays / 7;
  const diffInMonths = diffInDays / 30;
  const diffInYears = diffInDays / 365;

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
}
```

#### 3. `formatDate` Implementation

```typescript
// src/filters/date-time/formatDate.ts
import { format as dateFnsFormat } from 'date-fns';
import { parseDate } from './utils/dateParser';
import { getLocale } from './utils/localeManager';

export type DateFormat = 
  | 'short' 
  | 'medium' 
  | 'long' 
  | 'full' 
  | string;

const PRESET_FORMATS: Record<string, string> = {
  short: 'P',      // 12/20/2025
  medium: 'PP',    // Dec 20, 2025
  long: 'PPP',     // December 20, 2025
  full: 'PPPP'     // Saturday, December 20, 2025
};

export function formatDate(
  date: DateInput,
  format: DateFormat = 'medium',
  locale?: string
): string {
  const parsed = parseDate(date);
  
  if (!parsed) {
    return 'Invalid date';
  }

  const pattern = PRESET_FORMATS[format] || format;
  
  try {
    return dateFnsFormat(parsed, pattern, {
      locale: locale ? getDateFnsLocale(locale) : undefined
    });
  } catch (error) {
    return 'Invalid format';
  }
}

// Helper to load date-fns locale
function getDateFnsLocale(locale: string) {
  // Implementation would dynamically import locale
  // This is a simplified version
  return undefined;
}
```

#### 4. `timezone` Implementation

```typescript
// src/filters/date-time/timezone.ts
import { formatInTimeZone } from 'date-fns-tz';
import { parseDate } from './utils/dateParser';

export interface TimezoneOptions {
  format?: string;
  showTimezone?: boolean;
  returnDate?: boolean;
}

export function timezone(
  date: DateInput,
  targetTimezone: string,
  options: TimezoneOptions = {}
): string | Date {
  const {
    format = 'yyyy-MM-dd HH:mm:ss zzz',
    showTimezone = true,
    returnDate = false
  } = options;

  const parsed = parseDate(date);
  
  if (!parsed) {
    return returnDate ? new Date(NaN) : 'Invalid date';
  }

  try {
    if (returnDate) {
      // Convert and return Date object
      const converted = new Date(
        parsed.toLocaleString('en-US', { timeZone: targetTimezone })
      );
      return converted;
    }

    const pattern = showTimezone ? format : format.replace(/\s*z+\s*/, '');
    return formatInTimeZone(parsed, targetTimezone, pattern);
  } catch (error) {
    return returnDate ? new Date(NaN) : 'Invalid timezone';
  }
}
```

#### 5. `duration` Implementation

```typescript
// src/filters/date-time/duration.ts
export type DurationUnit = 'years' | 'months' | 'weeks' | 'days' | 
                           'hours' | 'minutes' | 'seconds' | 'milliseconds';

export type DurationFormat = 'narrow' | 'short' | 'long' | 'colon';

export interface DurationOptions {
  format?: DurationFormat;
  inputUnit?: 'milliseconds' | 'seconds';
  maxUnits?: number;
  minUnits?: DurationUnit[];
  units?: DurationUnit[];
  locale?: string;
  padStart?: boolean;
}

const UNIT_DIVISORS = {
  years: 365 * 24 * 60 * 60 * 1000,
  months: 30 * 24 * 60 * 60 * 1000,
  weeks: 7 * 24 * 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
  hours: 60 * 60 * 1000,
  minutes: 60 * 1000,
  seconds: 1000,
  milliseconds: 1
};

export function duration(
  value: number,
  options: DurationOptions = {}
): string {
  const {
    format = 'short',
    inputUnit = 'milliseconds',
    maxUnits = Infinity,
    minUnits = [],
    units,
    locale,
    padStart = false
  } = options;

  // Convert to milliseconds
  const ms = inputUnit === 'seconds' ? value * 1000 : value;

  if (format === 'colon') {
    return formatColonDuration(ms, padStart);
  }

  const parts = calculateDurationParts(ms, units);
  return formatDurationParts(parts, format, maxUnits, minUnits, locale);
}

function calculateDurationParts(
  ms: number,
  allowedUnits?: DurationUnit[]
): Map<DurationUnit, number> {
  const parts = new Map<DurationUnit, number>();
  let remaining = Math.abs(ms);

  const unitsToUse = allowedUnits || Object.keys(UNIT_DIVISORS) as DurationUnit[];

  for (const unit of unitsToUse) {
    const divisor = UNIT_DIVISORS[unit];
    const value = Math.floor(remaining / divisor);
    
    if (value > 0) {
      parts.set(unit, value);
      remaining -= value * divisor;
    }
  }

  return parts;
}

function formatDurationParts(
  parts: Map<DurationUnit, number>,
  format: DurationFormat,
  maxUnits: number,
  minUnits: DurationUnit[],
  locale?: string
): string {
  const entries = Array.from(parts.entries()).slice(0, maxUnits);
  
  // Ensure minimum units
  for (const unit of minUnits) {
    if (!parts.has(unit)) {
      entries.push([unit, 0]);
    }
  }

  const formatted = entries.map(([unit, value]) => {
    switch (format) {
      case 'narrow':
        return `${value}${getUnitAbbreviation(unit, 'narrow')}`;
      case 'short':
        return `${value}${getUnitAbbreviation(unit, 'short')}`;
      case 'long':
        return formatLongUnit(value, unit, locale);
      default:
        return `${value}${getUnitAbbreviation(unit, 'short')}`;
    }
  });

  return format === 'long' 
    ? formatted.join(', ') 
    : formatted.join(' ');
}

function formatColonDuration(ms: number, padStart: boolean): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  const pad = (n: number) => padStart ? String(n).padStart(2, '0') : String(n);

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function getUnitAbbreviation(unit: DurationUnit, style: 'narrow' | 'short'): string {
  const abbreviations: Record<DurationUnit, { narrow: string; short: string }> = {
    years: { narrow: 'y', short: 'y' },
    months: { narrow: 'mo', short: 'mo' },
    weeks: { narrow: 'w', short: 'w' },
    days: { narrow: 'd', short: 'd' },
    hours: { narrow: 'h', short: 'h' },
    minutes: { narrow: 'm', short: 'm' },
    seconds: { narrow: 's', short: 's' },
    milliseconds: { narrow: 'ms', short: 'ms' }
  };

  return abbreviations[unit][style];
}

function formatLongUnit(value: number, unit: DurationUnit, locale?: string): string {
  // Use Intl.ListFormat or simple pluralization
  const unitName = value === 1 ? unit.slice(0, -1) : unit;
  return `${value} ${unitName}`;
}
```

#### 6. `timeAgo` Implementation

```typescript
// src/filters/date-time/timeAgo.ts
import { parseDate, DateInput } from './utils/dateParser';
import { formatDate } from './formatDate';

export interface TimeAgoOptions {
  format?: 'narrow' | 'short' | 'long';
  threshold?: number; // days
  fallbackFormat?: string;
  justNowThreshold?: number; // seconds
  referenceDate?: DateInput;
  locale?: string;
}

export function timeAgo(
  date: DateInput,
  options: TimeAgoOptions = {}
): string {
  const {
    format = 'long',
    threshold = Infinity,
    fallbackFormat = 'PPP',
    justNowThreshold = 10,
    referenceDate = new Date(),
    locale
  } = options;

  const targetDate = parseDate(date);
  const refDate = parseDate(referenceDate);

  if (!targetDate || !refDate) {
    return 'Invalid date';
  }

  const diffInSeconds = (refDate.getTime() - targetDate.getTime()) / 1000;
  const diffInDays = diffInSeconds / 86400;

  // Check threshold for fallback
  if (diffInDays > threshold) {
    return formatDate(targetDate, fallbackFormat, locale);
  }

  // Just now
  if (diffInSeconds < justNowThreshold) {
    return 'just now';
  }

  // Calculate time units
  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;

  let value: number;
  let unit: Intl.RelativeTimeFormatUnit;

  if (diffInSeconds < minute) {
    value = Math.floor(diffInSeconds);
    unit = 'second';
  } else if (diffInSeconds < hour) {
    value = Math.floor(diffInSeconds / minute);
    unit = 'minute';
  } else if (diffInSeconds < day) {
    value = Math.floor(diffInSeconds / hour);
    unit = 'hour';
  } else if (diffInSeconds < week) {
    value = Math.floor(diffInSeconds / day);
    unit = 'day';
  } else if (diffInSeconds < month) {
    value = Math.floor(diffInSeconds / week);
    unit = 'week';
  } else if (diffInSeconds < year) {
    value = Math.floor(diffInSeconds / month);
    unit = 'month';
  } else {
    value = Math.floor(diffInSeconds / year);
    unit = 'year';
  }

  // Format based on style
  if (format === 'narrow') {
    return formatNarrow(value, unit);
  } else if (format === 'short') {
    return formatShort(value, unit);
  } else {
    return formatLong(value, unit, locale);
  }
}

function formatNarrow(value: number, unit: Intl.RelativeTimeFormatUnit): string {
  const abbrev: Record<string, string> = {
    second: 's', minute: 'm', hour: 'h',
    day: 'd', week: 'w', month: 'mo', year: 'y'
  };
  return `${value}${abbrev[unit]}`;
}

function formatShort(value: number, unit: Intl.RelativeTimeFormatUnit): string {
  const abbrev: Record<string, string> = {
    second: 's', minute: 'm', hour: 'h',
    day: 'd', week: 'w', month: 'mo', year: 'y'
  };
  return `${value}${abbrev[unit]} ago`;
}

function formatLong(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  locale?: string
): string {
  const rtf = new Intl.RelativeTimeFormat(locale || 'en-US', {
    style: 'long',
    numeric: 'always'
  });
  return rtf.format(-value, unit);
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// src/filters/date-time/__tests__/relativeDate.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { relativeDate } from '../relativeDate';

describe('relativeDate', () => {
  let mockNow: Date;

  beforeEach(() => {
    mockNow = new Date('2025-12-20T12:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should format future dates', () => {
    const future = new Date('2025-12-23T12:00:00Z');
    expect(relativeDate(future)).toBe('in 3 days');
  });

  it('should format past dates', () => {
    const past = new Date('2025-12-19T12:00:00Z');
    expect(relativeDate(past)).toBe('yesterday');
  });

  it('should respect style option', () => {
    const future = new Date('2025-12-23T12:00:00Z');
    expect(relativeDate(future, { style: 'short' })).toBe('in 3 days');
    expect(relativeDate(future, { style: 'narrow' })).toBe('in 3d');
  });

  it('should handle numeric option', () => {
    const yesterday = new Date('2025-12-19T12:00:00Z');
    expect(relativeDate(yesterday, { numeric: 'auto' })).toBe('yesterday');
    expect(relativeDate(yesterday, { numeric: 'always' })).toBe('1 day ago');
  });

  it('should support different locales', () => {
    const future = new Date('2025-12-23T12:00:00Z');
    expect(relativeDate(future, { locale: 'es-ES' })).toBe('dentro de 3 días');
  });

  it('should handle invalid dates', () => {
    expect(relativeDate('invalid')).toBe('Invalid date');
    expect(relativeDate(null as any)).toBe('Invalid date');
  });
});
```

```typescript
// src/filters/date-time/__tests__/formatDate.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate } from '../formatDate';

describe('formatDate', () => {
  const testDate = new Date('2025-12-20T15:30:00Z');

  it('should format with custom pattern', () => {
    expect(formatDate(testDate, 'yyyy-MM-dd')).toBe('2025-12-20');
    expect(formatDate(testDate, 'MMMM d, yyyy')).toBe('December 20, 2025');
  });

  it('should support preset formats', () => {
    expect(formatDate(testDate, 'short')).toMatch(/\d{1,2}\/\d{1,2}\/\d{2,4}/);
    expect(formatDate(testDate, 'medium')).toContain('Dec');
    expect(formatDate(testDate, 'long')).toContain('December');
  });

  it('should handle time formatting', () => {
    expect(formatDate(testDate, 'HH:mm:ss')).toBe('15:30:00');
    expect(formatDate(testDate, 'h:mm a')).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
  });

  it('should handle invalid dates', () => {
    expect(formatDate('invalid')).toBe('Invalid date');
  });
});
```

```typescript
// src/filters/date-time/__tests__/timezone.test.ts
import { describe, it, expect } from 'vitest';
import { timezone } from '../timezone';

describe('timezone', () => {
  const testDate = new Date('2025-12-20T15:30:00Z');

  it('should convert to different timezones', () => {
    const result = timezone(testDate, 'America/New_York');
    expect(result).toContain('10:30'); // UTC-5
  });

  it('should show timezone abbreviation', () => {
    const result = timezone(testDate, 'America/New_York', {
      showTimezone: true
    });
    expect(result).toMatch(/EST|EDT/);
  });

  it('should return Date object when requested', () => {
    const result = timezone(testDate, 'Asia/Tokyo', {
      returnDate: true
    });
    expect(result).toBeInstanceOf(Date);
  });

  it('should handle invalid timezone', () => {
    const result = timezone(testDate, 'Invalid/Timezone');
    expect(result).toBe('Invalid timezone');
  });
});
```

```typescript
// src/filters/date-time/__tests__/duration.test.ts
import { describe, it, expect } from 'vitest';
import { duration } from '../duration';

describe('duration', () => {
  it('should format milliseconds', () => {
    expect(duration(5400000)).toBe('1h 30m');
    expect(duration(90000)).toBe('1m 30s');
  });

  it('should format seconds when specified', () => {
    expect(duration(3665, { inputUnit: 'seconds' })).toBe('1h 1m 5s');
  });

  it('should support different formats', () => {
    const ms = 5400000;
    expect(duration(ms, { format: 'short' })).toBe('1h 30m');
    expect(duration(ms, { format: 'narrow' })).toBe('1h30m');
    expect(duration(ms, { format: 'long' })).toContain('hour');
    expect(duration(ms, { format: 'colon' })).toBe('1:30:00');
  });

  it('should respect maxUnits', () => {
    const ms = 90061000; // 1 day, 1 hour, 1 minute, 1 second
    expect(duration(ms, { maxUnits: 2 })).toBe('1d 1h');
  });

  it('should pad colon format', () => {
    expect(duration(185000, { format: 'colon', padStart: true }))
      .toBe('00:03:05');
  });
});
```

```typescript
// src/filters/date-time/__tests__/timeAgo.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { timeAgo } from '../timeAgo';

describe('timeAgo', () => {
  let mockNow: Date;

  beforeEach(() => {
    mockNow = new Date('2025-12-20T12:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should display just now for recent timestamps', () => {
    const recent = new Date('2025-12-20T11:59:55Z');
    expect(timeAgo(recent)).toBe('just now');
  });

  it('should format different time ranges', () => {
    expect(timeAgo(new Date('2025-12-20T11:45:00Z'))).toBe('15 minutes ago');
    expect(timeAgo(new Date('2025-12-20T10:00:00Z'))).toBe('2 hours ago');
    expect(timeAgo(new Date('2025-12-19T12:00:00Z'))).toBe('1 day ago');
  });

  it('should support different formats', () => {
    const past = new Date('2025-12-20T11:45:00Z');
    expect(timeAgo(past, { format: 'short' })).toBe('15m ago');
    expect(timeAgo(past, { format: 'narrow' })).toBe('15m');
    expect(timeAgo(past, { format: 'long' })).toBe('15 minutes ago');
  });

  it('should fallback to date after threshold', () => {
    const old = new Date('2024-01-01T12:00:00Z');
    const result = timeAgo(old, {
      threshold: 30,
      fallbackFormat: 'MMM d, yyyy'
    });
    expect(result).toBe('Jan 1, 2024');
  });

  it('should support custom reference date', () => {
    const result = timeAgo(
      new Date('2025-12-20T10:00:00Z'),
      { referenceDate: new Date('2025-12-20T12:00:00Z') }
    );
    expect(result).toBe('2 hours ago');
  });
});
```

### Integration Tests

```typescript
// Integration test example
describe('Date filters integration', () => {
  it('should chain multiple filters', () => {
    const date = new Date('2025-12-20T15:30:00Z');
    
    // Convert timezone then format
    const converted = timezone(date, 'America/New_York', {
      returnDate: true
    }) as Date;
    const formatted = formatDate(converted, 'full');
    
    expect(formatted).toContain('December');
  });

  it('should work with template syntax', () => {
    // Test template integration when applicable
  });
});
```

### Browser Compatibility Tests

- Test in Chrome, Firefox, Safari, Edge
- Test `Intl` API fallbacks
- Test timezone handling across browsers
- Test locale loading

### Performance Benchmarks

```typescript
describe('Performance benchmarks', () => {
  it('should format 1000 dates in under 100ms', () => {
    const dates = Array.from({ length: 1000 }, (_, i) => 
      new Date(Date.now() - i * 60000)
    );

    const start = performance.now();
    dates.forEach(date => formatDate(date, 'medium'));
    const end = performance.now();

    expect(end - start).toBeLessThan(100);
  });
});
```

---

## Backwards Compatibility

### Breaking Changes

This is a new feature addition, so there are no breaking changes to existing functionality.

### Migration from Other Libraries

For users migrating from moment.js or date-fns:

```typescript
// moment.js → formatr
// Before:
moment(date).fromNow()
// After:
timeAgo(date)

// Before:
moment(date).format('YYYY-MM-DD')
// After:
formatDate(date, 'yyyy-MM-dd')

// Before:
moment(date).tz('America/New_York').format('LLLL')
// After:
timezone(date, 'America/New_York', { format: 'full' })
```

### Deprecation Strategy

N/A - New feature

---

## Potential Pitfalls

### 1. Timezone Complexity

**Issue**: Timezone handling is notoriously complex with DST, historical changes, and edge cases.

**Mitigation**:
- Use established libraries (date-fns-tz) for timezone conversions
- Comprehensive testing across different timezones
- Document known limitations
- Provide clear error messages for invalid timezones

### 2. Locale Data Size

**Issue**: Supporting all locales can significantly increase bundle size.

**Mitigation**:
- Lazy-load locale data
- Support tree-shaking
- Provide locale subset packages
- Use browser's native `Intl` API when possible

### 3. Performance with Large Lists

**Issue**: Formatting many dates in a list can cause performance issues.

**Mitigation**:
- Implement efficient caching
- Consider memoization for frequently used formats
- Provide virtual scrolling examples
- Document performance best practices

### 4. Relative Time Accuracy

**Issue**: "5 minutes ago" becomes stale quickly in SPAs.

**Mitigation**:
- Document need for reactive updates
- Provide examples with setInterval/requestAnimationFrame
- Consider auto-update option for framework integrations
- Document performance implications of auto-updates

### 5. Browser Compatibility

**Issue**: Older browsers may lack full `Intl` API support.

**Mitigation**:
- Polyfill detection and loading
- Graceful degradation
- Clear browser support documentation
- Test matrix for older browsers

### 6. Ambiguous Dates

**Issue**: Date strings can be parsed differently across environments.

**Mitigation**:
- Prefer ISO 8601 format
- Document accepted input formats
- Provide validation utilities
- Clear error messages for invalid inputs

---

## Future Extensions

### 1. Auto-Updating Time Display

```typescript
// Future API idea
import { createAutoUpdatingTimeAgo } from '@formatr/filters';

const { value, cleanup } = createAutoUpdatingTimeAgo(date, {
  updateInterval: 60000, // Update every minute
  onUpdate: (newValue) => {
    element.textContent = newValue;
  }
});

// Cleanup when component unmounts
cleanup();
```

### 2. Calendar Operations

```typescript
// Add calendar-aware filtering
import { calendarDate } from '@formatr/filters';

calendarDate(date, 'add', { days: 5 });
calendarDate(date, 'subtract', { weeks: 2 });
calendarDate(date, 'startOf', 'month');
calendarDate(date, 'endOf', 'week');
```

### 3. Business Day Calculations

```typescript
import { businessDays } from '@formatr/filters';

// Calculate business days between dates
businessDays.between(startDate, endDate, { 
  excludeWeekends: true,
  holidays: nationalHolidays 
});

// Add business days
businessDays.add(date, 5);
```

### 4. Custom Format Presets

```typescript
// Allow users to register custom presets
import { registerDateFormat } from '@formatr/filters';

registerDateFormat('myApp', {
  timestamp: 'MMM d, yyyy [at] h:mm a',
  date: 'EEEE, MMMM d',
  time: 'h:mm a zzz'
});

// Use custom preset
formatDate(date, 'myApp:timestamp');
```

### 5. Recurrence Rules

```typescript
// Support recurring dates
import { recurrence } from '@formatr/filters';

recurrence.next(baseDate, 'weekly', { 
  interval: 2,  // Every 2 weeks
  until: endDate 
});

recurrence.matches(date, 'monthly', {
  dayOfMonth: 15
});
```

### 6. Fiscal Year Support

```typescript
import { fiscalYear } from '@formatr/filters';

fiscalYear.format(date, {
  yearStart: { month: 4, day: 1 } // April 1
});
// Output: "FY2025 Q3"

fiscalYear.quarter(date, { yearStart: { month: 4, day: 1 } });
// Output: 3
```

### 7. Islamic/Hebrew Calendar Support

```typescript
import { calendar } from '@formatr/filters';

calendar.format(date, 'islamic');
// Output: "15 Jumada II 1447 AH"

calendar.format(date, 'hebrew');
// Output: "19 Kislev 5786"
```

### 8. Natural Language Parsing

```typescript
import { parseNatural } from '@formatr/filters';

parseNatural('next Friday at 3pm');
parseNatural('in 2 weeks');
parseNatural('last day of this month');
// Returns Date objects
```

### 9. Framework-Specific Integrations

```typescript
// React hook
import { useLiveTimeAgo } from '@formatr/react';

function PostTimestamp({ date }) {
  const timeAgo = useLiveTimeAgo(date);
  return <span>{timeAgo}</span>;
}

// Vue composable
import { useRelativeTime } from '@formatr/vue';

const relativeTime = useRelativeTime(date, { updateInterval: 60000 });
```

### 10. Advanced Formatting Options

```typescript
// Conditional formatting
formatDate(date, {
  pattern: 'PPP',
  conditions: [
    { if: 'isToday', then: "'Today at' p" },
    { if: 'isYesterday', then: "'Yesterday at' p" },
    { if: 'isThisWeek', then: 'EEEE p' },
    { else: 'PPP' }
  ]
});
```

---

## Open Questions

1. **Dependency Choice**: Should we use date-fns, or implement native solutions using `Intl` API exclusively?
2. **Bundle Strategy**: Single package vs. separate packages for each filter?
3. **Locale Loading**: How to handle locale data without bloating bundle size?
4. **Auto-Update**: Should auto-updating time displays be part of core or separate package?
5. **Calendar Systems**: Priority for supporting non-Gregorian calendars?
6. **Testing Infrastructure**: Need for timezone-mocked test environments?

---

## References

- [MDN Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [MDN Intl.RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat)
- [date-fns Documentation](https://date-fns.org/)
- [IANA Time Zone Database](https://www.iana.org/time-zones)
- [Unicode CLDR](http://cldr.unicode.org/)
- [ISO 8601 Standard](https://www.iso.org/iso-8601-date-and-time-format.html)

---

## Conclusion

This RFC proposes a comprehensive suite of date and time formatting filters that will significantly enhance the `formatr` library's capabilities. The implementation focuses on developer experience, internationalization, and performance while maintaining flexibility for various use cases.

The proposed filters cover the most common date/time formatting scenarios encountered in modern web applications, from social media timestamps to e-commerce delivery dates to project management deadlines.

**Next Steps**:
1. Gather feedback on API design
2. Finalize dependency choices
3. Create detailed implementation tickets
4. Begin development with `formatDate` and `timeAgo` as priority filters
5. Iterate based on community feedback

---

**Ready for Implementation**: ⏳ Pending Review