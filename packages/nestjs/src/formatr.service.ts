import { Injectable, Inject } from '@nestjs/common';
import { template, templateAsync } from '@timur_manjosov/formatr';
import { TemplateLoader } from '@formatr/shared';
import { FORMATR_OPTIONS, type FormatrModuleOptions } from './formatr.module';

@Injectable()
export class FormatrService {
  private loader: TemplateLoader;
  private filters: Record<string, (value: unknown) => unknown>;
  private asyncFilters: Record<string, (value: unknown) => Promise<unknown>>;

  constructor(@Inject(FORMATR_OPTIONS) private options: FormatrModuleOptions) {
    this.loader = new TemplateLoader(options);
    this.filters = options.filters || {};
    this.asyncFilters = options.asyncFilters || {};
  }

  /**
   * Render a template synchronously
   * @param templateName - Name of the template file
   * @param context - Context data for the template
   * @returns Rendered template string
   */
  async render(templateName: string, context: any): Promise<string> {
    const source = await this.loader.load(templateName);
    const compiled = template(source, { filters: this.filters });
    return compiled(context);
  }

  /**
   * Render a template with async filter support
   * @param templateName - Name of the template file
   * @param context - Context data for the template
   * @returns Promise of rendered template string
   */
  async renderAsync(templateName: string, context: any): Promise<string> {
    const source = await this.loader.load(templateName);
    const allFilters = { ...this.filters, ...this.asyncFilters };
    const compiled = templateAsync(source, { filters: allFilters });
    return await compiled(context);
  }
}
