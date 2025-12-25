import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { 
  readFile as utilReadFile,
  writeFile as utilWriteFile,
  pathExists,
  isDirectory,
  isFile,
  findFiles,
} from '../src/utils/file-handler';

describe('file-handler', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `formatr-file-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('readFile', () => {
    it('should read file contents', async () => {
      const filePath = join(testDir, 'test.txt');
      await writeFile(filePath, 'Hello World');
      
      const content = await utilReadFile(filePath);
      expect(content).toBe('Hello World');
    });
  });

  describe('writeFile', () => {
    it('should write file contents', async () => {
      const filePath = join(testDir, 'output.txt');
      await utilWriteFile(filePath, 'Test content');
      
      const content = await readFile(filePath, 'utf-8');
      expect(content).toBe('Test content');
    });

    it('should create directories if needed', async () => {
      const filePath = join(testDir, 'nested', 'dir', 'file.txt');
      await utilWriteFile(filePath, 'Nested content');
      
      const content = await readFile(filePath, 'utf-8');
      expect(content).toBe('Nested content');
    });
  });

  describe('pathExists', () => {
    it('should return true for existing path', async () => {
      const filePath = join(testDir, 'exists.txt');
      await writeFile(filePath, 'content');
      
      expect(pathExists(filePath)).toBe(true);
    });

    it('should return false for non-existing path', () => {
      expect(pathExists(join(testDir, 'does-not-exist.txt'))).toBe(false);
    });
  });

  describe('isDirectory', () => {
    it('should return true for directory', async () => {
      expect(await isDirectory(testDir)).toBe(true);
    });

    it('should return false for file', async () => {
      const filePath = join(testDir, 'file.txt');
      await writeFile(filePath, 'content');
      
      expect(await isDirectory(filePath)).toBe(false);
    });
  });

  describe('isFile', () => {
    it('should return true for file', async () => {
      const filePath = join(testDir, 'file.txt');
      await writeFile(filePath, 'content');
      
      expect(await isFile(filePath)).toBe(true);
    });

    it('should return false for directory', async () => {
      expect(await isFile(testDir)).toBe(false);
    });
  });

  describe('findFiles', () => {
    it('should find files with matching extension', async () => {
      await writeFile(join(testDir, 'a.fmt'), 'content');
      await writeFile(join(testDir, 'b.fmt'), 'content');
      await writeFile(join(testDir, 'c.txt'), 'content');
      
      const files = await findFiles(testDir, ['.fmt'], false);
      expect(files).toHaveLength(2);
      expect(files.some(f => f.endsWith('a.fmt'))).toBe(true);
      expect(files.some(f => f.endsWith('b.fmt'))).toBe(true);
    });

    it('should find files recursively', async () => {
      const subDir = join(testDir, 'subdir');
      await mkdir(subDir);
      
      await writeFile(join(testDir, 'root.fmt'), 'content');
      await writeFile(join(subDir, 'nested.fmt'), 'content');
      
      const files = await findFiles(testDir, ['.fmt'], true);
      expect(files).toHaveLength(2);
    });
  });
});
