import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getSessionEnsuringFresh, refreshSessionSafely } from '@/lib/authSession';
import { isAuthInvokeError } from '@/lib/supabaseUtils';

interface ImpersonatedProfile {
  id: string;
  fullName: string | null;
  email: string | null;
}

interface ImpersonationContextType {
  effectiveUserId: string | null;
  impersonatorUserId: string | null;
  impersonatedUserId: string | null;
  impersonatedProfile: ImpersonatedProfile | null;
  isImpersonating: boolean;
  isImpersonationLoading: boolean;
  startImpersonation: (targetUserId: string) => Promise<void>;
  stopImpersonation: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);
const IMPERSONATION_FUNCTION_NAME = 'impersonation-session';
const IMPERSONATION_REQUEST_TIMEOUT_MS = 20000;

interface HttpError extends Error {
  httpStatus?: number;
}

function withHttpStatus(message: string, status?: number): HttpError {
  const error = new Error(message) as HttpError;
  if (typeof status === 'number') {
    error.httpStatus = status;
  }
  return error;
}

function looksLikeJwtToken(token: string | null | undefined): token is string {
  if (typeof token !== 'string') return false;
  const parts = token.trim().split('.');
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

async function getValidAccessToken(forceRefresh = false): Promise<string | null> {
  if (forceRefresh) {
    const { session } = await refreshSessionSafely();
    const refreshedToken = session?.access_token ?? null;
    return looksLikeJwtToken(refreshedToken) ? refreshedToken : null;
  }

  const { session } = await getSessionEnsuringFresh(45);
  const currentToken = session?.access_token ?? null;
  return looksLikeJwtToken(currentToken) ? currentToken : null;
}

async function invokeImpersonationRequest(
  body: { action: 'status' } | { action: 'start'; target_user_id: string } | { action: 'stop' },
  accessToken: string,
): Promise<{ data: unknown | null; error: Error | null }> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  if (!supabaseUrl) {
    return {
      data: null,
      error: withHttpStatus('Supabase environment variables are missing for impersonation request.'),
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), IMPERSONATION_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/${IMPERSONATION_FUNCTION_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    let parsedBody: unknown = null;
    try {
      parsedBody = await response.clone().json();
    } catch {
      try {
        parsedBody = await response.text();
      } catch {
        parsedBody = null;
      }
    }

    if (!response.ok) {
      const parsedObject = parsedBody as { error?: string; message?: string } | null;
      const errorMessage =
        parsedObject?.error ||
        parsedObject?.message ||
        (typeof parsedBody === 'string' && parsedBody.length > 0 ? parsedBody : null) ||
        `Impersonation function failed with HTTP ${response.status}.`;

      return {
        data: null,
        error: withHttpStatus(errorMessage, response.status),
      };
    }

    return {
      data: parsedBody,
      error: null,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        data: null,
        error: withHttpStatus('Impersonation request timed out. Please try again.'),
      };
    }

    return {
      data: null,
      error: error instanceof Error ? error : withHttpStatus('Unexpected impersonation request failure.'),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function loadProfile(userId: string): Promise<ImpersonatedProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    fullName: data.full_name,
    email: data.email,
  };
}

function parseImpersonatedProfile(value: unknown): ImpersonatedProfile | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const id = typeof row.id === 'string' ? row.id : null;
  if (!id) return null;
  return {
    id,
    fullName: typeof row.full_name === 'string' ? row.full_name : null,
    email: typeof row.email === 'string' ? row.email : null,
  };
}

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [impersonatorUserId, setImpersonatorUserId] = useState<string | null>(null);
  const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(null);
  const [impersonatedProfile, setImpersonatedProfile] = useState<ImpersonatedProfile | null>(null);
  const [isImpersonationLoading, setIsImpersonationLoading] = useState(false);

  const stopImpersonation = useCallback(() => {
    setImpersonatorUserId(null);
    setImpersonatedUserId(null);
    setImpersonatedProfile(null);
  }, []);

  const invokeImpersonation = useCallback(async (
    body: { action: 'status' } | { action: 'start'; target_user_id: string } | { action: 'stop' },
  ) => {
    let token = await getValidAccessToken(false);
    if (!token) {
      token = await getValidAccessToken(true);
    }

    if (!token) {
      return {
        data: null,
        error: withHttpStatus(`Neplatná relace uživatele (${IMPERSONATION_FUNCTION_NAME}). Přihlaste se prosím znovu.`),
      };
    }

    let lastResult = await invokeImpersonationRequest(body, token);
    if (!lastResult.error || !isAuthInvokeError(lastResult.error)) {
      return lastResult;
    }

    // Retry a few times with forced token refresh to avoid false session-expired errors
    // when auth state and network timing briefly race.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const refreshedToken = await getValidAccessToken(true);
      if (!refreshedToken) {
        break;
      }

      lastResult = await invokeImpersonationRequest(body, refreshedToken);
      if (!lastResult.error || !isAuthInvokeError(lastResult.error)) {
        return lastResult;
      }
    }

    return lastResult;
  }, []);

  const syncImpersonationStatus = useCallback(async () => {
    if (!user?.id) {
      stopImpersonation();
      return;
    }

    const { data, error } = await invokeImpersonation({
      action: 'status',
    }) as {
      data: {
        impersonated_user_id?: string;
        impersonated_profile?: unknown;
        error?: string;
      } | null;
      error: Error | null;
    };

    if (error) {
      if (isAuthInvokeError(error)) {
        // Keep UX stable when session is invalid.
        stopImpersonation();
        return;
      }
      throw error;
    }
    if (data?.error) throw new Error(data.error);

    const targetUserId = typeof data?.impersonated_user_id === 'string' ? data.impersonated_user_id : null;
    if (!targetUserId) {
      stopImpersonation();
      return;
    }

    setImpersonatorUserId(user.id);
    setImpersonatedUserId(targetUserId);
    const profileFromServer = parseImpersonatedProfile(data?.impersonated_profile);
    if (profileFromServer) {
      setImpersonatedProfile(profileFromServer);
      return;
    }

    const fallbackProfile = await loadProfile(targetUserId);
    setImpersonatedProfile(fallbackProfile);
  }, [invokeImpersonation, stopImpersonation, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      stopImpersonation();
      return;
    }

    setIsImpersonationLoading(true);
    void syncImpersonationStatus()
      .catch((error) => {
        console.error('Failed to sync impersonation status:', error);
        stopImpersonation();
      })
      .finally(() => {
        setIsImpersonationLoading(false);
      });
  }, [stopImpersonation, syncImpersonationStatus, user?.id]);

  const startImpersonation = useCallback(async (targetUserId: string) => {
    if (!user?.id) {
      throw new Error('Cannot impersonate without an authenticated user.');
    }

    if (targetUserId === user.id) {
      throw new Error('Cannot impersonate your own user.');
    }

    setIsImpersonationLoading(true);
    try {
      const { data, error } = await invokeImpersonation({
        action: 'start',
        target_user_id: targetUserId,
      }) as {
        data: { error?: string } | null;
        error: Error | null;
      };

      if (error) {
        if (isAuthInvokeError(error)) {
          // Operation might have succeeded server-side despite a transient auth transport failure.
          const statusCheck = await invokeImpersonation({
            action: 'status',
          });
          const statusData = statusCheck.data as { impersonated_user_id?: string } | null;
          if (!statusCheck.error && statusData?.impersonated_user_id === targetUserId) {
            await syncImpersonationStatus();
            toast.success('Impersonation started.');
            return;
          }
          throw new Error('Session expired during impersonation. Please sign in again.');
        }
        throw error;
      }
      if (data?.error) throw new Error(data.error);

      await syncImpersonationStatus();
      toast.success('Impersonation started.');
    } finally {
      setIsImpersonationLoading(false);
    }
  }, [invokeImpersonation, syncImpersonationStatus, user?.id]);

  const stopImpersonationRemote = useCallback(async () => {
    if (!impersonatedUserId) {
      stopImpersonation();
      return;
    }

    setIsImpersonationLoading(true);
    try {
      const { data, error } = await invokeImpersonation({
        action: 'stop',
      }) as {
        data: { error?: string } | null;
        error: Error | null;
      };

      if (error) {
        if (isAuthInvokeError(error)) {
          // Operation might have succeeded server-side despite a transient auth transport failure.
          const statusCheck = await invokeImpersonation({
            action: 'status',
          });
          const statusData = statusCheck.data as { impersonated_user_id?: string } | null;
          if (!statusCheck.error && !statusData?.impersonated_user_id) {
            stopImpersonation();
            toast.success('Impersonation stopped.');
            return;
          }
          stopImpersonation();
          throw new Error('Session expired during impersonation. Please sign in again.');
        }
        throw error;
      }
      if (data?.error) throw new Error(data.error);

      await syncImpersonationStatus();
      toast.success('Impersonation stopped.');
    } finally {
      setIsImpersonationLoading(false);
    }
  }, [impersonatedUserId, invokeImpersonation, stopImpersonation, syncImpersonationStatus]);

  const effectiveUserId = impersonatedUserId ?? user?.id ?? null;

  const value = useMemo<ImpersonationContextType>(
    () => ({
      effectiveUserId,
      impersonatorUserId,
      impersonatedUserId,
      impersonatedProfile,
      isImpersonating: !!impersonatedUserId,
      isImpersonationLoading,
      startImpersonation,
      stopImpersonation: stopImpersonationRemote,
    }),
    [
      effectiveUserId,
      impersonatorUserId,
      impersonatedUserId,
      impersonatedProfile,
      isImpersonationLoading,
      startImpersonation,
      stopImpersonationRemote,
    ],
  );

  return <ImpersonationContext.Provider value={value}>{children}</ImpersonationContext.Provider>;
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (!context) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
}
