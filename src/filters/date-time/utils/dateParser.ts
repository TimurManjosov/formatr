/**
 * Type representing valid date inputs: Date object, timestamp (number), or ISO string
 */
export type DateInput = Date | number | string;

/**
 * Parses various date input types into a Date object.
 * 
 * Accepts Date objects, numeric timestamps (milliseconds since epoch),
 * or date strings (ISO format recommended for consistency).
 * 
 * @param input - Date object, timestamp, or date string
 * @returns A valid Date object, or null if the input is invalid
 * 
 * @example
 * ```typescript
 * parseDate(new Date('2025-12-20')) // => Date object
 * parseDate(1703030400000) // => Date object
 * parseDate('2025-12-20T12:00:00Z') // => Date object
 * parseDate('invalid') // => null
 * parseDate(null) // => null
 * ```
 */
export function parseDate(input: DateInput): Date | null {
  if (input == null) {
    return null;
  }

  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }

  if (typeof input === 'number') {
    const date = new Date(input);
    return isNaN(date.getTime()) ? null : date;
  }

  if (typeof input === 'string') {
    const parsed = new Date(input);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

/**
 * Type guard to check if a value is a valid Date object.
 * 
 * @param date - Any value to check
 * @returns True if the value is a Date object with a valid time value
 * 
 * @example
 * ```typescript
 * isValidDate(new Date('2025-12-20')) // => true
 * isValidDate(new Date('invalid')) // => false
 * isValidDate('2025-12-20') // => false (not a Date object)
 * ```
 */
export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}
