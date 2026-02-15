import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addMonths, startOfMonth, getDaysInMonth, getDate } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Loader2, Building2, MapPin, CheckCircle2, AlertTriangle, Search, Plus, X, PenLine, Users, CalendarIcon, FileText, Zap, MessageSquare, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAresLookup } from '@/hooks/useAresLookup';
import { cn } from '@/lib/utils';
import socialsLogo from '@/assets/socials-logo.png';
import { LeadService } from '@/types/crm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Type for lead data from Edge Function
interface OnboardingLead {
  id: string;
  company_name: string;
  ico: string;
  dic?: string;
  website?: string;
  industry?: string;
  billing_street?: string;
  billing_city?: string;
  billing_zip?: string;
  billing_country?: string;
  billing_email?: string;
  contact_name: string;
  contact_position?: string;
  contact_email?: string;
  contact_phone?: string;
  owner_id?: string;
  owner_name?: string;
  owner_email?: string;
  potential_services?: LeadService[];
}


const signatorySchema = z.object({
  name: z.string().min(1, 'Jméno je povinné'),
  position: z.string().optional(),
  email: z.string().email('Neplatný formát e-mailu'),
  phone: z.string()
    .min(1, 'Telefon je povinný pro podpis smlouvy')
    .refine(val => val.length >= 9, {
      message: 'Telefon musí mít alespoň 9 číslic',
    }),
});

const projectContactSchema = z.object({
  name: z.string().min(1, 'Jméno je povinné'),
  email: z.string().email('Neplatný formát e-mailu'),
  phone: z.string()
    .optional()
    .refine(val => !val || val.length === 0 || val.length >= 9, {
      message: 'Telefon musí mít alespoň 9 číslic',
    }),
});

