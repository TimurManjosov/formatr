/**
 * Gets the locale to use for formatting, with fallback to system locale.
 * 
 * If a locale is provided, it is used directly. Otherwise, falls back to
 * the system locale (via navigator.language in browsers) or 'en-US' as
 * a final fallback for Node.js environments.
 * 
 * @param locale - Optional locale string (e.g., 'en-US', 'de-DE')
 * @returns The locale string to use for formatting
 * 
 * @example
 * ```typescript
 * getLocale('fr-FR') // => 'fr-FR'
 * getLocale() // => system locale or 'en-US'
 * ```
 */
export function getLocale(locale?: string): string {
  if (locale) {
    return locale;
  }

  // In browsers, use navigator.language
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language;
  }

  // Fallback for Node.js or other environments
  return 'en-US';
}

/**
 * Checks if a locale is supported by the Intl API.
 * 
 * Attempts to create an Intl.DateTimeFormat with the locale
 * to verify support. This is a lightweight check.
 * 
 * @param locale - Locale string to check
 * @returns True if the locale is supported
 * 
 * @example
 * ```typescript
 * isLocaleSupported('en-US') // => true
 * isLocaleSupported('xx-XX') // => false (invalid locale)
 * ```
 */
export function isLocaleSupported(locale: string): boolean {
  try {
    new Intl.DateTimeFormat(locale);
    return true;
  } catch {
    return false;
  }
}
