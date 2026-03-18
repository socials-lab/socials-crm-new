import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Bell, Loader2 } from 'lucide-react';
import { EmailTemplatesManager } from '@/components/settings/EmailTemplatesManager';

type EmailNotificationLevel = 'none' | 'important' | 'all';

export default function Settings() {
  const { user } = useAuth();
  const { role, isSuperAdmin } = useUserRole();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [emailLevel, setEmailLevel] = useState<EmailNotificationLevel>('none');
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  // Load email notification preference from profiles table
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('email_notification_level')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.email_notification_level) {
          setEmailLevel(data.email_notification_level as EmailNotificationLevel);
        }
        setLoadingPrefs(false);
      });
  }, [user]);

  const updateEmailLevel = async (newLevel: EmailNotificationLevel) => {
    if (!user) return;
    const prev = emailLevel;
    setEmailLevel(newLevel);
    const { error } = await supabase
      .from('profiles')
      .update({ email_notification_level: newLevel })
      .eq('id', user.id);

    if (error) {
      setEmailLevel(prev);
      toast({ title: 'Chyba', description: 'Nepodařilo se uložit nastavení.', variant: 'destructive' });
    } else {
      const labels: Record<EmailNotificationLevel, string> = {
        none: 'E-mailové notifikace vypnuty.',
        important: 'Budete dostávat jen důležité e-maily.',
        all: 'Budete dostávat všechny e-maily.',
      };
      toast({ title: 'Uloženo', description: labels[newLevel] });
    }
  };

  const canSeeSettings = isSuperAdmin || role === 'admin' || role === 'management';

  const handleSaveProfile = async () => {
    if (!user) return;
    const trimmed = fullName.trim();
    if (!trimmed) {
      toast({ title: 'Chyba', description: 'Jméno nemůže být prázdné.', variant: 'destructive' });
      return;
    }

    setSavingProfile(true);
    try {
      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: trimmed })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: trimmed },
      });

      if (authError) throw authError;

      // Update linked colleague record if one exists
      const { data: colleague } = await supabase
        .from('colleagues')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (colleague) {
        await supabase
          .from('colleagues')
          .update({ full_name: trimmed })
          .eq('id', colleague.id);
      }

      toast({ title: 'Uloženo', description: 'Profil byl úspěšně aktualizován.' });
    } catch (err: any) {
      toast({ title: 'Chyba', description: err.message || 'Nepodařilo se uložit profil.', variant: 'destructive' });
    } finally {
      setSavingProfile(false);
    }
  };

  if (!canSeeSettings) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Přístup odepřen</h2>
          <p className="text-muted-foreground">Nemáte oprávnění k zobrazení nastavení.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="⚙️ Nastavení"
        titleAccent="systému"
        description="Správa účtu a předvoleb"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Profile Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Profil
            </CardTitle>
            <CardDescription>Správa osobních údajů</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Celé jméno</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user?.email || ''} disabled />
              <p className="text-xs text-muted-foreground">Email je svázán s Google účtem a nelze ho změnit.</p>
            </div>
            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Uložit změny
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" />
              Notifikace
            </CardTitle>
            <CardDescription>Nastavení e-mailových upozornění</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Pouze důležité e-maily</p>
                <p className="text-xs text-muted-foreground">
                  Podpis smlouvy, převod leadu, vyplněný formulář
                </p>
              </div>
              <Switch
                checked={emailLevel === 'important' || emailLevel === 'all'}
                onCheckedChange={(checked) => {
                  if (checked) {
                    updateEmailLevel('important');
                  } else {
                    updateEmailLevel('none');
                  }
                }}
                disabled={loadingPrefs}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Všechny e-mailové notifikace</p>
                <p className="text-xs text-muted-foreground">
                  E-mail při každé notifikaci (nový lead, nabídka aj.)
                </p>
              </div>
              <Switch
                checked={emailLevel === 'all'}
                onCheckedChange={(checked) => {
                  if (checked) {
                    updateEmailLevel('all');
                  } else {
                    updateEmailLevel(emailLevel === 'all' ? 'important' : 'none');
                  }
                }}
                disabled={loadingPrefs}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Notifikace v aplikaci jsou vždy aktivní.
            </p>
          </CardContent>
        </Card>

        <EmailTemplatesManager />
      </div>
    </div>
  );
}
