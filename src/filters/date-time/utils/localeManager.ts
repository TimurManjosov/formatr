/**
 * Gets the locale to use for formatting, with fallback to system locale.
 * 
 * If a locale is provided, it is used directly. Otherwise, falls back to
 * a safe default of 'en-US' for consistent behavior across environments.
 * 
 * @param locale - Optional locale string (e.g., 'en-US', 'de-DE')
 * @returns The locale string to use for formatting
 * 
 * @example
 * ```typescript
 * getLocale('fr-FR') // => 'fr-FR'
 * getLocale() // => 'en-US' (safe default)
 * ```
 */
export function getLocale(locale?: string): string {
  if (locale) {
    return locale;
  }

  // Always return a safe default
  // Don't rely on navigator.language as it's not available in all environments
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
