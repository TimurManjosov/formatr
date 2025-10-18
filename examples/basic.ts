import { template } from '../src';

const t = template<{ name: string; count: number }>(
  'Hello {name|upper}, you have {count|plural:message, messages}'
);
console.log(t({ name: 'Lara', count: 1 }));
console.log(t({ name: 'Lara', count: 2 }));
