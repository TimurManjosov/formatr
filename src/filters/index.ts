import type { Filter } from './text';
import { lower, pad, plural, replace, slice, trim, truncate, upper } from './text';
export { makeIntlFilters } from './intl';
export type { Filter } from './text';

export const builtinFilters: Record<string, Filter> = {
  upper,
  lower,
  trim,
  plural,
  slice,
  pad,
  truncate,
  replace,
};
