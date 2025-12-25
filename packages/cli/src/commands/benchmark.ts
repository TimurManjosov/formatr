/**
 * Benchmark command - Benchmark template rendering performance
 */
import { Command } from 'commander';
import { template } from '@timur_manjosov/formatr';
import { 
  logger, 
  readFile, 
  writeFile,
  parseData,
  getRelativePath,
  EXIT_CODES,
} from '../utils/index.js';

interface BenchmarkOptions {
  data?: string;
  iterations?: string;
  warmup?: string;
  memory?: boolean;
  report?: string;
  json?: boolean;
}

interface BenchmarkResult {
  file: string;
  iterations: number;
  warmup: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  ops: number;
  memory?: {
    heapUsed: number;
    heapTotal: number;
  };
}

/**
 * Calculate statistics from timing results
 */
function calculateStats(times: number[]): {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
} {
  const sorted = [...times].sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);
  const mean = sum / times.length;
  
  const median = times.length % 2 === 0
    ? (sorted[times.length / 2 - 1]! + sorted[times.length / 2]!) / 2
    : sorted[Math.floor(times.length / 2)]!;
  
  const squaredDiffs = times.map(t => Math.pow(t - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / times.length;
  const stdDev = Math.sqrt(avgSquaredDiff);
  
  return {
    mean,
    median,
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    stdDev,
  };
}

/**
 * Benchmark a single template
 */
async function benchmarkTemplate(
  filePath: string,
  data: unknown,
  iterations: number,
  warmup: number,
  measureMemory: boolean
): Promise<BenchmarkResult> {
  const source = await readFile(filePath);
  const renderFn = template(source);
  const ctx = data as Record<string, unknown>;
  
  // Warmup
  for (let i = 0; i < warmup; i++) {
    renderFn(ctx);
  }
  
  // Force GC if available
  if (global.gc) {
    global.gc();
  }
  
  // Measure memory before
  let memoryBefore: NodeJS.MemoryUsage | undefined;
  if (measureMemory) {
    memoryBefore = process.memoryUsage();
  }
  
  // Benchmark
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    renderFn(ctx);
    const end = performance.now();
    times.push(end - start);
  }
  
  // Measure memory after
  let memoryResult: BenchmarkResult['memory'];
  if (measureMemory && memoryBefore) {
    const memoryAfter = process.memoryUsage();
    memoryResult = {
      heapUsed: Math.round((memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(memoryAfter.heapTotal / 1024 / 1024 * 100) / 100,
    };
  }
  
  const stats = calculateStats(times);
  
  const result: BenchmarkResult = {
    file: filePath,
    iterations,
    warmup,
    ...stats,
    ops: Math.round(1000 / stats.mean),
  };
  
  if (memoryResult) {
    result.memory = memoryResult;
  }
  
  return result;
}

/**
 * Generate HTML report
 */
function generateHtmlReport(results: BenchmarkResult[]): string {
  const rows = results.map(r => `
    <tr>
      <td>${getRelativePath(r.file)}</td>
      <td>${r.iterations}</td>
      <td>${r.mean.toFixed(4)}</td>
      <td>${r.median.toFixed(4)}</td>
      <td>${r.min.toFixed(4)}</td>
      <td>${r.max.toFixed(4)}</td>
      <td>${r.ops.toLocaleString()}</td>
    </tr>
  `).join('');
  
  return `<!DOCTYPE html>
<html>
<head>
  <title>Formatr Benchmark Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    .timestamp { color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <h1>Formatr Benchmark Report</h1>
  <p class="timestamp">Generated: ${new Date().toISOString()}</p>
  <table>
    <thead>
      <tr>
        <th>Template</th>
        <th>Iterations</th>
        <th>Mean (ms)</th>
        <th>Median (ms)</th>
        <th>Min (ms)</th>
        <th>Max (ms)</th>
        <th>Ops/sec</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;
}

export const benchmarkCommand = new Command('benchmark')
  .description('Benchmark template rendering performance')
  .argument('<template...>', 'Template file(s) to benchmark')
  .option('-d, --data <source>', 'Data source (file path or inline JSON)')
  .option('-i, --iterations <count>', 'Number of iterations', '1000')
  .option('-w, --warmup <count>', 'Number of warmup iterations', '100')
  .option('-m, --memory', 'Include memory profiling')
  .option('-r, --report <file>', 'Generate HTML report')
  .option('--json', 'Output results as JSON')
  .action(async (templates: string[], options: BenchmarkOptions) => {
    try {
      // Parse data
      let data: unknown = {};
      if (options.data) {
        data = await parseData(options.data);
      }
      
      const iterations = parseInt(options.iterations ?? '1000', 10);
      const warmup = parseInt(options.warmup ?? '100', 10);
      
      if (iterations < 1) {
        logger.error('Iterations must be at least 1');
        process.exit(EXIT_CODES.INVALID_USAGE);
        return;
      }
      
      if (!options.json) {
        logger.info(`Benchmarking ${templates.length} template(s)...`);
        logger.info(`  Iterations: ${iterations}`);
        logger.info(`  Warmup: ${warmup}`);
        console.log();
      }
      
      const results: BenchmarkResult[] = [];
      
      for (const templateFile of templates) {
        if (!options.json) {
          logger.info(`Running: ${getRelativePath(templateFile)}`);
        }
        
        const result = await benchmarkTemplate(
          templateFile,
          data,
          iterations,
          warmup,
          options.memory ?? false
        );
        results.push(result);
        
        if (!options.json) {
          console.log(`  Mean: ${logger.colored.green(result.mean.toFixed(4) + ' ms')}`);
          console.log(`  Median: ${logger.colored.green(result.median.toFixed(4) + ' ms')}`);
          console.log(`  Min: ${logger.colored.green(result.min.toFixed(4) + ' ms')}`);
          console.log(`  Max: ${logger.colored.red(result.max.toFixed(4) + ' ms')}`);
          console.log(`  Std Dev: ${logger.colored.yellow(result.stdDev.toFixed(4) + ' ms')}`);
          console.log(`  Ops/sec: ${logger.colored.cyan(result.ops.toLocaleString())}`);
          
          if (result.memory) {
            console.log(`  Memory delta: ${result.memory.heapUsed} MB`);
          }
          console.log();
        }
      }
      
      // Output JSON
      if (options.json) {
        const output = results.map(r => ({
          file: getRelativePath(r.file),
          iterations: r.iterations,
          warmup: r.warmup,
          mean: r.mean,
          median: r.median,
          min: r.min,
          max: r.max,
          stdDev: r.stdDev,
          ops: r.ops,
          memory: r.memory,
        }));
        console.log(JSON.stringify(output, null, 2));
      }
      
      // Generate HTML report
      if (options.report) {
        const html = generateHtmlReport(results);
        await writeFile(options.report, html);
        logger.success(`Report saved to ${options.report}`);
      }
      
      // Compare if multiple templates
      if (!options.json && results.length > 1) {
        const fastest = results.reduce((a, b) => a.mean < b.mean ? a : b);
        const slowest = results.reduce((a, b) => a.mean > b.mean ? a : b);
        
        console.log(logger.colored.bold('Comparison:'));
        console.log(`  Fastest: ${logger.colored.green(getRelativePath(fastest.file))} (${fastest.mean.toFixed(4)} ms)`);
        console.log(`  Slowest: ${logger.colored.red(getRelativePath(slowest.file))} (${slowest.mean.toFixed(4)} ms)`);
        console.log(`  Difference: ${((slowest.mean / fastest.mean - 1) * 100).toFixed(1)}% slower`);
      }
      
      process.exit(EXIT_CODES.SUCCESS);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(EXIT_CODES.FAILURE);
    }
  });

export default benchmarkCommand;
