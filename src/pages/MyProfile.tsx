import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
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
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useCRMData } from '@/hooks/useCRMData';
import { useUserRole } from '@/hooks/useUserRole';
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
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function MyProfile() {
  const { colleagueId } = useUserRole();
  const { colleagues, updateColleague, getColleagueById } = useCRMData();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      });
    }
  }, [currentColleague?.id]);

  const handleSubmit = async (data: ProfileFormData) => {
    if (!currentColleague) return;

    setIsSubmitting(true);
    try {
      await updateColleague(currentColleague.id, {
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
      });
      toast.success('Profil byl uložen');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Nepodařilo se uložit profil');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const initials = currentColleague.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  const seniorityLabels: Record<string, string> = {
    junior: 'Junior',
    mid: 'Mid',
    senior: 'Senior',
    partner: 'Partner',
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Můj"
        titleAccent="profil"
        description="Spravujte své osobní a fakturační údaje"
      />

      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20 text-2xl">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">{currentColleague.full_name}</h2>
                <Badge variant={currentColleague.is_freelancer ? 'secondary' : 'outline'}>
                  {currentColleague.is_freelancer ? 'Freelancer' : 'Interní'}
                </Badge>
                <Badge variant="outline">
                  {seniorityLabels[currentColleague.seniority] || currentColleague.seniority}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span>{currentColleague.position}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{currentColleague.email}</span>
                <span className="text-xs">(pracovní)</span>
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
            <CardContent className="space-y-4">
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
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Datum narození
                      </FormLabel>
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
                                format(field.value, "d. MMMM yyyy", { locale: cs })
                              ) : (
                                <span>Vybrat datum</span>
                              )}
                              <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
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
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="ico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IČO</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="12345678"
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

              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Název firmy / Jméno OSVČ</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Jan Novák"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            <CardContent>
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
