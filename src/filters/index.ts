import type { Filter } from './text';
import { lower, plural, trim, upper } from './text';

export type { Filter } from './text';

export const builtinFilters: Record<string, Filter> = {
  upper,
  lower,
  trim,
  plural,
};
