import { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import * as Sentry from '@sentry/react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isExplicitSignOut = useRef(false);
  const revalidateInFlightRef = useRef(false);
  const lastVisibilityState = useRef<DocumentVisibilityState>(document.visibilityState);
  const hiddenAtRef = useRef<number | null>(null);
  const lastRevalidateAtRef = useRef(0);
  const sessionLossToastShownRef = useRef(false);

  useEffect(() => {
    // Get initial session; always resolve loading state to avoid infinite spinner.
    async function initializeAuth() {
      try {
        const { data: { session }, error } = await withTimeout(
          supabase.auth.getSession(),
          12000,
          'Timeout while loading auth session'
        );
        if (error) {
          throw error;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          Sentry.setUser({
            id: session.user.id,
            email: session.user.email,
          });
        }
      } catch (error) {
        console.error('Error initializing auth session:', error);
        Sentry.captureException(error);
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    void initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Update Sentry user context
        if (session?.user) {
          Sentry.setUser({
            id: session.user.id,
            email: session.user.email,
          });
        } else {
          Sentry.setUser(null);
        }

        // Update last_login on sign in
        if (event === 'SIGNED_IN' && session?.user) {
          sessionLossToastShownRef.current = false;
          await supabase
            .from('user_roles')
            .update({ last_login: new Date().toISOString() })
            .eq('user_id', session.user.id);
        }

        // Handle unexpected session loss (e.g. refresh token revoked by race condition)
        if (event === 'SIGNED_OUT' && !isExplicitSignOut.current) {
          if (!window.location.pathname.startsWith('/auth')) {
            if (!sessionLossToastShownRef.current) {
              toast.error('Session expired. Please sign in again.');
              sessionLossToastShownRef.current = true;
            }
            setSession(null);
            setUser(null);
          }
        }
        isExplicitSignOut.current = false;
      }
    );

    const isHardAuthFailure = (error: unknown): boolean => {
      const message = String((error as { message?: string })?.message ?? '').toLowerCase();
      return (
        message.includes('invalid refresh token') ||
        message.includes('refresh_token_not_found') ||
        message.includes('jwt expired') ||
        message.includes('session refresh returned no session')
      );
    };

    const isTransientFailure = (error: unknown): boolean => {
      const message = String((error as { message?: string })?.message ?? '').toLowerCase();
      return (
        message.includes('timeout') ||
        message.includes('abort') ||
        message.includes('network') ||
        message.includes('failed to fetch')
      );
    };

    const revalidateSession = async () => {
      if (revalidateInFlightRef.current) return;

      const now = Date.now();
      if (now - lastRevalidateAtRef.current < 10000) return;
      lastRevalidateAtRef.current = now;

      if (!session?.user) return;
      if (session.expires_at && session.expires_at * 1000 - now > 5 * 60 * 1000) {
        return;
      }

      revalidateInFlightRef.current = true;

      try {
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          5000,
          'Timeout while revalidating auth session'
        );

        if (error) {
          throw error;
        }

        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          return;
        }

        const { data: refreshed, error: refreshError } = await withTimeout(
          supabase.auth.refreshSession(),
          8000,
          'Timeout while refreshing auth session'
        );

        if (refreshError || !refreshed.session) {
          throw refreshError || new Error('Session refresh returned no session');
        }

        setSession(refreshed.session);
        setUser(refreshed.session.user);
        sessionLossToastShownRef.current = false;
      } catch (error) {
        console.error('Session revalidation failed:', error);
        if (isTransientFailure(error)) {
          return;
        }

        if (isHardAuthFailure(error) && !window.location.pathname.startsWith('/auth')) {
          if (!sessionLossToastShownRef.current) {
            toast.error('Session expired. Please sign in again.');
            sessionLossToastShownRef.current = true;
          }
          setSession(null);
          setUser(null);
        }
      } finally {
        revalidateInFlightRef.current = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
      }

      if (lastVisibilityState.current === 'hidden' && document.visibilityState === 'visible') {
        const hiddenMs = hiddenAtRef.current ? Date.now() - hiddenAtRef.current : 0;
        if (hiddenMs >= 30000) {
          void revalidateSession();
        }
      }

      lastVisibilityState.current = document.visibilityState;
    };

    const handleFocus = () => {
      const now = Date.now();
      if (now - lastRevalidateAtRef.current > 30000) {
        void revalidateSession();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
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
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    isExplicitSignOut.current = true;
    await supabase.auth.signOut();
    Sentry.setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signInWithGoogle, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
