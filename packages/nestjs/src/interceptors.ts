import { Injectable } from '@nestjs/common';
import type {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { FormatrService } from './formatr.service';
import { FORMATR_TEMPLATE_KEY } from './decorators';

/**
 * Interceptor that automatically renders responses using formatr templates
 * when the @FormatrResponse decorator is used
 */
@Injectable()
export class FormatrInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly formatrService: FormatrService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const templateName = this.reflector.get<string>(
      FORMATR_TEMPLATE_KEY,
      context.getHandler(),
    );

    if (!templateName) {
      return next.handle();
    }

    return next.handle().pipe(
      map(async (data) => {
        if (typeof data === 'object' && data !== null) {
          return await this.formatrService.render(templateName, data);
        }
        return data;
      }),
    );
  }
}
