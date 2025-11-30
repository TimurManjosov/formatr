import type { Filter } from '../filters';
import { builtinFilters, makeIntlFilters } from '../filters';
import type { Node, TemplateAST } from './ast';
import { FormatrError } from './errors';
import { parseTemplate } from './parser';
import { getTemplate } from './registry';

export type Ctx = Record<string, unknown>;
export type MissingHandler = 'error' | 'keep' | ((key: string) => string);

export interface CompileOptions {
  onMissing?: MissingHandler;
  filters?: Record<string, Filter>;
  locale?: string;
  // new:
  cacheSize?: number; // default 200 (0 disables)
  strictKeys?: boolean; // enforce key presence at render time
}

type ResolvedFilter = { fn: Filter; args: string[] };
type Part =
  | { type: 'text'; value: string }
  | { type: 'ph'; path: string[]; keyStr: string; filters?: ResolvedFilter[] };

// Safe traversal with early exit
function getPathValue(obj: unknown, path: string[]): { found: boolean; value?: unknown } {
  let cur: any = obj;
  for (const seg of path) {
    if (cur == null || (typeof cur !== 'object' && typeof cur !== 'function')) {
      return { found: false };
    }
    cur = cur[seg];
  }
  return cur === undefined ? { found: false } : { found: true, value: cur };
}

/**
 * Merges consecutive text nodes in the parts array for optimized rendering.
 * This reduces the number of array operations during render time.
 */
function mergeParts(rawParts: Part[]): Part[] {
  const merged: Part[] = [];
  let pendingText = '';

  for (const p of rawParts) {
    if (p.type === 'text') {
      pendingText += p.value;
    } else {
      if (pendingText) {
        merged.push({ type: 'text', value: pendingText });
        pendingText = '';
      }
      merged.push(p);
    }
  }

  if (pendingText) {
    merged.push({ type: 'text', value: pendingText });
  }

  return merged;
}

/**
 * Expands include nodes by replacing them with the nodes from the included template.
 * Uses a Set to track visited templates and prevent infinite recursion.
 */
function expandIncludes(nodes: Node[], visited: Set<string>): Node[] {
  const expanded: Node[] = [];
  
  for (const node of nodes) {
    if (node.kind === 'Include') {
      const templateName = node.name;
      
      // Check for circular includes
      if (visited.has(templateName)) {
        throw new FormatrError(`Circular include detected: "${templateName}"`);
      }
      
      // Get the template source from the registry
      const templateSource = getTemplate(templateName);
      if (templateSource === undefined) {
        throw new FormatrError(`Unknown template "${templateName}"`);
      }
      
      // Parse the included template
      const includedAst = parseTemplate(templateSource);
      
      // Recursively expand includes in the included template
      const newVisited = new Set(visited);
      newVisited.add(templateName);
      const expandedNodes = expandIncludes(includedAst.nodes, newVisited);
      
      // Add all nodes from the included template
      expanded.push(...expandedNodes);
    } else {
      expanded.push(node);
    }
  }
  
  return expanded;
}

export function compile(ast: TemplateAST, options: CompileOptions = {}) {
  const onMissing = options.onMissing ?? 'keep';
  const strictKeys = options.strictKeys ?? false;

  const registry: Record<string, Filter> = {
    ...builtinFilters,
    ...makeIntlFilters(options.locale),
    ...(options.filters ?? {}),
  };

  // Expand includes first (this resolves all {> name} to their actual content)
  const expandedNodes = expandIncludes(ast.nodes, new Set());

  // Pre-resolve filters per placeholder at compile time
  const rawParts: Part[] = expandedNodes.map((n) => {
    if (n.kind === 'Text') return { type: 'text', value: n.value };
    // After expansion, there should be no Include nodes left
    if (n.kind === 'Include') {
      throw new FormatrError(`Unexpected include node after expansion: "${n.name}"`);
    }
    let resolved: ResolvedFilter[] | undefined;
    if (n.filters && n.filters.length) {
      resolved = n.filters.map((f) => {
        const fn = registry[f.name];
        if (!fn) throw new FormatrError(`Unknown filter "${f.name}"`);
        return { fn, args: f.args ?? [] };
      });
    }
    // Pre-compute keyStr at compile time to avoid join() at render time
    const keyStr = n.path.join('.');
    return resolved && resolved.length
      ? { type: 'ph', path: n.path, keyStr, filters: resolved }
      : { type: 'ph', path: n.path, keyStr };
  });

  // Merge consecutive text nodes for faster rendering
  const parts = mergeParts(rawParts);

  // Optimization: if template is all static text, return a constant function
  if (parts.length === 1) {
    const first = parts[0];
    if (first && first.type === 'text') {
      const staticResult = first.value;
      return function render(): string {
        return staticResult;
      };
    }
  }

  // Optimization: if template is empty, return empty string
  if (parts.length === 0) {
    return function render(): string {
      return '';
    };
  }

  return function render<T extends Ctx = Ctx>(ctx: T): string {
    // Use array-based string building for better performance with many fragments
    const fragments: string[] = [];

    for (const p of parts) {
      if (p.type === 'text') {
        fragments.push(p.value);
        continue;
      }

      const { found, value } = getPathValue(ctx, p.path);
      if (!found || value == null) {
        // strictKeys takes precedence over onMissing
        if (strictKeys || onMissing === 'error') throw new FormatrError(`Missing key "${p.keyStr}"`);
        if (onMissing === 'keep') {
          fragments.push(`{${p.keyStr}}`);
          continue;
        }
        fragments.push(onMissing(p.keyStr));
        continue;
      }

      let val: unknown = value;
      if (p.filters && p.filters.length) {
        for (const rf of p.filters) {
          val = rf.fn(val, ...rf.args);
        }
      }
      fragments.push(String(val));
    }

    return fragments.join('');
  };
}
