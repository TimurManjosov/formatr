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
  const registry = {
    ...builtinFilters,
    ...makeIntlFilters(options.locale),
    ...options.filters ?? {}
  };
  const parts = ast.nodes.map((n) => {
    if (n.kind === "Text") return { type: "text", value: n.value };
    return n.filters && n.filters.length ? { type: "ph", path: n.path, filters: n.filters } : { type: "ph", path: n.path };
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
        if (onMissing === "error") throw new FormatrError(`Missing key "${keyStr}"`);
        if (onMissing === "keep") {
          out += `{${keyStr}}`;
          continue;
        }
        out += onMissing(keyStr);
        continue;
      }
      let val = value;
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
function readIdentifier(source, iRef) {
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
function readPath(source, iRef) {
  const segs = [];
  segs.push(readIdentifier(source, iRef));
  while (source[iRef.i] === ".") {
    iRef.i++;
    segs.push(readIdentifier(source, iRef));
  }
  return segs;
}
function parseTemplate(source) {
  const nodes = [];
  let i = 0;
  let textStart = 0;
  const pushTextIfAny = (end) => {
    if (end > textStart) nodes.push({ kind: "Text", value: source.slice(textStart, end) });
  };
  const readFilterArgs = (iRef) => {
    const args = [];
    if (source[iRef.i] === ":") {
      iRef.i++;
      let argStart = iRef.i;
      while (iRef.i < source.length && source[iRef.i] !== "}") {
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
  };
  const readFilters = (iRef) => {
    const filters = [];
    while (source[iRef.i] === "|") {
      iRef.i++;
      const name = readIdentifier(source, iRef);
      const args = readFilterArgs(iRef);
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
      const iRef = { i };
      const path = readPath(source, iRef);
      const filters = readFilters(iRef);
      if (source[iRef.i] !== "}") {
        throw new FormatrError(`Expected '}' to close placeholder for "${path.join(".")}"`, iRef.i);
      }
      i = iRef.i + 1;
      nodes.push(
        filters.length ? { kind: "Placeholder", path, filters } : { kind: "Placeholder", path }
      );
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
var DEFAULT_CACHE_SIZE = 200;
var compiledCache = new LRU(DEFAULT_CACHE_SIZE);
function makeCacheKey(source, options) {
  const opt = {
    locale: options.locale ?? null,
    onMissing: options.onMissing ?? "keep",
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
export {
  FormatrError,
  template
};
