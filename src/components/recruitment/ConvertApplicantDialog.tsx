import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Loader2, Search, CheckCircle, AlertCircle, UserPlus, CalendarIcon, Camera, Mail, Hash, FolderKanban } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Applicant } from '@/types/applicant';
import { useApplicantsData } from '@/hooks/useApplicantsData';
import { AvatarUpload } from '@/components/forms/AvatarUpload';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  avatar_url: z.string().nullable().optional(),
  birthday: z.date({ required_error: 'Datum narození je povinné' }),
  personal_email: z.string().email('Neplatný email').optional().or(z.literal('')),
  ico: z.string().min(8, 'IČO musí mít 8 číslic').max(8, 'IČO musí mít 8 číslic'),
  company_name: z.string().min(1, 'Název firmy je povinný'),
  dic: z.string().optional(),
  hourly_rate: z.coerce.number().min(100, 'Minimální hodinová sazba je 100 Kč'),
  billing_street: z.string().min(1, 'Ulice je povinná'),
  billing_city: z.string().min(1, 'Město je povinné'),
  billing_zip: z.string().min(5, 'PSČ je povinné'),
  bank_account: z.string().min(1, 'Číslo účtu je povinné'),
});

type FormData = z.infer<typeof formSchema>;

interface ConvertApplicantDialogProps {
  applicant: Applicant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConvertApplicantDialog({ 
  applicant, 
  open, 
  onOpenChange 
}: ConvertApplicantDialogProps) {
  const { completeOnboarding } = useApplicantsData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingARES, setIsValidatingARES] = useState(false);
  const [aresError, setAresError] = useState<string | null>(null);
  const [aresValidated, setAresValidated] = useState(false);
  const [createWorkspaceAccount, setCreateWorkspaceAccount] = useState(true);
  const [inviteToSlack, setInviteToSlack] = useState(true);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [workspaceEmail, setWorkspaceEmail] = useState<string | null>(null);
  const [slackInvited, setSlackInvited] = useState(false);
  const [inviteToFreelo, setInviteToFreelo] = useState(true);
  const [freeloInvited, setFreeloInvited] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      avatar_url: applicant.avatar_url || null,
      birthday: applicant.birthday ? new Date(applicant.birthday) : undefined,
      personal_email: applicant.personal_email || '',
      ico: applicant.ico || '',
      company_name: applicant.company_name || '',
      dic: applicant.dic || '',
      hourly_rate: applicant.hourly_rate || 500,
      billing_street: applicant.billing_street || '',
      billing_city: applicant.billing_city || '',
      billing_zip: applicant.billing_zip || '',
      bank_account: applicant.bank_account || '',
    },
  });

  const validateARES = async (ico: string) => {
    if (ico.length !== 8) {
      setAresError('IČO musí mít přesně 8 číslic');
      return;
    }

    setIsValidatingARES(true);
    setAresError(null);

    try {
      const response = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`);
      
      if (!response.ok) {
        throw new Error('Subjekt nebyl nalezen v ARES');
      }

      const data = await response.json();
      
      form.setValue('company_name', data.obchodniJmeno || '');
      if (data.dic) form.setValue('dic', data.dic);
      if (data.sidlo?.textovaAdresa) {
        form.setValue('billing_street', data.sidlo.textovaAdresa.split(',')[0] || '');
      }
      if (data.sidlo?.nazevObce) form.setValue('billing_city', data.sidlo.nazevObce);
      if (data.sidlo?.psc) form.setValue('billing_zip', data.sidlo.psc.toString());

      setAresValidated(true);
      toast.success(`Údaje načteny z ARES: ${data.obchodniJmeno}`);
    } catch (error) {
      setAresError(error instanceof Error ? error.message : 'Chyba při validaci IČO');
      setAresValidated(false);
    } finally {
      setIsValidatingARES(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // Create Google Workspace account if enabled
      let generatedEmail: string | undefined;
      if (createWorkspaceAccount) {
        setIsCreatingAccount(true);
        const nameParts = applicant.full_name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const { data: wsData, error: wsError } = await supabase.functions.invoke('create-workspace-account', {
          body: {
            first_name: firstName,
            last_name: lastName,
            personal_email: data.personal_email || applicant.email,
          },
        });

        setIsCreatingAccount(false);

        if (wsError) {
          console.error('Workspace account error:', wsError);
          toast.error('Nepodařilo se vytvořit Google Workspace účet', {
            description: wsError.message,
          });
        } else if (wsData?.success) {
          generatedEmail = wsData.email;
          setWorkspaceEmail(wsData.email);
          toast.success(`Google Workspace účet vytvořen: ${wsData.email}`, {
            description: `Dočasné heslo bylo nastaveno. Pozvánka odeslána na ${data.personal_email || applicant.email}.`,
            duration: 10000,
          });
        } else if (wsData?.error) {
          toast.error('Google Workspace: ' + wsData.error);
        }
      }

      // Invite to Slack
      if (inviteToSlack) {
        const slackEmail = generatedEmail || applicant.email;
        const { data: slackData, error: slackError } = await supabase.functions.invoke('invite-slack-user', {
          body: {
            email: slackEmail,
            channels: ['general'],
          },
        });

        if (slackError) {
          console.error('Slack invite error:', slackError);
          toast.error('Nepodařilo se pozvat do Slacku', { description: slackError.message });
        } else if (slackData?.success) {
          setSlackInvited(true);
          toast.success(slackData.message);
        } else if (slackData?.error) {
          toast.error('Slack: ' + slackData.error);
        }
      }

      // Invite to Freelo onboarding project
      if (inviteToFreelo) {
        const freeloEmail = generatedEmail || applicant.email;
        const { data: freeloData, error: freeloError } = await supabase.functions.invoke('invite-freelo-user', {
          body: { email: freeloEmail },
        });

        if (freeloError) {
          console.error('Freelo invite error:', freeloError);
          toast.error('Nepodařilo se pozvat do Freelo', { description: freeloError.message });
        } else if (freeloData?.success) {
          setFreeloInvited(true);
          toast.success(freeloData.message);
        } else if (freeloData?.error) {
          toast.error('Freelo: ' + freeloData.error);
        }
      }

      const colleague = completeOnboarding(applicant.id, {
        full_name: applicant.full_name,
        email: generatedEmail || applicant.email,
        phone: applicant.phone || '',
        position: applicant.position,
        avatar_url: data.avatar_url || undefined,
        birthday: data.birthday ? data.birthday.toISOString().split('T')[0] : undefined,
        personal_email: data.personal_email || undefined,
        ico: data.ico,
        company_name: data.company_name,
        dic: data.dic,
        hourly_rate: data.hourly_rate,
        billing_street: data.billing_street,
        billing_city: data.billing_city,
        billing_zip: data.billing_zip,
        bank_account: data.bank_account,
      });

      toast.success(`${applicant.full_name} byl přidán do kolegů`);
      onOpenChange(false);
      form.reset();
      setWorkspaceEmail(null);
      setSlackInvited(false);
      setFreeloInvited(false);
    } catch (error) {
      toast.error('Nepodařilo se převést uchazeče');
    } finally {
      setIsSubmitting(false);
      setIsCreatingAccount(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Převést na kolegu
          </DialogTitle>
          <DialogDescription>
            Zadejte fakturační údaje pro {applicant.full_name}
          </DialogDescription>
        </DialogHeader>

        {applicant.onboarding_completed_at && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
            <CheckCircle className="h-4 w-4 text-primary shrink-0" />
            <span>Údaje předvyplněny z onboardingového formuláře</span>
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Avatar upload */}
            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center">
                  <FormLabel className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Profilová fotka
                  </FormLabel>
                  <FormControl>
                    <AvatarUpload
                      value={field.value || null}
                      onChange={field.onChange}
                      name={applicant.full_name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Personal info section */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="birthday"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Datum narození *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "d. M. yyyy", { locale: cs })
                            ) : (
                              <span>Vybrat</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          className="pointer-events-auto"
                          captionLayout="dropdown-buttons"
                          fromYear={1950}
                          toYear={new Date().getFullYear()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="personal_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Soukromý email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jan@gmail.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* IČO with ARES validation */}
            <FormField
              control={form.control}
              name="ico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IČO *</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="12345678"
                        maxLength={8}
                        onChange={(e) => {
                          field.onChange(e);
                          setAresValidated(false);
                          setAresError(null);
                        }}
                      />
                    </FormControl>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => validateARES(field.value)}
                      disabled={isValidatingARES || field.value.length !== 8}
                    >
                      {isValidatingARES ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-1" />
                          ARES
                        </>
                      )}
                    </Button>
                  </div>
                  {aresError && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {aresError}
                    </div>
                  )}
                  {aresValidated && (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      IČO ověřeno v ARES
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Název firmy *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DIČ</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="CZ12345678" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="billing_street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ulice a číslo *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="billing_city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Město *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billing_zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PSČ *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hourly_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hodinová sazba (Kč) *</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bank_account"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Číslo účtu *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123456789/0100" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Google Workspace account */}
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Vytvořit Google Workspace účet</span>
                </div>
                <Switch 
                  checked={createWorkspaceAccount} 
                  onCheckedChange={setCreateWorkspaceAccount} 
                />
              </div>
              {createWorkspaceAccount && (
                <p className="text-xs text-muted-foreground">
                  Bude vytvořen email <span className="font-mono font-medium text-foreground">
                    {(() => {
                      const parts = applicant.full_name.split(' ');
                      const first = parts[0]?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';
                      const last = parts.slice(1).join(' ').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';
                      return `${first}.${last}@socials.cz`;
                    })()}
                  </span> a na soukromý email přijde pozvánka k přihlášení.
                </p>
              )}
              {workspaceEmail && (
                <div className="flex items-center gap-1 text-sm text-primary">
                  <CheckCircle className="h-4 w-4" />
                  Účet vytvořen: {workspaceEmail}
                </div>
              )}
            </div>

            {/* Slack invite */}
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Pozvat do Slacku</span>
                </div>
                <Switch 
                  checked={inviteToSlack} 
                  onCheckedChange={setInviteToSlack} 
                />
              </div>
              {inviteToSlack && (
                <p className="text-xs text-muted-foreground">
                  Na email kolegy bude odeslána pozvánka do Slack workspace a bude přidán do výchozích kanálů.
                </p>
              )}
              {slackInvited && (
                <div className="flex items-center gap-1 text-sm text-primary">
                  <CheckCircle className="h-4 w-4" />
                  Pozvánka do Slacku odeslána
                </div>
              )}
            </div>

            {/* Freelo invite */}
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Pozvat do Freelo</span>
                </div>
                <Switch 
                  checked={inviteToFreelo} 
                  onCheckedChange={setInviteToFreelo} 
                />
              </div>
              {inviteToFreelo && (
                <p className="text-xs text-muted-foreground">
                  Email kolegy bude pozván do onboardingového Freelo projektu.
                </p>
              )}
              {freeloInvited && (
                <div className="flex items-center gap-1 text-sm text-primary">
                  <CheckCircle className="h-4 w-4" />
                  Pozván do Freelo
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Zrušit
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Ukládám...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Převést na kolegu
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
