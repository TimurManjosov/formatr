# RFC: Add Official Framework Integrations

**Issue Number:** #03  
**Status:** Draft  
**Created:** 2025-12-20  
**Author:** TimurManjosov

---

## Description

**What:**
Provide first-party, officially maintained adapters and integrations for popular Node.js and frontend frameworks: **Express**, **NestJS**, **Next.js**, **React**, and **Vue**. These integrations handle framework-specific concerns like middleware, SSR, streaming, template caching, and component composition.

**Why:**
While formatr works in any JavaScript environment, integrating it into frameworks requires boilerplate: registering filters, caching templates, handling async rendering, SSR hydration, and more. Official integrations eliminate this friction and provide best practices out of the box.

**Current Limitations:**
- No standardized way to use formatr in Express or NestJS
- React/Vue developers must manually wrap formatr in components
- No SSR/SSG optimizations for Next.js
- No streaming support for server-rendered templates
- No TypeScript types for framework-specific APIs

**New Capabilities:**
- Express middleware for rendering templates in HTTP responses
- NestJS module with dependency injection and interceptors
- Next.js plugin for SSR/SSG template optimization
- React hooks (`useFormat`, `useAsyncFormat`) with suspense support
- Vue composables and components for reactive templating
- Streaming template rendering for HTTP responses

**Scope:**
- Packages: `@formatr/express`, `@formatr/nestjs`, `@formatr/nextjs`, `@formatr/react`, `@formatr/vue`
- Each package includes TypeScript types, documentation, and examples
- Maintain separate versioning for each integration
- Support latest stable versions of each framework

**Non-Goals:**
- Integrations for Angular, Svelte, Solid (can be added later based on demand)
- Template language syntax extensions (integrations use core formatr syntax)
- Framework-specific template features (keep formatr framework-agnostic)

---

## Motivation & Use Cases

### Use Case 1: Express Email Rendering Service

```typescript
import express from 'express';
import { formatrMiddleware } from '@formatr/express';

const app = express();

// Register formatr middleware
app.use(formatrMiddleware({
  templatesDir: './templates',
  cache: true,
  filters: {
    currency: (value) => `$${value.toFixed(2)}`,
  },
}));

// Render template in route
app.get('/order-confirmation/:orderId', async (req, res) => {
  const order = await db.orders.findOne(req.params.orderId);
  
  res.formatr('order-confirmation.txt', {
    customerName: order.customerName,
    total: order.total,
    items: order.items,
  });
});
```

### Use Case 2: NestJS Transactional Email Module

```typescript
import { Module } from '@nestjs/common';
import { FormatrModule } from '@formatr/nestjs';

@Module({
  imports: [
    FormatrModule.register({
      templatesDir: './templates',
      asyncFilters: {
        user: async (userId) => await userService.findById(userId),
      },
    }),
  ],
})
export class EmailModule {}

// In service
@Injectable()
export class EmailService {
  constructor(private formatr: FormatrService) {}
  
  async sendWelcomeEmail(userId: number) {
    const html = await this.formatr.renderAsync('welcome-email.html', { userId });
    await this.mailer.send(html);
  }
}
```

### Use Case 3: Next.js SSR with Template Caching

```typescript
// next.config.js
import { withFormatr } from '@formatr/nextjs';

export default withFormatr({
  formatr: {
    templatesDir: './templates',
    cache: true,
    precompile: true, // Precompile templates at build time
  },
});

// pages/blog/[slug].tsx
import { GetServerSideProps } from 'next';
import { formatr } from '@formatr/nextjs';

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const post = await db.posts.findOne(params.slug);
  
  const content = formatr('blog-post.md', {
    title: post.title,
    author: post.author,
    content: post.content,
  });
  
  return { props: { content } };
};
```

### Use Case 4: React Dynamic Notifications

```typescript
import { useFormat, useAsyncFormat } from '@formatr/react';

function NotificationBanner({ userId, eventType }) {
  // Sync formatting
  const message = useFormat(
    "Hello {userId|user.name}, you have {count} new messages",
    { userId, count: 5 }
  );
  
  return <div className="banner">{message}</div>;
}

function AsyncNotification({ userId }) {
  // Async formatting with Suspense
  const message = useAsyncFormat(
    "{userId|fetchUser.name}, your order {orderId|fetchOrder.status}",
    { userId, orderId: 123 }
  );
  
  return <div>{message}</div>;
}

// In parent component
<Suspense fallback={<Spinner />}>
  <AsyncNotification userId={42} />
</Suspense>
```

