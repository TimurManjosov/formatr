import type { FilterCall, Node, TemplateAST } from './ast';
import { FormatrError } from './errors';

const ID_START = /[A-Za-z_]/;
const ID_CONT = /[A-Za-z0-9_]/;

function readIdentifier(source: string, iRef: { i: number }): string {
  const { i } = iRef;
  if (!ID_START.test(source.charAt(i))) {
    throw new FormatrError(`Expected identifier`, i);
  }
  let j = i + 1;
  while (j < source.length && ID_CONT.test(source.charAt(j))) j++;
  const id = source.slice(i, j);
  iRef.i = j;
  return id;
}

function readPath(source: string, iRef: { i: number }): string[] {
  // <ident> ( "." <ident> )*
  const segs: string[] = [];
  segs.push(readIdentifier(source, iRef));
  while (source[iRef.i] === '.') {
    iRef.i++; // skip '.'
    // require another identifier after dot
    segs.push(readIdentifier(source, iRef));
  }
  return segs;
}

export function parseTemplate(source: string): TemplateAST {
  const nodes: Node[] = [];
  let i = 0;
  let textStart = 0;

  const pushTextIfAny = (end: number) => {
    if (end > textStart) nodes.push({ kind: 'Text', value: source.slice(textStart, end) });
  };

  const readFilterArgs = (iRef: { i: number }): string[] => {
    const args: string[] = [];
    if (source[iRef.i] === ':') {
      iRef.i++;
      let argStart = iRef.i;
      while (iRef.i < source.length && source[iRef.i] !== '}') {
        if (source[iRef.i] === ',') {
          args.push(source.slice(argStart, iRef.i).trim());
          iRef.i++;
          argStart = iRef.i;
          continue;
        }
        iRef.i++;
      }
      args.push(source.slice(argStart, iRef.i).trim());
    }
    return args;
  };

  const readFilters = (iRef: { i: number }): FilterCall[] => {
    const filters: FilterCall[] = [];
    while (source[iRef.i] === '|') {
      iRef.i++;
      const name = readIdentifier(source, iRef);
      const args = readFilterArgs(iRef);
      filters.push({ name, args });
    }
    return filters;
  };

  while (i < source.length) {
    const ch = source[i];

    if (ch === '{') {
      if (source[i + 1] === '{') {
        pushTextIfAny(i);
        nodes.push({ kind: 'Text', value: '{' });
        i += 2;
        textStart = i;
        continue;
      }

      pushTextIfAny(i);
      i++; // '{'

      const iRef = { i };
      const path = readPath(source, iRef); // ← now reads a.b.c
      const filters = readFilters(iRef);

      if (source[iRef.i] !== '}') {
        throw new FormatrError(`Expected '}' to close placeholder for "${path.join('.')}"`, iRef.i);
      }
      i = iRef.i + 1; // skip '}'

      nodes.push(
        filters.length ? { kind: 'Placeholder', path, filters } : { kind: 'Placeholder', path }
      );
      textStart = i;
      continue;
    }

    if (ch === '}' && source[i + 1] === '}') {
      pushTextIfAny(i);
      nodes.push({ kind: 'Text', value: '}' });
      i += 2;
      textStart = i;
      continue;
    }

    i++;
  }

  pushTextIfAny(i);
  return { nodes };
}
