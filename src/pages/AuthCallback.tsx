import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { Loader2, CheckCircle } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent double processing
    if (processedRef.current) return;
    processedRef.current = true;

    console.log('[AuthCallback] Component mounted, URL:', window.location.href);

    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const code = urlParams.get('code');
        const token = urlParams.get('token');
        const type = urlParams.get('type');
        const oauthType = sessionStorage.getItem('oauth_type');
        
        // Get tokens from hash (Supabase puts them there after redirect)
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const hashType = hashParams.get('type');
        const hashError = hashParams.get('error');
        const errorCode = hashParams.get('error_code');
        const errorDescription = hashParams.get('error_description');
        
        console.log('[AuthCallback] Parsed params:', { 
          code: code ? 'present' : 'none',
          token: token ? 'present' : 'none',
          type, 
          accessToken: accessToken ? 'present' : 'none',
          refreshToken: refreshToken ? 'present' : 'none',
          hashType, hashError, errorCode,
          hash: window.location.hash,
          search: window.location.search
        });
        
        // Check for errors in hash (from Supabase redirect)
        if (hashError) {
          console.error('[AuthCallback] Auth error from hash:', hashError, errorCode, errorDescription);
          
          // Provide specific error messages based on error code
          if (errorCode === 'otp_expired' || errorDescription?.includes('expired')) {
            toast.error('Platnost odkazu vypršela. Požádejte administrátora o novou pozvánku.');
          } else if (errorCode === 'access_denied') {
            toast.error('Přístup zamítnut. Kontaktujte administrátora.');
          } else if (errorDescription) {
            toast.error('Chyba přihlášení: ' + errorDescription);
          } else {
            toast.error('Chyba přihlášení: ' + hashError);
          }
          navigate('/auth');
          return;
        }
        
        // Check if this is a Google Calendar OAuth callback
        if (code && oauthType === 'google_calendar') {
          console.log('[AuthCallback] Google Calendar OAuth callback');
          sessionStorage.removeItem('oauth_type');
          
          // Exchange code for tokens via Edge Function
          const redirectUri = `${window.location.origin}/auth/callback`;
          const { data, error } = await supabase.functions.invoke('calendar-oauth-callback', {
            body: { code, redirect_uri: redirectUri },
          });
          
          if (error || data?.error) {
            console.error('[AuthCallback] Google OAuth error:', error || data?.error);
            toast.error('Chyba při propojování Google kalendáře: ' + (error?.message || data?.error));
          } else {
            toast.success('Google kalendář byl úspěšně propojen!');
          }
          
          // Redirect back to meetings page
          navigate('/meetings');
          return;
        }
        
        // If we have access_token in hash, Supabase's detectSessionInUrl should handle it
        // But we need to check if it's an invite and remember the type
        const isInviteFlow = hashType === 'invite' || type === 'invite';
        
        if (accessToken && refreshToken) {
          console.log('[AuthCallback] Tokens found in hash, isInviteFlow:', isInviteFlow);
          
          // Store invite flag before Supabase potentially clears the hash
          if (isInviteFlow) {
            sessionStorage.setItem('auth_invite_flow', 'true');
          }
          
          // Don't manually call setSession - Supabase's detectSessionInUrl handles this
          // Just wait a moment for Supabase to process
          console.log('[AuthCallback] Waiting for Supabase to process tokens...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Handle invite/recovery token verification (if token is in URL params, not hash)
        if (token && (type === 'invite' || type === 'recovery' || type === 'signup')) {
          console.log('[AuthCallback] Verifying token for type:', type);
          
          const otpType = type === 'invite' ? 'invite' : type === 'recovery' ? 'recovery' : 'signup';
          
          const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: otpType,
          });
          
          if (verifyError) {
            console.error('[AuthCallback] Token verification error:', verifyError);
            
            // Provide specific error messages
            if (verifyError.message.includes('expired')) {
              toast.error('Platnost odkazu vypršela. Požádejte administrátora o novou pozvánku.');
            } else if (verifyError.message.includes('invalid')) {
              toast.error('Neplatný odkaz. Zkontrolujte, že jste použili celý odkaz z e-mailu.');
            } else if (verifyError.message.includes('already') || verifyError.message.includes('used')) {
              toast.error('Tento odkaz již byl použit. Přihlaste se pomocí svého hesla.');
            } else {
              toast.error('Chyba při ověřování odkazu: ' + verifyError.message);
            }
            navigate('/auth');
            return;
          }
          
          if (verifyData.session) {
            console.log('[AuthCallback] Token verified, session created, showing password form');
            // Token verified, show password form
            setShowPasswordForm(true);
            setIsProcessing(false);
            return;
          }
        }
        
        // Supabase may have already processed the URL and established a session
        // (due to detectSessionInUrl: true). Wait a moment and check for session.
        console.log('[AuthCallback] No direct tokens found, waiting for Supabase to process...');
        
        // Small delay to allow Supabase to process the URL
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Try to get existing session (might be set by Supabase automatically)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('[AuthCallback] Session check:', { 
          hasSession: !!session, 
          error: sessionError?.message,
          userEmail: session?.user?.email,
          userCreatedAt: session?.user?.created_at,
          userConfirmedAt: session?.user?.confirmed_at
        });

        if (sessionError) {
          console.error('[AuthCallback] Auth callback error:', sessionError);
          toast.error('Chyba při ověřování: ' + sessionError.message);
          navigate('/auth');
          return;
        }

        if (session) {
          // User is authenticated
          console.log('[AuthCallback] User authenticated:', session.user.email);
          
          // Check if this user was recently created (within last 5 minutes) - likely from invite
          const createdAt = new Date(session.user.created_at);
          const now = new Date();
          const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60);
          const isNewUser = minutesSinceCreation < 5;
          
          // Check for invite flow flag we might have stored
          const storedInviteFlag = sessionStorage.getItem('auth_invite_flow');
          if (storedInviteFlag) {
            sessionStorage.removeItem('auth_invite_flow');
          }
          
          // Check if user has no password set (invited users don't have password initially)
          // We detect this by checking if they came from an invite flow
          const isFromInvite = hashType === 'invite' || type === 'invite' || storedInviteFlag === 'true' || isNewUser;
          
          console.log('[AuthCallback] User analysis:', { 
            minutesSinceCreation, 
            isNewUser, 
            isFromInvite,
            hashType,
            type,
            storedInviteFlag
          });
          
          if (isFromInvite) {
            console.log('[AuthCallback] Showing password form for invited/new user');
            setShowPasswordForm(true);
            setIsProcessing(false);
            return;
          }
          
          // Regular login, redirect to dashboard
          toast.success('Úspěšně přihlášeno!');
          navigate('/');
        } else {
          // No session and no token - user needs to log in
          console.log('[AuthCallback] No session found, no tokens in URL');
          toast.error('Odkaz pro přihlášení není platný nebo již vypršel. Přihlaste se prosím.');
          navigate('/auth');
        }
      } catch (error) {
        console.error('[AuthCallback] Callback processing error:', error);
        toast.error('Neočekávaná chyba při zpracování přihlášení');
        navigate('/auth');
      }
    };

    handleCallback();
  }, [navigate]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Heslo musí mít alespoň 6 znaků');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Hesla se neshodují');
      return;
    }

    setIsSettingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.error('Chyba při nastavení hesla: ' + error.message);
        return;
      }

      toast.success('Heslo bylo úspěšně nastaveno!');
      navigate('/');
    } catch (error) {
      console.error('Password setting error:', error);
      toast.error('Neočekávaná chyba');
    } finally {
      setIsSettingPassword(false);
    }
  };

  const handleSkipPassword = () => {
    toast.success('Vítejte v aplikaci!');
    navigate('/');
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Ověřuji přihlášení...</p>
        </div>
      </div>
    );
  }

  if (showPasswordForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Vítejte v Socials CRM!</CardTitle>
            <CardDescription>
              Nastavte si heslo pro přihlášení do aplikace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nové heslo</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSettingPassword}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Potvrdit heslo</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isSettingPassword}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSettingPassword}>
                {isSettingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Nastavuji heslo...
                  </>
                ) : (
                  'Nastavit heslo'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleSkipPassword}
                disabled={isSettingPassword}
              >
                Přeskočit a pokračovat
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
