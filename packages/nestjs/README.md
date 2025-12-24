# @formatr/nestjs

NestJS module for formatr template engine with dependency injection support.

## Installation

```bash
npm install @formatr/nestjs @timur_manjosov/formatr @nestjs/common @nestjs/core
```

## Usage

### Module Registration

```typescript
import { Module } from '@nestjs/common';
import { FormatrModule } from '@formatr/nestjs';

@Module({
  imports: [
    FormatrModule.register({
      templatesDir: './templates',
      cache: true,
      filters: {
        currency: (value) => `$${Number(value).toFixed(2)}`,
      },
    }),
  ],
})
export class AppModule {}
```

### Using the Service

```typescript
import { Injectable } from '@nestjs/common';
import { FormatrService } from '@formatr/nestjs';

@Injectable()
export class EmailService {
  constructor(private readonly formatr: FormatrService) {}

  async sendWelcomeEmail(userId: number, userName: string) {
    const html = await this.formatr.render('welcome-email', {
      userId,
      userName,
    });
    
    // Send email...
  }
}
```

### Using the Decorator

```typescript
import { Controller, Get } from '@nestjs/common';
import { FormatrResponse } from '@formatr/nestjs';

@Controller('reports')
export class ReportsController {
  @Get('monthly')
  @FormatrResponse('monthly-report')
  getMonthlyReport() {
    return {
      month: 'December',
      revenue: 150000,
      expenses: 75000,
    };
  }
}
```

### Async Filters

```typescript
FormatrModule.register({
  templatesDir: './templates',
  asyncFilters: {
    fetchUser: async (userId) => {
      return await userService.findById(userId);
    },
  },
}),
```

Then use `renderAsync`:

```typescript
const html = await this.formatr.renderAsync('user-profile', { userId: 123 });
```

## API

### `FormatrModule.register(options)`

Options:
- `templatesDir` (string, required): Directory containing template files
- `extension` (string, optional): File extension for templates
- `cache` (boolean | object, optional): Enable caching
- `filters` (object, optional): Synchronous custom filters
- `asyncFilters` (object, optional): Asynchronous custom filters

### `FormatrService`

Methods:
- `render(templateName, context)`: Render template synchronously
- `renderAsync(templateName, context)`: Render with async filter support

### `@FormatrResponse(templateName)`

Decorator to automatically render controller responses using a template.

### `FormatrInterceptor`

Interceptor for automatic template rendering (use with `@FormatrResponse`).

## License

MIT
