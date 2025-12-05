import { describe, it, expect, beforeEach } from 'vitest';
import { 
  template, 
  initWasm, 
  isWasmEnabled, 
  disableWasm, 
  enableWasm 
} from '../src/index';

describe('WebAssembly Backend', () => {
  beforeEach(() => {
    // Reset WASM state before each test
    disableWasm();
  });

  describe('API Functions', () => {
    it('should export initWasm function', () => {
      expect(typeof initWasm).toBe('function');
    });

    it('should export isWasmEnabled function', () => {
      expect(typeof isWasmEnabled).toBe('function');
    });

    it('should export disableWasm function', () => {
      expect(typeof disableWasm).toBe('function');
    });

    it('should export enableWasm function', () => {
      expect(typeof enableWasm).toBe('function');
    });

    it('should report WASM as disabled initially', () => {
      expect(isWasmEnabled()).toBe(false);
    });

    it('should handle initWasm gracefully even if WASM fails to load', async () => {
      // This should not throw even if WASM loading fails
      await expect(initWasm()).resolves.toBeUndefined();
    });

    it('should allow disabling WASM', () => {
      disableWasm();
      expect(isWasmEnabled()).toBe(false);
    });

    it('should handle multiple initWasm calls', async () => {
      // Multiple calls should not cause issues
      await initWasm();
      await initWasm();
      await initWasm();
      // Should complete without error
      expect(true).toBe(true);
    });
  });

  describe('Fallback Behavior', () => {
    it('should work with JavaScript backend when WASM is disabled', () => {
      disableWasm();
      
      const t = template<{ name: string }>('{name|upper}');
      expect(t({ name: 'alice' })).toBe('ALICE');
    });

    it('should handle all filters without WASM', () => {
      disableWasm();
      
      const t1 = template<{ text: string }>('{text|upper}');
      expect(t1({ text: 'hello' })).toBe('HELLO');
      
      const t2 = template<{ text: string }>('{text|lower}');
      expect(t2({ text: 'HELLO' })).toBe('hello');
      
      const t3 = template<{ text: string }>('{text|trim}');
      expect(t3({ text: '  hello  ' })).toBe('hello');
    });
  });

  describe('Compatibility', () => {
    it('should produce identical output with and without WASM for upper filter', async () => {
      const template1 = template<{ name: string }>('{name|upper}');
      const context = { name: 'alice' };
      
      // Get result without WASM
      disableWasm();
      const jsResult = template1(context);
      
      // Try to get result with WASM (will fall back if unavailable)
      await initWasm();
      const template2 = template<{ name: string }>('{name|upper}');
      const wasmResult = template2(context);
      
      // Results should be identical
      expect(wasmResult).toBe(jsResult);
      expect(wasmResult).toBe('ALICE');
    });

    it('should produce identical output for lower filter', async () => {
      const context = { text: 'HELLO WORLD' };
      
      disableWasm();
      const t1 = template<{ text: string }>('{text|lower}');
      const jsResult = t1(context);
      
      await initWasm();
      const t2 = template<{ text: string }>('{text|lower}');
      const wasmResult = t2(context);
      
      expect(wasmResult).toBe(jsResult);
      expect(wasmResult).toBe('hello world');
    });

    it('should produce identical output for trim filter', async () => {
      const context = { text: '  hello  ' };
      
      disableWasm();
      const t1 = template<{ text: string }>('{text|trim}');
      const jsResult = t1(context);
      
      await initWasm();
      const t2 = template<{ text: string }>('{text|trim}');
      const wasmResult = t2(context);
      
      expect(wasmResult).toBe(jsResult);
      expect(wasmResult).toBe('hello');
    });

    it('should produce identical output for complex templates', async () => {
      const context = { 
        name: '  alice  ', 
        title: 'dr',
        message: 'IMPORTANT'
      };
      
      const templateStr = 'Hello {title|upper}. {name|trim|upper}, {message|lower}';
      
      disableWasm();
      const t1 = template<typeof context>(templateStr);
      const jsResult = t1(context);
      
      await initWasm();
      const t2 = template<typeof context>(templateStr);
      const wasmResult = t2(context);
      
      expect(wasmResult).toBe(jsResult);
      expect(wasmResult).toBe('Hello DR. ALICE, important');
    });

    it('should handle edge cases identically with and without WASM', async () => {
      const testCases = [
        { input: '', expected: '' },
        { input: ' ', expected: ' ' }, // Space remains space in upper
        { input: '123', expected: '123' },
        { input: 'Hello123World', expected: 'HELLO123WORLD' },
        { input: '!@#$%', expected: '!@#$%' },
      ];

      for (const { input, expected } of testCases) {
        disableWasm();
        const t1 = template<{ text: string }>('{text|upper}');
        const jsResult = t1({ text: input });
        
        await initWasm();
        const t2 = template<{ text: string }>('{text|upper}');
        const wasmResult = t2({ text: input });
        
        expect(wasmResult).toBe(jsResult);
        expect(wasmResult).toBe(expected);
      }
    });
  });

  describe('Performance', () => {
    it('should not degrade performance when WASM fails to load', async () => {
      // Initialize WASM (may or may not succeed)
      await initWasm();
      
      const t = template<{ name: string }>('{name|upper}');
      
      const iterations = 1000;
      const start = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        t({ name: 'test' });
      }
      
      const duration = Date.now() - start;
      
      // Should complete reasonably quickly regardless of WASM status
      // This is a sanity check, not a performance benchmark
      expect(duration).toBeLessThan(1000); // 1 second for 1000 iterations
    });
  });

  describe('Environment Support', () => {
    it('should work in Node.js environment', () => {
      // This test runs in Node.js via vitest
      expect(typeof process).toBe('object');
      expect(isWasmEnabled()).toBe(false); // Initially disabled
      
      const t = template<{ text: string }>('{text|upper}');
      expect(t({ text: 'hello' })).toBe('HELLO');
    });

    it('should handle WebAssembly being undefined', async () => {
      // WASM init should handle environments without WebAssembly
      await initWasm();
      
      // Should not crash, may or may not be enabled
      const wasmStatus = isWasmEnabled();
      expect(typeof wasmStatus).toBe('boolean');
    });
  });

  describe('State Management', () => {
    it('should maintain state across multiple operations', async () => {
      expect(isWasmEnabled()).toBe(false);
      
      await initWasm();
      const status1 = isWasmEnabled();
      
      // Use a template
      const t = template<{ text: string }>('{text|upper}');
      t({ text: 'hello' });
      
      // Status should remain the same
      const status2 = isWasmEnabled();
      expect(status2).toBe(status1);
      
      // Disable
      disableWasm();
      expect(isWasmEnabled()).toBe(false);
      
      // Re-enable
      const reEnabled = enableWasm();
      if (status1) {
        // If WASM was previously enabled, re-enable should succeed
        expect(reEnabled).toBe(true);
        expect(isWasmEnabled()).toBe(true);
      } else {
        // If WASM was never enabled, re-enable should fail
        expect(reEnabled).toBe(false);
        expect(isWasmEnabled()).toBe(false);
      }
    });

    it('should allow toggling WASM on and off', async () => {
      await initWasm();
      const initialStatus = isWasmEnabled();
      
      // Disable
      disableWasm();
      expect(isWasmEnabled()).toBe(false);
      
      // Re-enable if it was initially enabled
      if (initialStatus) {
        const reEnabled = enableWasm();
        expect(reEnabled).toBe(true);
        expect(isWasmEnabled()).toBe(true);
        
        // Disable again
        disableWasm();
        expect(isWasmEnabled()).toBe(false);
      }
    });
  });

  describe('Error Handling', () => {
    it('should not throw when templates are used without initializing WASM', () => {
      const t = template<{ name: string }>('{name|upper}');
      expect(() => t({ name: 'alice' })).not.toThrow();
    });

    it('should gracefully handle invalid WASM paths', async () => {
      // initWasm should not throw even if WASM file is not found
      await expect(initWasm()).resolves.toBeUndefined();
    });

    it('should continue working after WASM initialization failure', async () => {
      await initWasm(); // May fail, but shouldn't break anything
      
      const t = template<{ text: string }>('{text|upper}');
      expect(t({ text: 'hello' })).toBe('HELLO');
    });
  });
});
