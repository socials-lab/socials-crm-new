import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addMonths, startOfMonth } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Building2, MapPin, CheckCircle2, AlertTriangle, Search, Plus, X, PenLine, Users, CalendarIcon, FileText, Zap, MessageSquare } from 'lucide-react';
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
    .optional()
    .refine(val => !val || val.length === 0 || val.length >= 9, {
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
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [leadNotFound, setLeadNotFound] = useState(false);
  const [icoChanged, setIcoChanged] = useState(false);
  const [originalIco, setOriginalIco] = useState<string>('');
  const [lead, setLead] = useState<OnboardingLead | null>(null);

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

  // Calculate order totals
  const getOrderSummary = () => {
    const services = lead?.potential_services || [];
    const monthlyServices = services.filter(s => s.billing_type === 'monthly');
    const oneOffServices = services.filter(s => s.billing_type === 'one_off');
    
    const monthlyTotal = monthlyServices.reduce((sum, s) => sum + s.price, 0);
    const oneOffTotal = oneOffServices.reduce((sum, s) => sum + s.price, 0);
    
    return { monthlyServices, oneOffServices, monthlyTotal, oneOffTotal };
  };

  const { monthlyServices, oneOffServices, monthlyTotal, oneOffTotal } = getOrderSummary();

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price) + ' ' + currency;
  };

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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
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
            {/* Co bude následovat */}
            <div className="space-y-4">
              <h3 className="font-semibold text-center text-lg">Co bude následovat?</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0 text-sm">1</div>
                  <div>
                    <p className="font-medium">📧 Smlouva k podpisu</p>
                    <p className="text-sm text-muted-foreground">
                      Do 24 hodin vám na e-mail dorazí smlouva ke kontrole a podpisu přes DigiSign.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Dotazy? Obraťte se na <a href={`mailto:${ownerEmail}`} className="text-primary hover:underline">{ownerEmail}</a>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-muted-foreground/20 text-muted-foreground flex items-center justify-center font-bold shrink-0 text-sm">2</div>
                  <div>
                    <p className="font-medium">📞 Osobní kontakt</p>
                    <p className="text-sm text-muted-foreground">
                      Po podpisu smlouvy vás bude kontaktovat <strong>{ownerName}</strong>, 
                      se kterým budete řešit celý projekt.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Dotazy? Obraťte se na <a href={`mailto:${ownerEmail}`} className="text-primary hover:underline">{ownerEmail}</a>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-muted-foreground/20 text-muted-foreground flex items-center justify-center font-bold shrink-0 text-sm">3</div>
                  <div>
                    <p className="font-medium">🚀 Zahájení spolupráce</p>
                    <p className="text-sm text-muted-foreground">
                      Společně naplánujeme první kroky a pustíme se do práce!
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Dotazy? Obraťte se na <a href={`mailto:${ownerEmail}`} className="text-primary hover:underline">{ownerEmail}</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">
                Máte dotazy? {ownerName} je tu pro vás.
              </p>
              <a 
                href={`mailto:${ownerEmail}`}
                className="text-primary hover:underline"
              >
                {ownerEmail}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <img src={socialsLogo} alt="Socials" className="h-12 mx-auto" />
          <h1 className="text-2xl font-bold">Onboarding formulář</h1>
          <p className="text-muted-foreground">
            Zkontrolujte a doplňte vaše údaje pro zahájení spolupráce.
          </p>
        </div>

        {/* Process Steps */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="pt-6 pb-5">
            <h3 className="text-center font-semibold mb-4">📋 Jak to bude probíhat?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center p-3">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-2">1</div>
                <p className="font-medium">Vyplníte formulář</p>
                <p className="text-sm text-muted-foreground">Zkontrolujte a doplňte údaje (2 min)</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Dotazy? <a href={`mailto:${ownerEmail}`} className="text-primary hover:underline">{ownerEmail}</a>
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-3">
                <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold mb-2">2</div>
                <p className="font-medium">Smlouva k podpisu</p>
                <p className="text-sm text-muted-foreground">Do 24h vám dorazí smlouva přes DigiSign</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Dotazy? <a href={`mailto:${ownerEmail}`} className="text-primary hover:underline">{ownerEmail}</a>
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-3">
                <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold mb-2">3</div>
                <p className="font-medium">Osobní kontakt</p>
                <p className="text-sm text-muted-foreground">{ownerName} vás bude kontaktovat</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Dotazy? <a href={`mailto:${ownerEmail}`} className="text-primary hover:underline">{ownerEmail}</a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Company Info */}
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

            {/* Billing Address */}
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

            {/* Signatories - Persons who sign the contract */}
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
                  onClick={() => appendSignatory({ name: '', position: '', email: '', phone: '' })}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Přidat další osobu pro podpis
                </Button>
              </CardContent>
            </Card>

            {/* Project Contacts - For Freelo */}
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

            {/* Start Date */}
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

            {/* Order Summary */}
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
                            <p className="font-medium text-right">
                              {formatPrice(service.price, service.currency)}<span className="text-muted-foreground">/měs</span>
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 border-t">
                        <p className="font-medium">Měsíční platba celkem</p>
                        <p className="font-bold text-lg">{formatPrice(monthlyTotal, monthlyServices[0]?.currency || 'Kč')}</p>
                      </div>
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

            {/* Submit */}
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isSubmitting}
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
          </form>
        </Form>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Potřebujete pomoct?{' '}
          <a href="mailto:info@socials.cz" className="text-primary hover:underline">
            Kontaktujte nás
          </a>
        </p>
      </div>
    </div>
  );
}