### Use Case 5: Vue 3 Reactive Templates

```vue
<template>
  <div>
    <p>{{ formatted }}</p>
  </div>
</template>

<script setup>
import { useFormat } from '@formatr/vue';
import { ref } from 'vue';

const userName = ref('Alice');
const userAge = ref(30);

const formatted = useFormat(
  "User: {name} (age: {age})",
  { name: userName, age: userAge }
);
// Auto-updates when userName or userAge changes
</script>
```

---

## Requirements

### API Design

**Common Features Across All Integrations:**
1. Template loading from file system or strings
2. Template caching with TTL and invalidation
3. Filter registration (sync and async)
4. Error handling with framework-specific error types
5. TypeScript types for all APIs
6. Streaming support (where applicable)
7. SSR/SSG optimizations (where applicable)

**Per-Framework Requirements:**

**Express:**
- `formatrMiddleware(options)` - adds `res.formatr()` method
- `formatrEngine(options)` - view engine compatible with `res.render()`
- `res.formatr(template, context)` - render template synchronously
- `res.formatrAsync(template, context)` - render template asynchronously
- `res.formatrStream(template, context)` - stream template chunks

**NestJS:**
- `FormatrModule.register(options)` - global module registration
- `FormatrService` - injectable service for rendering
- `@FormatrResponse(template)` - decorator for HTTP responses
- `FormatrInterceptor` - interceptor for automatic template rendering

**Next.js:**
- `withFormatr(nextConfig)` - Next.js config wrapper
- `formatr(template, context)` - sync rendering (SSR/SSG)
- `formatrAsync(template, context)` - async rendering
- `useFormatr()` - React hook for client-side rendering
- Template precompilation at build time

**React:**
- `FormatrProvider` - context provider for filters and config
- `useFormat(template, context)` - sync hook
- `useAsyncFormat(template, context)` - async hook with Suspense
- `<Format template={} context={} />` - component

**Vue:**
- `FormatrPlugin` - Vue plugin for global registration
- `useFormat(template, context)` - composable with reactivity
- `<Formatr template="" :context="{}" />` - component

### TypeScript Typing Constraints
- All packages export full TypeScript types
- Strongly typed context objects via generics
- Framework-specific types (e.g., `Express.Response` augmentation)
- Type inference for filter chains

### Runtime Behavior
- Template caching: in-memory LRU cache with configurable size and TTL
- File system watching: auto-reload templates in development
- Error handling: framework-specific error responses (HTTP 500, component error boundaries)
- Streaming: chunk-by-chunk rendering for large templates

### Configuration Options

```typescript
interface FormatrIntegrationOptions {
  templatesDir?: string; // Directory for template files
  extension?: string; // Default: '.formatr' or framework-specific
  cache?: boolean | { ttl: number; maxSize: number }; // Enable caching
  watch?: boolean; // Watch file system for changes (dev mode)
  filters?: Record<string, FilterFunction>; // Custom filters
  asyncFilters?: Record<string, AsyncFilterFunction>; // Async filters
  precompile?: boolean; // Precompile templates (build time, Next.js only)
  streaming?: boolean; // Enable streaming (Express, Node.js only)
  errorHandler?: (error: Error) => void; // Custom error handler
}
```

### Error Handling
- **Express:** Return HTTP 500 with error message in development, generic error in production
- **NestJS:** Throw `HttpException` with proper status code
- **Next.js:** Return 500 error page or fallback content
- **React:** Throw error to nearest error boundary
- **Vue:** Emit error event and render fallback slot

### Performance Considerations
- Cache compiled templates aggressively
- Lazy-load templates (load on first use, not at startup)
- Streaming reduces memory usage for large templates
- Precompilation (Next.js) eliminates runtime parsing

---

## Acceptance Criteria

