import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { CheckCircle, Loader2, User, Building, CreditCard, MapPin } from 'lucide-react';
import socialsLogo from '@/assets/socials-logo.png';

const formSchema = z.object({
  // Pre-filled from application
  full_name: z.string().min(2, 'Jméno je povinné'),
  email: z.string().email('Neplatný email'),
  phone: z.string().min(9, 'Telefon je povinný'),
  position: z.string().min(2, 'Pozice je povinná'),
  
  // New fields to fill
  birth_date: z.string().min(1, 'Datum narození je povinné'),
  birth_number: z.string().optional(),
  nationality: z.string().min(1, 'Státní příslušnost je povinná'),
  
  // Address
  street: z.string().min(1, 'Ulice je povinná'),
  city: z.string().min(1, 'Město je povinné'),
  zip: z.string().min(5, 'PSČ je povinné'),
  
  // Bank
  bank_account: z.string().min(1, 'Číslo účtu je povinné'),
  bank_code: z.string().min(4, 'Kód banky je povinný'),
  
  // Health insurance
  health_insurance: z.string().min(1, 'Zdravotní pojišťovna je povinná'),
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

export default function ApplicantOnboardingForm() {
  const { applicantId } = useParams<{ applicantId: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      position: '',
      birth_date: '',
      birth_number: '',
      nationality: 'Česká republika',
      street: '',
      city: '',
      zip: '',
      bank_account: '',
      bank_code: '',
      health_insurance: '',
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

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Onboarding data submitted:', data);
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
              Děkujeme za vyplnění všech údajů. Brzy se vám ozveme s dalšími informacemi o nástupu.
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
              Prosím vyplňte následující údaje pro dokončení nástupu.
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Onboarding formulář</CardTitle>
            <CardDescription>
              Zkontrolujte předvyplněné údaje a doplňte chybějící informace
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

                {/* Personal details */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Osobní údaje
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="birth_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Datum narození *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="birth_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rodné číslo</FormLabel>
                          <FormControl>
                            <Input placeholder="XXXXXX/XXXX" {...field} />
                          </FormControl>
                          <FormDescription>Volitelné</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Státní příslušnost *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="health_insurance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zdravotní pojišťovna *</FormLabel>
                        <FormControl>
                          <Input placeholder="např. VZP, ČPZP, OZP..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Address */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Trvalá adresa
                  </h3>

                  <FormField
                    control={form.control}
                    name="street"
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
                      name="city"
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
                      name="zip"
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

                {/* Bank details */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Bankovní spojení
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bank_account"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Číslo účtu *</FormLabel>
                          <FormControl>
                            <Input placeholder="123456789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bank_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kód banky *</FormLabel>
                          <FormControl>
                            <Input placeholder="0100" {...field} />
                          </FormControl>
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
