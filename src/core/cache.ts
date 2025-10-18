export class LRU<K, V> {
  private map = new Map<K, V>();
  constructor(private readonly max: number) {}

  get(key: K): V | undefined {
    const v = this.map.get(key);
    if (v !== undefined) {
      // refresh recency
      this.map.delete(key);
      this.map.set(key, v);
    }
    return v;
  }

  set(key: K, value: V) {
    if (this.max <= 0) return;
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.max) {
      // delete least-recently-used (first inserted)
      const first = this.map.keys().next().value as K;
      this.map.delete(first);
    }
  }

  size() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
}
