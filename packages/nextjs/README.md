# @formatr/nextjs

Next.js integration for formatr template engine with SSR/SSG support.

## Installation

```bash
npm install @formatr/nextjs @timur_manjosov/formatr next react
```

## Usage

### Configuration

```typescript
// next.config.js
import { withFormatr } from '@formatr/nextjs';

export default withFormatr({
  formatr: {
    templatesDir: './templates',
    cache: true,
    precompile: true,
  },
});
```

### Server-Side Rendering (App Router)

```typescript
// app/blog/[slug]/page.tsx
import { configureFormatr, formatr } from '@formatr/nextjs';

// Configure once (e.g., in layout or middleware)
configureFormatr({
  templatesDir: './templates',
  cache: true,
});

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  
  const content = await formatr('blog-post', {
    title: post.title,
    author: post.author,
    content: post.content,
  });
  
  return <div dangerouslySetInnerHTML={{ __html: content }} />;
}
```

### Server-Side Rendering (Pages Router)

```typescript
// pages/posts/[id].tsx
import { GetServerSideProps } from 'next';
import { configureFormatr, formatr } from '@formatr/nextjs';

configureFormatr({
  templatesDir: './templates',
  cache: true,
});

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const post = await getPost(params?.id as string);
  
  const content = await formatr('post', {
    title: post.title,
    body: post.body,
  });
  
  return { props: { content } };
};

export default function Post({ content }: { content: string }) {
  return <div>{content}</div>;
}
```

### Static Site Generation

```typescript
export const getStaticProps = async () => {
  const content = await formatr('homepage', {
    title: 'Welcome',
    description: 'Static content',
  });
  
  return { props: { content } };
};
```

### Client-Side Hook

```tsx
'use client';

import { useFormatr } from '@formatr/nextjs';

export function ClientGreeting({ name }: { name: string }) {
  const message = useFormatr('Hello, {name}!', { name });
  return <div>{message}</div>;
}
```

### Async Rendering

```typescript
import { formatrAsync } from '@formatr/nextjs';

export default async function UserProfile({ userId }: { userId: string }) {
  const content = await formatrAsync('user-profile', {
    userId,
  });
  
  return <div>{content}</div>;
}
```

## API

### `withFormatr(nextConfig)`

Next.js configuration wrapper.

Options:
- `formatr.templatesDir`: Template directory
- `formatr.cache`: Enable caching
- `formatr.precompile`: Precompile templates at build time (future)

### `configureFormatr(options)`

Configure formatr for server-side use.

Options:
- `templatesDir` (required): Template directory
- `cache`: Enable caching
- `filters`: Custom filters

### `formatr(templateName, context)`

Render template on server (SSR/SSG).

### `formatrAsync(templateName, context)`

Render template with async filter support.

### `useFormatr(template, context, filters?)`

Client-side hook for template rendering.

## License

MIT
