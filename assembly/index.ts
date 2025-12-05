/**
 * WebAssembly backend for formatr
 * 
 * This module provides performance-critical functions implemented in AssemblyScript
 * for near-native execution speed.
 */

/**
 * Simple string transformation: convert to uppercase
 * Uses the built-in toUpperCase method for proper Unicode handling
 * @param str - Input string
 * @returns Uppercase version of the string
 */
export function toUpperCase(str: string): string {
  return str.toUpperCase();
}

/**
 * Simple string transformation: convert to lowercase
 * Uses the built-in toLowerCase method for proper Unicode handling
 * @param str - Input string
 * @returns Lowercase version of the string
 */
export function toLowerCase(str: string): string {
  return str.toLowerCase();
}

/**
 * Trim whitespace from both ends of a string
 * Uses the built-in trim method
 * @param str - Input string
 * @returns Trimmed string
 */
export function trim(str: string): string {
  return str.trim();
}
