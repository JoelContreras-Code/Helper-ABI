/** Error with an HTTP status and a stable machine-readable code for API clients. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message?: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message ?? code);
    this.name = 'HttpError';
  }
}
