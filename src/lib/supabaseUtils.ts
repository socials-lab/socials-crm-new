import { supabase } from '@/integrations/supabase/client';

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
      reject(new Error('Požadavek vypršel. Zkuste to prosím znovu.'));
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
      error: error instanceof Error ? error : new Error('Neznámá chyba'),
    };
  }
}
