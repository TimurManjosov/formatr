// src/core/cache.ts
var LRU = class {
  constructor(max) {
    this.max = max;
  }
  map = /* @__PURE__ */ new Map();
  get(key) {
    const v = this.map.get(key);
    if (v !== void 0) {
      this.map.delete(key);
      this.map.set(key, v);
    }
    return v;
  }
  set(key, value) {
    if (this.max <= 0) return;
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.max) {
      const first = this.map.keys().next().value;
      this.map.delete(first);
    }
  }
  size() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
};

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
var slice = (v, start, end) => {
  const str = String(v);
  const startIdx = start != null ? parseInt(start, 10) : 0;
  const endIdx = end != null ? parseInt(end, 10) : void 0;
  return str.slice(startIdx, endIdx);
};
var pad = (v, length, direction = "right", char = " ") => {
  const str = String(v);
  const len = length != null ? parseInt(length, 10) : 0;
  if (isNaN(len) || str.length >= len) return str;
  const padChar = char.charAt(0) || " ";
  const padSize = len - str.length;
  if (direction === "left") {
    return padChar.repeat(padSize) + str;
  } else if (direction === "both" || direction === "center") {
    const leftPad = Math.floor(padSize / 2);
    const rightPad = padSize - leftPad;
    return padChar.repeat(leftPad) + str + padChar.repeat(rightPad);
  } else {
    return str + padChar.repeat(padSize);
  }
};
var truncate = (v, length, ellipsis = "...") => {
  const str = String(v);
  const maxLen = length != null ? parseInt(length, 10) : str.length;
  if (isNaN(maxLen) || str.length <= maxLen) return str;
  const truncatedLength = Math.max(0, maxLen - ellipsis.length);
  return str.slice(0, truncatedLength) + ellipsis;
};
var replace = (v, from, to = "") => {
  const str = String(v);
  if (from == null || from === "") return str;
  return str.split(from).join(to);
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
  plural,
  slice,
  pad,
  truncate,
  replace
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
function getPathValue(obj, path) {
  let cur = obj;
  for (const seg of path) {
    if (cur == null || typeof cur !== "object" && typeof cur !== "function") {
      return { found: false };
    }
    cur = cur[seg];
  }
  return cur === void 0 ? { found: false } : { found: true, value: cur };
}
function compile(ast, options = {}) {
  const onMissing = options.onMissing ?? "keep";
  const strictKeys = options.strictKeys ?? false;
  const registry = {
    ...builtinFilters,
    ...makeIntlFilters(options.locale),
    ...options.filters ?? {}
  };
  const parts = ast.nodes.map((n) => {
    if (n.kind === "Text") return { type: "text", value: n.value };
    let resolved;
    if (n.filters && n.filters.length) {
      resolved = n.filters.map((f) => {
        const fn = registry[f.name];
        if (!fn) throw new FormatrError(`Unknown filter "${f.name}"`);
        return { fn, args: f.args ?? [] };
      });
    }
    return resolved && resolved.length ? { type: "ph", path: n.path, filters: resolved } : { type: "ph", path: n.path };
  });
  return function render(ctx) {
    let out = "";
    for (const p of parts) {
      if (p.type === "text") {
        out += p.value;
        continue;
      }
      const { found, value } = getPathValue(ctx, p.path);
      if (!found || value == null) {
        const keyStr = p.path.join(".");
        if (strictKeys || onMissing === "error") throw new FormatrError(`Missing key "${keyStr}"`);
        if (onMissing === "keep") {
          out += `{${keyStr}}`;
          continue;
        }
        out += onMissing(keyStr);
        continue;
      }
      let val = value;
      if (p.filters && p.filters.length) {
        for (const rf of p.filters) {
          val = rf.fn(val, ...rf.args);
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
function makeRange(start, end) {
  return { start, end };
}
function readIdentifier(source, iRef) {
  const c0 = source[iRef.i] ?? "";
  if (!ID_START.test(c0)) {
    throw new FormatrError(`Expected identifier`, iRef.i);
  }
  let j = iRef.i + 1;
  while (j < source.length && ID_CONT.test(source[j] ?? "")) j++;
  const id = source.slice(iRef.i, j);
  iRef.i = j;
  return id;
}
function readPath(source, iRef) {
  const segs = [];
  segs.push(readIdentifier(source, iRef));
  while (source[iRef.i] === ".") {
    iRef.i++;
    segs.push(readIdentifier(source, iRef));
  }
  return segs;
}
function readFilterArgs(source, iRef) {
  const args = [];
  if (source[iRef.i] === ":") {
    iRef.i++;
    let argStart = iRef.i;
    while (iRef.i < source.length && source[iRef.i] !== "}" && source[iRef.i] !== "|") {
      if (source[iRef.i] === ",") {
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
}
function readFilters(source, iRef) {
  const filters = [];
  while (source[iRef.i] === "|") {
    const fStart = iRef.i;
    iRef.i++;
    const name = readIdentifier(source, iRef);
    const args = readFilterArgs(source, iRef);
    const fEnd = iRef.i;
    filters.push({ name, args, range: makeRange(fStart, fEnd) });
  }
  return filters;
}
function parseTemplate(source) {
  const nodes = [];
  let i = 0;
  let textStart = 0;
  const pushTextIfAny = (end) => {
    if (end > textStart) {
      nodes.push({
        kind: "Text",
        value: source.slice(textStart, end),
        range: makeRange(textStart, end)
      });
    }
  };
  while (i < source.length) {
    const ch = source[i];
    if (ch === "{") {
      if (source[i + 1] === "{") {
        pushTextIfAny(i);
        nodes.push({ kind: "Text", value: "{", range: makeRange(i, i + 2) });
        i += 2;
        textStart = i;
        continue;
      }
      pushTextIfAny(i);
      const phStart = i;
      i++;
      const iRef = { i };
      const path = readPath(source, iRef);
      const filters = readFilters(source, iRef);
      if (source[iRef.i] !== "}") {
        const keyStr = path.join(".");
        throw new FormatrError(`Expected '}' to close placeholder for "${keyStr}"`, iRef.i);
      }
      i = iRef.i + 1;
      const phEnd = i;
      nodes.push(
        filters.length ? { kind: "Placeholder", path, filters, range: makeRange(phStart, phEnd) } : { kind: "Placeholder", path, range: makeRange(phStart, phEnd) }
      );
      textStart = i;
      continue;
    }
    if (ch === "}" && source[i + 1] === "}") {
      pushTextIfAny(i);
      nodes.push({ kind: "Text", value: "}", range: makeRange(i, i + 2) });
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
var DEFAULT_CACHE_SIZE = 200;
var compiledCache = new LRU(DEFAULT_CACHE_SIZE);
function makeCacheKey(source, options) {
  const opt = {
    locale: options.locale ?? null,
    onMissing: options.onMissing ?? "keep",
    strictKeys: options.strictKeys ?? false,
    // include the filter names only (implementations come from user each call;
    // we assume same names = same behavior for caching purposes)
    filters: options.filters ? Object.keys(options.filters).sort() : []
    // cacheSize is not part of cache identity
  };
  return JSON.stringify([source, opt]);
}
function template(source, options = {}) {
  const cacheSize = options.cacheSize ?? DEFAULT_CACHE_SIZE;
  if (cacheSize !== compiledCache["max"]) {
    compiledCache.max = cacheSize;
    if (cacheSize === 0) compiledCache.clear();
  }
  if (cacheSize > 0) {
    const key = makeCacheKey(source, options);
    const cached = compiledCache.get(key);
    if (cached) return cached;
    const ast2 = parseTemplate(source);
    const fn = compile(ast2, options);
    compiledCache.set(key, fn);
    return fn;
  }
  const ast = parseTemplate(source);
  return compile(ast, options);
}

// src/core/position.ts
function buildLineStarts(src) {
  const starts = [0];
  for (let i = 0; i < src.length; i++) {
    if (src.charCodeAt(i) === 10) starts.push(i + 1);
  }
  return starts;
}
function indexToLineCol(src, index, lineStarts) {
  const starts = lineStarts ?? buildLineStarts(src);
  if (starts.length === 0) return { line: 1, column: 1 };
  let lo = 0, hi = starts.length - 1;
  while (lo <= hi) {
    const mid = lo + hi >> 1;
    if (starts[mid] !== void 0 && starts[mid] <= index) lo = mid + 1;
    else hi = mid - 1;
  }
  const line = hi + 1;
  const column = index - (starts[hi] ?? 0) + 1;
  return { line, column };
}

// src/core/analyze.ts
function astRangeToRange(source, astRange, lineStarts) {
  const start = indexToLineCol(source, astRange.start, lineStarts);
  const end = indexToLineCol(source, astRange.end, lineStarts);
  return { start, end };
}
function inferPlaceholderType(path) {
  const key = path[path.length - 1]?.toLowerCase() ?? "";
  if (key.includes("count") || key.includes("price") || key.includes("age") || key.includes("quantity") || key.includes("amount") || key.includes("total") || key.includes("sum") || key.includes("num")) {
    return "number";
  }
  if (key.includes("name") || key.includes("title") || key.includes("description") || key.includes("id") || key.includes("text") || key.includes("label") || key.includes("message")) {
    return "string";
  }
  return "unknown";
}
function getFilterExpectedType(filterName) {
  if (["number", "percent", "currency", "plural"].includes(filterName)) return "number";
  if (["upper", "lower", "trim", "slice", "pad", "truncate", "replace"].includes(filterName)) return "string";
  if (["date"].includes(filterName)) return "date";
  return "unknown";
}
function resolvePath(context, path) {
  let current = context;
  for (const key of path) {
    if (current == null || typeof current !== "object") return void 0;
    current = current[key];
    if (current === void 0) return void 0;
  }
  return current;
}
function atPos(source, pos, lineStarts) {
  const { line, column } = indexToLineCol(source, pos, lineStarts);
  return { pos, line, column };
}
function analyze(source, options = {}) {
  const messages = [];
  const lineStarts = buildLineStarts(source);
  let ast;
  try {
    ast = parseTemplate(source);
  } catch (e) {
    if (e instanceof FormatrError) {
      const pos = e.pos ?? 0;
      const posInfo = atPos(source, pos, lineStarts);
      const range2 = astRangeToRange(source, { start: pos, end: pos + 1 }, lineStarts);
      messages.push({
        code: "parse-error",
        message: e.message,
        severity: "error",
        range: range2,
        ...posInfo
      });
      return { messages };
    }
    const range = astRangeToRange(source, { start: 0, end: 1 }, lineStarts);
    messages.push({
      code: "parse-error",
      message: e?.message ?? String(e),
      severity: "error",
      range
    });
    return { messages };
  }
  const registry = {
    ...builtinFilters,
    ...makeIntlFilters(options.locale),
    ...options.filters ?? {}
  };
  if (options.context !== void 0 && (options.strictKeys || options.onMissing === "error")) {
    for (const node of ast.nodes) {
      if (node.kind === "Placeholder") {
        const value = resolvePath(options.context, node.path);
        if (value === void 0) {
          const range = astRangeToRange(source, node.range, lineStarts);
          const posInfo = atPos(source, node.range.start, lineStarts);
          messages.push({
            code: "missing-key",
            message: `Missing key "${node.path.join(".")}" in context`,
            severity: "error",
            range,
            data: { path: node.path },
            ...posInfo
          });
        }
      }
    }
  }
  for (const node of ast.nodes) {
    if (node.kind !== "Placeholder" || !node.filters?.length) continue;
    for (const f of node.filters) {
      const fn = registry[f.name];
      if (!fn) {
        const range = astRangeToRange(source, f.range, lineStarts);
        const posInfo = atPos(source, f.range.start, lineStarts);
        messages.push({
          code: "unknown-filter",
          message: `Unknown filter "${f.name}"`,
          severity: "error",
          range,
          data: { filter: f.name },
          ...posInfo
        });
        continue;
      }
      const expectedType = getFilterExpectedType(f.name);
      const inferredType = inferPlaceholderType(node.path);
      if (expectedType !== "unknown" && inferredType !== "unknown" && expectedType !== inferredType) {
        const range = astRangeToRange(source, f.range, lineStarts);
        const posInfo = atPos(source, f.range.start, lineStarts);
        messages.push({
          code: "suspicious-filter",
          message: `Filter "${f.name}" expects a ${expectedType}, but "${node.path.join(".")}" likely produces a ${inferredType}`,
          severity: "warning",
          range,
          data: { filter: f.name, placeholder: node.path.join("."), expectedType },
          ...posInfo
        });
      }
      if (f.name === "plural" && f.args.length !== 2) {
        const range = astRangeToRange(source, f.range, lineStarts);
        const posInfo = atPos(source, f.range.start, lineStarts);
        messages.push({
          code: "bad-args",
          message: `Filter "plural" requires exactly 2 arguments (e.g. one, other)`,
          severity: "error",
          range,
          data: { filter: f.name, expected: 2, got: f.args.length },
          ...posInfo
        });
      }
      if (f.name === "currency" && f.args.length < 1) {
        const range = astRangeToRange(source, f.range, lineStarts);
        const posInfo = atPos(source, f.range.start, lineStarts);
        messages.push({
          code: "bad-args",
          message: `Filter "currency" requires at least 1 argument: currency code (e.g., USD)`,
          severity: "error",
          range,
          data: { filter: f.name, expected: "at least 1", got: f.args.length },
          ...posInfo
        });
      }
      if (f.name === "slice" && (f.args.length < 1 || f.args.length > 2)) {
        const range = astRangeToRange(source, f.range, lineStarts);
        const posInfo = atPos(source, f.range.start, lineStarts);
        messages.push({
          code: "bad-args",
          message: `Filter "slice" requires 1 or 2 arguments: start, end?`,
          severity: "error",
          range,
          data: { filter: f.name, expected: "1-2", got: f.args.length },
          ...posInfo
        });
      }
      if (f.name === "pad" && (f.args.length < 1 || f.args.length > 3)) {
        const range = astRangeToRange(source, f.range, lineStarts);
        const posInfo = atPos(source, f.range.start, lineStarts);
        messages.push({
          code: "bad-args",
          message: `Filter "pad" requires 1 to 3 arguments: length, direction?, char?`,
          severity: "error",
          range,
          data: { filter: f.name, expected: "1-3", got: f.args.length },
          ...posInfo
        });
      }
      if (f.name === "truncate" && (f.args.length < 1 || f.args.length > 2)) {
        const range = astRangeToRange(source, f.range, lineStarts);
        const posInfo = atPos(source, f.range.start, lineStarts);
        messages.push({
          code: "bad-args",
          message: `Filter "truncate" requires 1 or 2 arguments: length, ellipsis?`,
          severity: "error",
          range,
          data: { filter: f.name, expected: "1-2", got: f.args.length },
          ...posInfo
        });
      }
      if (f.name === "replace" && f.args.length !== 2) {
        const range = astRangeToRange(source, f.range, lineStarts);
        const posInfo = atPos(source, f.range.start, lineStarts);
        messages.push({
          code: "bad-args",
          message: `Filter "replace" requires exactly 2 arguments: from, to`,
          severity: "error",
          range,
          data: { filter: f.name, expected: 2, got: f.args.length },
          ...posInfo
        });
      }
    }
  }
  return { messages };
}
export {
  FormatrError,
  analyze,
  template
};
