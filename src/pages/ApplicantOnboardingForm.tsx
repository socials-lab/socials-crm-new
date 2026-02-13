import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Progress } from '@/components/ui/progress';
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
import { CheckCircle2, Loader2, User, Building, CreditCard, MapPin, Search, AlertCircle, CalendarIcon, Heart, Camera, ArrowLeft, ArrowRight, Sparkles, ClipboardList } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import socialsLogo from '@/assets/socials-logo.png';
import { AvatarUpload } from '@/components/forms/AvatarUpload';

const formSchema = z.object({
  full_name: z.string().min(2, 'Jméno je povinné'),
  email: z.string().email('Neplatný email'),
  phone: z.string().min(9, 'Telefon je povinný'),
  position: z.string().min(2, 'Pozice je povinná'),
  birthday: z.date({ required_error: 'Datum narození je povinné' }),
  personal_email: z.string().email('Neplatný email').optional().or(z.literal('')),
  avatar_url: z.string().min(1, 'Profilová fotka je povinná'),
  ico: z.string().optional().or(z.literal('')),
  company_name: z.string().min(1, 'Název firmy je povinný'),
  dic: z.string().optional(),
  billing_street: z.string().min(1, 'Ulice je povinná'),
  billing_city: z.string().min(1, 'Město je povinné'),
  billing_zip: z.string().min(5, 'PSČ je povinné'),
  hourly_rate: z.coerce.number().min(100, 'Minimální hodinová sazba je 100 Kč'),
  bank_account: z.string().min(1, 'Číslo účtu je povinné'),
});

type FormData = z.infer<typeof formSchema>;

const MOCK_APPLICANT_DATA = {
  'mock-applicant-1': {
    full_name: 'Jan Novák',
    email: 'jan.novak@email.cz',
    phone: '+420 777 123 456',
    position: 'Performance Specialist',
  },
  'test-applicant': {
    full_name: 'Tereza Testovací',
    email: 'tereza@test.cz',
    phone: '+420 600 123 456',
    position: 'Social Media Specialist',
  },
};

interface ARESData {
  company_name: string;
  dic?: string;
  billing_street: string;
  billing_city: string;
  billing_zip: string;
}

const TOTAL_STEPS = 6;
const stepLabels = [
  'Úvod',
  'O tobě',
  'Osobní údaje',
  'Fakturační údaje',
  'Sazba a platba',
  'Souhrn',
];

const stepIcons = [Sparkles, User, Heart, Building, CreditCard, CheckCircle2];

const stepFieldMap: Record<number, string[]> = {
  0: [],
  1: ['full_name', 'email', 'phone', 'position'],
  2: ['birthday', 'avatar_url'],
  3: ['company_name', 'billing_street', 'billing_city', 'billing_zip'],
  4: ['hourly_rate', 'bank_account'],
  5: [],
};

