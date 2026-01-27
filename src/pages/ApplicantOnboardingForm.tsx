import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { CheckCircle, Loader2, User, Building, CreditCard, MapPin, Search, AlertCircle, CalendarIcon, Heart, Camera } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import socialsLogo from '@/assets/socials-logo.png';
import { AvatarUpload } from '@/components/forms/AvatarUpload';

const formSchema = z.object({
  // Pre-filled from application
  full_name: z.string().min(2, 'Jméno je povinné'),
  email: z.string().email('Neplatný email'),
  phone: z.string().min(9, 'Telefon je povinný'),
  position: z.string().min(2, 'Pozice je povinná'),
  
  // Personal info (new section)
  birthday: z.date({ required_error: 'Datum narození je povinné' }),
  personal_email: z.string().email('Neplatný email').optional().or(z.literal('')),
  avatar_url: z.string().nullable().optional(),
  
  // Company info (ARES validated)
  ico: z.string().min(8, 'IČO musí mít 8 číslic').max(8, 'IČO musí mít 8 číslic'),
  company_name: z.string().min(1, 'Název firmy je povinný'),
  dic: z.string().optional(),
  
  // Billing address
  billing_street: z.string().min(1, 'Ulice je povinná'),
  billing_city: z.string().min(1, 'Město je povinné'),
  billing_zip: z.string().min(5, 'PSČ je povinné'),
  
  // Hourly rate
  hourly_rate: z.coerce.number().min(100, 'Minimální hodinová sazba je 100 Kč'),
  
  // Bank account
  bank_account: z.string().min(1, 'Číslo účtu je povinné'),
});

type FormData = z.infer<typeof formSchema>;

// Mock data for testing - in production would fetch from API
const MOCK_APPLICANT_DATA = {
  'mock-applicant-1': {
    full_name: 'Jan Novák',
    email: 'jan.novak@email.cz',
    phone: '+420 777 123 456',
    position: 'Performance Specialist',
  },
};

interface ARESData {
  company_name: string;
  dic?: string;
  billing_street: string;
  billing_city: string;
  billing_zip: string;
}

export default function ApplicantOnboardingForm() {
  const { applicantId } = useParams<{ applicantId: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isValidatingARES, setIsValidatingARES] = useState(false);
  const [aresError, setAresError] = useState<string | null>(null);
  const [aresValidated, setAresValidated] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      position: '',
      birthday: undefined,
      personal_email: '',
      avatar_url: null,
      ico: '',
      company_name: '',
      dic: '',
      billing_street: '',
      billing_city: '',
      billing_zip: '',
      hourly_rate: 0,
      bank_account: '',
    },
  });

  // Load applicant data
  useEffect(() => {
    if (applicantId) {
      // Simulate API call
      setTimeout(() => {
        const data = MOCK_APPLICANT_DATA[applicantId as keyof typeof MOCK_APPLICANT_DATA];
        if (data) {
          form.reset({
            ...form.getValues(),
            ...data,
          });
          setIsLoading(false);
        } else {
          setNotFound(true);
          setIsLoading(false);
        }
      }, 500);
    }
  }, [applicantId, form]);

  // ARES validation function
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
      
      // Extract data from ARES response
      const aresData: ARESData = {
        company_name: data.obchodniJmeno || '',
        dic: data.dic || '',
        billing_street: data.sidlo?.textovaAdresa?.split(',')[0] || '',
        billing_city: data.sidlo?.nazevObce || '',
        billing_zip: data.sidlo?.psc?.toString() || '',
      };

      // Update form with ARES data
      form.setValue('company_name', aresData.company_name);
      if (aresData.dic) form.setValue('dic', aresData.dic);
      if (aresData.billing_street) form.setValue('billing_street', aresData.billing_street);
      if (aresData.billing_city) form.setValue('billing_city', aresData.billing_city);
      if (aresData.billing_zip) form.setValue('billing_zip', aresData.billing_zip);

      setAresValidated(true);
      toast.success(`Údaje načteny z ARES: ${aresData.company_name}`);
    } catch (error) {
      setAresError(error instanceof Error ? error.message : 'Chyba při validaci IČO');
      setAresValidated(false);
    } finally {
      setIsValidatingARES(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    // Simulate API call - in production would call backend to:
    // 1. Update applicant with onboarding_completed_at
    // 2. Create new colleague record
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Onboarding data submitted:', data);
    toast.success('Onboarding dokončen! Byl jste přidán do týmu.');
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <h2 className="text-2xl font-bold">Odkaz nenalezen</h2>
            <p className="text-muted-foreground">
              Tento onboarding odkaz není platný nebo již vypršel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Onboarding dokončen!</h2>
            <p className="text-muted-foreground">
              Děkujeme za vyplnění všech údajů. Vaše fakturační údaje byly uloženy a můžete začít spolupracovat.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <img 
            src={socialsLogo} 
            alt="Socials" 
            className="h-12 mx-auto"
          />
          <div>
            <h1 className="text-3xl font-bold">Vítejte v týmu!</h1>
            <p className="text-muted-foreground mt-2">
              Pro dokončení nástupu vyplňte prosím fakturační údaje pro spolupráci na IČO.
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Onboarding formulář</CardTitle>
            <CardDescription>
              Zkontrolujte předvyplněné údaje a doplňte fakturační informace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Pre-filled info */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Základní údaje (z přihlášky)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Celé jméno *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pozice *</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly className="bg-muted" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefon *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Personal info - NEW SECTION */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Osobní údaje
                  </h3>

                  {/* Avatar Upload */}
                  <FormField
                    control={form.control}
                    name="avatar_url"
                    render={({ field }) => (
                      <FormItem className="flex flex-col items-center">
                        <FormLabel className="flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          Profilová fotka *
                        </FormLabel>
                        <FormControl>
                          <AvatarUpload
                            value={field.value || null}
                            onChange={field.onChange}
                            name={form.watch('full_name')}
                          />
                        </FormControl>
                        <FormDescription className="text-center">
                          Nahrajte svou fotku ve formátu 1:1 pro profil v CRM
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    format(field.value, "d. MMMM yyyy", { locale: cs })
                                  ) : (
                                    <span>Vybrat datum</span>
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
                          <FormDescription>
                            Pro sledování narozenin v týmu
                          </FormDescription>
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
                          <FormDescription>
                            Pro interní komunikaci (nepovinné)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Company/IČO info */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Fakturační údaje (IČO)
                  </h3>

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
                        <FormDescription>
                          Zadejte IČO a klikněte na ARES pro automatické doplnění údajů
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="company_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Název firmy / Jméno OSVČ *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Vyplní se z ARES" />
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
                          <FormDescription>Volitelné</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Fakturační adresa
                  </h3>

                  <FormField
                    control={form.control}
                    name="billing_street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ulice a číslo popisné *</FormLabel>
                        <FormControl>
                          <Input placeholder="Příkladná 123" {...field} />
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
                            <Input placeholder="Praha" {...field} />
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
                            <Input placeholder="110 00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Hourly rate & Bank */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Sazba a platební údaje
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="hourly_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hodinová sazba (Kč) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="500" 
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Vaše hodinová sazba pro fakturaci
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bank_account"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Číslo bankovního účtu *</FormLabel>
                          <FormControl>
                            <Input placeholder="123456789/0100" {...field} />
                          </FormControl>
                          <FormDescription>
                            Ve formátu číslo účtu/kód banky
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Submit */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Odesílám...
                    </>
                  ) : (
                    'Dokončit onboarding'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
