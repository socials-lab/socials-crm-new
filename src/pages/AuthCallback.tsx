import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Loader2 } from 'lucide-react';
import { withTimeout } from '@/utils/asyncUtils';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function resolveSessionWithRetry(attempts = 4): Promise<boolean> {
      for (let i = 0; i < attempts; i += 1) {
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          5000,
          'Timeout while checking auth session'
        );
        if (error) throw error;
        if (data.session) return true;
        if (i < attempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, 400));
        }
      }
      return false;
    }

    async function handleCallback() {
      try {
        const url = new URL(window.location.href);
        const searchParams = url.searchParams;
        const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : '');

        const code = searchParams.get('code');
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        const oauthType = sessionStorage.getItem('oauth_type');

        const hashError = hashParams.get('error');
        const hashErrorDescription = hashParams.get('error_description');
        if (hashError) {
          toast.error(hashErrorDescription || 'Authentication callback failed');
          navigate('/auth', { replace: true });
          return;
        }

        // Dedicated flow for Google Calendar OAuth callback.
        if (code && oauthType === 'google_calendar') {
          sessionStorage.removeItem('oauth_type');
          const redirectUri = 'https://crm.socials.cz/auth-proxy/calendar-callback';
          const { data, error } = await withTimeout(
            supabase.functions.invoke('calendar-oauth-callback', {
              body: { code, redirect_uri: redirectUri },
            }),
            12000,
            'Timeout while processing Google Calendar callback'
          );

          if (error || data?.error) {
            throw new Error((data as { error?: string } | null)?.error || error?.message || 'Google callback failed');
          }

          toast.success('Google account connected successfully.');
          navigate('/meetings', { replace: true });
          return;
        }

        // Magic-link / invite hash flow is processed by Supabase internally (detectSessionInUrl=true).
        // For code flow we must exchange it explicitly.
        if (code) {
          const { error } = await withTimeout(
            supabase.auth.exchangeCodeForSession(code),
            10000,
            'Timeout while exchanging auth code'
          );
          if (error) throw error;
        }

        // Handle token-hash flow from invited or recovery links.
        if (token && (type === 'invite' || type === 'recovery' || type === 'signup')) {
          const otpType = type === 'invite' ? 'invite' : type === 'recovery' ? 'recovery' : 'signup';
          const { error } = await withTimeout(
            supabase.auth.verifyOtp({
              token_hash: token,
              type: otpType,
            }),
            10000,
            'Timeout while verifying auth link'
          );
          if (error) throw error;
        }

        const hasSession = await resolveSessionWithRetry();
        if (!hasSession) {
          throw new Error('No auth session after callback');
        }

        toast.success('Successfully signed in.');
        navigate('/my-profile', { replace: true });
      } catch (error) {
        console.error('Auth callback failed:', error);
        toast.error((error as { message?: string })?.message || 'Authentication failed.');
        navigate('/auth', { replace: true });
      } finally {
        if (!cancelled) {
          setIsProcessing(false);
        }
      }
    }

    void handleCallback();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Processing sign-in...</p>
        </div>
      </div>
    );
  }

  return null;
}