export default function ApplicantOnboardingForm() {
  const { applicantId } = useParams<{ applicantId: string }>();
  const [currentStep, setCurrentStep] = useState(0);
  const [stepDirection, setStepDirection] = useState<'forward' | 'backward'>('forward');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isValidatingARES, setIsValidatingARES] = useState(false);
  const [aresError, setAresError] = useState<string | null>(null);
  const [aresValidated, setAresValidated] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [noIco, setNoIco] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      position: '',
      birthday: undefined,
      personal_email: '',
      avatar_url: '',
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

  useEffect(() => {
    if (applicantId) {
      setTimeout(() => {
        const data = MOCK_APPLICANT_DATA[applicantId as keyof typeof MOCK_APPLICANT_DATA];
        if (data) {
          form.reset({ ...form.getValues(), ...data });
          setIsLoading(false);
        } else {
          setNotFound(true);
          setIsLoading(false);
        }
      }, 500);
    }
  }, [applicantId, form]);

  const validateARES = async (ico: string) => {
    if (ico.length !== 8) {
      setAresError('IČO musí mít přesně 8 číslic');
      return;
    }
    setIsValidatingARES(true);
    setAresError(null);
    try {
      const response = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`);
      if (!response.ok) throw new Error('Subjekt nebyl nalezen v ARES');
      const data = await response.json();
      const aresData: ARESData = {
        company_name: data.obchodniJmeno || '',
        dic: data.dic || '',
        billing_street: data.sidlo?.textovaAdresa?.split(',')[0] || '',
        billing_city: data.sidlo?.nazevObce || '',
        billing_zip: data.sidlo?.psc?.toString() || '',
      };
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

  const validateCurrentStep = useCallback(async () => {
    const fields = stepFieldMap[currentStep] as any[];
    if (fields.length === 0) return true;
    return await form.trigger(fields);
  }, [currentStep, form]);

  const goNext = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) return;
    setStepDirection('forward');
    setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setStepDirection('backward');
    setCurrentStep(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Onboarding data submitted:', data);
    toast.success('Onboarding dokončen! Vítej v týmu.');
    setIsSubmitted(true);
    setIsSubmitting(false);
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <img src={socialsLogo} alt="Socials" className="h-10 mx-auto mb-4" />
            <CardTitle className="text-destructive">Odkaz nenalezen</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <style>{`
          @keyframes confetti-fall {
            0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
          .confetti-piece {
            position: fixed;
            top: -10px;
            animation: confetti-fall linear forwards;
            z-index: 50;
          }
        `}</style>
        {Array.from({ length: 35 }).map((_, i) => {
          const colors = ['#FF0000', '#FF6B35', '#FFD700', '#00C851', '#2196F3', '#9C27B0', '#FF4081', '#00BCD4'];
          const color = colors[i % colors.length];
          const left = Math.random() * 100;
          const size = Math.random() * 8 + 5;
          const duration = Math.random() * 2 + 2.5;
          const delay = Math.random() * 1.5;
          const shape = i % 3 === 0 ? '50%' : i % 3 === 1 ? '0' : '2px';
          return (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${left}%`,
                width: `${size}px`,
                height: `${size * (i % 2 === 0 ? 1 : 1.5)}px`,
                backgroundColor: color,
                borderRadius: shape,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}

        <Card className="max-w-lg w-full relative z-10">
          <CardHeader className="text-center">
            <img src={socialsLogo} alt="Socials" className="h-10 mx-auto mb-4" />
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">🎉 Děkujeme!</CardTitle>
            <p className="text-base text-muted-foreground mt-2">
              Tvoje údaje byly úspěšně odeslány. Teď je řada na nás!
            </p>
          </CardHeader>
          <CardContent className="space-y-6">

            <div className="space-y-4">
              <h3 className="font-semibold text-center text-lg">Co bude následovat?</h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0 text-sm">1</div>
                  <div>
                    <p className="font-medium">📝 Smlouva k digitálnímu podpisu</p>
                    <p className="text-sm text-muted-foreground">
                      Na základě vyplněných údajů připravíme smlouvu o spolupráci a pošleme ti ji k digitálnímu podpisu do 24 hodin.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-muted-foreground/20 text-muted-foreground flex items-center justify-center font-bold shrink-0 text-sm">2</div>
                  <div>
                    <p className="font-medium">📧 Založíme ti Socials email</p>
                    <p className="text-sm text-muted-foreground">
                      Po podpisu smlouvy ti na osobní email pošleme přihlašovací údaje k novému firemnímu emailu @socials.cz.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-muted-foreground/20 text-muted-foreground flex items-center justify-center font-bold shrink-0 text-sm">3</div>
                  <div>
                    <p className="font-medium">🛠️ Přístup do nástrojů</p>
                    <p className="text-sm text-muted-foreground">
                      Automaticky ti založíme účty ve Freelo (projektový nástroj) a Slacku (komunikace). Pozvánka přijde na tvůj nový Socials email.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-muted-foreground/20 text-muted-foreground flex items-center justify-center font-bold shrink-0 text-sm">4</div>
                  <div>
                    <p className="font-medium">📞 Onboarding call</p>
                    <p className="text-sm text-muted-foreground">
                      Domluvíme se na úvodním hovoru, kde tě provedeme vším potřebným pro start spolupráce.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center py-4">
              <p className="text-xl font-bold">🤝 Těšíme se na spolupráci!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StepIcon = stepIcons[currentStep];

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card className="text-center">
            <CardHeader className="pb-2">
              <div className="flex justify-center mb-2">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Vítej v týmu Socials! 🎉</CardTitle>
              <p className="text-muted-foreground mt-2">
                Abychom mohli připravit smlouvu a vše potřebné pro start spolupráce, potřebujeme od tebe vyplnit krátký onboarding formulář.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-left space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Co tě čeká</h4>
                <div className="space-y-2">
                  {[
                    { icon: User, label: 'Základní údaje', desc: 'Tvoje jméno, kontakt a pozice' },
                    { icon: Building, label: 'Fakturační údaje', desc: 'IČO a údaje pro smlouvu' },
                    { icon: MapPin, label: 'Adresa a platba', desc: 'Fakturační adresa a bankovní účet' },
                    { icon: ClipboardList, label: 'Souhrn a odeslání', desc: 'Kontrola údajů a souhlas' },
                  ].map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">⏱ Vyplnění zabere asi 3 minuty</p>
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                O tobě
              </CardTitle>
              <p className="text-sm text-muted-foreground">Zkontroluj si své údaje z přihlášky a případně je uprav.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tvoje celé jméno *</FormLabel>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Soukromý email *</FormLabel>
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
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="h-5 w-5 text-primary" />
                Osobní údaje
              </CardTitle>
              <p className="text-sm text-muted-foreground">Pár osobních informací, ať se lépe poznáme.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="avatar_url"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center">
                    <FormLabel className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Tvoje profilová fotka
                    </FormLabel>
                    <FormControl>
                      <AvatarUpload
                        value={field.value || null}
                        onChange={field.onChange}
                        name={form.watch('full_name')}
                      />
                    </FormControl>
                    <FormDescription className="text-center">
                      Nahraj svou fotku ve formátu 1:1 pro profil v CRM
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
                                <span>Vyber datum</span>
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
                            captionLayout="dropdown"
                            fromYear={1950}
                            toYear={new Date().getFullYear()}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Ať ti můžeme popřát k narozeninám 🎂
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building className="h-5 w-5 text-primary" />
                Fakturační údaje
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {noIco ? 'Vyplň fakturační údaje ručně.' : 'Zadej své IČO a my doplníme zbytek z ARES.'}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {!noIco && (
                <FormField
                  control={form.control}
                  name="ico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IČO</FormLabel>
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
                          <CheckCircle2 className="h-4 w-4" />
                          IČO ověřeno v ARES
                        </div>
                      )}
                      <FormDescription>
                        Zadej IČO a klikni na ARES pro automatické doplnění údajů
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox
                  checked={noIco}
                  onCheckedChange={(checked) => {
                    setNoIco(checked === true);
                    if (checked) {
                      setAresValidated(false);
                      setAresError(null);
                      form.setValue('ico', '');
                    }
                  }}
                />
                Nemám IČO (ještě nemám živnostenský list)
              </label>

              {(aresValidated || noIco) && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="company_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{noIco ? 'Celé jméno (pro smlouvu) *' : 'Název firmy / Jméno OSVČ *'}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={noIco ? 'Jan Novák' : ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {!noIco && (
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
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {noIco ? 'Trvalé bydliště' : 'Fakturační adresa'}
                    </h4>
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
                    <div className="grid grid-cols-2 gap-4 mt-4">
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
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                Sazba a platba
              </CardTitle>
              <p className="text-sm text-muted-foreground">Tvoje hodinová sazba a kam ti pošleme peníze.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                  control={form.control}
                  name="hourly_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domluvená hodinová sazba na vícepráce (Kč) *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="500" {...field} />
                      </FormControl>
                      <FormDescription>
                        Za klienty budeš mít fixní částku
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
            </CardContent>
          </Card>
        );

      case 5:
        const values = form.getValues();
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Souhrn
              </CardTitle>
              <p className="text-sm text-muted-foreground">Zkontroluj si všechny údaje a odešli formulář.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <SummarySection title="O tobě" icon={<User className="h-4 w-4" />}>
                  <SummaryRow label="Jméno" value={values.full_name} />
                  <SummaryRow label="Pozice" value={values.position} />
                  <SummaryRow label="Email" value={values.email} />
                  <SummaryRow label="Telefon" value={values.phone} />
                </SummarySection>

                <SummarySection title="Osobní údaje" icon={<Heart className="h-4 w-4" />}>
                  <SummaryRow label="Datum narození" value={values.birthday ? format(values.birthday, "d. MMMM yyyy", { locale: cs }) : '—'} />
                  <SummaryRow label="Profilová fotka" value={values.avatar_url ? '✅ Nahrána' : '❌ Chybí'} />
                </SummarySection>

                <SummarySection title="Fakturační údaje" icon={<Building className="h-4 w-4" />}>
                  <SummaryRow label="IČO" value={values.ico} />
                  <SummaryRow label="Firma" value={values.company_name} />
                  <SummaryRow label="DIČ" value={values.dic || '—'} />
                  <SummaryRow label="Adresa" value={`${values.billing_street}, ${values.billing_city} ${values.billing_zip}`} />
                </SummarySection>

                <SummarySection title="Sazba a platba" icon={<CreditCard className="h-4 w-4" />}>
                  <SummaryRow label="Hodinová sazba" value={`${values.hourly_rate} Kč`} />
                  <SummaryRow label="Bankovní účet" value={values.bank_account} />
                </SummarySection>
              </div>

              <div className="border-t pt-4 mt-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                    className="mt-0.5"
                  />
                  <span className="text-sm leading-relaxed">
                    Souhlasím s odesláním údajů a přípravou smlouvy o spolupráci na základě vyplněných údajů.
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky header - hidden on intro */}
      {currentStep > 0 && (
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <img src={socialsLogo} alt="Socials" className="h-8" />
              <span className="text-sm text-muted-foreground">
                Krok {currentStep} z {TOTAL_STEPS - 1}
              </span>
            </div>
            <Progress value={(currentStep / (TOTAL_STEPS - 1)) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">{stepLabels[currentStep]}</p>
          </div>
        </div>
      )}

      {/* Form content */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div
                key={currentStep}
                className={cn(
                  "animate-fade-in",
                  stepDirection === 'backward' && "animate-fade-in"
                )}
              >
                {renderStep()}
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                {currentStep > 0 ? (
                  <Button type="button" variant="outline" onClick={goBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Zpět
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep === 0 ? (
                  <Button type="button" onClick={goNext} className="mx-auto" size="lg">
                    Začít vyplňovat
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : currentStep < TOTAL_STEPS - 1 ? (
                  <Button type="button" onClick={goNext}>
                    Pokračovat
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting || !agreedToTerms}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Odesílám...
                      </>
                    ) : (
                      'Odeslat formulář'
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

function SummarySection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border rounded-lg p-3">
      <h4 className="font-medium text-sm flex items-center gap-2 mb-2 text-muted-foreground">
        {icon}
        {title}
      </h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
