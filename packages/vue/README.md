# @formatr/vue

Vue 3 composables and components for formatr template engine with reactive support.

## Installation

```bash
npm install @formatr/vue @timur_manjosov/formatr vue
```

## Usage

### Basic Composable

```vue
<script setup>
import { ref } from 'vue';
import { useFormat } from '@formatr/vue';

const name = ref('World');
const formatted = useFormat('Hello, {name}!', { name });

// Updates automatically when name changes
</script>

<template>
  <div>{{ formatted }}</div>
  <input v-model="name" />
</template>
```

### With Plugin

```typescript
import { createApp } from 'vue';
import { FormatrPlugin } from '@formatr/vue';
import App from './App.vue';

const app = createApp(App);

app.use(FormatrPlugin, {
  filters: {
    upper: (v) => String(v).toUpperCase(),
    currency: (v) => `$${Number(v).toFixed(2)}`,
  },
  locale: 'en-US',
});

app.mount('#app');
```

### Component API

```vue
<script setup>
import { ref } from 'vue';
import { Formatr } from '@formatr/vue';

const price = ref(99.99);
</script>

<template>
  <Formatr
    template="Price: {price|currency}"
    :context="{ price }"
  />
</template>
```

### Reactive Context

The composable automatically tracks reactive dependencies:

```vue
<script setup>
import { ref, reactive } from 'vue';
import { useFormat } from '@formatr/vue';

const user = reactive({
  name: 'Alice',
  age: 30,
});

const formatted = useFormat(
  'User: {name} (age: {age})',
  user
);

// Updates when user.name or user.age changes
</script>

<template>
  <div>{{ formatted }}</div>
  <button @click="user.age++">Increment Age</button>
</template>
```

## API

### `FormatrPlugin`

Vue plugin for global configuration.

Options:
- `filters`: Custom filter functions (optional)
- `locale`: Locale for internationalization (optional)

### `useFormat(template, context)`

Composable for reactive template formatting.

Parameters:
- `template`: Template string (can be ref or reactive)
- `context`: Context data object (can be ref or reactive)

Returns: Computed ref with formatted string

### `Formatr`

Component for rendering templates.

Props:
- `template`: Template string
- `context`: Context data object

## License

MIT
