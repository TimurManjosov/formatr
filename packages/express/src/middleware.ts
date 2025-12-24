import type { Request, Response, NextFunction } from 'express';
import { template, templateAsync } from '@timur_manjosov/formatr';
import { TemplateLoader, type TemplateLoaderOptions } from '@formatr/shared';
import { Readable } from 'stream';

export interface FormatrMiddlewareOptions extends TemplateLoaderOptions {
  filters?: Record<string, (value: unknown) => unknown>;
  errorHandler?: (error: Error, req: Request, res: Response) => void;
}

/**
 * Express middleware that adds formatr template rendering methods to the response object.
 * 
 * @param options - Configuration options
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * import express from 'express';
 * import { formatrMiddleware } from '@formatr/express';
 * 
 * const app = express();
 * 
 * app.use(formatrMiddleware({
 *   templatesDir: './templates',
 *   cache: true,
 *   filters: {
 *     currency: (value) => `$${Number(value).toFixed(2)}`,
 *   },
 * }));
 * 
 * app.get('/hello', (req, res) => {
 *   res.formatr('greeting', { name: 'World' });
 * });
 * ```
 */
export function formatrMiddleware(options: FormatrMiddlewareOptions) {
  const loader = new TemplateLoader(options);
  const filters = options.filters || {};

  const defaultErrorHandler = (error: Error, req: Request, res: Response) => {
    console.error('Formatr template error:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).send(isDev ? error.message : 'Internal Server Error');
  };

  const errorHandler = options.errorHandler || defaultErrorHandler;

  return (req: Request, res: Response, next: NextFunction) => {
    /**
     * Render a template synchronously and send as response
     */
    res.formatr = async function (templateName: string, context: any) {
      try {
        const source = await loader.load(templateName);
        const compiled = template(source, { filters });
        const result = compiled(context);
        res.send(result);
      } catch (error) {
        errorHandler(error as Error, req, res);
      }
    };

    /**
     * Render a template asynchronously (supports async filters) and send as response
     */
    res.formatrAsync = async function (templateName: string, context: any) {
      try {
        const source = await loader.load(templateName);
        const compiled = templateAsync(source, { filters });
        const result = await compiled(context);
        res.send(result);
      } catch (error) {
        errorHandler(error as Error, req, res);
      }
    };

    /**
     * Stream a template response (for large templates)
     */
    res.formatrStream = async function (templateName: string, context: any) {
      try {
        const source = await loader.load(templateName);
        const compiled = template(source, { filters });
        const result = compiled(context);
        
        // Create a readable stream from the result
        const stream = Readable.from([result]);
        stream.pipe(res);
      } catch (error) {
        errorHandler(error as Error, req, res);
      }
    };

    next();
  };
}
