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
