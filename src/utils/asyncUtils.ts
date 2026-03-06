/**
 * Wraps a promise with a timeout. If the promise doesn't resolve within
 * the specified time, it rejects with a timeout error.
 *
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds (default: 30000 = 30 seconds)
 * @param errorMessage - Custom error message for timeout
 * @returns The wrapped promise
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 30000,
  errorMessage = 'Operace trvá příliš dlouho. Zkuste to prosím znovu.'
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  );
  return Promise.race([promise, timeout]);
}

/**
 * Creates a timeout promise that rejects after the specified time.
 * Useful for Promise.race patterns.
 *
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Custom error message
 * @returns A promise that rejects after timeout
 */
export function createTimeout(
  timeoutMs: number,
  errorMessage = 'Timeout: operace trvá příliš dlouho'
): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  );
}

/**
 * Runs an async operation with AbortController-based timeout.
 * Unlike Promise.race-only timeout, this cancels the underlying request.
 */
export async function withAbortTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs = 30000,
  errorMessage = 'Operace trvá příliš dlouho. Zkuste to prosím znovu.'
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await operation(controller.signal);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(errorMessage);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
