/**
 * Data parsing utilities - supports JSON and YAML
 */
import { readFile } from './file-handler.js';

/**
 * Supported data formats
 */
export type DataFormat = 'json' | 'yaml' | 'auto';

/**
 * Parse a JSON string
 */
function parseJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON: ${message}`);
  }
}

/**
 * Parse a YAML string (lazy-loaded)
 */
async function parseYaml(content: string): Promise<unknown> {
  try {
    // Lazy load yaml package
    const yamlModule = await import('yaml');
    return yamlModule.parse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('Cannot find module')) {
      throw new Error('YAML support requires the "yaml" package. Install it with: npm install yaml');
    }
    throw new Error(`Invalid YAML: ${message}`);
  }
}

/**
 * Detect format from file extension
 */
function detectFormat(filePath: string): DataFormat {
  const lowerPath = filePath.toLowerCase();
  if (lowerPath.endsWith('.yaml') || lowerPath.endsWith('.yml')) {
    return 'yaml';
  }
  if (lowerPath.endsWith('.json')) {
    return 'json';
  }
  return 'auto';
}

/**
 * Auto-detect format from content
 */
function detectFormatFromContent(content: string): DataFormat {
  const trimmed = content.trim();
  // JSON typically starts with { or [
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return 'json';
  }
  // Assume YAML for everything else
  return 'yaml';
}

/**
 * Parse data from a string with format detection
 */
export async function parseDataString(
  content: string,
  format: DataFormat = 'auto'
): Promise<unknown> {
  const effectiveFormat = format === 'auto' ? detectFormatFromContent(content) : format;
  
  if (effectiveFormat === 'json') {
    return parseJson(content);
  }
  
  return parseYaml(content);
}

/**
 * Parse data from a file or inline string
 */
export async function parseData(
  input: string,
  format: DataFormat = 'auto'
): Promise<unknown> {
  // Check if it looks like inline JSON/YAML (starts with { or [)
  const trimmed = input.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return parseDataString(trimmed, format);
  }
  
  // Otherwise treat as file path
  const content = await readFile(input);
  const effectiveFormat = format === 'auto' ? detectFormat(input) : format;
  return parseDataString(content, effectiveFormat);
}

/**
 * Serialize data to a format
 */
export async function serializeData(
  data: unknown,
  format: 'json' | 'yaml' = 'json'
): Promise<string> {
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }
  
  try {
    const yamlModule = await import('yaml');
    return yamlModule.stringify(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('Cannot find module')) {
      throw new Error('YAML support requires the "yaml" package. Install it with: npm install yaml');
    }
    throw new Error(`Failed to serialize YAML: ${message}`);
  }
}
