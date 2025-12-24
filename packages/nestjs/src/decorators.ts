import { SetMetadata } from '@nestjs/common';

export const FORMATR_TEMPLATE_KEY = 'formatr:template';

/**
 * Decorator to specify a formatr template for a controller method
 * @param templateName - Name of the template to render
 */
export const FormatrResponse = (templateName: string) =>
  SetMetadata(FORMATR_TEMPLATE_KEY, templateName);
