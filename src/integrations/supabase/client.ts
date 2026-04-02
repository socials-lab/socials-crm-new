import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

const SUPABASE_CLIENT_KEY = '__socials_supabase_client__';
const SESSION_REFRESH_PROMISE_KEY = '__socials_fetch_session_refresh_promise__';

type SupabaseClientSingleton = ReturnType<typeof createClient<Database>>;
type SupabaseGlobal = typeof globalThis & {
  [SUPABASE_CLIENT_KEY]?: SupabaseClientSingleton;
  [SESSION_REFRESH_PROMISE_KEY]?: Promise<string | null> | null;
};

const supabaseGlobal = globalThis as SupabaseGlobal;

async function refreshAccessTokenForRetry(): Promise<string | null> {
  const client = supabaseGlobal[SUPABASE_CLIENT_KEY];
  if (!client) return null;

  if (!supabaseGlobal[SESSION_REFRESH_PROMISE_KEY]) {
    supabaseGlobal[SESSION_REFRESH_PROMISE_KEY] = (async () => {
      const { data, error } = await client.auth.refreshSession();
      if (error || !data.session?.access_token) {
        return null;
      }
      return data.session.access_token;
    })().finally(() => {
      supabaseGlobal[SESSION_REFRESH_PROMISE_KEY] = null;
    });
  }

  return await supabaseGlobal[SESSION_REFRESH_PROMISE_KEY];
}

function shouldRetryAfterUnauthorized(
  response: Response,
  requestUrl: string,
  init?: RequestInit,
  hasRetriedAuth = false,
): boolean {
  if (response.status !== 401) return false;
  if (requestUrl.includes('/auth/v1/')) return false;
  if (hasRetriedAuth) return false;

  const headers = new Headers(init?.headers);
  const authHeader = headers.get('Authorization');
  if (!authHeader) return false;
  if (authHeader === `Bearer ${SUPABASE_ANON_KEY}`) return false;

  return true;
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  hasRetriedAuth = false,
): Promise<Response> {
  const requestUrl = typeof input === 'string' ? input : input.toString();
  const isAuthRequest = requestUrl.includes('/auth/v1/');
  const timeoutMs = isAuthRequest ? 30000 : 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const originalSignal = init?.signal;

  if (originalSignal) {
    if (originalSignal.aborted) {
      controller.abort();
    } else {
      originalSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });

    if (!shouldRetryAfterUnauthorized(response, requestUrl, init, hasRetriedAuth)) {
      return response;
    }

    const refreshedAccessToken = await refreshAccessTokenForRetry();
    if (!refreshedAccessToken) {
      return response;
    }

    const retryHeaders = new Headers(init?.headers);
    retryHeaders.set('Authorization', `Bearer ${refreshedAccessToken}`);

    return await fetchWithTimeout(input, {
      ...init,
      headers: retryHeaders,
    }, true);
  } finally {
    clearTimeout(timeoutId);
  }
}

if (!supabaseGlobal[SUPABASE_CLIENT_KEY]) {
  supabaseGlobal[SUPABASE_CLIENT_KEY] = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      fetch: fetchWithTimeout,
    },
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  });
}

export const supabase = supabaseGlobal[SUPABASE_CLIENT_KEY]!;