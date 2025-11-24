export type Filter = (value: unknown, ...args: string[]) => unknown;

// Text Helpers

/**
 * Converts the input value to uppercase.
 * 
 * The value is coerced to a string using `String(value)` before transformation.
 * This ensures consistent behavior with all input types including null, undefined,
 * numbers, objects, and arrays.
 * 
 * @param v - Any value (will be coerced to string)
 * @returns Uppercase string representation of the input
 * 
 * @example
 * ```typescript
 * upper('hello') // => 'HELLO'
 * upper(42) // => '42'
 * upper([1,2,3]) // => '1,2,3'
 * ```
 */
export const upper: Filter = (v) => String(v).toUpperCase();

/**
 * Converts the input value to lowercase.
 * 
 * The value is coerced to a string using `String(value)` before transformation.
 * This ensures consistent behavior with all input types including null, undefined,
 * numbers, objects, and arrays.
 * 
 * @param v - Any value (will be coerced to string)
 * @returns Lowercase string representation of the input
 * 
 * @example
 * ```typescript
 * lower('HELLO') // => 'hello'
 * lower(42) // => '42'
 * lower({ obj: true }) // => '[object object]'
 * ```
 */
export const lower: Filter = (v) => String(v).toLowerCase();

/**
 * Trims leading and trailing whitespace from the input value.
 * 
 * The value is coerced to a string using `String(value)` before trimming.
 * This ensures consistent behavior with all input types.
 * 
 * @param v - Any value (will be coerced to string)
 * @returns Trimmed string representation of the input
 * 
 * @example
 * ```typescript
 * trim('  hello  ') // => 'hello'
 * trim(42) // => '42'
 * ```
 */
export const trim: Filter = (v) => String(v).trim();

/**
 * Returns the singular or plural form of a word based on a numeric count.
 * 
 * This filter requires exactly 2 arguments: the singular form and the plural form.
 * If the input is not a finite number, it returns the string representation of the input.
 * The singular form is returned when the count equals 1, otherwise the plural form is returned.
 * 
 * @param v - The count value (should be a number)
 * @param singular - The singular form of the word
 * @param plural - The plural form of the word
 * @returns The appropriate form (singular or plural) based on the count
 * @throws {Error} If singular or plural arguments are not provided
 * 
 * @example
 * ```typescript
 * plural(1, 'apple', 'apples') // => 'apple'
 * plural(2, 'apple', 'apples') // => 'apples'
 * plural(0, 'item', 'items') // => 'items'
 * plural(NaN, 'item', 'items') // => 'NaN' (fallback to string)
 * plural(1, 'goose', 'geese') // => 'goose'
 * ```
 */
export const plural: Filter = (v, singular?: string, plural?: string) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  if (singular == null || plural == null) {
    throw new Error('plural filter requires two args: singular, plural');
  }
  return n === 1 ? singular : plural;
};

/**
 * Extracts a substring from the input value using slice semantics.
 * 
 * The value is coerced to a string before slicing. This filter accepts 1 or 2 arguments:
 * - start: The starting index (inclusive)
 * - end: The ending index (exclusive, optional)
 * 
 * Negative indices count from the end of the string. If end is omitted, slicing continues
 * to the end of the string.
 * 
 * @param v - Any value (will be coerced to string)
 * @param start - Starting index (default: 0)
 * @param end - Ending index (optional, default: end of string)
 * @returns The extracted substring
 * 
 * @example
 * ```typescript
 * slice('hello world', '0', '5') // => 'hello'
 * slice('hello world', '6') // => 'world'
 * slice('hello world', '-5') // => 'world'
 * slice(12345, '0', '3') // => '123'
 * ```
 */
export const slice: Filter = (v, start?: string, end?: string) => {
  const str = String(v);
  const startIdx = start != null ? parseInt(start, 10) : 0;
  const endIdx = end != null ? parseInt(end, 10) : undefined;
  return str.slice(startIdx, endIdx);
};

