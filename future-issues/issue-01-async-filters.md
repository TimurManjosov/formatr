# Issue 1: Add Async Filter Support for External Data Sources

**Status**: Proposed  
**Priority**: High  
**Created**: 2025-12-20  
**Labels**: enhancement, async, filters

---

## Description

Add support for asynchronous filters in formatr to enable data fetching from external sources (APIs, databases, file systems) during template rendering. This enhancement would allow filters to return Promises, making formatr suitable for more complex, data-driven templating scenarios.

---

## Motivation & Use Cases

### Why This Matters

Current formatr filters are synchronous, limiting their ability to:
- Fetch data from REST APIs
- Query databases
- Read files from disk
- Perform time-consuming computations
- Integrate with external services

### Real-World Use Cases

1. **API Integration**
   ```javascript
   // Fetch user data from an API
   {{ userId | fetchUser | getUserName }}
   ```

2. **Database Queries**
   ```javascript
   // Look up product details
   {{ productId | dbLookup('products') | format('name: {name}, price: ${price}') }}
   ```

3. **File System Operations**
   ```javascript
   // Include external file content
   {{ './content.md' | readFile | markdown }}
   ```

4. **Image Processing**
   ```javascript
   // Fetch and resize images
   {{ imageUrl | fetchImage | resize(800, 600) | toDataUrl }}
   ```

5. **Internationalization**
   ```javascript
   // Load translations from external service
   {{ 'welcome.message' | translate(locale) }}
   ```

---

## Example Usage

### Basic Async Filter

```javascript
import { formatr } from 'formatr';

// Register an async filter
formatr.registerFilter('fetchUser', async (userId) => {
  const response = await fetch(`https://api.example.com/users/${userId}`);
  return await response.json();
});

formatr.registerFilter('getName', (user) => user.name);

// Use in template (note: render method becomes async)
const template = '{{ userId | fetchUser | getName }}';
const result = await formatr.render(template, { userId: 123 });
// Output: "John Doe"
```

### Chaining Async and Sync Filters

```javascript
formatr.registerFilter('fetchProduct', async (id) => {
  const res = await fetch(`https://api.example.com/products/${id}`);
  return await res.json();
});

formatr.registerFilter('formatPrice', (product) => {
  return `${product.name}: $${product.price.toFixed(2)}`;
});

const template = '{{ productId | fetchProduct | formatPrice | uppercase }}';
const result = await formatr.render(template, { productId: 456 });
// Output: "WIRELESS MOUSE: $29.99"
```

### Error Handling

```javascript
formatr.registerFilter('safeApiCall', async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
});

const template = '{{ apiUrl | safeApiCall | json }}';
const result = await formatr.render(template, { apiUrl: 'https://api.example.com/data' });
```

### Parallel Async Operations

```javascript
// Multiple independent async operations in one template
const template = `
User: {{ userId | fetchUser | getName }}
Orders: {{ userId | fetchOrders | count }}
Cart: {{ userId | fetchCart | totalPrice }}
`;

const result = await formatr.render(template, { userId: 123 });
```

---

## Requirements

### Functional Requirements

1. **Async Filter Registration**
   - Support both synchronous and asynchronous filter functions
   - Auto-detect async functions (Promise-returning)
   - Maintain backward compatibility with existing sync filters

2. **Promise Handling**
   - Properly await async filter results before passing to next filter
   - Support filter chaining with mixed sync/async filters
   - Handle Promise rejection gracefully

3. **Error Management**
   - Catch and report async filter errors
   - Provide meaningful error messages with context
   - Allow custom error handlers

4. **Performance**
   - Execute independent async filters in parallel when possible
   - Avoid unnecessary Promise wrapping for sync filters
   - Support cancellation/timeout mechanisms

### Non-Functional Requirements

1. **Backward Compatibility**
   - Existing synchronous code must work without changes
   - `formatr.render()` should still work synchronously when no async filters are present
   - Add `formatr.renderAsync()` as explicit async method

2. **Developer Experience**
   - Clear documentation on async filter usage
   - TypeScript support with proper Promise types
   - Helpful error messages

3. **Testing**
   - Comprehensive test coverage for async scenarios
   - Performance benchmarks
   - Error handling tests

---

## Acceptance Criteria

- [ ] Async filters can be registered using `registerFilter()` with async functions
- [ ] `renderAsync()` method correctly handles templates with async filters
- [ ] Mixed sync/async filter chains work correctly
- [ ] Independent async filters execute in parallel for performance
- [ ] Errors in async filters are caught and reported with context
- [ ] Backward compatibility: existing sync templates work unchanged
- [ ] TypeScript types properly reflect async capabilities
- [ ] Documentation includes async filter examples and best practices
- [ ] Test coverage ≥ 90% for async code paths
- [ ] Performance: async overhead < 5% for sync-only templates

---

## Implementation Ideas

### 1. Filter Detection

```javascript
function isAsyncFilter(fn) {
  return fn.constructor.name === 'AsyncFunction' || 
         fn.prototype?.constructor?.name === 'AsyncFunction';
}

