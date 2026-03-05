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
          await supabase
            .from('user_roles')
            .update({ last_login: new Date().toISOString() })
            .eq('user_id', session.user.id);
        }

        // Handle unexpected session loss (e.g. refresh token revoked by race condition)
        if (event === 'SIGNED_OUT' && !isExplicitSignOut.current) {
          // Don't redirect if already on auth pages
          if (!window.location.pathname.startsWith('/auth')) {
            toast.error('Session expired. Please sign in again.');
            window.location.href = '/auth';
          }
        }
        isExplicitSignOut.current = false;
      }
    );

    return () => subscription.unsubscribe();
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
