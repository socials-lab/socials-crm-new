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
import type { Lead, LeadSource } from '@/types/crm';
import { toast } from 'sonner';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Loader2, ExternalLink, Users, Building2, Calendar, Briefcase, Scale } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  summary: z.string().default(''),
  probability_percent: z.coerce.number().min(0).max(100).default(30),
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

interface AresData {
  companyName: string;
  dic: string | null;
  street: string | null;
  city: string | null;
  zip: string | null;
  country: string;
  legalForm: string | null;
  foundedDate: string | null;
  nace: string | null;
  directors: string[];
}

async function fetchAresData(ico: string): Promise<AresData | null> {
  try {
    // Fetch basic data
    const basicRes = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`);
    if (!basicRes.ok) return null;
    const basic = await basicRes.json();

    const sidlo = basic.sidlo || {};
    const legalFormCode = basic.pravniForma;
    const legalFormLabel = legalFormCode ? `${legalFormCode}` : null;

    // Try to get directors from VR
    let directors: string[] = [];
    try {
      const vrRes = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty-vr/${ico}`);
      if (vrRes.ok) {
        const vr = await vrRes.json();
        const statutarniOrgan = vr?.zaznamy?.[0]?.statutarniOrgan;
        if (statutarniOrgan && Array.isArray(statutarniOrgan)) {
          for (const organ of statutarniOrgan) {
            if (organ.clenove && Array.isArray(organ.clenove)) {
              for (const clen of organ.clenove) {
                const fo = clen.fospiravni || clen.fospiravny || clen.clenstvi?.ospiravni || clen;
                const jmeno = fo?.jmeno;
                const prijmeni = fo?.prijmeni;
                if (jmeno && prijmeni) {
                  directors.push(`${jmeno} ${prijmeni}`);
                }
              }
            }
          }
        }
      }
    } catch {
      // VR endpoint may not exist for all subjects
    }

    return {
      companyName: basic.obchodniJmeno || basic.nazev || '',
      dic: basic.dic || null,
      street: sidlo.textovaAdresa || [sidlo.nazevUlice, sidlo.cisloDomovni ? `${sidlo.cisloDomovni}${sidlo.cisloOrientacni ? '/' + sidlo.cisloOrientacni : ''}` : null].filter(Boolean).join(' ') || null,
      city: sidlo.nazevObce || null,
      zip: sidlo.psc ? String(sidlo.psc) : null,
      country: 'Česká republika',
      legalForm: legalFormLabel,
      foundedDate: basic.datumVzniku || null,
      nace: basic.czNace && basic.czNace.length > 0 ? basic.czNace[0] : null,
      directors,
    };
  } catch {
    return null;
  }
}

export function AddLeadDialog({ open, onOpenChange, lead }: AddLeadDialogProps) {
  const { addLead, updateLead } = useLeadsData();
  const { colleagues } = useCRMData();
  const { user } = useAuth();
  const [isLoadingAres, setIsLoadingAres] = useState(false);
  const [aresDirectors, setAresDirectors] = useState<string[]>([]);
  const [aresLegalForm, setAresLegalForm] = useState<string | null>(null);
  const [aresFounded, setAresFounded] = useState<string | null>(null);
  const [aresNace, setAresNace] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeColleagues = colleagues.filter(c => c.status === 'active');

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
      probability_percent: 30,
    },
  });

  const handleIcoChange = useCallback((value: string) => {
    // Clear previous debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Only auto-search when exactly 8 digits
    const cleanIco = value.replace(/\s/g, '');
    if (cleanIco.length === 8 && /^\d{8}$/.test(cleanIco)) {
      debounceRef.current = setTimeout(async () => {
        setIsLoadingAres(true);
        const data = await fetchAresData(cleanIco);
        if (data) {
          form.setValue('company_name', data.companyName);
          if (data.dic) form.setValue('dic', data.dic);
          if (data.street) form.setValue('billing_street', data.street);
          if (data.city) form.setValue('billing_city', data.city);
          if (data.zip) form.setValue('billing_zip', data.zip);
          form.setValue('billing_country', data.country);
          setAresDirectors(data.directors);
          setAresLegalForm(data.legalForm);
          setAresFounded(data.foundedDate);
          setAresNace(data.nace);
          toast.success('Údaje načteny z ARES');
        } else {
          toast.error('Subjekt nebyl nalezen v ARES');
        }
        setIsLoadingAres(false);
      }, 500);
    }
  }, [form]);

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
        probability_percent: lead.probability_percent,
      });
      setAresDirectors(lead.directors || []);
      setAresLegalForm(lead.legal_form || null);
      setAresFounded(lead.founded_date || null);
      setAresNace(lead.ares_nace || null);
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
        probability_percent: 30,
      });
      setAresDirectors([]);
      setAresLegalForm(null);
      setAresFounded(null);
      setAresNace(null);
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
      potential_service: lead?.potential_service || '',
      offer_type: lead?.offer_type || 'retainer' as const,
      estimated_price: lead?.estimated_price || 0,
      currency: lead?.currency || 'CZK',
      probability_percent: data.probability_percent,
      offer_url: lead?.offer_url || null,
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
      qualification_status: lead?.qualification_status || 'pending',
      qualification_reason: lead?.qualification_reason || null,
      qualified_at: lead?.qualified_at || null,
      legal_form: aresLegalForm,
      founded_date: aresFounded,
      directors: aresDirectors.length > 0 ? aresDirectors : null,
      ares_nace: aresNace,
      created_by: user?.id || null,
      updated_by: user?.id || null,
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

  const icoValue = form.watch('ico');

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
                  name="ico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IČO *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="12345678"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleIcoChange(e.target.value);
                            }}
                          />
                          {isLoadingAres && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              </div>

              {/* ARES info panel */}
              {(aresDirectors.length > 0 || aresLegalForm || aresFounded || aresNace || (icoValue && icoValue.length === 8)) && (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Data z ARES</span>
                    {icoValue && icoValue.length === 8 && (
                      <a
                        href={`https://ares.gov.cz/ekonomicke-subjekty/res/${icoValue}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Otevřít v ARES
                      </a>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {aresLegalForm && (
                      <div className="flex items-center gap-2">
                        <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Právní forma:</span>
                        <span className="font-medium">{aresLegalForm}</span>
                      </div>
                    )}
                    {aresFounded && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Vznik:</span>
                        <span className="font-medium">{new Date(aresFounded).toLocaleDateString('cs-CZ')}</span>
                      </div>
                    )}
                    {aresNace && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">CZ-NACE:</span>
                        <span className="font-medium">{aresNace}</span>
                      </div>
                    )}
                  </div>
                  {aresDirectors.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Jednatelé:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pl-5">
                        {aresDirectors.map((d, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{d}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {icoValue && icoValue.length === 8 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t">
                      <Building2 className="h-3 w-3" />
                      <span>Obrat firmy není v ARES dostupný –</span>
                      <a
                        href={`https://or.justice.cz/ias/ui/rejstrik-$firma?ico=${icoValue}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        hledat na Justice.cz
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}

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
              <h4 className="font-medium text-sm border-b pb-2">Sídlo firmy / Fakturační adresa</h4>

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
