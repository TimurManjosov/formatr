// src/core/parser.ts

import type { FilterCall, Node, Range, TemplateAST } from './ast';
import { FormatrError } from './errors';

const ID_START = /[A-Za-z_]/;
const ID_CONT = /[A-Za-z0-9_]/;

function makeRange(start: number, end: number): Range {
  return { start, end };
}

function readIdentifier(source: string, iRef: { i: number }): string {
  const c0 = source[iRef.i] ?? '';
  if (!ID_START.test(c0)) {
    throw new FormatrError(`Expected identifier`, iRef.i);
  }
  let j = iRef.i + 1;
  while (j < source.length && ID_CONT.test(source[j] ?? '')) j++;
  const id = source.slice(iRef.i, j);
  iRef.i = j;
  return id;
}

function readPath(source: string, iRef: { i: number }): string[] {
  // <ident> ( "." <ident> )*
  const segs: string[] = [];
  segs.push(readIdentifier(source, iRef));
  while (source[iRef.i] === '.') {
    iRef.i++; // skip '.'
    segs.push(readIdentifier(source, iRef));
  }
  return segs;
}

/**
 * Reads optional filter args of the form:
 *   ":" <arg> ("," <arg>)*
 * Arg is a run of characters up to ',', '|', or '}' (no escaping in v0.2.x).
 * Leaves iRef.i positioned at the same place as before (either ':' consumed fully or not present).
 */
function readFilterArgs(source: string, iRef: { i: number }): string[] {
  const args: string[] = [];
  if (source[iRef.i] === ':') {
    iRef.i++; // skip ':'
    let argStart = iRef.i;
    while (iRef.i < source.length && source[iRef.i] !== '}' && source[iRef.i] !== '|') {
      if (source[iRef.i] === ',') {
        args.push(source.slice(argStart, iRef.i).trim());
        iRef.i++; // skip ','
        argStart = iRef.i;
        continue;
      }
      iRef.i++;
    }
    // push last segment (may be empty string if ':' at end — we accept then trim)
    args.push(source.slice(argStart, iRef.i).trim());
  }
  return args;
}

function readFilters(source: string, iRef: { i: number }): FilterCall[] {
  const filters: FilterCall[] = [];
  while (source[iRef.i] === '|') {
    const fStart = iRef.i; // range starts at '|'
    iRef.i++; // skip '|'
    const name = readIdentifier(source, iRef);
    const args = readFilterArgs(source, iRef);
    const fEnd = iRef.i; // end right before '}' or next token
    filters.push({ name, args, range: makeRange(fStart, fEnd) });
  }
  return filters;
}

export function parseTemplate(source: string): TemplateAST {
  const nodes: Node[] = [];
  let i = 0;
  let textStart = 0;

  const pushTextIfAny = (end: number) => {
    if (end > textStart) {
      nodes.push({
        kind: 'Text',
        value: source.slice(textStart, end),
        range: makeRange(textStart, end),
      });
    }
  };

  while (i < source.length) {
    const ch = source[i];

    if (ch === '{') {
      // Escaped "{{"
      if (source[i + 1] === '{') {
        pushTextIfAny(i);
        nodes.push({ kind: 'Text', value: '{', range: makeRange(i, i + 2) });
        i += 2;
        textStart = i;
        continue;
      }

      // Placeholder
      pushTextIfAny(i);
      const phStart = i; // includes '{'
      i++; // consume '{'

      const iRef = { i };
      const path = readPath(source, iRef);
      const filters = readFilters(source, iRef);

      if (source[iRef.i] !== '}') {
        const keyStr = path.join('.');
        throw new FormatrError(`Expected '}' to close placeholder for "${keyStr}"`, iRef.i);
      }
      i = iRef.i + 1; // consume '}'
      const phEnd = i;

      nodes.push(
        filters.length
          ? { kind: 'Placeholder', path, filters, range: makeRange(phStart, phEnd) }
          : { kind: 'Placeholder', path, range: makeRange(phStart, phEnd) }
      );

      textStart = i;
      continue;
    }

    // Escaped "}}"
    if (ch === '}' && source[i + 1] === '}') {
      pushTextIfAny(i);
      nodes.push({ kind: 'Text', value: '}', range: makeRange(i, i + 2) });
      i += 2;
      textStart = i;
      continue;
    }

    i++;
  }

  // Flush trailing text
  pushTextIfAny(i);

  return { nodes };
}