const onboardingSchema = z.object({
  // Company
  company_name: z.string().min(1, 'Název společnosti je povinný'),
  ico: z.string().length(8, 'IČO musí mít 8 číslic').regex(/^\d+$/, 'IČO musí obsahovat pouze číslice'),
  dic: z.string()
    .optional()
    .refine(val => !val || val.length === 0 || /^[A-Z]{2}\d{8,10}$/.test(val), {
      message: 'DIČ musí být ve formátu CZ12345678',
    }),
  website: z.string()
    .optional()
    .refine(val => !val || val.length === 0 || /^https?:\/\/.+\..+/.test(val), {
      message: 'Zadejte platnou URL (např. https://example.cz)',
    }),
  industry: z.string().optional(),
  
  // Billing address
  billing_street: z.string().optional(),
  billing_city: z.string().optional(),
  billing_zip: z.string()
    .optional()
    .refine(val => !val || val.length === 0 || /^\d{3}\s?\d{2}$/.test(val), {
      message: 'PSČ musí mít formát 12345 nebo 123 45',
    }),
  billing_country: z.string().optional(),
  billing_email: z.string().email('Neplatný formát e-mailu').optional().or(z.literal('')),
  
  // Signatories (persons who sign the contract) - no limit
  signatories: z.array(signatorySchema).min(1, 'Minimálně jedna osoba pro podpis je povinná'),
  
  // Project contacts (for Freelo)
  useSignatoriesForProject: z.boolean(),
  projectContacts: z.array(projectContactSchema),
  
  // Start date
  startDate: z.date({
    required_error: 'Vyberte datum zahájení spolupráce'
  }),
  
  // Order confirmation
  orderConfirmed: z.boolean(),
}).refine(data => {
  // Order must be confirmed
  return data.orderConfirmed === true;
}, {
  message: 'Musíte potvrdit objednávku',
  path: ['orderConfirmed']
}).refine(data => {
  // If using signatories for project, at least one signatory must have valid email
  if (data.useSignatoriesForProject) {
    const signatoryWithEmail = data.signatories.some(s => s.email && s.email.trim() !== '');
    return signatoryWithEmail;
  }
  // Otherwise must have at least 1 project contact with email
  return data.projectContacts.length >= 1 && data.projectContacts.some(pc => pc.email && pc.email.trim() !== '');
}, {
  message: 'Pro vytvoření projektu ve Freelu je potřeba alespoň jeden kontakt s e-mailovou adresou',
  path: ['projectContacts']
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

// Mock lead pro testování (odpovídá TEST_OFFER v publicOffersMockData.ts)
const TEST_LEAD = {
  id: 'test-lead',
  company_name: 'Testovací Firma s.r.o.',
  ico: '12345678',
  dic: 'CZ12345678',
  website: 'https://www.example-eshop.cz',
  industry: 'E-commerce',
  contact_name: 'Jan Novák',
  contact_email: 'jan.novak@example.cz',
  contact_phone: '+420 123 456 789',
  contact_position: 'Jednatel',
  billing_street: 'Václavské náměstí 1',
  billing_city: 'Praha',
  billing_zip: '11000',
  billing_country: 'Česká republika',
  billing_email: 'fakturace@example.cz',
  stage: 'offer_sent' as const,
  owner_id: 'test-owner',
  owner_name: 'Petr Svoboda',
  owner_email: 'petr.svoboda@socials.cz',
  source: 'website' as const,
  potential_services: [
    { id: 'svc-1', name: 'Meta Ads Management', price: 25000, currency: 'CZK', billing_type: 'monthly' as const, selected_tier: 'pro' as const },
    { id: 'svc-2', name: 'Google Ads PPC', price: 18000, currency: 'CZK', billing_type: 'monthly' as const, selected_tier: 'growth' as const },
    { id: 'svc-3', name: 'Kreativní produkce', price: 15000, currency: 'CZK', billing_type: 'monthly' as const, selected_tier: 'pro' as const },
    { id: 'svc-4', name: 'Úvodní Audit & Strategie', price: 12000, currency: 'CZK', billing_type: 'one_off' as const, selected_tier: null },
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default function OnboardingForm() {
  const { leadId } = useParams<{ leadId: string }>();
  const { lookupCompany, isLoading: isAresLoading } = useAresLookup();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [leadNotFound, setLeadNotFound] = useState(false);
  const [icoChanged, setIcoChanged] = useState(false);
  const [originalIco, setOriginalIco] = useState<string>('');
  const [lead, setLead] = useState<OnboardingLead | null>(null);
  const [stepDirection, setStepDirection] = useState<'forward' | 'backward'>('forward');

  // Owner info from lead data
  const ownerEmail = lead?.owner_email || 'info@socials.cz';
  const ownerName = lead?.owner_name || 'tým Socials';
  
  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      company_name: '',
      ico: '',
      dic: '',
      website: '',
      industry: '',
      billing_street: '',
      billing_city: '',
      billing_zip: '',
      billing_country: '',
      billing_email: '',
      signatories: [{ name: '', position: '', email: '', phone: '' }],
      useSignatoriesForProject: true,
      projectContacts: [],
      startDate: startOfMonth(addMonths(new Date(), 1)),
      orderConfirmed: false,
    }
  });

  const { fields: signatoryFields, append: appendSignatory, remove: removeSignatory } = useFieldArray({
    control: form.control,
    name: 'signatories',
  });

  const { fields: projectContactFields, append: appendProjectContact, remove: removeProjectContact } = useFieldArray({
    control: form.control,
    name: 'projectContacts',
  });

  const watchUseSignatories = form.watch('useSignatoriesForProject');
  const watchSignatories = form.watch('signatories');

  // Load lead data from Edge Function
  useEffect(() => {
    async function fetchLead() {
      if (!leadId) {
        setLeadNotFound(true);
        setIsLoading(false);
        return;
      }

      // Handle test lead for development
      if (leadId === 'test-lead') {
        const testLead = TEST_LEAD as unknown as OnboardingLead;
        setLead(testLead);
        setOriginalIco(testLead.ico);
        form.reset({
          company_name: testLead.company_name,
          ico: testLead.ico,
          dic: testLead.dic || '',
          website: testLead.website || '',
          industry: testLead.industry || '',
          billing_street: testLead.billing_street || '',
          billing_city: testLead.billing_city || '',
          billing_zip: testLead.billing_zip || '',
          billing_country: testLead.billing_country || 'Česká republika',
          billing_email: testLead.billing_email || '',
          signatories: [{
            name: testLead.contact_name,
            position: testLead.contact_position || '',
            email: testLead.contact_email || '',
            phone: testLead.contact_phone || '',
          }],
          useSignatoriesForProject: true,
          projectContacts: [],
          startDate: startOfMonth(addMonths(new Date(), 1)),
          orderConfirmed: false,
        });
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('get-onboarding-lead', {
          body: { leadId },
        });

        if (error || data?.error) {
          console.error('Failed to fetch lead:', error || data?.error);
          setLeadNotFound(true);
          setIsLoading(false);
          return;
        }

        const fetchedLead = data.lead as OnboardingLead;
        setLead(fetchedLead);
        setOriginalIco(fetchedLead.ico);
        form.reset({
          company_name: fetchedLead.company_name,
          ico: fetchedLead.ico,
          dic: fetchedLead.dic || '',
          website: fetchedLead.website || '',
          industry: fetchedLead.industry || '',
          billing_street: fetchedLead.billing_street || '',
          billing_city: fetchedLead.billing_city || '',
          billing_zip: fetchedLead.billing_zip || '',
          billing_country: fetchedLead.billing_country || 'Česká republika',
          billing_email: fetchedLead.billing_email || '',
          signatories: [{
            name: fetchedLead.contact_name,
            position: fetchedLead.contact_position || '',
            email: fetchedLead.contact_email || '',
            phone: fetchedLead.contact_phone || '',
          }],
          useSignatoriesForProject: true,
          projectContacts: [],
          startDate: startOfMonth(addMonths(new Date(), 1)),
          orderConfirmed: false,
        });
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching lead:', err);
        setLeadNotFound(true);
        setIsLoading(false);
      }
    }

    fetchLead();
  }, [leadId, form]);

  // Watch IČO for changes
  const watchedIco = form.watch('ico');
  useEffect(() => {
    if (originalIco && watchedIco !== originalIco) {
      setIcoChanged(true);
    } else {
      setIcoChanged(false);
    }
  }, [watchedIco, originalIco]);

  const handleAresLookup = async () => {
    const ico = form.getValues('ico');
    if (!ico || ico.length !== 8) {
      return;
    }
    
    const data = await lookupCompany(ico);
    if (data) {
      form.setValue('company_name', data.name);
      if (data.dic) {
        form.setValue('dic', data.dic);
      }
      // Parse address - ARES returns full address as string
      if (data.address) {
        // Try to parse Czech address format: "Street Number, ZIP City"
        const addressMatch = data.address.match(/^(.+?),?\s*(\d{3}\s?\d{2})\s+(.+)$/);
        if (addressMatch) {
          form.setValue('billing_street', addressMatch[1].trim());
          form.setValue('billing_zip', addressMatch[2].replace(/\s/g, ''));
          form.setValue('billing_city', addressMatch[3].trim());
        } else {
          // Fallback: put entire address in street field
          form.setValue('billing_street', data.address);
        }
        form.setValue('billing_country', 'Česká republika');
      }
    }
  };

  const onSubmit = async (data: OnboardingFormData) => {
    if (!lead) return;
    
    setIsSubmitting(true);
    
    try {
      // Prepare project contacts
      const projectContacts = data.useSignatoriesForProject 
        ? data.signatories.map(s => ({ name: s.name, email: s.email, phone: s.phone }))
        : data.projectContacts;

      // Submit form via Edge Function
      const { data: result, error } = await supabase.functions.invoke('submit-onboarding-form', {
        body: {
          leadId: lead.id,
          company_name: data.company_name,
          ico: data.ico,
          dic: data.dic || null,
          website: data.website || null,
          industry: data.industry || null,
          billing_street: data.billing_street || null,
          billing_city: data.billing_city || null,
          billing_zip: data.billing_zip || null,
          billing_country: data.billing_country || null,
          billing_email: data.billing_email || null,
          signatories: data.signatories,
          projectContacts,
          startDate: format(data.startDate, 'yyyy-MM-dd'),
        },
      });

      if (error || result?.error) {
        // Try to get the actual error from the response body
        let errorMessage = result?.error || 'Neznámá chyba';
        if (error && !result?.error) {
          try {
            const errBody = await error.context?.json?.();
            errorMessage = errBody?.error || error.message || errorMessage;
          } catch {
            errorMessage = error.message || errorMessage;
          }
        }
        console.error('Submission failed:', errorMessage);
        toast.error(`Nepodařilo se odeslat formulář: ${errorMessage}`);
        return;
      }

      setIsSubmitted(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Neznámá chyba';
      console.error('Submission failed:', error);
      toast.error(`Nepodařilo se odeslat formulář: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate order totals with prorated pricing
  const getOrderSummary = () => {
    const services = lead?.potential_services || [];
    const monthlyServicesRaw = services.filter(s => s.billing_type === 'monthly');
    const oneOffServices = services.filter(s => s.billing_type === 'one_off');

    const monthlyTotal = monthlyServicesRaw.reduce((sum, s) => sum + s.price, 0);
    const oneOffTotal = oneOffServices.reduce((sum, s) => sum + s.price, 0);

    const startDate = form.getValues('startDate');
    const startDay = startDate ? getDate(startDate) : 1;
    const isProrated = startDay > 1;
    const daysInMonth = startDate ? getDaysInMonth(startDate) : 30;
    const remainingDays = isProrated ? daysInMonth - startDay + 1 : daysInMonth;

    const monthlyServices = monthlyServicesRaw.map(s => ({
      ...s,
      proratedPrice: isProrated ? Math.round((s.price / daysInMonth) * remainingDays) : s.price,
    }));

    const proratedMonthlyTotal = monthlyServices.reduce((sum, s) => sum + s.proratedPrice, 0);
    const monthName = startDate ? format(startDate, 'LLLL', { locale: cs }) : '';

    return { monthlyServices, oneOffServices, monthlyTotal, oneOffTotal, isProrated, remainingDays, daysInMonth, proratedMonthlyTotal, monthName };
  };

  const { monthlyServices, oneOffServices, monthlyTotal, oneOffTotal, isProrated, remainingDays, daysInMonth, proratedMonthlyTotal, monthName } = getOrderSummary();

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price) + ' ' + currency;
  };

  // Wizard navigation
  const TOTAL_STEPS = 6;
  const stepLabels = [
    'Firemní údaje',
    'Fakturační adresa',
    'Osoby pro podpis',
    'Kontakty pro projekt',
    'Datum zahájení',
    'Souhrn a potvrzení',
  ];

  const stepFieldMap: Record<number, string[]> = {
    0: ['ico', 'company_name', 'dic', 'website', 'industry'],
    1: ['billing_street', 'billing_city', 'billing_zip', 'billing_country', 'billing_email'],
    2: ['signatories'],
    3: ['useSignatoriesForProject', 'projectContacts'],
    4: ['startDate'],
    5: ['orderConfirmed'],
  };

  const validateCurrentStep = useCallback(async () => {
    const fields = stepFieldMap[currentStep] as (keyof OnboardingFormData)[];
    const result = await form.trigger(fields);
    return result;
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

  const progressValue = ((currentStep + 1) / TOTAL_STEPS) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (leadNotFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <img src={socialsLogo} alt="Socials" className="h-10 mx-auto mb-4" />
            <CardTitle className="text-destructive">Formulář nenalezen</CardTitle>
            <CardDescription>
              Tento onboarding formulář neexistuje nebo již byl vyplněn.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Pokud máte otázky, kontaktujte nás na{' '}
              <a href="mailto:info@socials.cz" className="text-primary hover:underline">
                info@socials.cz
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        {/* CSS Confetti */}
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
            <CardDescription className="text-base">
              Vaše údaje byly úspěšně odeslány.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-center text-lg">Co bude následovat?</h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0 text-sm">1</div>
                  <div>
                    <p className="font-medium">📧 Smlouva k podpisu</p>
                    <p className="text-sm text-muted-foreground">
                      Do 24 hodin vám pošleme smlouvu k podpisu přes DigiSign.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-muted-foreground/20 text-muted-foreground flex items-center justify-center font-bold shrink-0 text-sm">2</div>
                  <div>
                    <p className="font-medium">📁 Projekt ve Freelu</p>
                    <p className="text-sm text-muted-foreground">
                      Po podpisu vytvoříme projekt ve Freelu a přidáme vám tam přístup.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-muted-foreground/20 text-muted-foreground flex items-center justify-center font-bold shrink-0 text-sm">3</div>
                  <div>
                    <p className="font-medium">📞 Onboarding telefonát</p>
                    <p className="text-sm text-muted-foreground">
                      Spojí se s vámi specialista, který vás bude mít na starosti a domluví onboarding telefonát.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-muted-foreground/20 text-muted-foreground flex items-center justify-center font-bold shrink-0 text-sm">4</div>
                  <div>
                    <p className="font-medium">🚀 Pustíme se do práce!</p>
                    <p className="text-sm text-muted-foreground">
                      Společně rozjedeme váš projekt naplno.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center py-4">
              <p className="text-xl font-bold">🤝 Těšíme se na spolupráci!</p>
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Potřebujete pomoct? Obraťte se na {ownerName} | <a href={`mailto:${ownerEmail}`} className="text-primary hover:underline">{ownerEmail}</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky header with progress */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <img src={socialsLogo} alt="Socials" className="h-8" />
            <span className="text-sm text-muted-foreground">
              Krok {currentStep + 1} z {TOTAL_STEPS}
            </span>
          </div>
          <Progress value={progressValue} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">{stepLabels[currentStep]}</p>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div
                key={currentStep}
                className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
              >
                {/* Step 0: Company Info */}
                {currentStep === 0 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5" />
                  🏢 Firemní údaje
                </CardTitle>
                <CardDescription>
                  Údaje jsme získali z vašeho webu. Pokud nesedí, prosím upravte je.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="ico"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IČO *</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input placeholder="12345678" maxLength={8} {...field} />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleAresLookup}
                            disabled={isAresLoading || field.value.length !== 8}
                            title="Načíst z ARES"
                          >
                            {isAresLoading ? (
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
                          <Input placeholder="CZ12345678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {icoChanged && (
                  <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <AlertDescription className="text-amber-700 dark:text-amber-400">
                      IČO se liší od původního záznamu ({originalIco}).{' '}
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-amber-700 dark:text-amber-400 underline"
                        onClick={handleAresLookup}
                      >
                        Načíst údaje z ARES pro nové IČO?
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Název společnosti *</FormLabel>
                      <FormControl>
                        <Input placeholder="Vaše společnost s.r.o." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Web</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.example.cz" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Obor</FormLabel>
                        <FormControl>
                          <Input placeholder="E-commerce, B2B, ..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
                )}

                {/* Step 1: Billing Address */}
                {currentStep === 1 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5" />
                  📍 Fakturační adresa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="billing_street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ulice a číslo</FormLabel>
                      <FormControl>
                        <Input placeholder="Václavské náměstí 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="billing_city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Město</FormLabel>
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
                        <FormLabel>PSČ</FormLabel>
                        <FormControl>
                          <Input placeholder="11000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="billing_country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Země</FormLabel>
                        <FormControl>
                          <Input placeholder="Česká republika" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="billing_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fakturační e-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="fakturace@firma.cz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
                )}

                {/* Step 2: Signatories */}
                {currentStep === 2 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <PenLine className="h-5 w-5" />
                  ✍️ Osoby pro podpis smlouvy
                </CardTitle>
                <CardDescription>
                  Osoby, které budou podepisovat smlouvu o spolupráci.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {signatoryFields.map((field, index) => (
                  <div key={field.id} className="space-y-4">
                    {index > 0 && (
                      <div className="flex items-center justify-between pt-4 border-t">
                        <span className="text-sm font-medium text-muted-foreground">
                          Osoba {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSignatory(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Odebrat
                        </Button>
                      </div>
                    )}
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`signatories.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Jméno a příjmení *</FormLabel>
                            <FormControl>
                              <Input placeholder="Jan Novák" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`signatories.${index}.position`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pozice</FormLabel>
                            <FormControl>
                              <Input placeholder="Jednatel" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`signatories.${index}.email`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="jan.novak@firma.cz" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`signatories.${index}.phone`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefon *</FormLabel>
                            <FormControl>
                              <Input placeholder="+420 123 456 789" {...field} />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Povinný pro podpis smlouvy
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendSignatory({ name: '', position: '', email: '', phone: '' })}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Přidat další osobu pro podpis
                </Button>
              </CardContent>
            </Card>
                )}

                {/* Step 3: Project Contacts */}
                {currentStep === 3 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  👥 Kontaktní osoby pro projekt
                </CardTitle>
                <CardDescription>
                  Tyto osoby přidáme do projektového nástroje Freelo pro každodenní komunikaci.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="useSignatoriesForProject"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/50">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer">
                          Použít osoby z podpisu smlouvy
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          E-maily z osob pro podpis budou automaticky přidány do Freela.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {watchUseSignatories && watchSignatories.length > 0 && (
                  <div className="rounded-md border p-4 bg-muted/30 space-y-2">
                    <p className="text-sm font-medium">Budou přidáni do Freela:</p>
                    {watchSignatories.map((signatory, index) => (
                      signatory.email && (
                        <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          {signatory.name || 'Bez jména'} ({signatory.email})
                        </div>
                      )
                    ))}
                  </div>
                )}

                {/* Additional project contacts - always visible */}
                <div className="space-y-4">
                  {projectContactFields.length > 0 && (
                    <p className="text-sm font-medium text-muted-foreground pt-2">
                      {watchUseSignatories ? 'Další kontakty pro projekt:' : 'Kontakty pro projekt:'}
                    </p>
                  )}
                  
                  {projectContactFields.map((field, index) => (
                    <div key={field.id} className="space-y-4 rounded-md border p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Kontakt {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProjectContact(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-3">
                        <FormField
                          control={form.control}
                          name={`projectContacts.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Jméno *</FormLabel>
                              <FormControl>
                                <Input placeholder="Jan Novák" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`projectContacts.${index}.email`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-mail *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="jan@firma.cz" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`projectContacts.${index}.phone`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefon</FormLabel>
                              <FormControl>
                                <Input placeholder="+420 123 456 789" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendProjectContact({ name: '', email: '', phone: '' })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {watchUseSignatories ? 'Přidat další kontakt pro Freelo' : 'Přidat kontakt pro Freelo'}
                  </Button>

                  {projectContactFields.length === 0 && !watchUseSignatories && (
                    <p className="text-sm text-muted-foreground">
                      Pokud nechcete přidat projektové kontakty, pokračujte bez nich.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
                )}

                {/* Step 4: Start Date */}
                {currentStep === 4 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarIcon className="h-5 w-5" />
                  📅 Požadované datum zahájení spolupráce
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full md:w-[300px] pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "d. MMMM yyyy", { locale: cs })
                              ) : (
                                <span>Vyberte datum zahájení...</span>
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
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-sm text-muted-foreground">
                        Spolupráci zahájíme k vybranému datu, nebo dle vzájemné dohody.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
                )}

                {/* Step 5: Order Summary */}
                {currentStep === 5 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  📋 Souhrn objednávky
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Monthly Services */}
                {monthlyServices.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                      🔄 MĚSÍČNÍ SLUŽBY
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="divide-y">
                        {monthlyServices.map((service, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-background">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">📦</span>
                              <div>
                                <p className="font-medium">{service.name}</p>
                                {service.selected_tier && (
                                  <p className="text-xs text-muted-foreground uppercase">{service.selected_tier}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              {isProrated ? (
                                <>
                                  <p className="text-sm text-muted-foreground line-through">{formatPrice(service.price, service.currency)}/měs</p>
                                  <p className="font-medium">{formatPrice(service.proratedPrice, service.currency)} <span className="text-muted-foreground text-xs">za {monthName} ({remainingDays} z {daysInMonth} dnů)</span></p>
                                </>
                              ) : (
                                <p className="font-medium">
                                  {formatPrice(service.price, service.currency)}<span className="text-muted-foreground">/měs</span>
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 border-t">
                        <p className="font-medium">Měsíční platba celkem</p>
                        <div className="text-right">
                          {isProrated ? (
                            <>
                              <p className="text-sm text-muted-foreground line-through">{formatPrice(monthlyTotal, monthlyServices[0]?.currency || 'Kč')}</p>
                              <p className="font-bold text-lg">{formatPrice(proratedMonthlyTotal, monthlyServices[0]?.currency || 'Kč')}</p>
                            </>
                          ) : (
                            <p className="font-bold text-lg">{formatPrice(monthlyTotal, monthlyServices[0]?.currency || 'Kč')}</p>
                          )}
                        </div>
                      </div>
                      {isProrated && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border-t text-center">
                          <p className="text-xs text-amber-700 dark:text-amber-400">
                            První měsíc fakturujeme poměrně dle počtu dnů od zahájení spolupráce.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* One-off Services */}
                {oneOffServices.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                      <Zap className="h-4 w-4" />
                      JEDNORÁZOVÉ SLUŽBY
                    </div>
                    <div className="border-2 border-amber-200 dark:border-amber-800 rounded-lg overflow-hidden">
                      <div className="divide-y">
                        {oneOffServices.map((service, index) => (
                          <div key={index} className="p-3 bg-amber-50/50 dark:bg-amber-950/20">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">⚡</span>
                                <div>
                                  <p className="font-medium">{service.name}</p>
                                  {service.selected_tier && (
                                    <p className="text-xs text-muted-foreground uppercase">{service.selected_tier}</p>
                                  )}
                                </div>
                              </div>
                              <p className="font-medium text-right">{formatPrice(service.price, service.currency)}</p>
                            </div>
                            <div className="mt-2 ml-8">
                              <span className="inline-flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-1 rounded">
                                💳 Jednorázová platba při zahájení
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between p-3 bg-amber-100 dark:bg-amber-900/40 border-t border-amber-200 dark:border-amber-800">
                        <p className="font-medium">Jednorázově celkem</p>
                        <p className="font-bold text-lg">{formatPrice(oneOffTotal, oneOffServices[0]?.currency || 'Kč')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* No services */}
                {monthlyServices.length === 0 && oneOffServices.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>Žádné služby k zobrazení.</p>
                  </div>
                )}

                {/* VAT notice */}
                <p className="text-sm text-muted-foreground text-center">
                  Všechny ceny jsou bez DPH.
                </p>

                {/* Order confirmation checkbox */}
                <FormField
                  control={form.control}
                  name="orderConfirmed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border-2 border-primary/50 p-4 bg-primary/5">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer font-medium">
                          Souhlasím s objednávkou výše uvedených služeb *
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Odesláním formuláře potvrzujete zájem o spolupráci. <strong className="text-foreground">Tímto krokem spolupráce ještě nezačíná</strong> – do 24 hodin vám zašleme smlouvu k podpisu přes DigiSign.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="orderConfirmed"
                  render={() => (
                    <FormMessage />
                  )}
                />

              </CardContent>
            </Card>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between pt-4">
                {currentStep > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goBack}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Zpět
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < TOTAL_STEPS - 1 ? (
                  <Button
                    type="button"
                    onClick={goNext}
                  >
                    Pokračovat
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Odesílám...
                      </>
                    ) : (
                      'Odeslat údaje'
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            Potřebujete pomoct?{' '}
            <a href="mailto:info@socials.cz" className="text-primary hover:underline">
              Kontaktujte nás
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
