# @formatr/react

React hooks and components for formatr template engine.

## Installation

```bash
npm install @formatr/react @timur_manjosov/formatr react
```

## Usage

### Basic Hook

```tsx
import { useFormat } from '@formatr/react';

function Greeting({ name }: { name: string }) {
  const message = useFormat('Hello, {name}!', { name });
  return <div>{message}</div>;
}
```

### With Provider

```tsx
import { FormatrProvider, useFormat } from '@formatr/react';

function App() {
  return (
    <FormatrProvider
      filters={{
        upper: (v) => String(v).toUpperCase(),
        currency: (v) => `$${Number(v).toFixed(2)}`,
      }}
      locale="en-US"
    >
      <MyComponent />
    </FormatrProvider>
  );
}

function MyComponent() {
  const formatted = useFormat('{price|currency}', { price: 99.99 });
  return <div>{formatted}</div>;
}
```

### Async with Suspense

```tsx
import { Suspense } from 'react';
import { useAsyncFormat } from '@formatr/react';

function UserProfile({ userId }: { userId: number }) {
  const message = useAsyncFormat(
    'User: {userId|fetchUser.name}',
    { userId }
  );
  return <div>{message}</div>;
}

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfile userId={123} />
    </Suspense>
  );
}
```

### Component API

```tsx
import { Format } from '@formatr/react';

function Invoice({ total }: { total: number }) {
  return (
    <Format
      template="Total: {total|currency}"
      context={{ total }}
    />
  );
}
```

## API

### `FormatrProvider`

Props:
- `children`: React children
- `filters`: Custom filter functions (optional)
- `locale`: Locale for internationalization (optional)

### `useFormat(template, context)`

Hook for synchronous template rendering.

Parameters:
- `template`: Template string with placeholders
- `context`: Context data object

Returns: Formatted string

### `useAsyncFormat(template, context)`

Hook for async template rendering with Suspense support.

Parameters:
- `template`: Template string with placeholders
- `context`: Context data object

Returns: Formatted string (suspends while loading)

### `Format`

Component for rendering templates.

Props:
- `template`: Template string
- `context`: Context data object

## License

MIT
