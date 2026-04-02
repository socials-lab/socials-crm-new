import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const SESSION_REFRESH_PROMISE_KEY = '__socials_session_refresh_promise__';

type SessionRefreshGlobal = typeof globalThis & {
  [SESSION_REFRESH_PROMISE_KEY]?: Promise<Session> | null;
};

function getExpectedProjectRef(): string | null {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) return null;
    return new URL(supabaseUrl).hostname.split('.')[0] ?? null;
  } catch {
    return null;
  }
}

function decodeJwtPayload(token?: string | null): Record<string, unknown> | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isValidUserAccessToken(token?: string | null): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  const subject = typeof payload.sub === 'string' ? payload.sub : null;
  const role = typeof payload.role === 'string' ? payload.role : null;
  const tokenProjectRef = typeof payload.ref === 'string' ? payload.ref : null;
  const expectedProjectRef = getExpectedProjectRef();
  const expiresAt = typeof payload.exp === 'number' ? payload.exp : null;

  if (!subject || subject.length === 0) return false;
  if (role === 'anon') return false;
  if (expectedProjectRef && tokenProjectRef && tokenProjectRef !== expectedProjectRef) return false;
  if (expiresAt && expiresAt <= Math.floor(Date.now() / 1000) + 15) return false;
  return true;
}

function normalizeAuthError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error) return error;
  return new Error(fallbackMessage);
}

function getRefreshGlobalState(): SessionRefreshGlobal {
  const sessionGlobal = globalThis as SessionRefreshGlobal;
  if (sessionGlobal[SESSION_REFRESH_PROMISE_KEY] === undefined) {
    sessionGlobal[SESSION_REFRESH_PROMISE_KEY] = null;
  }
  return sessionGlobal;
}

export function clearSupabaseAuthStorage(): void {
  if (typeof window === 'undefined') return;

  const expectedProjectRef = getExpectedProjectRef();
  const storages = [window.localStorage, window.sessionStorage];

  for (const storage of storages) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        if (!key) continue;

        const isAuthTokenKey = /^sb-[^-]+-auth-token$/.test(key);
        const isExpectedProjectAuthKey = expectedProjectRef
          ? key.startsWith(`sb-${expectedProjectRef}-`) && key.includes('auth-token')
          : false;

        if (isAuthTokenKey || isExpectedProjectAuthKey) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => storage.removeItem(key));
    } catch {
      // Ignore storage access failures (private mode / browser policies).
    }
  }
}

export async function refreshSessionSafely(): Promise<{ session: Session | null; error: Error | null }> {
  const sessionGlobal = getRefreshGlobalState();

  if (!sessionGlobal[SESSION_REFRESH_PROMISE_KEY]) {
    sessionGlobal[SESSION_REFRESH_PROMISE_KEY] = (async () => {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        throw error;
      }
      if (!data.session) {
        throw new Error('Session refresh returned no session');
      }
      if (!isValidUserAccessToken(data.session.access_token)) {
        throw new Error('Session refresh returned invalid user token');
      }
      return data.session;
    })().finally(() => {
      sessionGlobal[SESSION_REFRESH_PROMISE_KEY] = null;
    });
  }

  try {
    const session = await sessionGlobal[SESSION_REFRESH_PROMISE_KEY];
    return { session, error: null };
  } catch (error) {
    return {
      session: null,
      error: normalizeAuthError(error, 'Session refresh failed'),
    };
  }
}

export async function getSessionEnsuringFresh(minValiditySeconds = 120): Promise<{ session: Session | null; error: Error | null }> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return refreshSessionSafely();
  }

  const session = data.session;
  if (!session) {
    return refreshSessionSafely();
  }

  if (!isValidUserAccessToken(session.access_token)) {
    return refreshSessionSafely();
  }

  const expiresAt = session.expires_at ?? 0;
  const nowSec = Math.floor(Date.now() / 1000);
  if (expiresAt - nowSec < minValiditySeconds) {
    return refreshSessionSafely();
  }

  return { session, error: null };
}
