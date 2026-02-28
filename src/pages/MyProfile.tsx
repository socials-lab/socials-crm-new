import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns'; // used for saving birthday
import {
  User,
  Mail,
  Phone,
  Building2,
  CreditCard,
  MapPin,
  CalendarDays,
  Loader2,
  Save,
  Briefcase,
  Search,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { AvatarUpload } from '@/components/forms/AvatarUpload';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCRMData } from '@/hooks/useCRMData';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useAresLookup } from '@/hooks/useAresLookup';
import { CompanySearchInput } from '@/components/shared/CompanySearchInput';
import type { CompanySearchResult } from '@/hooks/useAresSearch';
import { toast } from 'sonner';

const profileSchema = z.object({
  phone: z.string().nullable(),
  birthday: z.date().nullable(),
  personal_email: z.string().email('Zadejte platný email').nullable().or(z.literal('')),
  ico: z.string().nullable(),
  dic: z.string().nullable(),
  company_name: z.string().nullable(),
  billing_street: z.string().nullable(),
  billing_city: z.string().nullable(),
  billing_zip: z.string().nullable(),
  bank_account: z.string().nullable(),
  email_signature: z.string().nullable(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function MyProfile() {
  const { user } = useAuth();
  const { colleagueId } = useUserRole();
  const { updateColleague, getColleagueById } = useCRMData();
  const { lookupCompany, isLoading: isLoadingAres } = useAresLookup();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  const currentColleague = useMemo(() => {
    if (!colleagueId) return null;
    return getColleagueById(colleagueId);
  }, [colleagueId, getColleagueById]);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phone: currentColleague?.phone || null,
      birthday: currentColleague?.birthday ? new Date(currentColleague.birthday) : null,
      personal_email: currentColleague?.personal_email || null,
      ico: currentColleague?.ico || null,
      dic: currentColleague?.dic || null,
      company_name: currentColleague?.company_name || null,
      billing_street: currentColleague?.billing_street || null,
      billing_city: currentColleague?.billing_city || null,
      billing_zip: currentColleague?.billing_zip || null,
      bank_account: currentColleague?.bank_account || null,
      email_signature: currentColleague?.email_signature || null,
    },
  });

  // Reset form when colleague data loads
  useMemo(() => {
    if (currentColleague) {
      form.reset({
        phone: currentColleague.phone || null,
        birthday: currentColleague.birthday ? new Date(currentColleague.birthday) : null,
        personal_email: currentColleague.personal_email || null,
        ico: currentColleague.ico || null,
        dic: currentColleague.dic || null,
        company_name: currentColleague.company_name || null,
        billing_street: currentColleague.billing_street || null,
        billing_city: currentColleague.billing_city || null,
        billing_zip: currentColleague.billing_zip || null,
        bank_account: currentColleague.bank_account || null,
        email_signature: currentColleague.email_signature || null,
      });
    }
  }, [currentColleague?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const loadAvatar = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Failed to load profile avatar:', error);
        return;
      }

      setAvatarUrl(data?.avatar_url ?? null);
    };

    loadAvatar();
  }, [user?.id]);

  const handleAvatarChange = async (newAvatarUrl: string | null) => {
    if (!user?.id) return;

    const previousAvatar = avatarUrl;
    setAvatarUrl(newAvatarUrl);
    setIsSavingAvatar(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            avatar_url: newAvatarUrl,
            full_name: user.user_metadata?.full_name || currentColleague?.full_name || null,
            email: user.email || null,
          },
          { onConflict: 'id' }
        );

      if (error) throw error;
      toast.success('Profilová fotka byla uložena');
    } catch (error) {
      console.error('Failed to save profile avatar:', error);
      setAvatarUrl(previousAvatar);
      toast.error('Nepodařilo se uložit profilovou fotku');
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handleAresLookup = async () => {
    const ico = form.getValues('ico');
    if (!ico || ico.length < 8) {
      toast.error('Zadejte platné IČO (8 číslic)');
      return;
    }

    const result = await lookupCompany(ico);
    if (result) {
      form.setValue('company_name', result.name || '');
      form.setValue('dic', result.dic || '');
      if (result.address) {
        // Try to parse address (format may vary)
        const addressParts = result.address.split(',');
        if (addressParts.length >= 2) {
          form.setValue('billing_street', addressParts[0].trim());
          const cityZip = addressParts[addressParts.length - 1].trim().split(' ');
          if (cityZip.length >= 2) {
            form.setValue('billing_zip', cityZip[0]);
            form.setValue('billing_city', cityZip.slice(1).join(' '));
          } else {
            form.setValue('billing_city', cityZip[0]);
          }
        } else {
          form.setValue('billing_street', result.address);
        }
      }
      toast.success('Údaje načteny z ARES');
    }
  };

  const handleSubmit = async (data: ProfileFormData) => {
    if (!currentColleague) return;

    setIsSubmitting(true);

    const profilePayload = {
      phone: data.phone || null,
      birthday: data.birthday ? format(data.birthday, 'yyyy-MM-dd') : null,
      personal_email: data.personal_email || null,
      ico: data.ico || null,
      dic: data.dic || null,
      company_name: data.company_name || null,
      billing_street: data.billing_street || null,
      billing_city: data.billing_city || null,
      billing_zip: data.billing_zip || null,
      bank_account: data.bank_account || null,
      email_signature: data.email_signature || null,
    };

    try {
      await updateColleague(currentColleague.id, profilePayload);
      toast.success('Profil byl uložen');
    } catch (error: any) {
      const isMissingEmailSignatureColumn =
        error?.code === 'PGRST204' &&
        String(error?.message || '').includes('email_signature');

      if (isMissingEmailSignatureColumn) {
        try {
          const { email_signature: _emailSignature, ...payloadWithoutSignature } = profilePayload;
          await updateColleague(currentColleague.id, payloadWithoutSignature);
          toast.success('Profil byl uložen (bez podpisu – čeká se na migraci databáze)');
          return;
        } catch (fallbackError) {
          console.error('Failed to update profile after email_signature fallback:', fallbackError);
        }
      }

      console.error('Failed to update profile:', error);
      toast.error('Nepodařilo se uložit profil');
    } finally {
      setIsSubmitting(false);
    }
  };

  function handleCompanySelect(company: CompanySearchResult) {
    form.setValue('company_name', company.name);
    form.setValue('ico', company.ico);
    form.setValue('dic', company.dic || '');
    form.setValue('billing_street', company.billing_street);
    form.setValue('billing_city', company.billing_city);
    form.setValue('billing_zip', company.billing_zip);
    toast.success('Údaje načteny z ARES');
  }

  if (!colleagueId) {
    return (
      <div className="p-6">
        <PageHeader
          title="Můj"
          titleAccent="profil"
          description="Váš účet není propojen s profilem kolegy"
        />
        <Card className="mt-6">
          <CardContent className="py-12 text-center text-muted-foreground">
            Váš účet není propojen s žádným profilem kolegy. Kontaktujte administrátora.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentColleague) {
    return (
      <div className="p-6">
        <PageHeader
          title="Můj"
          titleAccent="profil"
          description="Načítání..."
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const seniorityLabels: Record<string, string> = {
    junior: 'Junior',
    mid: 'Mid',
    senior: 'Senior',
    partner: 'Partner',
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 animate-fade-in">
      <PageHeader
        title="Můj"
        titleAccent="profil"
        description="Spravujte své osobní a fakturační údaje"
      />

      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <AvatarUpload
              value={avatarUrl}
              onChange={handleAvatarChange}
              name={currentColleague.full_name}
              disabled={isSavingAvatar}
              className="shrink-0"
            />
            <div className="flex-1 space-y-2 text-center sm:text-left min-w-0 w-full">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h2 className="text-xl md:text-2xl font-bold">{currentColleague.full_name}</h2>
                <Badge variant={currentColleague.is_freelancer ? 'secondary' : 'outline'}>
                  {currentColleague.is_freelancer ? 'Freelancer' : 'Interní'}
                </Badge>
                <Badge variant="outline">
                  {seniorityLabels[currentColleague.seniority] || currentColleague.seniority}
                </Badge>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground">
                <Briefcase className="h-4 w-4 shrink-0" />
                <span className="truncate">{currentColleague.position}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground text-sm">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">{currentColleague.email}</span>
                <span className="text-xs shrink-0">(pracovní)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Osobní údaje
              </CardTitle>
              <CardDescription>
                Kontaktní informace a datum narození
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Telefon
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+420 602 123 456"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthday"
                  render={({ field }) => {
                    const currentYear = new Date().getFullYear();
                    const years = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => currentYear - i);
                    const months = [
                      { value: 0, label: 'Leden' },
                      { value: 1, label: 'Únor' },
                      { value: 2, label: 'Březen' },
                      { value: 3, label: 'Duben' },
                      { value: 4, label: 'Květen' },
                      { value: 5, label: 'Červen' },
                      { value: 6, label: 'Červenec' },
                      { value: 7, label: 'Srpen' },
                      { value: 8, label: 'Září' },
                      { value: 9, label: 'Říjen' },
                      { value: 10, label: 'Listopad' },
                      { value: 11, label: 'Prosinec' },
                    ];

                    const selectedYear = field.value?.getFullYear();
                    const selectedMonth = field.value?.getMonth();
                    const selectedDay = field.value?.getDate();

                    const daysInMonth = selectedYear && selectedMonth !== undefined
                      ? new Date(selectedYear, selectedMonth + 1, 0).getDate()
                      : 31;
                    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

                    const handleDateChange = (type: 'day' | 'month' | 'year', value: number) => {
                      const current = field.value || new Date(2000, 0, 1);
                      let newDate: Date;

                      if (type === 'year') {
                        newDate = new Date(value, current.getMonth(), Math.min(current.getDate(), new Date(value, current.getMonth() + 1, 0).getDate()));
                      } else if (type === 'month') {
                        newDate = new Date(current.getFullYear(), value, Math.min(current.getDate(), new Date(current.getFullYear(), value + 1, 0).getDate()));
                      } else {
                        newDate = new Date(current.getFullYear(), current.getMonth(), value);
                      }

                      field.onChange(newDate);
                    };

                    return (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          Datum narození
                        </FormLabel>
                        <div className="grid grid-cols-3 gap-2">
                          <Select
                            value={selectedDay?.toString() || ''}
                            onValueChange={(v) => handleDateChange('day', parseInt(v))}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Den" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {days.map((day) => (
                                <SelectItem key={day} value={day.toString()}>
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={selectedMonth?.toString() || ''}
                            onValueChange={(v) => handleDateChange('month', parseInt(v))}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Měsíc" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {months.map((month) => (
                                <SelectItem key={month.value} value={month.value.toString()}>
                                  {month.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={selectedYear?.toString() || ''}
                            onValueChange={(v) => handleDateChange('year', parseInt(v))}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Rok" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              <FormField
                control={form.control}
                name="personal_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Osobní email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="jan.novak@gmail.com"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormDescription>
                      Pro fakturační a smluvní účely (jiný než pracovní email)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email_signature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email podpis</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={`Jan Novak\nSocials`}
                        rows={5}
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormDescription>
                      Tento text se používá jako výchozí podpis v odchozích emailech.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Billing Info (for freelancers) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Fakturační údaje
              </CardTitle>
              <CardDescription>
                {currentColleague.is_freelancer
                  ? 'Údaje pro fakturaci jako OSVČ'
                  : 'Volitelné údaje pro interní zaměstnance'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Název firmy / Jméno OSVČ</FormLabel>
                    <FormControl>
                      <CompanySearchInput
                        value={field.value || ''}
                        onChange={(value) => field.onChange(value || null)}
                        onSelect={handleCompanySelect}
                        placeholder="Zadejte název firmy (min. 3 znaky)..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="ico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IČO</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="12345678"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value || null)}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleAresLookup}
                          disabled={isLoadingAres}
                          title="Načíst údaje z ARES"
                          className="shrink-0"
                        >
                          {isLoadingAres ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
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
                        <Input
                          placeholder="CZ12345678"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Fakturační adresa
                </h4>

                <FormField
                  control={form.control}
                  name="billing_street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ulice a číslo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Hlavní 123/4"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="billing_city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Město</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Praha"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value || null)}
                          />
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
                        <FormLabel>PSČ</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="110 00"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value || null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Account */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Platební údaje
              </CardTitle>
              <CardDescription>
                Bankovní účet pro zasílání odměn
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <FormField
                control={form.control}
                name="bank_account"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Číslo bankovního účtu</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123456789/0100"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormDescription>
                      Formát: číslo účtu / kód banky
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ukládám...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Uložit změny
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
