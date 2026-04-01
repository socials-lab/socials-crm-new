import { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import * as Sentry from '@sentry/react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getSessionEnsuringFresh, refreshSessionSafely } from '@/lib/authSession';
import { withTimeout } from '@/utils/asyncUtils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_CONTEXT_KEY = '__socials_auth_context__';
type AuthContextGlobal = typeof globalThis & {
  [AUTH_CONTEXT_KEY]?: typeof AuthContext;
};
const authContextGlobal = globalThis as AuthContextGlobal;
const StableAuthContext = authContextGlobal[AUTH_CONTEXT_KEY] ?? AuthContext;
if (!authContextGlobal[AUTH_CONTEXT_KEY]) {
  authContextGlobal[AUTH_CONTEXT_KEY] = StableAuthContext;
}

function isTransientFailure(error: unknown): boolean {
  const message = String((error as { message?: string })?.message ?? '').toLowerCase();
  return (
    message.includes('timeout') ||
    message.includes('abort') ||
    message.includes('network') ||
    message.includes('failed to fetch')
  );
}

function isHardAuthFailure(error: unknown): boolean {
  const message = String((error as { message?: string })?.message ?? '').toLowerCase();
  return (
    message.includes('invalid refresh token') ||
    message.includes('refresh_token_not_found') ||
    message.includes('session refresh returned no session') ||
    message.includes('auth session missing')
  );
}

function shouldSuppressSessionToast(pathname: string): boolean {
  return (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/offer/') ||
    pathname === '/offer-test' ||
    pathname.startsWith('/onboarding/') ||
    pathname.startsWith('/applicant-onboarding/') ||
    pathname.startsWith('/modification/') ||
    pathname.startsWith('/extra-work-approval/') ||
    pathname.startsWith('/creative-boost-share/') ||
    pathname.startsWith('/sop-share/')
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const sessionRef = useRef<Session | null>(null);
  const mountedRef = useRef(false);
  const syncInFlightRef = useRef(false);
  const explicitSignOutRef = useRef(false);
  const sessionLossToastShownRef = useRef(false);
  const lastSyncAtRef = useRef(0);
  const lastVisibilityStateRef = useRef<DocumentVisibilityState>(document.visibilityState);
  const hiddenAtRef = useRef<number | null>(null);

  const setAuthState = (nextSession: Session | null) => {
    sessionRef.current = nextSession;
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (nextSession?.user) {
      Sentry.setUser({
        id: nextSession.user.id,
        email: nextSession.user.email,
      });
    } else {
      Sentry.setUser(null);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    const syncSession = async (force = false) => {
      if (!mountedRef.current) return;
      if (syncInFlightRef.current) return;

      const now = Date.now();
      if (!force && now - lastSyncAtRef.current < 5000) return;
      lastSyncAtRef.current = now;
      syncInFlightRef.current = true;

      try {
        const { session: ensuredSession, error: ensuredError } = await withTimeout(
          getSessionEnsuringFresh(120),
          7000,
          'Timeout while loading auth session',
        );

        if (ensuredError) {
          throw ensuredError;
        }

        if (ensuredSession) {
          setAuthState(ensuredSession);
          sessionLossToastShownRef.current = false;
          return;
        }

        // If we previously had a session but now don't, try one refresh.
        if (sessionRef.current) {
          const { session: refreshedSession, error: refreshError } = await withTimeout(
            refreshSessionSafely(),
            8000,
            'Timeout while refreshing auth session',
          );

          if (refreshError || !refreshedSession) {
            throw refreshError || new Error('Auth session missing after refresh');
          }

          setAuthState(refreshedSession);
          sessionLossToastShownRef.current = false;
          return;
        }

        setAuthState(null);
      } catch (error) {
        console.error('Auth sync failed:', error);

        if (isTransientFailure(error)) {
          return;
        }

        if (isHardAuthFailure(error)) {
          setAuthState(null);
          if (!shouldSuppressSessionToast(window.location.pathname) && !sessionLossToastShownRef.current) {
            toast.error('Session expired. Please sign in again.');
            sessionLossToastShownRef.current = true;
          }
          return;
        }

        Sentry.captureException(error);
      } finally {
        syncInFlightRef.current = false;
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    void syncSession(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mountedRef.current) return;

      setAuthState(nextSession);
      setLoading(false);

      if (event === 'SIGNED_IN' && nextSession?.user) {
        sessionLossToastShownRef.current = false;
        void supabase
          .from('user_roles')
          .update({ last_login: new Date().toISOString() })
          .eq('user_id', nextSession.user.id);
      }

      if (event === 'SIGNED_OUT' && !explicitSignOutRef.current) {
        if (!shouldSuppressSessionToast(window.location.pathname) && !sessionLossToastShownRef.current) {
          toast.error('Session expired. Please sign in again.');
          sessionLossToastShownRef.current = true;
        }
      }

      explicitSignOutRef.current = false;
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
      }

      if (lastVisibilityStateRef.current === 'hidden' && document.visibilityState === 'visible') {
        const hiddenMs = hiddenAtRef.current ? Date.now() - hiddenAtRef.current : 0;
        if (hiddenMs >= 10000) {
          void syncSession(true);
        }
      }

      lastVisibilityStateRef.current = document.visibilityState;
    };

    const handleFocus = () => {
      void syncSession(true);
    };

    const refreshIfNearExpiry = async () => {
      if (!mountedRef.current) return;
      const currentSession = sessionRef.current;
      if (!currentSession?.expires_at) return;

      const expiresInMs = currentSession.expires_at * 1000 - Date.now();
      if (expiresInMs > 5 * 60 * 1000) return;

      try {
        const { session: refreshedSession, error } = await withTimeout(
          refreshSessionSafely(),
          8000,
          'Timeout while proactively refreshing auth session',
        );
        if (!error && refreshedSession) {
          setAuthState(refreshedSession);
          sessionLossToastShownRef.current = false;
        }
      } catch (error) {
        // Keep auth UX stable; regular syncSession/onAuthStateChange handles hard failures.
        console.warn('Proactive auth refresh failed:', error);
      }
    };

    const proactiveRefreshInterval = window.setInterval(() => {
      void refreshIfNearExpiry();
    }, 60 * 1000);

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      window.clearInterval(proactiveRefreshInterval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const branch = new URL(supabaseUrl).hostname.split('.')[0];
    const redirectTo = encodeURIComponent(window.location.origin + '/auth/callback');
    const anonKey = encodeURIComponent(import.meta.env.VITE_SUPABASE_ANON_KEY);
    window.location.href = `https://crm.socials.cz/auth-proxy/login?branch=${branch}&redirect_to=${redirectTo}&anon_key=${anonKey}`;
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    explicitSignOutRef.current = true;
    await supabase.auth.signOut();
    setAuthState(null);
  };

  return (
    <StableAuthContext.Provider value={{ user, session, loading, signIn, signInWithGoogle, signUp, signOut }}>
      {children}
    </StableAuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(StableAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
