import type { Filter } from './text';

const toNumber = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export function makeIntlFilters(locale?: string): Record<string, Filter> {
  const number: Filter = (v, rangeOrMinFrac?: string, maxFrac?: string) => {
    const n = toNumber(v);
    if (n === null) return String(v);

    let min: number | undefined;
    let max: number | undefined;

    if (rangeOrMinFrac != null) {
      const s = String(rangeOrMinFrac);
      if (s.includes('-')) {
        const [a, b] = s.split('-');
        min = Number(a);
        max = Number(b);
      } else {
        min = Number(s);
        max = maxFrac != null ? Number(maxFrac) : min;
      }
    }

    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: min,
      maximumFractionDigits: max,
    }).format(n);
  };

  const percent: Filter = (v, frac?: string) => {
    const n = toNumber(v);
    if (n === null) return String(v);
    const digits = frac != null ? Number(frac) : 0;
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(n);
  };

  const currency: Filter = (v, code?: string, frac?: string) => {
    const n = toNumber(v);
    if (n === null) return String(v);
    if (!code) throw new Error(`currency filter requires code, e.g., currency:EUR`);

    // support combined "CODE:digits" syntax (some template parsers supply "EUR:2" as a single arg)
    let currencyCode = String(code).trim();
    let fraction = frac;
    if (currencyCode.includes(':')) {
      const [c, f] = currencyCode.split(':');
      currencyCode = (c ?? '').trim();
      // only adopt f if fraction not already provided; treat empty string as "not provided"
      if (f !== undefined && (fraction == null || fraction === '')) fraction = f;
    }

    // normalize
    currencyCode = currencyCode.toUpperCase();

    // validate / attempt to recover a 3-letter code
    if (!/^[A-Z]{3}$/.test(currencyCode)) {
      const letters = currencyCode.match(/[A-Z]{3,}/);
      if (letters && letters[0].length >= 3) {
        currencyCode = letters[0].slice(0, 3);
      } else {
        throw new Error(`currency filter received invalid currency code: ${String(code)}`);
      }
    }

    // parse fraction only if present and finite
    let digits: number | undefined = undefined;
    if (fraction != null && fraction !== '') {
      const d = Number(fraction);
      if (Number.isFinite(d)) digits = d;
    }

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        ...(digits != null ? { minimumFractionDigits: digits, maximumFractionDigits: digits } : {}),
      }).format(n);
    } catch {
      // fallback instead of letting Intl throw (keeps templating robust in edge cases)
      return String(v);
    }
  };

  const date: Filter = (v, style?: string) => {
    const d = v instanceof Date ? v : typeof v === 'number' ? new Date(v) : new Date(String(v));
    if (Number.isNaN(d.getTime())) return String(v);

    const map: Record<string, Intl.DateTimeFormatOptions> = {
      short: { dateStyle: 'short' },
      medium: { dateStyle: 'medium' },
      long: { dateStyle: 'long' },
      full: { dateStyle: 'full' },
    };
    const opts = map[style ?? 'medium'] ?? map.medium;
    return new Intl.DateTimeFormat(locale, opts).format(d);
  };

  return { number, percent, currency, date };
}
