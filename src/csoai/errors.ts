/**
 * Exception hierarchy for the CSOAI (csoai.org) public data API.
 *
 * All errors inherit from {@link CSOAIError} so callers can catch broadly
 * or narrow down to network vs. API-level failures.
 */

/** Base error for every CSOAI SDK failure. */
export class CSOAIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CSOAIError";
  }
}

/** Thrown when a network-level failure occurs (timeout, DNS, abort, etc.). */
export class CSOAINetworkError extends CSOAIError {
  public override readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "CSOAINetworkError";
    this.cause = cause;
  }
}

/** Thrown when the API returns a non-2xx status code. */
export class CSOAIAPIError extends CSOAIError {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(`[${statusCode}] ${message}`);
    this.name = "CSOAIAPIError";
  }
}

/** Thrown on 401 / 403 responses. */
export class CSOAIAuthError extends CSOAIAPIError {
  constructor(statusCode: number, message: string, body?: unknown) {
    super(statusCode, message, body);
    this.name = "CSOAIAuthError";
  }
}

/** Thrown on 400 / 422 responses (malformed request). */
export class CSOAIValidationError extends CSOAIAPIError {
  constructor(statusCode: number, message: string, body?: unknown) {
    super(statusCode, message, body);
    this.name = "CSOAIValidationError";
  }
}

/**
 * Build the correct error subclass from an HTTP response.
 *
 * @internal
 */
export function fromResponse(statusCode: number, body: unknown): CSOAIAPIError {
  let message = "";
  if (typeof body === "object" && body && !Array.isArray(body)) {
    const obj = body as Record<string, unknown>;
    message = String(obj.error ?? obj.message ?? "");
  }
  if (!message) message = "(no error message in response body)";

  if (statusCode === 401 || statusCode === 403) {
    return new CSOAIAuthError(statusCode, message, body);
  }
  if (statusCode === 400 || statusCode === 422) {
    return new CSOAIValidationError(statusCode, message, body);
  }
  return new CSOAIAPIError(statusCode, message, body);
}
