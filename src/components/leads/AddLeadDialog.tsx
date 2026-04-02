import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useCRMData } from '@/hooks/useCRMData';
import { useAuth } from '@/hooks/useAuth';
import { useAresLookup } from '@/hooks/useAresLookup';
import { CompanySearchInput } from '@/components/shared/CompanySearchInput';
import type { Lead, LeadSource } from '@/types/crm';
import type { CompanySearchResult } from '@/hooks/useAresSearch';
import { toast } from '@/components/ui/sonner';
import { useEffect, useState, useCallback } from 'react';
import { Loader2, Search } from 'lucide-react';
import { toNullableNumber } from '@/lib/dbNormalize';

const leadSchema = z.object({
  company_name: z.string().min(1, 'Název firmy je povinný'),
  ico: z.string().min(1, 'IČO je povinné'),
  dic: z.string().optional().nullable(),
  website: z.string().refine((val) => val === '' || /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(val), { message: 'Zadejte platnou URL' }).or(z.literal('')).optional().nullable(),
  industry: z.string().optional().nullable(),
  billing_street: z.string().optional().nullable(),
  billing_city: z.string().optional().nullable(),
  billing_zip: z.string().optional().nullable(),
  billing_country: z.string().optional().nullable(),
  billing_email: z.string().email('Zadejte platný email').or(z.literal('')).optional().nullable(),
  contact_name: z.string().min(1, 'Jméno kontaktu je povinné'),
  contact_position: z.string().optional().nullable(),
  contact_email: z.string().email('Zadejte platný email').or(z.literal('')).optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  stage: z.enum(['new_lead', 'meeting_done', 'waiting_access', 'access_received', 'preparing_offer', 'offer_sent', 'won', 'lost', 'postponed'] as const),
  owner_id: z.string().min(1, 'Odpovědná osoba je povinná'),
  source: z.enum(['referral', 'inbound', 'cold_outreach', 'event', 'linkedin', 'website', 'other'] as const),
  source_custom: z.string().optional().nullable(),
  client_message: z.string().optional().nullable(),
  ad_spend_monthly: z.coerce.number().min(0).optional().nullable(),
  summary: z.string(),
  estimated_price: z.coerce.number().min(0, 'Cena musí být kladná'),
  currency: z.string().default('CZK'),
  probability_percent: z.coerce.number().min(0).max(100),
  // Court registration info from ARES (hidden fields)
  court_name: z.string().optional().nullable(),
  court_file_number: z.string().optional().nullable(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
}

const SOURCE_OPTIONS: { value: LeadSource; label: string }[] = [
  { value: 'referral', label: 'Doporučení' },
  { value: 'inbound', label: 'Inbound' },
  { value: 'cold_outreach', label: 'Cold outreach' },
  { value: 'event', label: 'Event/konference' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'website', label: 'Web' },
  { value: 'other', label: 'Jiný' },
];

// Helper function to derive offer type from services
function getOfferTypeFromServices(services: Array<{ billing_type: 'monthly' | 'one_off' }>): 'retainer' | 'one_off' {
  if (!services?.length) return 'retainer';
  const hasMonthly = services.some(s => s.billing_type === 'monthly');
  const hasOneOff = services.some(s => s.billing_type === 'one_off');
  if (hasMonthly && hasOneOff) return 'retainer'; // Mixed: default to retainer
  return hasMonthly ? 'retainer' : 'one_off';
}

export function AddLeadDialog({ open, onOpenChange, lead }: AddLeadDialogProps) {
  const { addLead, updateLead } = useLeadsData();
  const { colleagues } = useCRMData();
  const { user } = useAuth();
  const { lookupCompany, isLoading: isLoadingAres } = useAresLookup();

  const activeColleagues = colleagues.filter(c => c.status === 'active');
  const isContractCreated = !!lead?.contract_created_at;
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
        form.setValue('billing_country', 'Česká republika');
      }
      // Set court registration info
      if (result.court_name) {
        form.setValue('court_name', result.court_name);
      }
      if (result.court_file_number) {
        form.setValue('court_file_number', result.court_file_number);
      }
      toast.success('Údaje načteny z ARES');
    }
  };

  const handleCompanySelect = (company: CompanySearchResult) => {
    console.debug('[AddLeadDialog] applying company autofill', {
      ico: company.ico,
      name: company.name,
      dic: company.dic,
    });

    // Auto-fill all fields from selected company
    form.setValue('company_name', company.name, { shouldDirty: true, shouldValidate: true });
    form.setValue('ico', company.ico, { shouldDirty: true, shouldValidate: true });
    form.setValue('dic', company.dic || '', { shouldDirty: true });
    form.setValue('billing_street', company.billing_street, { shouldDirty: true });
    form.setValue('billing_city', company.billing_city, { shouldDirty: true });
    form.setValue('billing_zip', company.billing_zip, { shouldDirty: true });
    form.setValue('billing_country', company.billing_country, { shouldDirty: true });

    console.debug('[AddLeadDialog] autofill applied values', {
      company_name: form.getValues('company_name'),
      ico: form.getValues('ico'),
      dic: form.getValues('dic'),
    });

    toast.success('Údaje načteny z ARES');
  };

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      company_name: '',
      ico: '',
      dic: '',
      website: '',
      industry: '',
      billing_street: '',
      billing_city: '',
      billing_zip: '',
      billing_country: 'Česká republika',
      billing_email: '',
      contact_name: '',
      contact_position: '',
      contact_email: '',
      contact_phone: '',
      stage: 'new_lead',
      owner_id: '',
      source: 'inbound',
      source_custom: '',
      client_message: '',
      ad_spend_monthly: null,
      summary: '',
      estimated_price: 0,
      currency: 'CZK',
      probability_percent: 30,
      court_name: '',
      court_file_number: '',
    },
  });

  useEffect(() => {
    if (lead) {
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
        contact_name: lead.contact_name,
        contact_position: lead.contact_position || '',
        contact_email: lead.contact_email || '',
        contact_phone: lead.contact_phone || '',
        stage: lead.stage,
        owner_id: lead.owner_id,
        source: lead.source,
        source_custom: lead.source_custom || '',
        client_message: lead.client_message || '',
        ad_spend_monthly: lead.ad_spend_monthly,
        summary: lead.summary,
        estimated_price: lead.estimated_price,
        currency: lead.currency,
        probability_percent: lead.probability_percent,
        court_name: lead.court_name || '',
        court_file_number: lead.court_file_number || '',
      });
    } else {
      form.reset({
        company_name: '',
        ico: '',
        dic: '',
        website: '',
        industry: '',
        billing_street: '',
        billing_city: '',
        billing_zip: '',
        billing_country: 'Česká republika',
        billing_email: '',
        contact_name: '',
        contact_position: '',
        contact_email: '',
        contact_phone: '',
        stage: 'new_lead',
        owner_id: '',
        source: 'inbound',
        source_custom: '',
        client_message: '',
        ad_spend_monthly: null,
        summary: '',
        estimated_price: 0,
        currency: 'CZK',
        probability_percent: 30,
        court_name: '',
        court_file_number: '',
      });
    }
  }, [lead, form]);

  const handleManualSubmit = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      const errors = form.formState.errors;
      const errorMessages = Object.entries(errors)
        .map(([field, error]) => `${field}: ${(error as { message?: string })?.message || 'Neplatné'}`)
        .join(', ');
      toast.error(`Formulář obsahuje chyby: ${errorMessages}`);
      return;
    }

    const data = form.getValues();
    const leadData = {
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
      contact_name: data.contact_name,
      contact_position: data.contact_position || null,
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
      stage: data.stage,
      owner_id: data.owner_id,
      source: data.source,
      source_custom: data.source === 'other' ? (data.source_custom || null) : null,
      client_message: data.client_message || null,
      ad_spend_monthly: toNullableNumber(data.ad_spend_monthly),
      summary: data.summary,
      estimated_price: data.estimated_price,
      currency: data.currency,
      probability_percent: data.probability_percent,
      offer_created_at: lead?.offer_created_at || null,
      potential_services: lead?.potential_services || [],
      meeting_request_sent_at: lead?.meeting_request_sent_at || null,
      access_request_sent_at: lead?.access_request_sent_at || null,
      access_request_platforms: lead?.access_request_platforms || [],
      access_received_at: lead?.access_received_at || null,
      onboarding_form_sent_at: lead?.onboarding_form_sent_at || null,
      onboarding_form_url: lead?.onboarding_form_url || null,
      onboarding_form_completed_at: lead?.onboarding_form_completed_at || null,
      contract_url: lead?.contract_url || null,
      contract_created_at: lead?.contract_created_at || null,
      contract_signed_at: lead?.contract_signed_at || null,
      offer_sent_at: lead?.offer_sent_at || null,
      offer_sent_by_id: lead?.offer_sent_by_id || null,
      created_by: user?.id || null,
      updated_by: user?.id || null,
      // Court registration info from ARES
      court_name: data.court_name || lead?.court_name || null,
      court_file_number: data.court_file_number || lead?.court_file_number || null,
    };

    setIsSubmitting(true);

    // Add timeout to prevent infinite hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: operace trvala příliš dlouho')), 30000)
    );

    try {
      if (lead) {
        await Promise.race([updateLead(lead.id, leadData), timeoutPromise]);
        toast.success('Lead byl upraven');
      } else {
        await Promise.race([addLead(leadData), timeoutPromise]);
        toast.success('Lead byl vytvořen');
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving lead:', error);
      const errorMessage = error instanceof Error ? error.message : 'Neznámá chyba';
      toast.error(`Nepodařilo se uložit lead: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? 'Upravit lead' : 'Nový lead'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6">
            {isContractCreated && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  ⚠️ Některá pole jsou uzamčena - smlouva byla odeslána
                </p>
              </div>
            )}
            {/* Company Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm border-b pb-2">Firma a kontakt</h4>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Název firmy *</FormLabel>
                      <FormControl>
                        <CompanySearchInput
                          value={field.value}
                          onChange={field.onChange}
                          onSelect={handleCompanySelect}
                          placeholder="Zadejte název firmy (min. 3 znaky)..."
                          disabled={isContractCreated}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IČO *</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="12345678" {...field} disabled={isContractCreated} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAresLookup}
                          disabled={isLoadingAres || isContractCreated}
                          className="shrink-0"
                        >
                          {isLoadingAres ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                          <span className="ml-1 hidden sm:inline">ARES</span>
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="dic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DIČ</FormLabel>
                      <FormControl>
                        <Input placeholder="CZ12345678" {...field} value={field.value || ''} disabled={isContractCreated} />
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
                      <Select onValueChange={field.onChange} value={field.value || ''} disabled={isContractCreated}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte obor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Ecommerce">Ecommerce</SelectItem>
                          <SelectItem value="LeadGen">LeadGen</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Web</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Billing Address Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm border-b pb-2">Fakturační adresa</h4>

              <FormField
                control={form.control}
                name="billing_street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ulice a číslo popisné</FormLabel>
                    <FormControl>
                      <Input placeholder="Václavské náměstí 1" {...field} value={field.value || ''} disabled={isContractCreated} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="billing_city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Město</FormLabel>
                      <FormControl>
                        <Input placeholder="Praha" {...field} value={field.value || ''} disabled={isContractCreated} />
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
                        <Input placeholder="110 00" {...field} value={field.value || ''} disabled={isContractCreated} />
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
                        <Input placeholder="Česká republika" {...field} value={field.value || ''} disabled={isContractCreated} />
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
                    <FormLabel>Fakturační email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="fakturace@firma.cz" {...field} value={field.value || ''} disabled={isContractCreated} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kontaktní osoba *</FormLabel>
                      <FormControl>
                        <Input placeholder="Jan Novák" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact_position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pozice</FormLabel>
                      <FormControl>
                        <Input placeholder="CEO" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="jan@firma.cz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon</FormLabel>
                      <FormControl>
                        <Input placeholder="+420 777 123 456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sales Info Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm border-b pb-2">Obchodní informace</h4>

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="stage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stav</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="new_lead">Nový lead</SelectItem>
                          <SelectItem value="meeting_done">Schůzka proběhla</SelectItem>
                          <SelectItem value="waiting_access">Čekáme na přístupy</SelectItem>
                          <SelectItem value="access_received">Přístupy přijaty</SelectItem>
                          <SelectItem value="preparing_offer">Příprava nabídky</SelectItem>
                          <SelectItem value="offer_sent">Nabídka odeslána</SelectItem>
                          <SelectItem value="won">Vyhráno</SelectItem>
                          <SelectItem value="lost">Prohráno</SelectItem>
                          <SelectItem value="postponed">Odloženo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="owner_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Odpovědná osoba *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeColleagues.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zdroj</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SOURCE_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {form.watch('source') === 'other' && (
                <FormField
                  control={form.control}
                  name="source_custom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vlastní zdroj</FormLabel>
                      <FormControl>
                        <Input placeholder="Zadejte vlastní zdroj..." {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="client_message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zpráva od klienta</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Co klient napsal při prvním kontaktu..." 
                        {...field} 
                        value={field.value || ''} 
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ad_spend_monthly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Měsíční investice do reklamy (Kč)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="100000" 
                        {...field} 
                        value={field.value ?? ''} 
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shrnutí / poznámka</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Zájem o Performance Boost..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>


            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Zrušit
              </Button>
              <Button type="button" onClick={handleManualSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Ukládám...' : lead ? 'Uložit změny' : 'Vytvořit lead'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
