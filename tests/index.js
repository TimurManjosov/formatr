import assert from "assert";
import { toUpperCase, toLowerCase, trim } from "../build/debug.js";

// Test WASM functions
assert.strictEqual(toUpperCase("hello"), "HELLO");
assert.strictEqual(toLowerCase("WORLD"), "world");
assert.strictEqual(trim("  test  "), "test");

console.log("✓ WASM module tests passed");

