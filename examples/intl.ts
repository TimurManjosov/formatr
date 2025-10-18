import { template } from '../src';
const t = template('{n|currency:EUR}', { locale: 'de' });
console.log(t({ n: 12.5 }));
