import { getSessionEnsuringFresh, refreshSessionSafely } from '@/lib/authSession';
import { supabase } from '@/integrations/supabase/client';

export type InvokeAuthMode = 'required' | 'optional' | 'none';

interface InvokeFunctionOptions {
  body?: unknown;
  headers?: Record<string, string>;
  authMode?: InvokeAuthMode;
}

interface ErrorWithHttpStatus extends Error {
  httpStatus?: number;
}

function isLikelyHardSessionFailure(message: string | null | undefined): boolean {
  const text = String(message ?? '').toLowerCase();
  return (
    text.includes('invalid refresh token') ||
    text.includes('refresh_token_not_found') ||
    text.includes('session refresh returned no session') ||
    text.includes('session refresh returned invalid user token') ||
    text.includes('auth session missing') ||
    text.includes('session missing')
  );
}

function isLikelyTransientSessionFailure(message: string | null | undefined): boolean {
  const text = String(message ?? '').toLowerCase();
  return (
    text.includes('timeout') ||
    text.includes('abort') ||
    text.includes('network') ||
    text.includes('failed to fetch')
  );
}

function getErrorHttpStatus(error: unknown): number | undefined {
  const contextStatus = (error as { context?: { status?: unknown } } | null)?.context?.status;
  if (typeof contextStatus === 'number') {
    return contextStatus;
  }

  const errorStatus = (error as { httpStatus?: unknown } | null)?.httpStatus;
  if (typeof errorStatus === 'number') {
    return errorStatus;
  }

  return undefined;
}

function attachHttpStatus(error: Error, status?: number): ErrorWithHttpStatus {
  const normalized = error as ErrorWithHttpStatus;
  if (typeof status === 'number') {
    normalized.httpStatus = status;
  }
  return normalized;
}

export function isAuthInvokeError(error: unknown): boolean {
  const status = getErrorHttpStatus(error);
  if (status === 401) {
    return true;
  }

  const message = String((error as { message?: string } | null)?.message ?? '').toLowerCase();
  return (
    message.includes('invalid jwt') ||
    message.includes('jwt expired') ||
    message.includes('missing authorization header') ||
    message.includes('authorization header') ||
    message.includes('unauthorized') ||
    /\b401\b/.test(message) ||
    message.includes('neplatná autorizace') ||
    message.includes('neplatná relace')
  );
}

async function normalizeInvokeError(error: unknown): Promise<ErrorWithHttpStatus> {
  const status = getErrorHttpStatus(error);

  if (!(error instanceof Error)) {
    return attachHttpStatus(new Error('Neznámá chyba'), status);
  }

  const maybeContext = (error as { context?: unknown })?.context;
  if (maybeContext && typeof maybeContext === 'object' && typeof maybeContext.text === 'function') {
    try {
      const response = maybeContext as Response;
      const responseStatus = response.status;
      const bodyText = await response.clone().text();

      if (bodyText) {
        try {
          const parsed = JSON.parse(bodyText) as { error?: string; message?: string; stage?: string; durationMs?: number };
          const apiMessage = parsed.error || parsed.message;
          if (apiMessage) {
            const stage = parsed.stage ? ` [${parsed.stage}]` : '';
            const duration = parsed.durationMs ? ` (${parsed.durationMs}ms)` : '';
            return attachHttpStatus(new Error(`${apiMessage}${stage}${duration}`), responseStatus);
          }
        } catch {
          return attachHttpStatus(new Error(`Edge function error (${responseStatus}): ${bodyText}`), responseStatus);
        }
      }

      return attachHttpStatus(new Error(`Edge function error (${responseStatus})`), responseStatus);
    } catch {
      // Fall through to original error
    }
  }

  return attachHttpStatus(error, status);
}

function getAnonAuthHeaders(): Record<string, string> {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!anonKey) {
    return {};
  }

  return {
    Authorization: `Bearer ${anonKey}`,
    apikey: anonKey,
  };
}

