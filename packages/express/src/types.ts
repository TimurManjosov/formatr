import type { Request, Response } from 'express';

declare global {
  namespace Express {
    interface Response {
      /**
       * Render a formatr template and send as response
       * @param templateName - Name of the template file (without extension)
       * @param context - Context data for the template
       */
      formatr(templateName: string, context: any): Promise<void>;

      /**
       * Render a formatr template asynchronously (supports async filters)
       * @param templateName - Name of the template file (without extension)
       * @param context - Context data for the template
       */
      formatrAsync(templateName: string, context: any): Promise<void>;

      /**
       * Stream a formatr template response
       * @param templateName - Name of the template file (without extension)
       * @param context - Context data for the template
       */
      formatrStream(templateName: string, context: any): Promise<void>;
    }
  }
}

export {};
