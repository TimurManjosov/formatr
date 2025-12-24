import { promises as fs } from 'fs';
import * as path from 'path';
import { TemplateCache } from './cache';

export interface TemplateLoaderOptions {
  templatesDir: string;
  extension?: string;
  cache?: boolean | { ttl: number; maxSize: number };
}

export class TemplateLoader {
  private readonly templatesDir: string;
  private readonly extension: string;
  private readonly cache: TemplateCache<string> | null;

  constructor(options: TemplateLoaderOptions) {
    this.templatesDir = options.templatesDir;
    this.extension = options.extension || '.txt';
    
    if (options.cache) {
      const cacheOpts = typeof options.cache === 'boolean'
        ? { maxSize: 100, ttl: 1000 * 60 * 60 } // 1 hour default
        : options.cache;
      this.cache = new TemplateCache(cacheOpts);
    } else {
      this.cache = null;
    }
  }

  async load(templateName: string): Promise<string> {
    const templatePath = this.resolvePath(templateName);
    
    // Check cache first
    if (this.cache) {
      const cached = this.cache.get(templatePath);
      if (cached !== undefined) {
        return cached;
      }
    }

    // Load from file system
    const template = await fs.readFile(templatePath, 'utf-8');
    
    // Store in cache
    if (this.cache) {
      this.cache.set(templatePath, template);
    }

    return template;
  }

  resolvePath(templateName: string): string {
    // If template name doesn't have extension, add it
    const name = templateName.endsWith(this.extension) 
      ? templateName 
      : `${templateName}${this.extension}`;
    return path.join(this.templatesDir, name);
  }

  clearCache(): void {
    this.cache?.clear();
  }
}
