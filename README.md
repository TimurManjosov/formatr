# formatr

Elegant, typed string formatting for TypeScript.

```ts
import { template } from 'formatr';
const greet = template<{ name: string }>('Hello {name}');
console.log(greet({ name: 'World' })); // Hello World
```
