// src/core/parser.ts
import type { Node, TemplateAST } from './ast';
import { FormatrError } from './errors';

// identifier: [A-Za-z_][A-Za-z0-9_]*
const ID_START = /[A-Za-z_]/;
const ID_CONT = /[A-Za-z0-9_]/;

function isIdStart(ch: string | undefined): boolean {
  return !!ch && ID_START.test(ch);
}
function isIdCont(ch: string | undefined): boolean {
  return !!ch && ID_CONT.test(ch);
}

export function parseTemplate(source: string): TemplateAST {
  const nodes: Node[] = [];
  let i = 0;
  let textStart = 0;

  const pushTextIfAny = (end: number) => {
    if (end > textStart) {
      nodes.push({ kind: 'Text', value: source.slice(textStart, end) });
    }
  };

  while (i < source.length) {
    const ch = source.charAt(i);

    if (ch === '{') {
      // Escaped "{{" → literal "{"
      if (source.charAt(i + 1) === '{') {
        pushTextIfAny(i);
        nodes.push({ kind: 'Text', value: '{' });
        i += 2;
        textStart = i;
        continue;
      }

      // Start of placeholder: {identifier}
      pushTextIfAny(i);
      i++; // skip '{'
      const start = i;

      if (!isIdStart(source.charAt(i))) {
        throw new FormatrError(`Expected identifier after '{'`, i);
      }
      i++;
      while (isIdCont(source.charAt(i))) i++;

      const key = source.slice(start, i);

      if (source.charAt(i) !== '}') {
        throw new FormatrError(`Expected '}' to close placeholder for "${key}"`, i);
      }
      i++; // skip '}'

      nodes.push({ kind: 'Placeholder', key });
      textStart = i;
      continue;
    }

    // Escaped "}}" → literal "}"
    if (ch === '}' && source.charAt(i + 1) === '}') {
      pushTextIfAny(i);
      nodes.push({ kind: 'Text', value: '}' });
      i += 2;
      textStart = i;
      continue;
    }

    i++;
  }

  // flush trailing text
  pushTextIfAny(i);
  return { nodes };
}
