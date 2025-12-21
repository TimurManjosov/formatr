export class FormatrError extends Error {
  constructor(
    message?: string,
    public readonly pos?: number // future: line/col mapping
  ) {
    super(message);
    this.name = 'FormatrError';
  }
}

export class FilterExecutionError extends FormatrError {
  constructor(
    message: string,
    public readonly filterName: string,
    public readonly inputValue: unknown,
    public readonly filterArgs: string[],
    public readonly originalError: Error
  ) {
    super(message);
    this.name = 'FilterExecutionError';
  }
}
