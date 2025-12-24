# @formatr/express

Express.js middleware for formatr template engine.

## Installation

```bash
npm install @formatr/express @timur_manjosov/formatr express
```

## Usage

### Basic Setup

```typescript
import express from 'express';
import { formatrMiddleware } from '@formatr/express';

const app = express();

app.use(formatrMiddleware({
  templatesDir: './templates',
  extension: '.txt',
  cache: true,
}));

app.get('/hello', async (req, res) => {
  await res.formatr('greeting', { name: 'World' });
});

app.listen(3000);
```

### With Custom Filters

```typescript
app.use(formatrMiddleware({
  templatesDir: './templates',
  filters: {
    currency: (value) => `$${Number(value).toFixed(2)}`,
    upper: (value) => String(value).toUpperCase(),
  },
}));

app.get('/invoice', async (req, res) => {
  await res.formatr('invoice', {
    customer: 'John Doe',
    total: 99.99,
  });
});
```

### Async Rendering

For templates with async filters:

```typescript
app.get('/user/:id', async (req, res) => {
  await res.formatrAsync('user-profile', {
    userId: req.params.id,
  });
});
```

### Streaming Large Templates

```typescript
app.get('/report', async (req, res) => {
  await res.formatrStream('large-report', {
    data: largeDataset,
  });
});
```

## API

### `formatrMiddleware(options)`

Options:
- `templatesDir` (string, required): Directory containing template files
- `extension` (string, optional): File extension for templates (default: '.txt')
- `cache` (boolean | object, optional): Enable caching (default: false)
  - If object: `{ ttl: number, maxSize: number }`
- `filters` (object, optional): Custom filter functions
- `errorHandler` (function, optional): Custom error handler

### Response Methods

Added to Express response object:

- `res.formatr(templateName, context)`: Render template synchronously
- `res.formatrAsync(templateName, context)`: Render with async filter support
- `res.formatrStream(templateName, context)`: Stream template response

## License

MIT
