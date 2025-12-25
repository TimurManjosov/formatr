/**
 * Progress indicator utilities for long-running operations
 */

export interface ProgressOptions {
  text?: string;
  spinner?: boolean;
}

/**
 * Simple progress indicator that works in TTY mode
 * Uses lazy loading to avoid startup time impact
 */
export class Progress {
  private text: string;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private spinnerIndex = 0;
  private static readonly SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  
  constructor(options: ProgressOptions = {}) {
    this.text = options.text || 'Processing...';
  }
  
  /**
   * Start the progress indicator
   */
  start(text?: string): void {
    if (text) {
      this.text = text;
    }
    
    // Only show spinner in TTY mode
    if (!process.stdout.isTTY) {
      console.log(this.text);
      return;
    }
    
    this.spinnerIndex = 0;
    this.render();
    this.intervalId = setInterval(() => this.render(), 80);
  }
  
  /**
   * Update the progress text
   */
  update(text: string): void {
    this.text = text;
    if (!process.stdout.isTTY) {
      console.log(text);
    }
  }
  
  /**
   * Stop the progress indicator
   */
  stop(finalText?: string): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (process.stdout.isTTY) {
      // Clear the entire current line using ANSI escape sequence
      process.stdout.write('\r\x1b[2K');
    }
    
    if (finalText) {
      console.log(finalText);
    }
  }
  
  /**
   * Mark as success
   */
  success(text?: string): void {
    this.stop(`✓ ${text || this.text}`);
  }
  
  /**
   * Mark as failed
   */
  fail(text?: string): void {
    this.stop(`✗ ${text || this.text}`);
  }
  
  private render(): void {
    if (!process.stdout.isTTY) return;
    
    const frame = Progress.SPINNER_FRAMES[this.spinnerIndex % Progress.SPINNER_FRAMES.length];
    this.spinnerIndex++;
    process.stdout.write(`\r${frame} ${this.text}`);
  }
}

/**
 * Create a progress indicator
 */
export function createProgress(options?: ProgressOptions): Progress {
  return new Progress(options);
}

/**
 * Progress bar for operations with known length
 */
export class ProgressBar {
  private total: number;
  private current = 0;
  private width: number;
  private text: string;
  
  constructor(total: number, text = 'Progress', width = 40) {
    this.total = total;
    this.width = width;
    this.text = text;
  }
  
  /**
   * Update progress
   */
  update(current: number, text?: string): void {
    this.current = current;
    if (text) {
      this.text = text;
    }
    this.render();
  }
  
  /**
   * Increment progress by one
   */
  tick(text?: string): void {
    this.update(this.current + 1, text);
  }
  
  /**
   * Complete the progress bar
   */
  complete(text?: string): void {
    this.current = this.total;
    this.render();
    if (process.stdout.isTTY) {
      console.log(); // New line
    }
    if (text) {
      console.log(`✓ ${text}`);
    }
  }
  
  private render(): void {
    if (!process.stdout.isTTY) return;
    
    const percent = Math.min(100, Math.round((this.current / this.total) * 100));
    const filled = Math.round((this.current / this.total) * this.width);
    const empty = this.width - filled;
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    process.stdout.write(`\r${this.text} [${bar}] ${percent}% (${this.current}/${this.total})`);
  }
}

/**
 * Create a progress bar
 */
export function createProgressBar(total: number, text?: string): ProgressBar {
  return new ProgressBar(total, text);
}
