import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from URL hash (magic link callback)
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          toast.error('Chyba při ověřování: ' + error.message);
          navigate('/auth');
          return;
        }

        if (session) {
          // User is authenticated, show password form for new users
          // or redirect to dashboard for existing users
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            // Check if this might be a new invite (no password set yet)
            // We'll show the password form for invite links
            const urlParams = new URLSearchParams(window.location.search);
            const type = urlParams.get('type');
            
            if (type === 'invite' || type === 'recovery') {
              setShowPasswordForm(true);
              setIsProcessing(false);
            } else {
              // Regular login, redirect to dashboard
              toast.success('Úspěšně přihlášeno!');
              navigate('/');
            }
          } else {
            // New user, show password form
            setShowPasswordForm(true);
            setIsProcessing(false);
          }
        } else {
          // No session, redirect to auth
          toast.error('Přihlášení vypršelo');
          navigate('/auth');
        }
      } catch (error) {
        console.error('Callback processing error:', error);
        toast.error('Neočekávaná chyba');
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
