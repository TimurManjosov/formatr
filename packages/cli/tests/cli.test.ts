import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const CLI_PATH = join(__dirname, '..', 'dist', 'cli.js');

// Helper to run CLI commands
async function runCli(args: string[], options: { cwd?: string; input?: string } = {}): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  return new Promise((resolve) => {
    const proc = spawn('node', [CLI_PATH, ...args], {
      cwd: options.cwd ?? process.cwd(),
      env: { ...process.env, NO_COLOR: '1' },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    if (options.input) {
      proc.stdin.write(options.input);
      proc.stdin.end();
    }

    proc.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 0,
      });
    });
  });
}

describe('CLI', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `formatr-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('--help', () => {
    it('should display help information', async () => {
      const result = await runCli(['--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('CLI tools for the formatr template library');
      expect(result.stdout).toContain('render');
      expect(result.stdout).toContain('validate');
      expect(result.stdout).toContain('analyze');
    });
  });

  describe('--version', () => {
    it('should display version', async () => {
      const result = await runCli(['--version']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    });
  });

  describe('render', () => {
    it('should render a template from file', async () => {
      const templatePath = join(testDir, 'template.fmt');
      const dataPath = join(testDir, 'data.json');
      
      await writeFile(templatePath, 'Hello {name|upper}!');
      await writeFile(dataPath, JSON.stringify({ name: 'world' }));
      
      const result = await runCli(['render', templatePath, '--data', dataPath], { cwd: testDir });
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('Hello WORLD!');
    });

    it('should render a template from stdin', async () => {
      const dataPath = join(testDir, 'data.json');
      await writeFile(dataPath, JSON.stringify({ name: 'piped' }));
      
      const result = await runCli(['render', '--data', dataPath], { 
        cwd: testDir,
        input: 'Hello {name|upper}!',
      });
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('Hello PIPED!');
    });

    it('should output to file with --output', async () => {
      const templatePath = join(testDir, 'template.fmt');
      const dataPath = join(testDir, 'data.json');
      const outputPath = join(testDir, 'output.txt');
      
      await writeFile(templatePath, 'Hello {name}!');
      await writeFile(dataPath, JSON.stringify({ name: 'World' }));
      
      const result = await runCli(['render', templatePath, '--data', dataPath, '--output', outputPath], { cwd: testDir });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Output written to');
    });
  });

  describe('validate', () => {
    it('should validate a valid template', async () => {
      const templatePath = join(testDir, 'valid.fmt');
      await writeFile(templatePath, 'Hello {name|upper}!');
      
      const result = await runCli(['validate', templatePath], { cwd: testDir });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('valid');
    });

    it('should detect invalid template syntax', async () => {
      const templatePath = join(testDir, 'invalid.fmt');
      await writeFile(templatePath, 'Hello {name|unknownfilter}!');
      
      const result = await runCli(['validate', templatePath], { cwd: testDir });
      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('Unknown filter');
    });

    it('should output JSON with --json', async () => {
      const templatePath = join(testDir, 'template.fmt');
      await writeFile(templatePath, 'Hello {name}!');
      
      const result = await runCli(['validate', templatePath, '--json'], { cwd: testDir });
      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout);
      expect(json).toBeInstanceOf(Array);
      expect(json[0]).toHaveProperty('file');
      expect(json[0]).toHaveProperty('valid');
    });
  });

  describe('analyze', () => {
    it('should analyze template complexity', async () => {
      const templatePath = join(testDir, 'template.fmt');
      await writeFile(templatePath, 'Hello {name|upper}! You have {count} messages.');
      
      const result = await runCli(['analyze', templatePath], { cwd: testDir });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Complexity');
      expect(result.stdout).toContain('Placeholders');
    });

    it('should output JSON with --json', async () => {
      const templatePath = join(testDir, 'template.fmt');
      await writeFile(templatePath, 'Hello {name}!');
      
      const result = await runCli(['analyze', templatePath, '--json'], { cwd: testDir });
      expect(result.exitCode).toBe(0);
      const json = JSON.parse(result.stdout);
      expect(json).toBeInstanceOf(Array);
      expect(json[0]).toHaveProperty('complexity');
      expect(json[0]).toHaveProperty('placeholderCount');
    });
  });

  describe('lint', () => {
    it('should lint a clean template', async () => {
      const templatePath = join(testDir, 'clean.fmt');
      await writeFile(templatePath, 'Hello {name}!\n');
      
      const result = await runCli(['lint', templatePath], { cwd: testDir });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('no issues');
    });

    it('should detect linting issues', async () => {
      const templatePath = join(testDir, 'issues.fmt');
      await writeFile(templatePath, 'Hello { }!'); // Empty placeholder
      
      const result = await runCli(['lint', templatePath], { cwd: testDir });
      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('Empty placeholder');
    });
  });

  describe('format', () => {
    it('should format a template', async () => {
      const templatePath = join(testDir, 'messy.fmt');
      await writeFile(templatePath, 'Hello { name | upper }!');
      
      const result = await runCli(['format', templatePath], { cwd: testDir });
      expect(result.exitCode).toBe(0);
    });

    it('should report unformatted files with --check', async () => {
      const templatePath = join(testDir, 'messy.fmt');
      await writeFile(templatePath, 'Hello { name | upper }!');
      
      const result = await runCli(['format', templatePath, '--check'], { cwd: testDir });
      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('messy.fmt');
    });
  });

  describe('benchmark', () => {
    it('should benchmark a template', async () => {
      const templatePath = join(testDir, 'template.fmt');
      const dataPath = join(testDir, 'data.json');
      
      await writeFile(templatePath, 'Hello {name}!');
      await writeFile(dataPath, JSON.stringify({ name: 'World' }));
      
      const result = await runCli(['benchmark', templatePath, '--data', dataPath, '--iterations', '10'], { cwd: testDir });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Mean');
      expect(result.stdout).toContain('Ops/sec');
    });
  });

  describe('init', () => {
    it('should create config file with --config-only', async () => {
      const result = await runCli(['init', '--config-only'], { cwd: testDir });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('.formatrrc.json');
    });

    it('should create a project', async () => {
      const result = await runCli(['init', 'test-project', '--template', 'basic'], { cwd: testDir });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Project created successfully');
    });
  });

  describe('report', () => {
    it('should generate a report', async () => {
      const templatePath = join(testDir, 'report.fmt');
      const dataPath = join(testDir, 'data.json');
      
      await writeFile(templatePath, 'Report: {title}');
      await writeFile(dataPath, JSON.stringify({ title: 'Test Report' }));
      
      const result = await runCli(['report', '--template', templatePath, '--data', dataPath], { cwd: testDir });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Test Report');
    });
  });
});
