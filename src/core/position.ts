export function buildLineStarts(src: string): number[] {
  const starts = [0];
  for (let i = 0; i < src.length; i++) {
    const ch = src.charCodeAt(i);
    if (ch === 10 /* \n */) starts.push(i + 1);
  }
  return starts;
}

export function indexToLineCol(src: string, index: number, lineStarts?: number[]) {
  const starts = lineStarts ?? buildLineStarts(src);
  const safeStarts = starts.length > 0 ? starts : [0]; // ensure at least one start

  // binary search for greatest line start <= index
  let lo = 0,
    hi = safeStarts.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const midVal = safeStarts[mid] ?? 0;
    if (midVal <= index) lo = mid + 1;
    else hi = mid - 1;
  }
  // hi may be -1 if index < safeStarts[0]; treat start=0 in that case
  const start = safeStarts[hi] ?? 0; // now safeStarts always has at least one element
  const line = (hi >= 0 ? hi : 0) + 1; // 1-based
  const column = index - start + 1; // 1-based
  return { line, column };
}
