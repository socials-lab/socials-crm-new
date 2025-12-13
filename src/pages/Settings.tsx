import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { User, Building, Bell, Shield } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { role, isSuperAdmin } = useUserRole();
  
  const canSeeSettings = isSuperAdmin || role === 'admin' || role === 'management';

  if (!canSeeSettings) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Přístup odepřen</h2>
          <p className="text-muted-foreground">Nemáte oprávnění k zobrazení nastavení.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
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
              <Input id="name" defaultValue={user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={user?.email || ''} />
            </div>
            <Button>Uložit změny</Button>
          </CardContent>
        </Card>

        {/* Organization Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building className="h-4 w-4" />
              Organizace
            </CardTitle>
            <CardDescription>Nastavení agentury</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="org-name">Název agentury</Label>
              <Input id="org-name" defaultValue="Socials" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Výchozí měna</Label>
              <Input id="currency" defaultValue="CZK" />
            </div>
            <Button>Uložit změny</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" />
              Notifikace
            </CardTitle>
            <CardDescription>Nastavení upozornění</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">E-mailové notifikace</p>
                <p className="text-xs text-muted-foreground">Přijímat aktualizace e-mailem</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Upozornění na nízkou marži</p>
                <p className="text-xs text-muted-foreground">Oznámení při poklesu marže pod cíl</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Notifikace o nových leadech</p>
                <p className="text-xs text-muted-foreground">Oznámení při přidání nového leadu</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Zabezpečení
            </CardTitle>
            <CardDescription>Nastavení zabezpečení účtu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Dvoufaktorové ověření</p>
                <p className="text-xs text-muted-foreground">Přidejte další vrstvu zabezpečení</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label>Změna hesla</Label>
              <Input type="password" placeholder="Aktuální heslo" />
              <Input type="password" placeholder="Nové heslo" />
              <Input type="password" placeholder="Potvrdit nové heslo" />
            </div>
            <Button>Aktualizovat heslo</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
