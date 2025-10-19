export class FormatrError extends Error {
  constructor(
    message?: string,
    public readonly pos?: number // future: line/col mapping
  ) {
    super(message);
    this.name = 'FormatrError';
  }
}
