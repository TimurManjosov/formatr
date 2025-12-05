/**
 * WebAssembly Backend Example
 * 
 * This example demonstrates how to use the optional WASM backend
 * for improved performance in high-throughput scenarios.
 */

import { template, initWasm, isWasmEnabled, disableWasm, enableWasm } from "../src/index.js";

console.log("=== formatr WebAssembly Backend Example ===\n");

// Example 1: Basic WASM initialization
console.log("1. Initializing WASM backend...");
await initWasm();
console.log(`   WASM enabled: ${isWasmEnabled()}`);

// Example 2: Using templates with WASM
console.log("\n2. Using templates with WASM:");
const greet = template<{ name: string }>("Hello {name|upper}!");
console.log(`   ${greet({ name: "Alice" })}`);
console.log(`   ${greet({ name: "Bob" })}`);

// Example 3: Comparing JS vs WASM performance
console.log("\n3. Performance comparison:");

const perfTemplate = template<{ text: string }>("{text|trim|upper}");
const iterations = 100_000;

// Benchmark JavaScript
disableWasm();
console.log(`   JS backend (${iterations} iterations):`);
const jsStart = Date.now();
for (let i = 0; i < iterations; i++) {
  perfTemplate({ text: "  hello world  " });
}
const jsDuration = Date.now() - jsStart;
console.log(`   Duration: ${jsDuration}ms`);
console.log(`   Throughput: ${Math.round((iterations / jsDuration) * 1000).toLocaleString()} ops/sec`);

// Benchmark WASM
await initWasm();
console.log(`\n   WASM backend (${iterations} iterations):`);
const wasmStart = Date.now();
for (let i = 0; i < iterations; i++) {
  perfTemplate({ text: "  hello world  " });
}
const wasmDuration = Date.now() - wasmStart;
console.log(`   Duration: ${wasmDuration}ms`);
console.log(`   Throughput: ${Math.round((iterations / wasmDuration) * 1000).toLocaleString()} ops/sec`);
console.log(`   Speedup: ${(jsDuration / wasmDuration).toFixed(2)}x faster`);

// Example 4: Graceful fallback
console.log("\n4. Graceful fallback demonstration:");
console.log("   Disabling WASM...");
disableWasm();
console.log(`   WASM enabled: ${isWasmEnabled()}`);

const fallbackTemplate = template<{ name: string }>("Welcome {name|lower}!");
console.log(`   Result: ${fallbackTemplate({ name: "JOHN" })} (using JS)`);

// Re-enable WASM
const reEnabled = enableWasm();
console.log(`\n   Re-enabling WASM: ${reEnabled ? "success" : "failed (WASM was never loaded)"}`);
console.log(`   WASM enabled: ${isWasmEnabled()}`);
console.log(`   Result: ${fallbackTemplate({ name: "JANE" })} (using ${isWasmEnabled() ? "WASM" : "JS"})`);

// Example 5: Real-world use case - logging
console.log("\n5. Real-world example (logging):");
const logTemplate = template<{ level: string; message: string; timestamp: Date }>(
  "[{timestamp|date:short}] [{level|pad:5}] {message|trim}"
);

await initWasm(); // Ensure WASM is enabled for best performance

const logEntries = [
  { level: "INFO", message: "Server started on port 3000", timestamp: new Date() },
  { level: "WARN", message: "  High memory usage detected  ", timestamp: new Date() },
  { level: "ERROR", message: "Database connection failed", timestamp: new Date() },
];

console.log("   Processing log entries with WASM:");
for (const entry of logEntries) {
  console.log(`   ${logTemplate(entry)}`);
}

// Example 6: Template with multiple filters
console.log("\n6. Complex template with multiple filters:");
const complexTemplate = template<{ 
  title: string; 
  author: string; 
  description: string 
}>(
  "Title: {title|trim|upper}\\nAuthor: {author|trim}\\nDescription: {description|trim|lower}"
);

const article = {
  title: "  WebAssembly in JavaScript  ",
  author: "  John Doe  ",
  description: "  AN INTRODUCTION TO WASM  "
};

console.log(complexTemplate(article));

// Example 7: Error handling
console.log("\n7. Error handling:");
console.log("   WASM initialization handles errors gracefully.");
console.log("   If WASM fails to load, the library falls back to JavaScript.");
console.log("   No application code changes are required!");

// Summary
console.log("\n=== Summary ===");
console.log("✓ WASM backend provides 1.4-2x performance improvement");
console.log("✓ Opt-in feature - explicitly call initWasm() to enable");
console.log("✓ Graceful fallback to JavaScript if WASM unavailable");
console.log("✓ Transparent - no API changes required");
console.log("✓ Compatible with all modern browsers and Node.js");
console.log("\nFor more details, see WASM.md");
