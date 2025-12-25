/**
 * File handling utilities for the CLI
 */
import { readFile as fsReadFile, writeFile as fsWriteFile, mkdir, stat, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, extname, relative, resolve, isAbsolute } from 'node:path';

/**
 * Read a file and return its contents as a string
 */
export async function readFile(filePath: string): Promise<string> {
  const absolutePath = isAbsolute(filePath) ? filePath : resolve(process.cwd(), filePath);
  return fsReadFile(absolutePath, 'utf-8');
}

/**
 * Write content to a file, creating directories if needed
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  const absolutePath = isAbsolute(filePath) ? filePath : resolve(process.cwd(), filePath);
  const dir = dirname(absolutePath);
  
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  
  await fsWriteFile(absolutePath, content, 'utf-8');
}

/**
 * Check if a path exists
 * Note: Uses synchronous existsSync for simplicity in CLI path validation.
 * This is a common pattern in CLI tools where the blocking is acceptable.
 */
export function pathExists(filePath: string): boolean {
  const absolutePath = isAbsolute(filePath) ? filePath : resolve(process.cwd(), filePath);
  return existsSync(absolutePath);
}

/**
 * Check if a path is a directory
 */
export async function isDirectory(filePath: string): Promise<boolean> {
  try {
    const absolutePath = isAbsolute(filePath) ? filePath : resolve(process.cwd(), filePath);
    const stats = await stat(absolutePath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if a path is a file
 */
export async function isFile(filePath: string): Promise<boolean> {
  try {
    const absolutePath = isAbsolute(filePath) ? filePath : resolve(process.cwd(), filePath);
    const stats = await stat(absolutePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

/**
 * Find files matching extensions recursively
 */
export async function findFiles(
  dir: string,
  extensions: string[],
  recursive = true
): Promise<string[]> {
  const absoluteDir = isAbsolute(dir) ? dir : resolve(process.cwd(), dir);
  const results: string[] = [];
  
  async function walk(currentDir: string): Promise<void> {
    const entries = await readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      
      if (entry.isDirectory() && recursive) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (extensions.length === 0 || extensions.includes(ext)) {
          results.push(fullPath);
        }
      }
    }
  }
  
  await walk(absoluteDir);
  return results;
}

/**
 * Expand glob patterns (simple implementation)
 */
export async function expandGlob(pattern: string, baseDir: string = process.cwd()): Promise<string[]> {
  const absoluteBase = isAbsolute(baseDir) ? baseDir : resolve(process.cwd(), baseDir);
  
  // Handle simple patterns
  if (!pattern.includes('*')) {
    const fullPath = isAbsolute(pattern) ? pattern : join(absoluteBase, pattern);
    if (existsSync(fullPath)) {
      return [fullPath];
    }
    return [];
  }
  
  // Handle *.ext patterns
  if (pattern.startsWith('*.')) {
    const ext = extname(pattern);
    return findFiles(absoluteBase, [ext], false);
  }
  
  // Handle **/*.ext patterns
  if (pattern.startsWith('**/*.')) {
    const ext = extname(pattern);
    return findFiles(absoluteBase, [ext], true);
  }
  
  // Handle directory/* patterns
  if (pattern.endsWith('/*')) {
    const dirPart = pattern.slice(0, -2);
    const targetDir = isAbsolute(dirPart) ? dirPart : join(absoluteBase, dirPart);
    return findFiles(targetDir, [], false);
  }
  
  // Handle directory/**/* patterns
  if (pattern.endsWith('/**/*')) {
    const dirPart = pattern.slice(0, -5);
    const targetDir = isAbsolute(dirPart) ? dirPart : join(absoluteBase, dirPart);
    return findFiles(targetDir, [], true);
  }
  
  // Default: treat as literal path
  const fullPath = isAbsolute(pattern) ? pattern : join(absoluteBase, pattern);
  if (existsSync(fullPath)) {
    return [fullPath];
  }
  return [];
}

/**
 * Get relative path from current directory
 */
export function getRelativePath(filePath: string): string {
  const absolutePath = isAbsolute(filePath) ? filePath : resolve(process.cwd(), filePath);
  return relative(process.cwd(), absolutePath);
}

/**
 * Resolve a path to absolute
 */
export function resolvePath(filePath: string): string {
  return isAbsolute(filePath) ? filePath : resolve(process.cwd(), filePath);
}