/**
 * Pads the input value to a specified length with a padding character.
 * 
 * The value is coerced to a string before padding. This filter accepts 1 to 3 arguments:
 * - length: The target length for the padded string (required)
 * - direction: 'left', 'right', 'both', or 'center' (default: 'right')
 * - char: The padding character (default: ' ')
 * 
 * If the string is already at or exceeds the target length, it is returned unchanged.
 * Only the first character of the char argument is used for padding.
 * 
 * @param v - Any value (will be coerced to string)
 * @param length - Target length for the padded string
 * @param direction - Padding direction: 'left', 'right', 'both', or 'center' (default: 'right')
 * @param char - Padding character (default: ' ')
 * @returns The padded string
 * 
 * @example
 * ```typescript
 * pad('hello', '10') // => 'hello     '
 * pad('hello', '10', 'left') // => '     hello'
 * pad('hello', '10', 'both') // => '  hello   '
 * pad('42', '5', 'left', '0') // => '00042'
 * ```
 */
export const pad: Filter = (v, length?: string, direction = 'right', char = ' ') => {
  const str = String(v);
  const len = length != null ? parseInt(length, 10) : 0;
  if (isNaN(len) || str.length >= len) return str;
  const padChar = char.charAt(0) || ' ';
  const padSize = len - str.length;

  if (direction === 'left') {
    return padChar.repeat(padSize) + str;
  } else if (direction === 'both' || direction === 'center') {
    const leftPad = Math.floor(padSize / 2);
    const rightPad = padSize - leftPad;
    return padChar.repeat(leftPad) + str + padChar.repeat(rightPad);
  } else {
    // default: right
    return str + padChar.repeat(padSize);
  }
};

/**
 * Truncates the input value to a maximum length, adding an ellipsis if truncated.
 * 
 * The value is coerced to a string before truncation. This filter accepts 1 or 2 arguments:
 * - length: The maximum length of the resulting string (required)
 * - ellipsis: The ellipsis string to append (default: '...')
 * 
 * The ellipsis length is included in the maximum length calculation.
 * If the string is already at or below the maximum length, it is returned unchanged.
 * 
 * @param v - Any value (will be coerced to string)
 * @param length - Maximum length of the resulting string
 * @param ellipsis - Ellipsis string to append when truncating (default: '...')
 * @returns The truncated string with ellipsis if applicable
 * 
 * @example
 * ```typescript
 * truncate('hello world', '10') // => 'hello w...'
 * truncate('hello world', '10', '…') // => 'hello wor…'
 * truncate('hello', '10') // => 'hello'
 * truncate('This is long', '8', '') // => 'This is '
 * ```
 */
export const truncate: Filter = (v, length?: string, ellipsis = '...') => {
  const str = String(v);
  const maxLen = length != null ? parseInt(length, 10) : str.length;
  if (isNaN(maxLen) || str.length <= maxLen) return str;
  const truncatedLength = Math.max(0, maxLen - ellipsis.length);
  return str.slice(0, truncatedLength) + ellipsis;
};

/**
 * Replaces all occurrences of a substring with another string.
 * 
 * The value is coerced to a string before replacement. This filter requires exactly 2 arguments:
 * - from: The substring to search for
 * - to: The replacement string (default: '')
 * 
 * If the from argument is empty or null, the string is returned unchanged.
 * This performs a global replacement (all occurrences are replaced).
 * 
 * @param v - Any value (will be coerced to string)
 * @param from - The substring to search for
 * @param to - The replacement string (default: '')
 * @returns The string with all occurrences replaced
 * 
 * @example
 * ```typescript
 * replace('hello world', 'o', 'a') // => 'hella warld'
 * replace('hello', 'l', '') // => 'heo'
 * replace('user@example.com', '@', ' at ') // => 'user at example.com'
 * replace('hello_world', '_', '-') // => 'hello-world'
 * ```
 */
export const replace: Filter = (v, from?: string, to = '') => {
  const str = String(v);
  if (from == null || from === '') return str;
  return str.split(from).join(to);
};
