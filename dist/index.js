"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  FormatrError: () => FormatrError,
  template: () => template
});
module.exports = __toCommonJS(index_exports);

// src/filters/text.ts
var upper = (v) => String(v).toUpperCase();
var lower = (v) => String(v).toLowerCase();
var trim = (v) => String(v).trim();
var plural = (v, singular, plural2) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  if (singular == null || plural2 == null) {
    throw new Error("plural filter requires two args: singular, plural");
  }
  return n === 1 ? singular : plural2;
};

// src/filters/index.ts
var builtinFilters = {
  upper,
  lower,
  trim,
  plural
};

// src/core/errors.ts
var FormatrError = class extends Error {
  constructor(message, pos) {
    super(message);
    this.pos = pos;
    this.name = "FormatrError";
  }
};

// src/core/compile.ts
function compile(ast, options = {}) {
  const onMissing = options.onMissing ?? "keep";
  const registry = {
    ...builtinFilters,
    ...options.filters ?? {}
  };
  const parts = ast.nodes.map((n) => {
    if (n.kind === "Text") return { type: "text", value: n.value };
    return n.filters && n.filters.length ? { type: "ph", key: n.key, filters: n.filters } : { type: "ph", key: n.key };
  });
  return function render(ctx) {
    let out = "";
    for (const p of parts) {
      if (p.type === "text") {
        out += p.value;
      } else {
        let val = ctx[p.key];
        if (val === void 0 || val === null) {
          if (onMissing === "error") {
            throw new FormatrError(`Missing key "${p.key}"`);
          } else if (onMissing === "keep") {
            out += `{${p.key}}`;
            continue;
          } else {
            out += onMissing(p.key);
            continue;
          }
        }
        if (p.filters && p.filters.length) {
          for (const f of p.filters) {
            const fn = registry[f.name];
            if (!fn) {
              throw new FormatrError(`Unknown filter "${f.name}"`);
            }
            val = fn(val, ...f.args ?? []);
          }
        }
        out += String(val);
      }
    }
    return out;
  };
}

// src/core/parser.ts
var ID_START = /[A-Za-z_]/;
var ID_CONT = /[A-Za-z0-9_]/;
function parseTemplate(source) {
  const nodes = [];
  let i = 0;
  let textStart = 0;
  const pushTextIfAny = (end) => {
    if (end > textStart) nodes.push({ kind: "Text", value: source.slice(textStart, end) });
  };
  const readIdentifier = () => {
    if (!ID_START.test(source.charAt(i))) {
      throw new FormatrError(`Expected identifier`, i);
    }
    const start = i++;
    while (i < source.length && ID_CONT.test(source.charAt(i))) i++;
    return source.slice(start, i);
  };
  const readFilterArgs = () => {
    const args = [];
    if (source[i] === ":") {
      i++;
      let argStart = i;
      while (i < source.length && source[i] !== "}") {
        if (source[i] === ",") {
          args.push(source.slice(argStart, i).trim());
          i++;
          argStart = i;
          continue;
        }
        i++;
      }
      args.push(source.slice(argStart, i).trim());
    }
    return args;
  };
  const readFilters = () => {
    const filters = [];
    while (source[i] === "|") {
      i++;
      const name = readIdentifier();
      const posBeforeArgs = i;
      const args = readFilterArgs();
      filters.push({ name, args });
    }
    return filters;
  };
  while (i < source.length) {
    const ch = source[i];
    if (ch === "{") {
      if (source[i + 1] === "{") {
        pushTextIfAny(i);
        nodes.push({ kind: "Text", value: "{" });
        i += 2;
        textStart = i;
        continue;
      }
      pushTextIfAny(i);
      i++;
      const key = readIdentifier();
      const filters = readFilters();
      if (source[i] !== "}") {
        throw new FormatrError(`Expected '}' to close placeholder for "${key}"`, i);
      }
      i++;
      nodes.push(filters.length ? { kind: "Placeholder", key, filters } : { kind: "Placeholder", key });
      textStart = i;
      continue;
    }
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

// src/api.ts
function template(source, options = {}) {
  const ast = parseTemplate(source);
  return compile(ast, options);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FormatrError,
  template
});