function buildInvokeOptions(
  options?: InvokeFunctionOptions,
  accessToken?: string | null,
  forceAnon = false,
): { body?: unknown; headers?: Record<string, string> } {
  const headers: Record<string, string> = {
    ...(options?.headers || {}),
  };

  if (forceAnon) {
    Object.assign(headers, getAnonAuthHeaders());
  } else if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return {
    body: options?.body,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  };
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
  options?: InvokeFunctionOptions,
  timeoutMs: number = 30000
): Promise<{ data: T | null; error: Error | null }> {
  const authMode = options?.authMode ?? 'required';

  const invokeOnce = async (
    invokeOptions?: { body?: unknown; headers?: Record<string, string> }
  ): Promise<{ data: T | null; error: Error | null }> => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
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
        const normalizedError = await normalizeInvokeError(error);
        return {
          data: null,
          error: normalizedError,
        };
      }

      return {
        data: (data as T) ?? null,
        error: null,
      };
    })();

    try {
      return await Promise.race([invokePromise, timeoutPromise]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
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

    const { session, error } = await getSessionEnsuringFresh(45);
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
    if (authMode === 'none') {
      return await normalizeResultError(await invokeOnce(buildInvokeOptions(options, null, true)));
    }

    const initialTokenState = await getFreshAccessToken(false);
    if (!initialTokenState.token) {
      if (authMode === 'optional') {
        return await normalizeResultError(await invokeOnce(buildInvokeOptions(options, null, true)));
      }

      const initialReason = initialTokenState.errorMessage;
      console.error('[invokeWithTimeout] Missing valid session token before invoke', {
        functionName,
        reason: initialReason,
      });

      // If token lookup failed for transient reasons, try one request without forced Authorization.
      // Supabase client may still hold a usable token internally.
      if (!isLikelyHardSessionFailure(initialReason) || isLikelyTransientSessionFailure(initialReason)) {
        const fallbackResult = await invokeOnce(buildInvokeOptions(options));
        if (!isAuthInvokeError(fallbackResult.error)) {
          return await normalizeResultError(fallbackResult);
        }
      }

      return {
        data: null,
        error: new Error(`Neplatná relace uživatele (${functionName}). Přihlaste se prosím znovu.`),
      };
    }

    let result = await invokeOnce(buildInvokeOptions(options, initialTokenState.token));

    if (!isAuthInvokeError(result.error)) {
      return await normalizeResultError(result);
    }

    const firstErrorMessage = result.error?.message || null;
    const refreshedTokenState = await getFreshAccessToken(true);
    if (!refreshedTokenState.token) {
      if (authMode === 'optional') {
        return await normalizeResultError(await invokeOnce(buildInvokeOptions(options, null, true)));
      }

      const refreshReason = refreshedTokenState.errorMessage;
      console.error('[invokeWithTimeout] Session refresh failed after auth error', {
        functionName,
        firstErrorMessage,
        refreshErrorMessage: refreshReason,
      });

      if (!isLikelyHardSessionFailure(refreshReason) || isLikelyTransientSessionFailure(refreshReason)) {
        const fallbackResult = await invokeOnce(buildInvokeOptions(options));
        if (!isAuthInvokeError(fallbackResult.error)) {
          return await normalizeResultError(fallbackResult);
        }
      }

      return {
        data: result.data,
        error: new Error(`Neplatná relace uživatele (${functionName}). Přihlaste se prosím znovu.`),
      };
    }

    result = await invokeOnce(buildInvokeOptions(options, refreshedTokenState.token));

    if (!isAuthInvokeError(result.error)) {
      return await normalizeResultError(result);
    }

    if (authMode === 'optional') {
      const anonymousRetry = await invokeOnce(buildInvokeOptions(options, null, true));
      if (!isAuthInvokeError(anonymousRetry.error)) {
        return await normalizeResultError(anonymousRetry);
      }
    }

    if (isAuthInvokeError(result.error)) {
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
