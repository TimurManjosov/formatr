// Re-export filter types for external use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Filter, AsyncFilter, SyncOrAsyncFilter } from './text';
import { lower, pad, plural, replace, slice, trim, truncate, upper } from './text';
export { makeIntlFilters } from './intl';
export type { Filter, AsyncFilter, SyncOrAsyncFilter } from './text';

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
