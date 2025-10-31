// src/core/position.ts

export function buildLineStarts(src: string): number[] {
  const starts = [0];
  for (let i = 0; i < src.length; i++) {
    if (src.charCodeAt(i) === 10 /* '\n' */) starts.push(i + 1);
  }
  return starts;
}

export function indexToLineCol(src: string, index: number, lineStarts?: number[]) {
  const starts = lineStarts ?? buildLineStarts(src);
  if (starts.length === 0) return { line: 1, column: 1 };
  // binary search: greatest starts[k] <= index
  let lo = 0,
    hi = starts.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (starts[mid] !== undefined && starts[mid] <= index) lo = mid + 1;
    else hi = mid - 1;
  }
  const line = hi + 1; // 1-based
  const column = index - (starts[hi] ?? 0) + 1; // 1-based
  return { line, column };
}
