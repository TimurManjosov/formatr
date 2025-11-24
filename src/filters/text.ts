export type Filter = (value: unknown, ...args: string[]) => unknown;

// Text Helpers
export const upper: Filter = (v) => String(v).toUpperCase();
export const lower: Filter = (v) => String(v).toLowerCase();
export const trim: Filter = (v) => String(v).trim();

// Simple plural: plural(count, singular, plural)
export const plural: Filter = (v, singular?: string, plural?: string) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  if (singular == null || plural == null) {
    throw new Error('plural filter requires two args: singular, plural');
  }
  return n === 1 ? singular : plural;
};

// slice: Extract substring from string
export const slice: Filter = (v, start?: string, end?: string) => {
  const str = String(v);
  const startIdx = start != null ? parseInt(start, 10) : 0;
  const endIdx = end != null ? parseInt(end, 10) : undefined;
  return str.slice(startIdx, endIdx);
};

// pad: Pad string to specified length
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

// truncate: Shorten string to maximum length
export const truncate: Filter = (v, length?: string, ellipsis = '...') => {
  const str = String(v);
  const maxLen = length != null ? parseInt(length, 10) : str.length;
  if (isNaN(maxLen) || str.length <= maxLen) return str;
  const truncatedLength = Math.max(0, maxLen - ellipsis.length);
  return str.slice(0, truncatedLength) + ellipsis;
};

// replace: Replace all occurrences of substring
export const replace: Filter = (v, from?: string, to = '') => {
  const str = String(v);
  if (from == null || from === '') return str;
  return str.split(from).join(to);
};
