import { getSessionEnsuringFresh, refreshSessionSafely } from '@/lib/authSession';
import { supabase } from '@/integrations/supabase/client';

async function normalizeInvokeError(error: unknown): Promise<Error> {
  if (!(error instanceof Error)) {
    return new Error('Neznámá chyba');
  }

  const maybeContext = (error as { context?: unknown })?.context;
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
  const invokeOnce = async (
    invokeOptions?: { body?: unknown; headers?: Record<string, string> }
  ): Promise<{ data: T | null; error: Error | null }> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        const timeoutSec = Math.round(timeoutMs / 1000);
        reject(new Error(`Požadavek vypršel po ${timeoutSec}s (${functionName}). Zkuste to prosím znovu.`));
      }, timeoutMs);
    });

    const invokePromise = (async (): Promise<{ data: T | null; error: Error | null }> => {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: invokeOptions?.body,
        headers: invokeOptions?.headers,
      });

      if (error) {
        return {
          data: null,
          error: await normalizeInvokeError(error),
        };
      }

      return {
        data: (data as T) ?? null,
        error: null,
      };
    })();

    return await Promise.race([invokePromise, timeoutPromise]);
  };


  const normalizeResultError = async (
    result: { data: T | null; error: Error | null }
  ): Promise<{ data: T | null; error: Error | null }> => {
    if (!result.error) return result;
    return {
      data: result.data,
      error: await normalizeInvokeError(result.error),
    };
  };

  const isInvalidJwtError = (err: Error | null | undefined) => {
    if (!err) return false;
    const msg = (err.message || '').toLowerCase();
    return (
      msg.includes('invalid jwt') ||
      msg.includes('jwt expired') ||
      msg.includes('missing authorization header') ||
      msg.includes('authorization header') ||
      msg.includes('unauthorized') ||
      msg.includes('http 401') ||
      msg.includes('neplatná autorizace') ||
      msg.includes('neplatná relace')
    );
  };

  const getFreshAccessToken = async (forceRefresh = false): Promise<{ token: string | null; errorMessage: string | null }> => {
    if (forceRefresh) {
      const { session, error } = await refreshSessionSafely();
      if (error || !session?.access_token) {
        return {
          token: null,
          errorMessage: error?.message || 'Session refresh failed',
        };
      }
      return {
        token: session.access_token,
        errorMessage: null,
      };
    }

    const { session, error } = await getSessionEnsuringFresh(120);
    if (error || !session?.access_token) {
      return {
        token: null,
        errorMessage: error?.message || 'Session missing',
      };
    }

    return {
      token: session.access_token,
      errorMessage: null,
    };
  };

  try {
    const initialTokenState = await getFreshAccessToken(false);
    if (!initialTokenState.token) {
      console.error('[invokeWithTimeout] Missing valid session token before invoke', {
        functionName,
        reason: initialTokenState.errorMessage,
      });
      return {
        data: null,
        error: new Error(`Neplatná relace uživatele (${functionName}). Přihlaste se prosím znovu.`),
      };
    }

    const firstAttemptOptions = {
      ...(options || {}),
      headers: {
        ...(options?.headers || {}),
        Authorization: `Bearer ${initialTokenState.token}`,
      },
    };

    let result = await invokeOnce(firstAttemptOptions);

    if (!isInvalidJwtError(result.error)) {
      return await normalizeResultError(result);
    }

    const firstErrorMessage = result.error?.message || null;
    const refreshedTokenState = await getFreshAccessToken(true);
    if (!refreshedTokenState.token) {
      console.error('[invokeWithTimeout] Session refresh failed after auth error', {
        functionName,
        firstErrorMessage,
        refreshErrorMessage: refreshedTokenState.errorMessage,
      });
      return {
        data: result.data,
        error: new Error(`Neplatná relace uživatele (${functionName}). Přihlaste se prosím znovu.`),
      };
    }

    const retryOptions = {
      ...(options || {}),
      headers: {
        ...(options?.headers || {}),
        Authorization: `Bearer ${refreshedTokenState.token}`,
      },
    };

    result = await invokeOnce(retryOptions);

    if (isInvalidJwtError(result.error)) {
      console.error('[invokeWithTimeout] Auth still failing after forced refresh', {
        functionName,
        firstErrorMessage,
        secondErrorMessage: result.error?.message || null,
      });
      return {
        data: result.data,
        error: new Error(`Neplatná relace uživatele (${functionName}). Přihlaste se prosím znovu.`),
      };
    }

    return await normalizeResultError(result);
  } catch (error) {
    return {
      data: null,
      error: await normalizeInvokeError(error),
    };
  }
}
