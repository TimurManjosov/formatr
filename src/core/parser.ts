import { FormatrError } from "./errors";
import type { TemplateAST, Node, FilterCall } from "./ast";

const ID_START = /[A-Za-z_]/;
const ID_CONT  = /[A-Za-z0-9_]/;

export function parseTemplate(source: string): TemplateAST {
  const nodes: Node[] = [];
  let i = 0;
  let textStart = 0;

  const pushTextIfAny = (end: number) => {
    if (end > textStart) nodes.push({ kind: "Text", value: source.slice(textStart, end) });
  };

  const readIdentifier = (): string => {
    if (!ID_START.test(source.charAt(i))) {
      throw new FormatrError(`Expected identifier`, i);
    }
    const start = i++;
    while (i < source.length && ID_CONT.test(source.charAt(i))) i++;
    return source.slice(start, i);
  };

  const readFilterArgs = (): string[] => {
    // grammar: ":" <arg> ("," <arg>)*
    // arg = run of non-comma, non-} characters (no escaping for now)
    const args: string[] = [];
    if (source[i] === ":") {
      i++; // skip ':'
      let argStart = i;
      while (i < source.length && source[i] !== "}") {
        if (source[i] === ",") {
          args.push(source.slice(argStart, i).trim());
          i++; // skip ','
          argStart = i;
          continue;
        }
        i++;
      }
      // don't consume '}' here; caller will check it
      args.push(source.slice(argStart, i).trim());
    }
    return args;
  };

  const readFilters = (): FilterCall[] => {
    const filters: FilterCall[] = [];
    while (source[i] === "|") {
      i++; // skip '|'
      const name = readIdentifier();
      const posBeforeArgs = i;
      const args = readFilterArgs(); // may or may not read any (only if ':' found)
      // reading args stops before '}', so if neither ':' nor next token, we stay at same i
      filters.push({ name, args });
    }
    return filters;
  };

  while (i < source.length) {
    const ch = source[i];

    if (ch === "{") {
      // escaped "{{"
      if (source[i + 1] === "{") {
        pushTextIfAny(i);
        nodes.push({ kind: "Text", value: "{" });
        i += 2;
        textStart = i;
        continue;
      }

      // start placeholder
      pushTextIfAny(i);
      i++; // '{'

      const key = readIdentifier();

      // optional filter chain
      const filters = readFilters();

      // close '}'
      if (source[i] !== "}") {
        throw new FormatrError(`Expected '}' to close placeholder for "${key}"`, i);
      }
      i++; // '}'

      nodes.push(filters.length
        ? { kind: "Placeholder", key, filters }
        : { kind: "Placeholder", key });

      textStart = i;
      continue;
    }

    // escaped "}}"
    if (ch === "}" && source[i + 1] === "}") {
      pushTextIfAny(i);
      nodes.push({ kind: "Text", value: "}" });
      i += 2;
      textStart = i;
      continue;
    }

    i++;
  }

  pushTextIfAny(i);
  return { nodes };
}
