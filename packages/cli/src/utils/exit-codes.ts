/**
 * Exit code constants
 */
export const EXIT_CODES = {
  SUCCESS: 0,
  FAILURE: 1,
  INVALID_USAGE: 2,
} as const;

export type ExitCode = (typeof EXIT_CODES)[keyof typeof EXIT_CODES];
