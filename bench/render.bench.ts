import { template } from '../src';

function now() {
  return Number(process.hrtime.bigint()) / 1e6;
} // ms

interface BenchResult {
  name: string;
  iterations: number;
  durationMs: number;
  opsPerSec: number;
}

function bench(name: string, fn: () => void, iterations: number): BenchResult {
  // Warmup
  for (let i = 0; i < 100; i++) fn();

  const start = now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const durationMs = now() - start;
  const opsPerSec = Math.round((iterations / (durationMs || 1)) * 1000);

  return { name, iterations, durationMs, opsPerSec };
}

function formatOps(opsPerSec: number): string {
  if (opsPerSec >= 1_000_000) {
    return `${(opsPerSec / 1_000_000).toFixed(2)}M`;
  } else if (opsPerSec >= 1_000) {
    return `${(opsPerSec / 1_000).toFixed(2)}K`;
  }
  return String(opsPerSec);
}

function printResult(result: BenchResult) {
  const itersStr = result.iterations.toLocaleString().padStart(12);
  const durStr = result.durationMs.toFixed(2).padStart(10);
  const opsStr = formatOps(result.opsPerSec).padStart(10);
  console.log(`${result.name.padEnd(45)} ${itersStr} renders in ${durStr}ms  (${opsStr} ops/sec)`);
}

console.log('\n📊 formatr Benchmark Suite\n');
console.log('='.repeat(95));

// Test contexts
const simpleCtx = { name: 'Alice' };
const filterCtx = { name: '  Alice  ' };
const intlCtx = { price: 99.99 };
const nestedCtx = { user: { profile: { name: 'Alice' } } };
const complexCtx = {
  name: 'alexander',
  count: 42,
  user: { name: 'Lara', address: { city: 'Berlin' } },
  n: 12345.6789,
  d: new Date('2025-10-13T00:00:00Z'),
};

// Compile templates once
const simple = template<{ name: string }>('Hello {name}');
const withFilters = template<{ name: string }>('Hello {name|trim|upper}');
const intlCurrency = template<{ price: number }>('Price: {price|currency:USD}', { locale: 'en-US' });
const nested = template<{ user: { profile: { name: string } } }>('Name: {user.profile.name}');
const complex = template('Hello {user.name|upper}, you have {count|number} — {d|date:short}', {
  locale: 'en',
});
const staticOnly = template('Hello World! This is a static template with no placeholders.');
const manyFilters = template<{ text: string }>('{text|trim|lower|upper|trim}');
const largePlaceholders = template<{
  a: string;
  b: string;
  c: string;
  d: string;
  e: string;
}>('A={a}, B={b}, C={c}, D={d}, E={e}');

// Run benchmarks
console.log('\n🚀 Render Performance (pre-compiled templates)\n');

const results: BenchResult[] = [];

results.push(bench('Simple (no filters): "Hello {name}"', () => simple(simpleCtx), 1_000_000));
results.push(
  bench('With text filters: "{name|trim|upper}"', () => withFilters(filterCtx), 500_000)
);
results.push(bench('Intl currency: "{price|currency:USD}"', () => intlCurrency(intlCtx), 100_000));
results.push(bench('Nested paths: "{user.profile.name}"', () => nested(nestedCtx), 500_000));
results.push(
  bench('Complex (3 filters + intl): mixed template', () => complex(complexCtx), 100_000)
);
results.push(bench('Static only (no placeholders)', () => staticOnly({}), 1_000_000));
results.push(
  bench('Many filters: "{text|trim|lower|upper|trim}"', () => manyFilters(filterCtx), 500_000)
);
results.push(
  bench('Many placeholders (5 vars)', () => largePlaceholders({ a: '1', b: '2', c: '3', d: '4', e: '5' }), 500_000)
);

results.forEach(printResult);

// Compilation benchmarks
console.log('\n⚙️  Compilation Performance\n');

const compileSrc = 'Hello {user.name|upper}, you have {count|number} — {d|date:short}';

const compileNoCacheResult = bench(
  'Compile (no cache)',
  () => {
    template(compileSrc, { locale: 'en', cacheSize: 0 });
  },
  1_000
);
printResult(compileNoCacheResult);

const compileCacheResult = bench(
  'Compile (cache hit)',
  () => {
    template(compileSrc, { locale: 'en' });
  },
  10_000
);
printResult(compileCacheResult);

// Summary
console.log('\n' + '='.repeat(95));
console.log('\n📈 Performance Summary\n');

const simpleOps = results.find((r) => r.name.includes('Simple'))?.opsPerSec ?? 0;
const intlOps = results.find((r) => r.name.includes('Intl'))?.opsPerSec ?? 0;
const nestedOps = results.find((r) => r.name.includes('Nested'))?.opsPerSec ?? 0;
const staticOps = results.find((r) => r.name.includes('Static'))?.opsPerSec ?? 0;

console.log(`  • Simple templates:    ${formatOps(simpleOps)} ops/sec`);
console.log(`  • Intl formatting:     ${formatOps(intlOps)} ops/sec`);
console.log(`  • Nested paths:        ${formatOps(nestedOps)} ops/sec`);
console.log(`  • Static templates:    ${formatOps(staticOps)} ops/sec`);
console.log(`  • Cache lookup:        ${formatOps(compileCacheResult.opsPerSec)} ops/sec`);
console.log(`  • Full compilation:    ${formatOps(compileNoCacheResult.opsPerSec)} ops/sec`);

console.log('\n✅ Benchmark complete\n');
