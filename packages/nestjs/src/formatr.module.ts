import { Module } from '@nestjs/common';
import type { DynamicModule, Provider } from '@nestjs/common';
import { FormatrService } from './formatr.service';
import type { TemplateLoaderOptions } from '@formatr/shared';

export interface FormatrModuleOptions extends TemplateLoaderOptions {
  filters?: Record<string, (value: unknown) => unknown>;
  asyncFilters?: Record<string, (value: unknown) => Promise<unknown>>;
}

export const FORMATR_OPTIONS = 'FORMATR_OPTIONS';

@Module({})
export class FormatrModule {
  static register(options: FormatrModuleOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: FORMATR_OPTIONS,
      useValue: options,
    };

    return {
      module: FormatrModule,
      providers: [optionsProvider, FormatrService],
      exports: [FormatrService],
      global: true,
    };
  }
}
