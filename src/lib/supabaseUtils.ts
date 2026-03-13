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
  const invokeOnce = async (
    invokeOptions?: { body?: unknown; headers?: Record<string, string> },
    accessToken?: string | null
  ): Promise<{ data: T | null; error: Error | null }> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        const timeoutSec = Math.round(timeoutMs / 1000);
        reject(new Error(`Požadavek vypršel po ${timeoutSec}s (${functionName}). Zkuste to prosím znovu.`));
      }, timeoutMs);
    });

    const invokePromise = (async (): Promise<{ data: T | null; error: Error | null }> => {
      if (!accessToken) {
        return {
          data: null,
          error: new Error(`Neplatná relace uživatele (${functionName}). Přihlaste se prosím znovu.`),
        };
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
        ...(invokeOptions?.headers || {}),
      };

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: invokeOptions?.body !== undefined ? JSON.stringify(invokeOptions.body) : undefined,
      });

      const bodyText = await response.text();
      let parsedBody: unknown = null;
      if (bodyText) {
        try {
          parsedBody = JSON.parse(bodyText);
        } catch {
          parsedBody = bodyText;
        }
      }

      if (!response.ok) {
        const payload = parsedBody as { error?: string; message?: string } | string | null;
        const apiError =
          typeof payload === 'string'
            ? payload
            : payload?.error || payload?.message || `Edge function error (${response.status})`;
        return {
          data: null,
          error: new Error(`${apiError} [HTTP ${response.status}]`),
        };
      }

      return {
        data: (parsedBody as T) ?? null,
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
      msg.includes('neplatná autorizace') ||
      msg.includes('neplatná relace') ||
      msg.includes('401') ||
      msg.includes('http 401') ||
      msg.includes('non-2xx')
    );
  };

  const getFreshAccessToken = async (forceRefresh = false): Promise<string | null> => {
    if (forceRefresh) {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshData.session?.access_token) {
        return null;
      }
      return refreshData.session.access_token;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session?.access_token) {
      return null;
    }

    const expiresAtMs = session.expires_at ? session.expires_at * 1000 : null;
    const isNearExpiry = !!expiresAtMs && expiresAtMs - Date.now() < 2 * 60 * 1000;
    if (isNearExpiry) {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (!refreshError && refreshData.session?.access_token) {
        return refreshData.session.access_token;
      }
    }

    return session.access_token;
  };

  try {
    const initialAccessToken = await getFreshAccessToken(false);
    let result = await invokeOnce(options, initialAccessToken);

    if (!isInvalidJwtError(result.error)) {
      return await normalizeResultError(result);
    }

    // Retry exactly once with a forced session refresh and explicit fresh token.
    const refreshedAccessToken = await getFreshAccessToken(true);
    if (refreshedAccessToken) {
      const retriedAfterRefresh = await invokeOnce(options, refreshedAccessToken);
      if (!isInvalidJwtError(retriedAfterRefresh.error)) {
        return await normalizeResultError(retriedAfterRefresh);
      }
      result = retriedAfterRefresh;
    }

    // Do not fall back to anon token for edge functions.
    // If user JWT is invalid even after refresh, fail loudly with actionable message.
    if (isInvalidJwtError(result.error)) {
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