function registerFilter(name, fn) {
  filters[name] = {
    fn,
    isAsync: isAsyncFilter(fn)
  };
}
```

### 2. Async Rendering Pipeline

```javascript
async function renderAsync(template, context) {
  const tokens = tokenize(template);
  const results = await Promise.all(
    tokens.map(token => processToken(token, context))
  );
  return results.join('');
}

async function processToken(token, context) {
  if (token.type !== 'expression') return token.value;
  
  let value = resolveValue(token.variable, context);
  
  for (const filter of token.filters) {
    const filterDef = filters[filter.name];
    if (filterDef.isAsync) {
      value = await filterDef.fn(value, ...filter.args);
    } else {
      value = filterDef.fn(value, ...filter.args);
    }
  }
  
  return value;
}
```

### 3. Parallel Optimization

```javascript
// Identify independent async operations
function optimizeAsyncExecution(tokens) {
  const asyncGroups = [];
  let currentGroup = [];
  
  for (const token of tokens) {
    if (hasAsyncFilters(token)) {
      currentGroup.push(token);
    } else if (currentGroup.length > 0) {
      asyncGroups.push(currentGroup);
      currentGroup = [];
    }
  }
  
  return asyncGroups;
}
```

### 4. Error Context

```javascript
async function safeFilterExecution(filterName, fn, value, args) {
  try {
    return await fn(value, ...args);
  } catch (error) {
    throw new FilterExecutionError(
      `Error in filter '${filterName}': ${error.message}`,
      { filterName, input: value, args, originalError: error }
    );
  }
}
```

---

## Testing Strategy

### Unit Tests

```javascript
describe('Async Filters', () => {
  test('should handle single async filter', async () => {
    formatr.registerFilter('asyncDouble', async (n) => {
      await delay(10);
      return n * 2;
    });
    
    const result = await formatr.renderAsync('{{ value | asyncDouble }}', { value: 5 });
    expect(result).toBe('10');
  });
  
  test('should chain async and sync filters', async () => {
    formatr.registerFilter('fetchData', async () => ({ name: 'test' }));
    formatr.registerFilter('getName', (obj) => obj.name);
    formatr.registerFilter('upper', (str) => str.toUpperCase());
    
    const result = await formatr.renderAsync('{{ x | fetchData | getName | upper }}', { x: 1 });
    expect(result).toBe('TEST');
  });
  
  test('should handle async filter errors', async () => {
    formatr.registerFilter('failingFilter', async () => {
      throw new Error('API Error');
    });
    
    await expect(
      formatr.renderAsync('{{ x | failingFilter }}', { x: 1 })
    ).rejects.toThrow('API Error');
  });
  
  test('should execute independent async filters in parallel', async () => {
    const startTime = Date.now();
    
    formatr.registerFilter('delay', async (val) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return val;
    });
    
    const template = '{{ a | delay }} {{ b | delay }}';
    await formatr.renderAsync(template, { a: 1, b: 2 });
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(150); // Should be ~100ms, not 200ms
  });
});
```

### Integration Tests

```javascript
describe('Async Filters Integration', () => {
  test('should fetch real data from API', async () => {
    formatr.registerFilter('fetchUser', async (id) => {
      const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`);
      return await res.json();
    });
    
    const template = '{{ userId | fetchUser | get("name") }}';
    const result = await formatr.renderAsync(template, { userId: 1 });
    expect(result).toBeTruthy();
  });
});
```

### Performance Tests

```javascript
describe('Async Performance', () => {
  test('should have minimal overhead for sync filters', () => {
    const syncTime = measureSync(() => {
      formatr.render('{{ value | double }}', { value: 5 });
    });
    
    const asyncTime = measureSync(() => {
      formatr.renderAsync('{{ value | double }}', { value: 5 });
    });
    
    expect(asyncTime - syncTime).toBeLessThan(syncTime * 0.05); // < 5% overhead
  });
});
```

---

## Backwards Compatibility

### Maintaining Compatibility

1. **Dual API Approach**
   ```javascript
   // Existing sync API (unchanged)
   formatr.render(template, context); // Synchronous
   
   // New async API
   await formatr.renderAsync(template, context); // Asynchronous
   ```

2. **Auto-detection Option** (Future consideration)
   ```javascript
   // Smart render that auto-detects async needs
   const result = await formatr.smartRender(template, context);
   // Returns Promise only if template has async filters
   ```

3. **Migration Path**
   - Existing code continues to work
   - Async filters require explicit `renderAsync()` usage
   - Clear error messages if async filter used with sync `render()`

### Breaking Changes

**None.** This is a purely additive feature.

---

## Potential Pitfalls

### 1. Performance Issues

**Problem**: Excessive sequential async operations
```javascript
// BAD: Sequential fetches (slow)
{{ id1 | fetch }} {{ id2 | fetch }} {{ id3 | fetch }}
```

**Solution**: Implement parallel execution optimization

### 2. Error Handling Complexity

**Problem**: Async errors can be harder to trace
```javascript
// Where did this error come from?
{{ value | filter1 | asyncFilter2 | filter3 | asyncFilter4 }}
```

**Solution**: Enhanced error messages with filter chain context

### 3. Memory Leaks

**Problem**: Uncancelled async operations
```javascript
// User navigates away before render completes
await formatr.renderAsync(longRunningTemplate);
```

**Solution**: Implement cancellation tokens / AbortController support

### 4. Race Conditions

**Problem**: Async filters with shared state
```javascript
let counter = 0;
formatr.registerFilter('increment', async () => {
  await delay(Math.random() * 100);
  return ++counter;
});
```

**Solution**: Document best practices for stateless filters

### 5. Testing Complexity

**Problem**: Async code requires more sophisticated testing
**Solution**: Provide testing utilities and examples

---

## Future Extensions

### 1. Caching Layer

```javascript
formatr.registerFilter('fetchUser', async (id) => {
  return await fetch(`/api/users/${id}`);
}, {
  cache: {
    ttl: 300000, // 5 minutes
    key: (id) => `user:${id}`
  }
});
```

### 2. Timeout Support

```javascript
formatr.registerFilter('slowApi', async (id) => {
  // Implementation
}, {
  timeout: 5000 // 5 second timeout
});
```

### 3. Retry Logic

```javascript
formatr.registerFilter('unreliableApi', async (id) => {
  // Implementation
}, {
  retry: {
    attempts: 3,
    backoff: 'exponential'
  }
});
```

### 4. Request Batching

```javascript
// Automatically batch multiple calls to the same filter
formatr.registerFilter('batchFetch', async (id) => {
  // Implementation
}, {
  batch: {
    maxSize: 100,
    maxDelay: 50
  }
});
```

### 5. Streaming Support

```javascript
// For very large templates
const stream = formatr.renderStream(template, context);
for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

### 6. Progress Tracking

```javascript
const result = await formatr.renderAsync(template, context, {
  onProgress: (completed, total) => {
    console.log(`${completed}/${total} filters completed`);
  }
});
```

---

## Related Issues

- None yet (this is the first proposed enhancement)

## References

- [JavaScript Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [Async Functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
- Template engines with async support: Nunjucks, Liquid

---

**Next Steps**:
1. Gather community feedback on this proposal
2. Create prototype implementation
3. Benchmark performance implications
4. Develop comprehensive test suite
5. Update documentation
6. Release as minor version (semver compatible)