1. ✅ All 5 packages (`@formatr/express`, `@formatr/nestjs`, `@formatr/nextjs`, `@formatr/react`, `@formatr/vue`) are published to npm
2. ✅ Each package has comprehensive TypeScript types with 100% type coverage
3. ✅ Express middleware supports sync, async, and streaming rendering
4. ✅ NestJS module supports dependency injection and decorators
5. ✅ Next.js plugin enables SSR/SSG with template precompilation
6. ✅ React hooks work with Suspense for async rendering
7. ✅ Vue composable provides reactive template updates
8. ✅ All packages have >= 90% test coverage
9. ✅ Documentation includes integration guides for each framework
10. ✅ Example projects demonstrating each integration
11. ✅ Performance benchmarks for SSR scenarios
12. ✅ Error handling works correctly in each framework context

---

## Implementation Ideas

### Package Structure

```
packages/
├── express/
│   ├── src/
│   │   ├── middleware.ts
│   │   ├── engine.ts
│   │   ├── cache.ts
│   │   └── index.ts
│   ├── package.json
│   └── README.md
├── nestjs/
│   ├── src/
│   │   ├── formatr.module.ts
│   │   ├── formatr.service.ts
│   │   ├── decorators.ts
│   │   ├── interceptors.ts
│   │   └── index.ts
│   ├── package.json
│   └── README.md
├── nextjs/
│   ├── src/
│   │   ├── plugin.ts
│   │   ├── server.ts
│   │   ├── client.ts
│   │   └── index.ts
│   ├── package.json
│   └── README.md
├── react/
│   ├── src/
│   │   ├── FormatrProvider.tsx
│   │   ├── useFormat.ts
│   │   ├── useAsyncFormat.ts
│   │   ├── Format.tsx
│   │   └── index.ts
│   ├── package.json
│   └── README.md
└── vue/
    ├── src/
    │   ├── plugin.ts
    │   ├── composables.ts
    │   ├── Formatr.vue
    │   └── index.ts
    ├── package.json
    └── README.md
```

### Express Implementation Example

```typescript
// packages/express/src/middleware.ts
import { format, formatAsync } from 'formatr';
import { promises as fs } from 'fs';
import path from 'path';
import { LRUCache } from 'lru-cache';

export interface FormatrMiddlewareOptions {
  templatesDir: string;
  extension?: string;
  cache?: boolean | { ttl: number; maxSize: number };
  watch?: boolean;
  filters?: Record<string, Function>;
}

export function formatrMiddleware(options: FormatrMiddlewareOptions) {
  const {
    templatesDir,
    extension = '.txt',
    cache = false,
    watch = process.env.NODE_ENV !== 'production',
    filters = {}
  } = options;

  // Initialize cache
  const templateCache = cache ? new LRUCache<string, string>({
    max: typeof cache === 'object' ? cache.maxSize : 100,
    ttl: typeof cache === 'object' ? cache.ttl : 1000 * 60 * 60 // 1 hour
  }) : null;

  // Register custom filters
  Object.entries(filters).forEach(([name, fn]) => {
    // Register with formatr core
  });

  return (req: any, res: any, next: any) => {
    // Add formatr method to response
    res.formatr = async function(templateName: string, context: any) {
      try {
        const templatePath = path.join(templatesDir, `${templateName}${extension}`);
        let template = templateCache?.get(templatePath);

        if (!template) {
          template = await fs.readFile(templatePath, 'utf-8');
          if (templateCache) {
            templateCache.set(templatePath, template);
          }
        }

        const result = format(template, context);
        res.send(result);
      } catch (error) {
        next(error);
      }
    };

    res.formatrAsync = async function(templateName: string, context: any) {
      try {
        const templatePath = path.join(templatesDir, `${templateName}${extension}`);
        let template = templateCache?.get(templatePath);

        if (!template) {
          template = await fs.readFile(templatePath, 'utf-8');
          if (templateCache) {
            templateCache.set(templatePath, template);
          }
        }

        const result = await formatAsync(template, context);
        res.send(result);
      } catch (error) {
        next(error);
      }
    };

    next();
  };
}
```

### React Implementation Example

```typescript
// packages/react/src/useFormat.ts
import { useMemo } from 'react';
import { format } from 'formatr';
import { useFormatrContext } from './FormatrProvider';

export function useFormat(template: string, context: Record<string, any>): string {
  const { filters } = useFormatrContext();

  return useMemo(() => {
    // Apply custom filters from context
    return format(template, context);
  }, [template, context, filters]);
}
```

