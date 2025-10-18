import { template } from '../src';

function now() {
  return Number(process.hrtime.bigint()) / 1e6;
} // ms

function bench(name: string, fn: () => void) {
  const start = now();
  fn();
  const dur = now() - start;
  console.log(`${name}: ${dur.toFixed(2)} ms`);
}

const ctx = {
  name: 'alexander',
  count: 42,
  user: { name: 'Lara', address: { city: 'Berlin' } },
  n: 12345.6789,
  d: new Date('2025-10-13T00:00:00Z'),
};

const src = 'Hello {user.name|upper}, you have {count|number} — {d|date:short}';

function renderLoop(t: (c: any) => string, iters: number) {
  let out = '';
  for (let i = 0; i < iters; i++) out = t(ctx);
  return out.length; // prevent dead-code elimination
}

const iters = 100_000;

bench('compile+render (no cache)', () => {
  for (let i = 0; i < 1000; i++) {
    const t = template(src, { locale: 'en', cacheSize: 0 });
    t(ctx);
  }
});

bench('compile once + render loop', () => {
  const t = template(src, { locale: 'en' });
  renderLoop(t, iters);
});

bench('compile many times (cache on)', () => {
  for (let i = 0; i < 1000; i++) {
    const t = template(src, { locale: 'en' }); // should hit cache
    t(ctx);
  }
});
