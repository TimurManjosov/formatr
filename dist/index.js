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
  analyze: () => analyze,
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

// src/filters/intl.ts
var toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
function makeIntlFilters(locale) {
  const number = (v, rangeOrMinFrac, maxFrac) => {
    const n = toNumber(v);
    if (n === null) return String(v);
    let min;
    let max;
    if (rangeOrMinFrac != null) {
      const s = String(rangeOrMinFrac);
      if (s.includes("-")) {
        const [a, b] = s.split("-");
        min = Number(a);
        max = Number(b);
      } else {
        min = Number(s);
        max = maxFrac != null ? Number(maxFrac) : min;
      }
    }
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: min,
      maximumFractionDigits: max
    }).format(n);
  };
  const percent = (v, frac) => {
    const n = toNumber(v);
    if (n === null) return String(v);
    const digits = frac != null ? Number(frac) : 0;
    return new Intl.NumberFormat(locale, {
      style: "percent",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(n);
  };
  const currency = (v, code, frac) => {
    const n = toNumber(v);
    if (n === null) return String(v);
    if (!code) throw new Error(`currency filter requires code, e.g., currency:EUR`);
    let currencyCode = String(code).trim();
    let fraction = frac;
    if (currencyCode.includes(":")) {
      const [c, f] = currencyCode.split(":");
      currencyCode = (c ?? "").trim();
      if (f !== void 0 && (fraction == null || fraction === "")) fraction = f;
    }
    currencyCode = currencyCode.toUpperCase();
    if (!/^[A-Z]{3}$/.test(currencyCode)) {
      const letters = currencyCode.match(/[A-Z]{3,}/);
      if (letters && letters[0].length >= 3) {
        currencyCode = letters[0].slice(0, 3);
      } else {
        throw new Error(`currency filter received invalid currency code: ${String(code)}`);
      }
    }
    let digits = void 0;
    if (fraction != null && fraction !== "") {
      const d = Number(fraction);
      if (Number.isFinite(d)) digits = d;
    }
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currencyCode,
        ...digits != null ? { minimumFractionDigits: digits, maximumFractionDigits: digits } : {}
      }).format(n);
    } catch {
      return String(v);
    }
  };
  const date = (v, style) => {
    const d = v instanceof Date ? v : typeof v === "number" ? new Date(v) : new Date(String(v));
    if (Number.isNaN(d.getTime())) return String(v);
    const map = {
      short: { dateStyle: "short" },
      medium: { dateStyle: "medium" },
      long: { dateStyle: "long" },
      full: { dateStyle: "full" }
    };
    const opts = map[style ?? "medium"] ?? map.medium;
    return new Intl.DateTimeFormat(locale, opts).format(d);
  };
  return { number, percent, currency, date };
}

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
    ...makeIntlFilters(options.locale),
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
        continue;
      }
      let val = ctx[p.key];
      if (val === void 0 || val === null) {
        if (onMissing === "error") throw new FormatrError(`Missing key "${p.key}"`);
        if (onMissing === "keep") {
          out += `{${p.key}}`;
          continue;
        }
        out += onMissing(p.key);
        continue;
      }
      if (p.filters && p.filters.length) {
        for (const f of p.filters) {
          const fn = registry[f.name];
          if (!fn) throw new FormatrError(`Unknown filter "${f.name}"`);
          val = fn(val, ...f.args ?? []);
        }
      }
      out += String(val);
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

// src/core/analyze.ts
function analyze(source, options = {}) {
  const messages = [];
  let ast;
  try {
    ast = parseTemplate(source);
  } catch (e) {
    return { messages };
  }
  const registry = {
    ...builtinFilters,
    ...makeIntlFilters(options.locale),
    ...options.filters ?? {}
  };
  for (const node of ast.nodes) {
    if (node.kind !== "Placeholder" || !node.filters?.length) continue;
    for (const f of node.filters) {
      const fn = registry[f.name];
      if (!fn) {
        messages.push({
          code: "unknown-filter",
          message: `Unknown filter "${f.name}"`,
          data: { filter: f.name }
        });
        continue;
      }
      if (f.name === "plural" && f.args.length !== 2) {
        messages.push({
          code: "bad-args",
          message: `Filter "plural" requires exactly 2 args: singular, plural`,
          data: { filter: f.name, got: f.args.length }
        });
      }
      if (f.name === "currency" && f.args.length < 1) {
        messages.push({
          code: "bad-args",
          message: `Filter "currency" requires at least 1 arg: currency code (e.g., EUR)`,
          data: { filter: f.name, got: f.args.length }
        });
      }
    }
  }
  return { messages };
}

// src/api.ts
function template(source, options = {}) {
  const ast = parseTemplate(source);
  return compile(ast, options);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FormatrError,
  analyze,
  template
});
