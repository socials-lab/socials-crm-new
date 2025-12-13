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
import { currentUser } from '@/data/mockData';
import type { Lead, LeadStage, LeadSource, LeadOfferType } from '@/types/crm';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { Loader2, Search } from 'lucide-react';

const leadSchema = z.object({
  company_name: z.string().min(1, 'Název firmy je povinný'),
  ico: z.string().min(1, 'IČO je povinné'),
  dic: z.string().optional().nullable(),
  website: z.string().url('Zadejte platnou URL').or(z.literal('')).optional().nullable(),
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
  potential_service: z.string().min(1, 'Služba je povinná'),
  offer_type: z.enum(['retainer', 'one_off'] as const),
  estimated_price: z.coerce.number().min(0, 'Cena musí být kladná'),
  currency: z.string().default('CZK'),
  probability_percent: z.coerce.number().min(0).max(100),
  offer_url: z.string().url('Zadejte platnou URL').or(z.literal('')).optional().nullable(),
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

const SERVICE_OPTIONS = [
  'Performance Boost',
  'Socials Boost',
  'Creative Boost',
  'Lead Gen Funnel',
  'Analytics Setup',
  'Strategy Consulting',
];

// Mock ARES data for demo
const MOCK_ARES_DATA: Record<string, { company_name: string; dic: string; billing_street: string; billing_city: string; billing_zip: string; billing_country: string }> = {
  '12345678': {
    company_name: 'Demo Firma s.r.o.',
    dic: 'CZ12345678',
    billing_street: 'Václavské náměstí 1',
    billing_city: 'Praha',
    billing_zip: '110 00',
    billing_country: 'Česká republika',
  },
  '87654321': {
    company_name: 'Test Company a.s.',
    dic: 'CZ87654321',
    billing_street: 'Masarykova 123',
    billing_city: 'Brno',
    billing_zip: '602 00',
    billing_country: 'Česká republika',
  },
  '11223344': {
    company_name: 'Innovation Labs s.r.o.',
    dic: 'CZ11223344',
    billing_street: 'Technologická 5',
    billing_city: 'Ostrava',
    billing_zip: '708 00',
    billing_country: 'Česká republika',
  },
};

export function AddLeadDialog({ open, onOpenChange, lead }: AddLeadDialogProps) {
  const { addLead, updateLead } = useLeadsData();
  const { colleagues } = useCRMData();
  const [isLoadingAres, setIsLoadingAres] = useState(false);

  const activeColleagues = colleagues.filter(c => c.status === 'active');
  
  const handleAresLookup = async () => {
    const ico = form.getValues('ico');
    if (!ico || ico.length < 8) {
      toast.error('Zadejte platné IČO (8 číslic)');
      return;
    }
    
    setIsLoadingAres(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check mock data first
    const mockData = MOCK_ARES_DATA[ico];
    if (mockData) {
      form.setValue('company_name', mockData.company_name);
      form.setValue('dic', mockData.dic);
      form.setValue('billing_street', mockData.billing_street);
      form.setValue('billing_city', mockData.billing_city);
      form.setValue('billing_zip', mockData.billing_zip);
      form.setValue('billing_country', mockData.billing_country);
      toast.success('Údaje načteny z ARES');
    } else {
      // Generate random mock data for any IČO
      form.setValue('company_name', `Společnost ${ico} s.r.o.`);
      form.setValue('dic', `CZ${ico}`);
      form.setValue('billing_street', 'Ulice 123');
      form.setValue('billing_city', 'Praha');
      form.setValue('billing_zip', '100 00');
      form.setValue('billing_country', 'Česká republika');
      toast.success('Údaje načteny z ARES (demo)');
    }
    
    setIsLoadingAres(false);
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
      owner_id: currentUser.id === 'user-1' ? 'col-1' : '',
      source: 'inbound',
      source_custom: '',
      client_message: '',
      ad_spend_monthly: null,
      summary: '',
      potential_service: '',
      offer_type: 'retainer',
      estimated_price: 0,
      currency: 'CZK',
      probability_percent: 30,
      offer_url: '',
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
        potential_service: lead.potential_service,
        offer_type: lead.offer_type,
        estimated_price: lead.estimated_price,
        currency: lead.currency,
        probability_percent: lead.probability_percent,
        offer_url: lead.offer_url || '',
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
        owner_id: currentUser.id === 'user-1' ? 'col-1' : '',
        source: 'inbound',
        source_custom: '',
        client_message: '',
        ad_spend_monthly: null,
        summary: '',
        potential_service: '',
        offer_type: 'retainer',
        estimated_price: 0,
        currency: 'CZK',
        probability_percent: 30,
        offer_url: '',
      });
    }
  }, [lead, form]);

  const handleSubmit = (data: LeadFormData) => {
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
      ad_spend_monthly: data.ad_spend_monthly || null,
      summary: data.summary,
      potential_service: data.potential_service,
      offer_type: data.offer_type,
      estimated_price: data.estimated_price,
      currency: data.currency,
      probability_percent: data.probability_percent,
      offer_url: data.offer_url || null,
      offer_created_at: lead?.offer_created_at || null,
      potential_services: lead?.potential_services || [],
      access_request_sent_at: lead?.access_request_sent_at || null,
      access_request_platforms: lead?.access_request_platforms || [],
      access_received_at: lead?.access_received_at || null,
      onboarding_form_sent_at: lead?.onboarding_form_sent_at || null,
      onboarding_form_url: lead?.onboarding_form_url || null,
      onboarding_form_completed_at: lead?.onboarding_form_completed_at || null,
      contract_url: lead?.contract_url || null,
      contract_created_at: lead?.contract_created_at || null,
      contract_sent_at: lead?.contract_sent_at || null,
      contract_signed_at: lead?.contract_signed_at || null,
      offer_sent_at: lead?.offer_sent_at || null,
      offer_sent_by_id: lead?.offer_sent_by_id || null,
      created_by: currentUser.id,
      updated_by: currentUser.id,
    };

    if (lead) {
      updateLead(lead.id, leadData);
      toast.success('Lead byl upraven');
    } else {
      addLead(leadData);
      toast.success('Lead byl vytvořen');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? 'Upravit lead' : 'Nový lead'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                        <Input placeholder="Firma s.r.o." {...field} />
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
                          <Input placeholder="12345678" {...field} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAresLookup}
                          disabled={isLoadingAres}
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
                        <Input placeholder="CZ12345678" {...field} value={field.value || ''} />
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
                        <Input placeholder="E-commerce" {...field} value={field.value || ''} />
                      </FormControl>
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
                      <Input placeholder="Václavské náměstí 1" {...field} value={field.value || ''} />
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
                        <Input placeholder="Praha" {...field} value={field.value || ''} />
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
                        <Input placeholder="110 00" {...field} value={field.value || ''} />
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
                        <Input placeholder="Česká republika" {...field} value={field.value || ''} />
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
                      <Input type="email" placeholder="fakturace@firma.cz" {...field} value={field.value || ''} />
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
                          <SelectItem value="contacted">Kontaktováno</SelectItem>
                          <SelectItem value="in_progress">Probíhá jednání</SelectItem>
                          <SelectItem value="offer_sent">Nabídka odeslána</SelectItem>
                          <SelectItem value="won">Vyhráno</SelectItem>
                          <SelectItem value="lost">Prohráno</SelectItem>
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

            {/* Offer Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm border-b pb-2">Nabídka</h4>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="potential_service"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Služba *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte službu" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SERVICE_OPTIONS.map(s => (
                            <SelectItem key={s} value={s}>
                              {s}
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
                  name="offer_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Typ nabídky</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="retainer">Paušál</SelectItem>
                          <SelectItem value="one_off">Jednorázová zakázka</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="estimated_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Odhadovaná cena</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="50000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Měna</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CZK">CZK</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="offer_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Odkaz na nabídku</FormLabel>
                    <FormControl>
                      <Input placeholder="https://freelo.io/project/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Zrušit
              </Button>
              <Button type="submit">
                {lead ? 'Uložit změny' : 'Vytvořit lead'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
