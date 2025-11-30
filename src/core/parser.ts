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
 * Reads a quoted string starting at iRef.i (which must be '"' or "'").
 * Handles escape sequences: \", \', \\, \,, \:
 * Returns the string content (without quotes) and advances iRef.i past the closing quote.
 */
function readQuotedString(source: string, iRef: { i: number }): string {
  const quoteChar = source[iRef.i];
  const startPos = iRef.i;
  iRef.i++; // skip opening quote

  let result = '';

  while (iRef.i < source.length) {
    const ch = source[iRef.i];

    if (ch === quoteChar) {
      iRef.i++; // skip closing quote
      return result;
    }

    if (ch === '\\') {
      iRef.i++; // skip backslash
      if (iRef.i >= source.length) {
        throw new FormatrError('Unexpected end of input in escape sequence', iRef.i);
      }
      const escaped = source[iRef.i];
      if (escaped === '"' || escaped === "'" || escaped === '\\' || escaped === ',' || escaped === ':') {
        result += escaped;
      } else {
        throw new FormatrError(`Invalid escape sequence: \\${escaped}`, iRef.i - 1);
      }
      iRef.i++;
      continue;
    }

    result += ch;
    iRef.i++;
  }

  // Reached end of source without finding closing quote
  throw new FormatrError('Unterminated string', startPos);
}

/**
 * Reads optional filter args of the form:
 *   ":" <arg> ("," <arg>)*
 * Args can be:
 *   - Quoted strings: "..." or '...' (can contain commas, colons, etc.)
 *   - Unquoted: run of characters up to ',', '|', or '}'
 * Supports escape sequences inside quoted strings: \", \', \\, \,, \:
 * Leaves iRef.i positioned at the same place as before (either ':' consumed fully or not present).
 */
function readFilterArgs(source: string, iRef: { i: number }): string[] {
  const args: string[] = [];
  if (source[iRef.i] === ':') {
    iRef.i++; // skip ':'

    let expectingArg = true; // Track if we're expecting an argument after a comma

    while (iRef.i < source.length && source[iRef.i] !== '}' && source[iRef.i] !== '|') {
      const ch = source[iRef.i];

      if (ch === '"' || ch === "'") {
        // Read quoted string
        const quotedArg = readQuotedString(source, iRef);
        args.push(quotedArg);
        expectingArg = false;

        // Check for comma separator
        if (source[iRef.i] === ',') {
          iRef.i++; // skip ','
          expectingArg = true;
        }
      } else if (ch === ',') {
        // Comma found - if we were expecting an arg, push empty string for backwards compat
        if (expectingArg) {
          args.push('');
        }
        iRef.i++; // skip ','
        expectingArg = true;
      } else {
        // Read unquoted argument (until comma, '|', or '}')
        const argStart = iRef.i;
        while (
          iRef.i < source.length &&
          source[iRef.i] !== ',' &&
          source[iRef.i] !== '}' &&
          source[iRef.i] !== '|'
        ) {
          iRef.i++;
        }
        const arg = source.slice(argStart, iRef.i).trim();
        args.push(arg);
        expectingArg = false;

        // Check for comma separator
        if (source[iRef.i] === ',') {
          iRef.i++; // skip ','
          expectingArg = true;
        }
      }
    }

    // Handle trailing comma - push empty string for backwards compat
    if (expectingArg && args.length > 0) {
      args.push('');
    }
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