```typescript
// packages/react/src/useAsyncFormat.ts
import { use } from 'react';
import { formatAsync } from 'formatr';
import { useFormatrContext } from './FormatrProvider';

export function useAsyncFormat(
  template: string,
  context: Record<string, any>
): string {
  const { filters } = useFormatrContext();

  // Use React's `use` hook for Suspense support
  const promise = useMemo(() => {
    return formatAsync(template, context);
  }, [template, context, filters]);

  return use(promise);
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// Express middleware tests
describe('formatrMiddleware', () => {
  it('should add formatr method to response', () => {
    const middleware = formatrMiddleware({ templatesDir: './templates' });
    const req = {};
    const res = {};
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.formatr).toBeDefined();
    expect(typeof res.formatr).toBe('function');
  });

  it('should render template with context', async () => {
    // Test implementation
  });
});

// React hooks tests
describe('useFormat', () => {
  it('should format template with context', () => {
    const { result } = renderHook(() =>
      useFormat('Hello {name}', { name: 'World' })
    );

    expect(result.current).toBe('Hello World');
  });

  it('should re-render when context changes', () => {
    // Test implementation
  });
});
```

### Integration Tests

```typescript
// Full framework integration tests
describe('Express Integration', () => {
  it('should render template in HTTP response', async () => {
    const app = express();
    app.use(formatrMiddleware({ templatesDir: './test-templates' }));

    app.get('/test', (req, res) => {
      res.formatr('test', { message: 'Hello' });
    });

    const response = await request(app).get('/test');
    expect(response.text).toContain('Hello');
  });
});
```

### Performance Tests

```typescript
describe('Performance', () => {
  it('should cache templates effectively', async () => {
    // Measure cache hit rate
  });

  it('should handle SSR at scale', async () => {
    // Benchmark SSR rendering
  });
});
```

---

## Backwards Compatibility

**No Breaking Changes:**
- All integrations are new additions
- Core formatr API remains unchanged
- Integrations are opt-in via separate packages

**Migration Path:**
Developers using custom integrations can migrate to official packages:

```typescript
// Before: custom integration
app.use((req, res, next) => {
  res.formatr = (template, context) => {
    // Custom implementation
  };
  next();
});

// After: official integration
import { formatrMiddleware } from '@formatr/express';
app.use(formatrMiddleware({ templatesDir: './templates' }));
```

---

## Potential Pitfalls

### 1. **Framework Version Compatibility**
Different framework versions may have breaking changes.

**Mitigation:**
- Maintain compatibility matrix
- Test against multiple framework versions
- Clear documentation of supported versions

### 2. **Bundle Size Concerns**
Each integration adds dependencies.

**Mitigation:**
- Keep integrations lightweight
- Mark framework as peer dependency
- Tree-shaking support

### 3. **SSR Hydration Issues**
Mismatch between server and client rendering.

**Mitigation:**
- Consistent rendering logic
- Proper hydration testing
- Documentation on SSR best practices

### 4. **Cache Invalidation**
Stale templates in production.

**Mitigation:**
- Proper cache invalidation strategies
- Watch mode in development
- Manual cache clearing API

### 5. **Type Safety**
Generic context types may be hard to infer.

**Mitigation:**
- Comprehensive TypeScript support
- Type helpers and utilities
- Good documentation

---

## Future Extensions

### 1. Additional Framework Support
- Angular integration
- Svelte integration
- Solid.js integration

### 2. Advanced Caching
- Redis cache backend
- CDN integration
- Distributed caching

### 3. Streaming Improvements
- Progressive rendering
- Partial hydration
- Islands architecture support

### 4. Developer Tools
- Browser DevTools extension
- Template debugger
- Performance profiler

### 5. Build-Time Optimizations
- Template precompilation
- Dead code elimination
- Static extraction

---

## Open Questions

1. Should we maintain separate packages or monorepo?
2. What's the minimum supported version for each framework?
3. How to handle framework-specific features without coupling?
4. Should integrations be published before or after core async support?
5. What's the release cadence for integration packages?

---

## References

- [Express.js Documentation](https://expressjs.com/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Vue.js Documentation](https://vuejs.org/)

---

**Ready for Implementation**: ⏳ Pending Review