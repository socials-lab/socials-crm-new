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
import { useLeadsData } from '@/hooks/useLeadsData';
import { useCRMData } from '@/hooks/useCRMData';
import { cn } from '@/lib/utils';
import socialsLogo from '@/assets/socials-logo.png';
import { LeadService } from '@/types/crm';

// Mock ARES lookup - will be replaced with Edge Function
const mockAresLookup = async (ico: string): Promise<{
  company_name: string;
  dic: string;
  street: string;
  city: string;
  zip: string;
  country: string;
} | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock data based on IČO
  if (ico.length === 8 && /^\d+$/.test(ico)) {
    return {
      company_name: `Společnost ${ico.slice(0, 4)} s.r.o.`,
      dic: `CZ${ico}`,
      street: 'Václavské náměstí 1',
      city: 'Praha',
      zip: '11000',
      country: 'Česká republika'
    };
  }
  return null;
};

const signatorySchema = z.object({
  name: z.string().min(1, 'Jméno je povinné'),
  position: z.string().optional(),
  email: z.string().email('Neplatný formát e-mailu'),
  phone: z.string().optional(),
});

const projectContactSchema = z.object({
  name: z.string().min(1, 'Jméno je povinné'),
  email: z.string().email('Neplatný formát e-mailu'),
  phone: z.string().optional(),
});

const onboardingSchema = z.object({
  // Company
  company_name: z.string().min(1, 'Název společnosti je povinný'),
  ico: z.string().length(8, 'IČO musí mít 8 číslic').regex(/^\d+$/, 'IČO musí obsahovat pouze číslice'),
  dic: z.string().optional(),
  website: z.string().optional(),
  industry: z.string().optional(),
  
  // Billing address
  billing_street: z.string().optional(),
  billing_city: z.string().optional(),
  billing_zip: z.string().optional(),
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
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function OnboardingForm() {
  const { leadId } = useParams<{ leadId: string }>();
  const { getLeadById, markLeadAsConverted, updateLead } = useLeadsData();
  const { addClient, addContact } = useCRMData();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAresLoading, setIsAresLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [leadNotFound, setLeadNotFound] = useState(false);
  const [icoChanged, setIcoChanged] = useState(false);
  const [originalIco, setOriginalIco] = useState<string>('');

  
  const lead = leadId ? getLeadById(leadId) : undefined;
  
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

  // Load lead data
  useEffect(() => {
    if (!leadId) {
      setLeadNotFound(true);
      setIsLoading(false);
      return;
    }
    
    if (lead) {
      setOriginalIco(lead.ico);
      form.reset({
        company_name: lead.company_name,
        ico: lead.ico,
        dic: lead.dic || '',
        website: lead.website || '',
        industry: lead.industry || '',
        billing_street: lead.billing_street || '',
        billing_city: lead.billing_city || '',
        billing_zip: lead.billing_zip || '',
        billing_country: lead.billing_country || 'Česká republika',
        billing_email: lead.billing_email || '',
        signatories: [{
          name: lead.contact_name,
          position: lead.contact_position || '',
          email: lead.contact_email || '',
          phone: lead.contact_phone || '',
        }],
        useSignatoriesForProject: true,
        projectContacts: [],
        startDate: startOfMonth(addMonths(new Date(), 1)),
        orderConfirmed: false,
      });
      setIsLoading(false);
    } else {
      setLeadNotFound(true);
      setIsLoading(false);
    }
  }, [leadId, lead, form]);

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
    
    setIsAresLoading(true);
    try {
      const data = await mockAresLookup(ico);
      if (data) {
        form.setValue('company_name', data.company_name);
        form.setValue('dic', data.dic);
        form.setValue('billing_street', data.street);
        form.setValue('billing_city', data.city);
        form.setValue('billing_zip', data.zip);
        form.setValue('billing_country', data.country);
      }
    } catch (error) {
      console.error('ARES lookup failed:', error);
    } finally {
      setIsAresLoading(false);
    }
  };

  const onSubmit = async (data: OnboardingFormData) => {
    if (!lead) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get primary signatory
      const primarySignatory = data.signatories[0];
      
      // Create new client
      const newClient = addClient({
        name: data.company_name,
        brand_name: data.company_name,
        ico: data.ico,
        dic: data.dic || null,
        website: data.website || '',
        country: data.billing_country || 'Česká republika',
        industry: data.industry || '',
        status: 'active',
        tier: 'standard',
        sales_representative_id: lead.owner_id,
        billing_street: data.billing_street || null,
        billing_city: data.billing_city || null,
        billing_zip: data.billing_zip || null,
        billing_country: data.billing_country || null,
        billing_email: data.billing_email || null,
        main_contact_name: primarySignatory.name,
        main_contact_email: primarySignatory.email,
        main_contact_phone: primarySignatory.phone || '',
        acquisition_channel: lead.source,
        start_date: format(data.startDate, 'yyyy-MM-dd'),
        created_by: lead.owner_id,
        end_date: null,
        notes: '',
        pinned_notes: '',
      });
      
      // Create signatory contacts
      data.signatories.forEach((signatory, index) => {
        addContact({
          client_id: newClient.id,
          name: signatory.name,
          position: signatory.position || null,
          email: signatory.email,
          phone: signatory.phone || null,
          is_primary: index === 0,
          is_decision_maker: true,
          notes: 'Osoba pro podpis smlouvy',
        });
      });
      
      // Create project contacts
      if (data.useSignatoriesForProject) {
        // Signatories are also project contacts - already created above
      } else {
        // Create separate project contacts
        data.projectContacts.forEach((contact) => {
          // Check if not duplicate of signatory
          const isDuplicate = data.signatories.some(s => s.email === contact.email);
          if (!isDuplicate) {
            addContact({
              client_id: newClient.id,
              name: contact.name,
              position: null,
              email: contact.email,
              phone: contact.phone || null,
              is_primary: false,
              is_decision_maker: false,
              notes: 'Projektový kontakt pro Freelo',
            });
          }
        });
      }
      
      // Generate contract URL (mock - prepared for PandaDoc integration)
      const contractSlug = data.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const mockContractUrl = `https://app.pandadoc.com/documents/smlouva-${contractSlug}-${Date.now()}`;
      
      // Update lead with onboarding completion and contract info
      updateLead(lead.id, {
        onboarding_form_completed_at: new Date().toISOString(),
        contract_url: mockContractUrl,
        contract_created_at: new Date().toISOString(),
      });
      
      // Mark lead as converted
      markLeadAsConverted(lead.id, newClient.id, '');
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Submission failed:', error);
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
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <img src={socialsLogo} alt="Socials" className="h-10 mx-auto mb-4" />
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 animate-bounce" />
            </div>
            <CardTitle className="text-2xl">🎉 Děkujeme!</CardTitle>
            <CardDescription className="text-base">
              Vaše údaje byly úspěšně odeslány.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Náš tým se vám brzy ozve s dalšími kroky pro zahájení spolupráce.
            </p>
            <a 
              href="https://socials.cz" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block text-primary hover:underline"
            >
              Navštívit socials.cz →
            </a>
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
            Vyplňte prosím vaše údaje pro dokončení registrace.
          </p>
        </div>

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
                      MĚSÍČNÍ SLUŽBY
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
                          Odesláním formuláře potvrzujete zájem o spolupráci na uvedených službách.
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
