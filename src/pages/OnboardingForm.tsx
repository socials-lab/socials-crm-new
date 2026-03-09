import { useState, useEffect, useCallback, useRef } from 'react';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Loader2, Building2, MapPin, CheckCircle2, AlertTriangle, Plus, X, PenLine, Users, CalendarIcon, FileText, Zap, MessageSquare, ArrowLeft, ArrowRight } from 'lucide-react';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useCRMData } from '@/hooks/useCRMData';
import { cn } from '@/lib/utils';
import socialsLogo from '@/assets/socials-logo.svg';
import { LeadService } from '@/types/crm';

type CompanyCountry = 'CZ' | 'SK' | 'other';

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
  ico: z.string().optional().or(z.literal('')),
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
  const { getLeadById, markLeadAsConverted, updateLead } = useLeadsData();
  const { addClient, addContact, getColleagueById } = useCRMData();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [leadNotFound, setLeadNotFound] = useState(false);
  const [icoChanged, setIcoChanged] = useState(false);
  const [originalIco, setOriginalIco] = useState<string>('');
  const [stepDirection, setStepDirection] = useState<'forward' | 'backward'>('forward');
  const [companyCountry, setCompanyCountry] = useState<CompanyCountry>('CZ');
  const [aresQuery, setAresQuery] = useState('');
  const [aresResults, setAresResults] = useState<Array<{ ico: string; name: string; city: string | null }>>([]);
  const [isSearchingAres, setIsSearchingAres] = useState(false);
  const [showAresResults, setShowAresResults] = useState(false);
  const [aresValidated, setAresValidated] = useState(false);
  const [aresError, setAresError] = useState<string | null>(null);
  const aresSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get lead from database or use test lead for development
  const dbLead = leadId ? getLeadById(leadId) : undefined;
  const lead = dbLead || (leadId === 'test-lead' ? TEST_LEAD : undefined);
  
  // Get owner colleague info for contact display
  const ownerColleague = lead?.owner_id ? getColleagueById(lead.owner_id) : null;
  const ownerEmail = ownerColleague?.email || (lead as any)?.owner_email || 'info@socials.cz';
  const ownerName = ownerColleague?.full_name || (lead as any)?.owner_name || 'tým Socials';
  const ownerPhone = ownerColleague?.phone || (lead as any)?.owner_phone || '';
  
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

  // Real ARES lookup by IČO
  const validateAresIco = async (ico: string) => {
    if (ico.length !== 8) return;
    try {
      const response = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`);
      if (!response.ok) throw new Error('Subjekt nebyl nalezen v ARES');
      const data = await response.json();
      form.setValue('company_name', data.obchodniJmeno || '', { shouldValidate: true });
      form.setValue('dic', data.dic || '', { shouldValidate: true });
      form.setValue('billing_street', data.sidlo?.textovaAdresa?.split(',')[0] || '', { shouldValidate: true });
      form.setValue('billing_city', data.sidlo?.nazevObce || '', { shouldValidate: true });
      form.setValue('billing_zip', data.sidlo?.psc?.toString() || '', { shouldValidate: true });
      form.setValue('billing_country', 'Česká republika', { shouldValidate: true });
      form.setValue('ico', ico, { shouldValidate: true });
      setAresValidated(true);
      setAresError(null);
    } catch (error) {
      setAresError(error instanceof Error ? error.message : 'Chyba při validaci IČO');
      setAresValidated(false);
    }
  };

  // ARES name search
  const searchARES = useCallback(async (query: string) => {
    if (query.length < 3) {
      setAresResults([]);
      setShowAresResults(false);
      return;
    }
    setIsSearchingAres(true);
    try {
      const res = await fetch('https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/vyhledat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ obchodniJmeno: query, start: 0, pocet: 8 }),
      });
      if (!res.ok) throw new Error('ARES search failed');
      const data = await res.json();
      const items = (data.ekonomickeSubjekty || []).map((s: any) => ({
        ico: s.ico,
        name: s.obchodniJmeno || s.nazev || '',
        city: s.sidlo?.nazevObce || null,
      }));
      setAresResults(items);
      setShowAresResults(items.length > 0);
    } catch {
      setAresResults([]);
    } finally {
      setIsSearchingAres(false);
    }
  }, []);

  const handleAresQueryChange = (value: string) => {
    setAresQuery(value);
    setAresValidated(false);
    if (aresSearchTimeout.current) clearTimeout(aresSearchTimeout.current);
    aresSearchTimeout.current = setTimeout(() => searchARES(value), 400);
  };

  const handleSelectAresResult = async (result: { ico: string; name: string }) => {
    setShowAresResults(false);
    setAresQuery(result.name);
    await validateAresIco(result.ico);
  };

  const onSubmit = async (data: OnboardingFormData) => {
    if (!lead) return;
    
    setIsSubmitting(true);
    
    try {
      // Test mode: skip DB operations for test-lead (not a valid UUID)
      if (leadId === 'test-lead') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Test mode: skipping DB operations');
        console.log('Onboarding summary payload (test):', {
          companyName: data.company_name,
          services: lead.potential_services,
          signatories: data.signatories,
          startDate: format(data.startDate, 'yyyy-MM-dd'),
        });
        setIsSubmitted(true);
        setIsSubmitting(false);
        return;
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get primary signatory
      const primarySignatory = data.signatories[0];
      
      // Create new client
      const newClient = await addClient({
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
      for (let index = 0; index < data.signatories.length; index++) {
        const signatory = data.signatories[index];
        await addContact({
          client_id: newClient.id,
          name: signatory.name,
          position: signatory.position || null,
          email: signatory.email,
          phone: signatory.phone || null,
          is_primary: index === 0,
          is_decision_maker: true,
          notes: 'Osoba pro podpis smlouvy',
        });
      }
      
      // Create project contacts
      if (!data.useSignatoriesForProject) {
        // Create separate project contacts
        for (const contact of data.projectContacts) {
          // Check if not duplicate of signatory
          const isDuplicate = data.signatories.some(s => s.email === contact.email);
          if (!isDuplicate) {
            await addContact({
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
        }
      }
      
      // Generate contract URL (mock - prepared for PandaDoc integration)
      const contractSlug = data.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const mockContractUrl = `https://app.pandadoc.com/documents/smlouva-${contractSlug}-${Date.now()}`;
      
      // Update lead with onboarding completion and contract info
      await updateLead(lead.id, {
        onboarding_form_completed_at: new Date().toISOString(),
        contract_url: mockContractUrl,
        contract_created_at: new Date().toISOString(),
        ico: data.ico,
        dic: data.dic || null,
        company_name: data.company_name,
        website: data.website || null,
        industry: data.industry || null,
        billing_street: data.billing_street || null,
        billing_city: data.billing_city || null,
        billing_zip: data.billing_zip || null,
        billing_country: data.billing_country || null,
        billing_email: data.billing_email || null,
      });
      
      // Mark lead as converted
      await markLeadAsConverted(lead.id, newClient.id, '');

      // Send onboarding summary (best effort - failure doesn't block submission)
      try {
        const orderSummary = getOrderSummary();
        const summaryPayload = {
          companyName: data.company_name,
          ico: data.ico,
          dic: data.dic || null,
          website: data.website || null,
          billingAddress: {
            street: data.billing_street || null,
            city: data.billing_city || null,
            zip: data.billing_zip || null,
            country: data.billing_country || null,
            email: data.billing_email || null,
          },
          services: [
            ...orderSummary.monthlyServices.map(s => ({
              name: s.name,
              price: s.price,
              currency: s.currency || 'CZK',
              billingType: 'monthly',
              proratedPrice: s.proratedPrice,
            })),
            ...orderSummary.oneOffServices.map(s => ({
              name: s.name,
              price: s.price,
              currency: s.currency || 'CZK',
              billingType: 'one_off',
            })),
          ],
          startDate: format(data.startDate, 'yyyy-MM-dd'),
          isProrated: orderSummary.isProrated,
          remainingDays: orderSummary.remainingDays,
          daysInMonth: orderSummary.daysInMonth,
          monthlyTotal: orderSummary.monthlyTotal,
          proratedMonthlyTotal: orderSummary.proratedMonthlyTotal,
          oneOffTotal: orderSummary.oneOffTotal,
          signatories: data.signatories.map(s => ({
            name: s.name,
            email: s.email,
            phone: s.phone || null,
          })),
          projectContacts: (data.useSignatoriesForProject ? data.signatories : data.projectContacts).map(c => ({
            name: c.name,
            email: c.email,
            phone: c.phone || null,
          })),
          recipients: {
            to: [
              data.signatories[0]?.email,
              ownerEmail,
            ].filter(Boolean),
            bcc: ['danny@socials.cz', 'dana.bauerova@socials.cz'],
          },
        };
        console.log('Onboarding summary payload:', summaryPayload);
        await fetch(
          'https://empndmpeyrdycjdesoxr.supabase.co/functions/v1/send-onboarding-summary',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(summaryPayload),
          }
        );
      } catch (summaryError) {
        console.error('Failed to send onboarding summary:', summaryError);
      }
      
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

    const startDate = form.getValues('startDate');
    const startDay = startDate ? getDate(startDate) : 1;
    const isProrated = startDay > 1;
    const daysInMonth = startDate ? getDaysInMonth(startDate) : 30;
    const remainingDays = isProrated ? daysInMonth - startDay + 1 : daysInMonth;

    const proratedServices = monthlyServices.map(s => ({
      ...s,
      proratedPrice: isProrated ? Math.round((s.price / daysInMonth) * remainingDays) : s.price,
    }));

    const proratedMonthlyTotal = proratedServices.reduce((sum, s) => sum + s.proratedPrice, 0);
    const monthName = startDate ? format(startDate, 'LLLL', { locale: cs }) : '';

    return { monthlyServices: proratedServices, oneOffServices, monthlyTotal, oneOffTotal, isProrated, remainingDays, daysInMonth, proratedMonthlyTotal, monthName };
  };

  const { monthlyServices, oneOffServices, monthlyTotal, oneOffTotal, isProrated, remainingDays, daysInMonth, proratedMonthlyTotal, monthName } = getOrderSummary();

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price) + ' ' + currency;
  };

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
    const fields = stepFieldMap[currentStep] as any[];
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
                Potřebujete pomoct? Obraťte se na {ownerName}
                {ownerPhone && (
                  <> – <a href={`tel:${ownerPhone}`} className="text-primary hover:underline">{ownerPhone}</a></>
                )}
                {' '}| <a href={`mailto:${ownerEmail}`} className="text-primary hover:underline">{ownerEmail}</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky header */}
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
                        Vyberte zemi a doplňte údaje o společnosti.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Country selector */}
                      <div>
                        <FormLabel>Země registrace</FormLabel>
                        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mt-1.5">
                          {([
                            { value: 'CZ' as CompanyCountry, label: '🇨🇿 Česko' },
                            { value: 'SK' as CompanyCountry, label: '🇸🇰 Slovensko' },
                            { value: 'other' as CompanyCountry, label: '🌍 Jiná' },
                          ]).map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className={cn(
                                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                                companyCountry === option.value
                                  ? "bg-background shadow-sm text-foreground"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                              onClick={() => {
                                setCompanyCountry(option.value);
                                setAresValidated(false);
                                setAresError(null);
                                setAresQuery('');
                                setAresResults([]);
                                setShowAresResults(false);
                                if (option.value === 'CZ') {
                                  form.setValue('billing_country', 'Česká republika', { shouldValidate: true });
                                } else if (option.value === 'SK') {
                                  form.setValue('billing_country', 'Slovenská republika', { shouldValidate: true });
                                } else {
                                  form.setValue('billing_country', '', { shouldValidate: true });
                                }
                              }}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* CZ: ARES name search */}
                      {companyCountry === 'CZ' && (
                        <div className="relative">
                          <FormLabel>Vyhledat firmu v ARES</FormLabel>
                          <div className="mt-1.5 relative">
                            <Input
                              value={aresQuery}
                              onChange={(e) => handleAresQueryChange(e.target.value)}
                              onFocus={() => aresResults.length > 0 && setShowAresResults(true)}
                              onBlur={() => setTimeout(() => setShowAresResults(false), 200)}
                              placeholder="Začněte psát název firmy nebo jméno OSVČ..."
                            />
                            {isSearchingAres && (
                              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                          </div>

                          {aresError && (
                            <div className="flex items-center gap-1 text-sm text-destructive mt-1">
                              <AlertTriangle className="h-4 w-4" />
                              {aresError}
                            </div>
                          )}
                          {aresValidated && (
                            <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                              <CheckCircle2 className="h-4 w-4" />
                              Údaje načteny z ARES (IČO: {form.getValues('ico')})
                            </div>
                          )}
                          {!aresValidated && !aresError && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Zadejte alespoň 3 znaky pro vyhledání v ARES
                            </p>
                          )}

                          {showAresResults && aresResults.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                              {aresResults.map((r) => (
                                <button
                                  key={r.ico}
                                  type="button"
                                  className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors border-b last:border-b-0 flex items-center justify-between gap-2"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => handleSelectAresResult(r)}
                                >
                                  <div className="min-w-0">
                                    <p className="font-medium text-sm truncate">{r.name}</p>
                                    {r.city && <p className="text-xs text-muted-foreground">{r.city}</p>}
                                  </div>
                                  <span className="text-xs font-mono text-muted-foreground shrink-0">IČO {r.ico}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* SK / Other: Manual entry */}
                      {companyCountry !== 'CZ' && (
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="company_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Název společnosti *</FormLabel>
                                <FormControl>
                                  <Input placeholder={companyCountry === 'SK' ? 'Vaša spoločnosť s.r.o.' : 'Company name'} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="ico"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>IČO</FormLabel>
                                  <FormControl>
                                    <Input placeholder={companyCountry === 'SK' ? '12345678' : 'Company ID'} {...field} />
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
                                  <FormLabel>{companyCountry === 'SK' ? 'DIČ / IČ DPH' : 'VAT ID'}</FormLabel>
                                  <FormControl>
                                    <Input placeholder={companyCountry === 'SK' ? 'SK1234567890' : 'VAT number'} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}

                      {/* CZ: Show filled fields after ARES */}
                      {companyCountry === 'CZ' && aresValidated && (
                        <div className="space-y-4 animate-in fade-in-0 duration-300">
                          <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="company_name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Název společnosti *</FormLabel>
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
                                    <Input placeholder="CZ12345678" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}

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

                {/* Step 5: Summary & Confirmation */}
                {currentStep === 5 && (
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5" />
                        📋 Souhrn objednávky
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Filled data summary */}
                      <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
                        <h4 className="font-medium text-sm text-muted-foreground">Vaše údaje</h4>
                        <div className="grid gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Společnost:</span>
                            <span className="font-medium">{form.getValues('company_name')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">IČO:</span>
                            <span>{form.getValues('ico')}</span>
                          </div>
                          {form.getValues('dic') && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">DIČ:</span>
                              <span>{form.getValues('dic')}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Adresa:</span>
                            <span className="text-right">{[form.getValues('billing_street'), form.getValues('billing_city'), form.getValues('billing_zip')].filter(Boolean).join(', ')}</span>
                          </div>
                          {form.getValues('startDate') && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Zahájení:</span>
                              <span>{format(form.getValues('startDate'), "d. MMMM yyyy", { locale: cs })}</span>
                            </div>
                          )}
                        </div>
                      </div>

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
                              {isProrated ? (
                                <div>
                                  <p className="font-medium">První faktura (poměrná část)</p>
                                  <p className="text-xs text-muted-foreground">Od dalšího měsíce: {formatPrice(monthlyTotal, monthlyServices[0]?.currency || 'Kč')}/měs</p>
                                </div>
                              ) : (
                                <p className="font-medium">Měsíční platba celkem</p>
                              )}
                              <p className="font-bold text-lg">{formatPrice(isProrated ? proratedMonthlyTotal : monthlyTotal, monthlyServices[0]?.currency || 'Kč')}</p>
                            </div>
                          </div>
                          {isProrated && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              💡 První měsíc fakturujeme poměrně dle počtu dnů, ve kterých spolupráce probíhá.
                            </p>
                          )}
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

                      {monthlyServices.length === 0 && oneOffServices.length === 0 && (
                        <div className="text-center py-6 text-muted-foreground">
                          <p>Žádné služby k zobrazení.</p>
                        </div>
                      )}

                      <p className="text-sm text-muted-foreground text-center">
                        Všechny ceny jsou bez DPH.
                      </p>

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
              <div className="flex items-center justify-between pt-2">
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
            Potřebujete pomoct? Obraťte se na {ownerName}
            {ownerPhone && (
              <> – <a href={`tel:${ownerPhone}`} className="text-primary hover:underline">{ownerPhone}</a></>
            )}
            {' '}| <a href={`mailto:${ownerEmail}`} className="text-primary hover:underline">{ownerEmail}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
