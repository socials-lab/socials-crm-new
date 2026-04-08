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
import { useMeetingScheduleUrl } from '@/hooks/useMeetingScheduleUrl';
import { User, Bell, Loader2, Calendar, Save } from 'lucide-react';
import { EmailTemplatesManager } from '@/components/settings/EmailTemplatesManager';

type EmailNotificationLevel = 'none' | 'important' | 'all';
type NotificationEmailRoute = {
  notification_type: string;
  recipient_emails: string[];
  is_enabled: boolean;
};

const NOTIFICATION_ROUTE_LABELS: Record<string, string> = {
  new_lead: 'Nový lead',
  form_completed: 'Vyplněný formulář',
  contract_signed: 'Podepsaná smlouva',
  lead_converted: 'Lead převeden na klienta',
  access_granted: 'Přístupy přijaty',
  offer_sent: 'Nabídka odeslána',
  colleague_birthday: 'Narozeniny kolegy',
  new_feedback_idea: 'Nový feedback nápad',
};

export default function Settings() {
  const { user } = useAuth();
  const { role, isSuperAdmin } = useUserRole();
  const { toast } = useToast();
  const { meetingUrl, isLoading: isMeetingUrlLoading, saveMeetingUrl, isSaving } = useMeetingScheduleUrl();

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [emailLevel, setEmailLevel] = useState<EmailNotificationLevel>('none');
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [meetingUrlValue, setMeetingUrlValue] = useState('');
  const [isMeetingUrlDirty, setIsMeetingUrlDirty] = useState(false);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [notificationRoutes, setNotificationRoutes] = useState<NotificationEmailRoute[]>([]);
  const [savingRouteType, setSavingRouteType] = useState<string | null>(null);

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

  useEffect(() => {
    if (isMeetingUrlLoading) return;
    setMeetingUrlValue(meetingUrl);
    setIsMeetingUrlDirty(false);
  }, [meetingUrl, isMeetingUrlLoading]);

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

  useEffect(() => {
    if (!canSeeSettings) return;

    let cancelled = false;
    const loadRoutes = async () => {
      setRoutesLoading(true);
      const { data, error } = await supabase.functions.invoke<{ routes: NotificationEmailRoute[] }>('notification-email-routing', {
        body: { action: 'list' },
      });
      if (cancelled) return;
      if (error) {
        toast({ title: 'Chyba', description: 'Nepodařilo se načíst routování notifikačních e-mailů.', variant: 'destructive' });
      } else {
        setNotificationRoutes(data?.routes || []);
      }
      setRoutesLoading(false);
    };

    loadRoutes();
    return () => {
      cancelled = true;
    };
  }, [canSeeSettings]);

  const updateRouteField = (notificationType: string, patch: Partial<NotificationEmailRoute>) => {
    setNotificationRoutes((prev) => prev.map((route) => (
      route.notification_type === notificationType ? { ...route, ...patch } : route
    )));
  };

  const saveRoute = async (route: NotificationEmailRoute) => {
    setSavingRouteType(route.notification_type);
    const normalizedEmails = route.recipient_emails
      .map((email) => String(email || '').trim().toLowerCase())
      .filter((email) => email.length > 0);

    const { error } = await supabase.functions.invoke('notification-email-routing', {
      body: {
        action: 'upsert',
        routes: [
          {
            notification_type: route.notification_type,
            recipient_emails: normalizedEmails,
            is_enabled: route.is_enabled,
          },
        ],
      },
    });

    if (error) {
      toast({ title: 'Chyba', description: `Nepodařilo se uložit routování pro "${NOTIFICATION_ROUTE_LABELS[route.notification_type] || route.notification_type}".`, variant: 'destructive' });
    } else {
      toast({ title: 'Uloženo', description: `Routování pro "${NOTIFICATION_ROUTE_LABELS[route.notification_type] || route.notification_type}" bylo uloženo.` });
      updateRouteField(route.notification_type, { recipient_emails: normalizedEmails });
    }

    setSavingRouteType(null);
  };

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Nepodařilo se ulozit profil.';
      toast({ title: 'Chyba', description: message, variant: 'destructive' });
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              URL pro sjednání schůzky
            </CardTitle>
            <CardDescription>
              Odkaz na Calendly, Cal.com nebo jiný plánovač. Tato URL se použije v emailu "Žádost o schůzku".
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={meetingUrlValue}
              onChange={(event) => {
                const nextValue = event.target.value;
                setMeetingUrlValue(nextValue);
                setIsMeetingUrlDirty(nextValue !== meetingUrl);
              }}
              placeholder="https://calendly.com/vas-profil"
            />
            <Button
              onClick={() => {
                saveMeetingUrl(meetingUrlValue.trim());
                setIsMeetingUrlDirty(false);
              }}
              disabled={!isMeetingUrlDirty || isSaving}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Ukládám...' : 'Uložit URL'}
            </Button>
          </CardContent>
        </Card>

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

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" />
              Routování notifikačních e-mailů
            </CardTitle>
            <CardDescription>
              Nastavte, komu chodí jednotlivé notifikační e-maily. Více adres oddělte čárkou.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {routesLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Načítám routování...
              </div>
            ) : (
              notificationRoutes.map((route) => (
                <div key={route.notification_type} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm">
                      {NOTIFICATION_ROUTE_LABELS[route.notification_type] || route.notification_type}
                    </p>
                    <Switch
                      checked={route.is_enabled}
                      onCheckedChange={(checked) => updateRouteField(route.notification_type, { is_enabled: checked })}
                    />
                  </div>
                  <Input
                    placeholder="email1@socials.cz, email2@socials.cz"
                    value={route.recipient_emails.join(', ')}
                    onChange={(event) => {
                      const emails = event.target.value
                        .split(',')
                        .map((email) => email.trim())
                        .filter((email) => email.length > 0);
                      updateRouteField(route.notification_type, { recipient_emails: emails });
                    }}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => saveRoute(route)}
                      disabled={savingRouteType === route.notification_type}
                    >
                      {savingRouteType === route.notification_type && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Uložit
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <EmailTemplatesManager />
      </div>
    </div>
  );
}
