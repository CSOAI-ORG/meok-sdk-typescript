/**
 * Exception hierarchy for the MEOK TypeScript SDK.
 * Every error inherits from MeokError so callers can catch broadly or narrowly.
 */

export class MeokError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MeokError";
  }
}

export class MeokNetworkError extends MeokError {
  public override readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "MeokNetworkError";
    this.cause = cause;
  }
}

export class MeokAPIError extends MeokError {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(`[${statusCode}] ${message}`);
    this.name = "MeokAPIError";
  }
}

export class MeokAuthError extends MeokAPIError {
  constructor(statusCode: number, message: string, body?: unknown) {
    super(statusCode, message, body);
    this.name = "MeokAuthError";
  }
}

export class MeokValidationError extends MeokAPIError {
  constructor(statusCode: number, message: string, body?: unknown) {
    super(statusCode, message, body);
    this.name = "MeokValidationError";
  }
}

export class MeokPaymentError extends MeokAPIError {
  constructor(statusCode: number, message: string, body?: unknown) {
    super(statusCode, message, body);
    this.name = "MeokPaymentError";
  }
}

export function fromResponse(statusCode: number, body: unknown): MeokAPIError {
  let message = "";
  if (typeof body === "object" && body && !Array.isArray(body)) {
    const obj = body as Record<string, unknown>;
    message = String(obj.error ?? obj.message ?? "");
  }
  if (!message) message = "(no error message in response body)";

  if (statusCode === 401) return new MeokAuthError(statusCode, message, body);
  if (statusCode === 400) return new MeokValidationError(statusCode, message, body);
  if (statusCode === 402) return new MeokPaymentError(statusCode, message, body);
  return new MeokAPIError(statusCode, message, body);
}
