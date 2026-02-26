import { supabase } from '@/integrations/supabase/client';

async function normalizeInvokeError(error: unknown): Promise<Error> {
  if (!(error instanceof Error)) {
    return new Error('Neznámá chyba');
  }

  const maybeContext = (error as any)?.context;
  if (maybeContext && typeof maybeContext === 'object' && typeof maybeContext.text === 'function') {
    try {
      const response = maybeContext as Response;
      const status = response.status;
      const bodyText = await response.clone().text();

      if (bodyText) {
        try {
          const parsed = JSON.parse(bodyText) as { error?: string; message?: string; stage?: string; durationMs?: number };
          const apiMessage = parsed.error || parsed.message;
          if (apiMessage) {
            const stage = parsed.stage ? ` [${parsed.stage}]` : '';
            const duration = parsed.durationMs ? ` (${parsed.durationMs}ms)` : '';
            return new Error(`${apiMessage}${stage}${duration}`);
          }
        } catch {
          return new Error(`Edge function error (${status}): ${bodyText}`);
        }
      }

      return new Error(`Edge function error (${status})`);
    } catch {
      // Fall through to original error
    }
  }

  return error;
}

/**
 * Invoke a Supabase edge function with a timeout.
 * Prevents the UI from hanging forever if the function takes too long.
 *
 * @param functionName - Name of the edge function
 * @param options - Options to pass to the function (body, headers, etc.)
 * @param timeoutMs - Timeout in milliseconds (default: 30 seconds)
 */
export async function invokeWithTimeout<T = unknown>(
  functionName: string,
  options?: { body?: unknown; headers?: Record<string, string> },
  timeoutMs: number = 30000
): Promise<{ data: T | null; error: Error | null }> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      const timeoutSec = Math.round(timeoutMs / 1000);
      reject(new Error(`Požadavek vypršel po ${timeoutSec}s (${functionName}). Zkuste to prosím znovu.`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([
      supabase.functions.invoke(functionName, options),
      timeoutPromise,
    ]);

    return result as { data: T | null; error: Error | null };
  } catch (error) {
    return {
      data: null,
      error: await normalizeInvokeError(error),
    };
  }
}
