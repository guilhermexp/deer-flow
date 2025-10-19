/**
 * Retry utility with exponential backoff
 */

export interface RetryOptions {
  retries?: number;
  minTimeout?: number;
  maxTimeout?: number;
  factor?: number;
  onFailedAttempt?: (error: Error, attempt: number) => void;
}

export class RetryError extends Error {
  public readonly attempts: number;
  public readonly lastError: Error;

  constructor(message: string, attempts: number, lastError: Error) {
    super(message);
    this.name = "RetryError";
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = 3,
    minTimeout = 1000,
    maxTimeout = 30000,
    factor = 2,
    onFailedAttempt,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (onFailedAttempt) {
        onFailedAttempt(lastError, attempt);
      }

      if (attempt < retries) {
        // Calculate exponential backoff with max timeout
        const timeout = Math.min(
          minTimeout * Math.pow(factor, attempt - 1),
          maxTimeout
        );
        await new Promise((resolve) => setTimeout(resolve, timeout));
      }
    }
  }

  throw new RetryError(`Failed after ${retries} attempts`, retries, lastError!);
}

/**
 * Retry with a timeout for each attempt
 */
export async function retryWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  options: RetryOptions = {}
): Promise<T> {
  return retry(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await Promise.race([
        fn(),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () => {
            reject(new Error(`Operation timed out after ${timeoutMs}ms`));
          });
        }),
      ]);
    } finally {
      clearTimeout(timeoutId);
    }
  }, options);
}
