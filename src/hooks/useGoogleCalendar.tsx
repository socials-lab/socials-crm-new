import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { invokeWithTimeout } from '@/lib/supabaseUtils';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  htmlLink?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  organizer?: {
    email: string;
    displayName?: string;
  };
  status?: string;
  created?: string;
  updated?: string;
}

export const DEFAULT_GMAIL_BCC = 'danny@socials.cz';

export function useGoogleCalendar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hasGmailScope, setHasGmailScope] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  const checkConnection = useCallback(async () => {
    if (!user?.id) {
      setIsCheckingConnection(false);
      return;
    }
    
    setIsCheckingConnection(true);
    try {
      const { data, error } = await supabase
        .from('calendar_tokens')
        .select('expires_at, scopes, refresh_token')
        .eq('user_id', user.id)
        .single();

      if (data) {
        // User is considered "connected" if they have a refresh_token
        // (access_token expires after ~1 hour, but can be refreshed by Edge Functions)
        const hasRefreshToken = !!data.refresh_token;
        setIsConnected(hasRefreshToken);
        
        // Check if user has Gmail send scope
        const hasGmail = data.scopes && Array.isArray(data.scopes) && 
          data.scopes.includes('https://www.googleapis.com/auth/gmail.send');
        setHasGmailScope(hasGmail && hasRefreshToken);
      } else {
        setIsConnected(false);
        setHasGmailScope(false);
      }
    } catch {
      setIsConnected(false);
      setHasGmailScope(false);
    } finally {
      setIsCheckingConnection(false);
    }
  }, [user?.id]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Handle OAuth callback - call this from AuthCallback page when Google OAuth code is detected
  const handleOAuthCallback = async (code: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const redirectUri = 'https://crm.socials.cz/auth-proxy/calendar-callback';

      const { data, error } = await supabase.functions.invoke('calendar-oauth-callback', {
        body: { code, redirect_uri: redirectUri },
      });
      
      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      setIsConnected(true);
      toast.success('Google účet byl úspěšně propojen (kalendář a email)');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Chyba při propojování kalendáře';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const connectGoogleCalendar = () => {
    // Store state to identify Google OAuth callback
    sessionStorage.setItem('oauth_type', 'google_calendar');
    
    // Redirect to Google OAuth
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google OAuth není nakonfigurováno');
      return;
    }
    
    const redirectUri = 'https://crm.socials.cz/auth-proxy/calendar-callback';
    const state = btoa(window.location.origin);
    const scope = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.send';
    const responseType = 'code';
    const accessType = 'offline';
    const prompt = 'consent';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&access_type=${accessType}&prompt=${prompt}&state=${encodeURIComponent(state)}`;
    
    window.location.href = authUrl;
  };

  const SESSION_RESET_MESSAGE = 'Relace vypršela nebo je neplatná. Přihlaste se prosím znovu.';
  const RELOGIN_REQUIRED_MESSAGE = 'Vaše přihlášení vyžaduje nové ověření. Přihlaste se prosím znovu.';
  const PROJECT_REF_RESET_COOLDOWN_KEY = 'google_calendar_project_ref_reset_done';

  const getSupabaseProjectRef = () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) return null;
      return new URL(supabaseUrl).hostname.split('.')[0] ?? null;
    } catch {
      return null;
    }
  };

  const decodeJwtPayload = (token?: string | null): Record<string, unknown> | null => {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length < 2) return null;

    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const json = atob(padded);
      return JSON.parse(json);
    } catch {
      return null;
    }
  };

  const hasProjectRefMismatch = (accessToken?: string | null) => {
    const expectedRef = getSupabaseProjectRef();
    if (!expectedRef) return false;

    const payload = decodeJwtPayload(accessToken);
    const tokenRef = typeof payload?.ref === 'string' ? payload.ref : null;
    return !!tokenRef && tokenRef !== expectedRef;
  };

  const clearSupabaseAuthStorage = () => {
    const projectRef = getSupabaseProjectRef();
    const storageAreas = [window.localStorage, window.sessionStorage];

    for (const storage of storageAreas) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        if (!key) continue;

        const isCurrentProjectAuthKey = projectRef
          ? key.startsWith(`sb-${projectRef}-`) && key.includes('auth-token')
          : false;
        const isSupabaseAuthTokenKey = /^sb-[^-]+-auth-token$/.test(key);

        if (isCurrentProjectAuthKey || isSupabaseAuthTokenKey) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => storage.removeItem(key));
    }
  };

  const notifySessionInvalid = () => {
    toast.error(SESSION_RESET_MESSAGE);
  };

  const notifyReloginRequired = () => {
    toast.error(RELOGIN_REQUIRED_MESSAGE);
  };

  const shouldSkipProjectRefReset = () => {
    try {
      return window.sessionStorage.getItem(PROJECT_REF_RESET_COOLDOWN_KEY) === '1';
    } catch {
      return false;
    }
  };

  const markProjectRefResetHandled = () => {
    try {
      window.sessionStorage.setItem(PROJECT_REF_RESET_COOLDOWN_KEY, '1');
    } catch {
      // Ignore storage failures
    }
  };

  const forceSessionReset = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    clearSupabaseAuthStorage();
    notifySessionInvalid();
  };

  const handleProjectRefMismatch = async (accessToken?: string | null) => {
    if (!hasProjectRefMismatch(accessToken)) return false;

    if (shouldSkipProjectRefReset()) {
      console.warn('Supabase session project ref mismatch already handled in this tab, skipping repeated reset');
      return true;
    }

    markProjectRefResetHandled();
    console.warn('Supabase session project ref mismatch detected, resetting local session');
    await forceSessionReset();
    return true;
  };

  const isAuthFunctionError = (error: unknown) => {
    if (!error) return false;

    const candidate = error as {
      message?: string;
      name?: string;
      context?: { status?: number };
      status?: number;
    };

    const message = candidate.message?.toLowerCase() ?? '';
    const status = candidate.context?.status ?? candidate.status;

    if (status === 401) return true;

    const looksLikeInvalidJwt =
      message.includes('invalid jwt') ||
      message.includes('jwt expired') ||
      message.includes('unauthorized') ||
      message.includes('session') ||
      message.includes('401');

    const isFunctionsHttpError = candidate.name === 'FunctionsHttpError';
    return status === 401 || (isFunctionsHttpError && looksLikeInvalidJwt) || looksLikeInvalidJwt;
  };

  const createCalendarEvent = async (meetingId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('calendar-create-event', {
        body: { meeting_id: meetingId },
      });
      
      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      toast.success('Pozvánky byly odeslány do Google kalendáře');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Chyba při vytváření události';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmail = async (
    to: string,
    subject: string,
    html: string,
    options?: { cc?: string; bcc?: string; leadId?: string }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await invokeWithTimeout('gmail-send-email', {
        body: {
          to,
          subject,
          html,
          cc: options?.cc,
          bcc: options?.bcc,
          lead_id: options?.leadId,
        },
      }, 60000);

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : 'Chyba při odesílání emailu';
      const errorMessage = rawMessage.includes('Požadavek vypršel')
        ? `${rawMessage} (Google API pravděpodobně neodpovědělo včas.)`
        : rawMessage;
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch calendar events
  const fetchCalendarEvents = async (options?: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
  }): Promise<GoogleCalendarEvent[]> => {
    try {
      // Check current session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session ? 'exists' : 'null', session?.user?.email);

      if (!session) {
        console.error('No active session');
        toast.error('Nejste přihlášeni');
        return [];
      }

      if (await handleProjectRefMismatch(session.access_token)) {
        return [];
      }

      // Convert to snake_case for the edge function
      const body = options ? {
        time_min: options.timeMin,
        time_max: options.timeMax,
        max_results: options.maxResults,
      } : {};

      console.log('Fetching calendar events with options:', body);

      const invokeCalendarFetch = (accessToken?: string | null) =>
        supabase.functions.invoke('calendar-fetch-events', {
          body,
          headers: accessToken
            ? {
                Authorization: `Bearer ${accessToken}`,
                apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
              }
            : undefined,
        });

      let { data, error } = await invokeCalendarFetch(session.access_token);

      if (error && isAuthFunctionError(error)) {
        console.warn('Calendar fetch auth error detected, trying session recovery flow', error);

        // 1) Re-read current session and retry once with explicit latest token
        const { data: latestData, error: latestError } = await supabase.auth.getSession();
        const latestSession = latestData.session;

        if (!latestError && latestSession) {
          if (await handleProjectRefMismatch(latestSession.access_token)) {
            return [];
          }

          const retryWithLatest = await invokeCalendarFetch(latestSession.access_token);
          data = retryWithLatest.data;
          error = retryWithLatest.error;

          if (!error || !isAuthFunctionError(error)) {
            // Recovery succeeded
          } else {
            // 2) If still auth failing, force refresh and retry once more
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            const refreshedSession = refreshData.session;

            if (!refreshError && refreshedSession) {
              if (await handleProjectRefMismatch(refreshedSession.access_token)) {
                return [];
              }

              const retryAfterRefresh = await invokeCalendarFetch(refreshedSession.access_token);
              data = retryAfterRefresh.data;
              error = retryAfterRefresh.error;
            }
          }
        } else {
          // 2b) No session from getSession() — try refresh once
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          const refreshedSession = refreshData.session;

          if (!refreshError && refreshedSession) {
            if (await handleProjectRefMismatch(refreshedSession.access_token)) {
              return [];
            }

            const retryAfterRefresh = await invokeCalendarFetch(refreshedSession.access_token);
            data = retryAfterRefresh.data;
            error = retryAfterRefresh.error;
          }
        }

        if (error && isAuthFunctionError(error)) {
          console.error('Calendar fetch still failing auth after full recovery flow, re-login required', error);
          notifyReloginRequired();
          return [];
        }
      }

      console.log('Calendar fetch response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        toast.error('Chyba při načítání kalendáře: ' + error.message);
        return [];
      }

      // Check if token was revoked - update connection status
      if (data?.tokenRevoked) {
        console.log('Google token was revoked, updating connection status');
        setIsConnected(false);
        setHasGmailScope(false);
        toast.error('Google přístup vypršel. Prosím znovu propojte svůj účet.', {
          action: {
            label: 'Propojit',
            onClick: () => connectGoogleCalendar(),
          },
        });
        return [];
      }

      if (data?.error) {
        console.error('Calendar fetch error:', data.error);
        toast.error('Chyba z Google Calendar: ' + data.error);
        return [];
      }

      console.log('Fetched events count:', data?.events?.length || 0);
      return data?.events || [];
    } catch (err) {
      console.error('Failed to fetch calendar events:', err);
      toast.error('Nepodařilo se načíst kalendář');
      return [];
    }
  };

  return {
    connectGoogleCalendar,
    handleOAuthCallback,
    createCalendarEvent,
    sendEmail,
    fetchCalendarEvents,
    checkConnection,
    isConnected,
    hasGmailScope,
    isCheckingConnection,
    isLoading,
    error
  };
}
