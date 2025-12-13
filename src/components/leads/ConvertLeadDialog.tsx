import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, FileText, ExternalLink, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import type { Lead, CostModel, ClientTier, BillingModel, LeadSource } from '@/types/crm';
import { toast } from 'sonner';

const convertSchema = z.object({
  // Client info
  client_name: z.string().min(1, 'Název firmy je povinný'),
  brand_name: z.string().min(1, 'Brand je povinný'),
  ico: z.string().min(1, 'IČO je povinné'),
  dic: z.string().optional(),
  website: z.string().optional(),
  industry: z.string().optional(),
  country: z.string().optional(),
  tier: z.enum(['standard', 'gold', 'platinum', 'diamond'] as const),
  acquisition_channel: z.string().min(1, 'Zdroj je povinný'),
  pinned_notes: z.string().optional(),
  client_notes: z.string().optional(),
  // Billing
  billing_street: z.string().optional(),
  billing_city: z.string().optional(),
  billing_zip: z.string().optional(),
  billing_country: z.string().optional(),
  billing_email: z.string().email().or(z.literal('')).optional(),
  // Contact
  contact_name: z.string().min(1, 'Jméno kontaktu je povinné'),
  contact_position: z.string().optional(),
  contact_email: z.string().email().or(z.literal('')).optional(),
  contact_phone: z.string().optional(),
  contact_is_primary: z.boolean(),
  contact_is_decision_maker: z.boolean(),
  contact_notes: z.string().optional(),
  // Engagement
  engagement_name: z.string().min(1, 'Název zakázky je povinný'),
  engagement_type: z.enum(['retainer', 'one_off'] as const),
  billing_model: z.enum(['fixed_fee', 'spend_based', 'hybrid'] as const),
  currency: z.string().min(1, 'Měna je povinná'),
  monthly_fee: z.coerce.number().min(0),
  one_off_fee: z.coerce.number().min(0),
  target_margin_percent: z.coerce.number().min(0).max(100),
  start_date: z.string().min(1, 'Datum je povinné'),
  end_date: z.string().optional(),
  notice_period_months: z.coerce.number().optional(),
  primary_service_id: z.string().optional(),
  engagement_notes: z.string().optional(),
});

type ConvertFormData = z.infer<typeof convertSchema>;

interface TeamMember {
  colleague_id: string;
  role: string;
  cost_model: CostModel;
  monthly_cost: number;
  hourly_cost: number;
  percentage_of_revenue: number;
}

interface ConvertLeadDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ConvertLeadDialog({ lead, open, onOpenChange, onSuccess }: ConvertLeadDialogProps) {
  const { markLeadAsConverted } = useLeadsData();
  const { addClient, addContact, addEngagement, addAssignment, colleagues, services } = useCRMData();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const activeColleagues = colleagues.filter(c => c.status === 'active');
  const activeServices = services.filter(s => s.is_active);

  const form = useForm<ConvertFormData>({
    resolver: zodResolver(convertSchema),
    defaultValues: {
      client_name: '',
      brand_name: '',
      ico: '',
      dic: '',
      website: '',
      industry: '',
      country: 'Czech Republic',
      tier: 'standard',
      acquisition_channel: 'inbound',
      pinned_notes: '',
      client_notes: '',
      billing_street: '',
      billing_city: '',
      billing_zip: '',
      billing_country: 'Czech Republic',
      billing_email: '',
      contact_name: '',
      contact_position: '',
      contact_email: '',
      contact_phone: '',
      contact_is_primary: true,
      contact_is_decision_maker: true,
      contact_notes: '',
      engagement_name: '',
      engagement_type: 'retainer',
      billing_model: 'fixed_fee',
      currency: 'CZK',
      monthly_fee: 0,
      one_off_fee: 0,
      target_margin_percent: 40,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      notice_period_months: 1,
      primary_service_id: '',
      engagement_notes: '',
    },
  });

  // Reset form when lead changes
  useEffect(() => {
    if (lead && open) {
      form.reset({
        client_name: lead.company_name,
        brand_name: lead.company_name,
        ico: lead.ico,
        dic: '',
        website: lead.website || '',
        industry: lead.industry || '',
        country: 'Czech Republic',
        tier: 'standard',
        acquisition_channel: lead.source === 'other' ? (lead.source_custom || 'Jiný') : lead.source,
        pinned_notes: '',
        client_notes: '',
        billing_street: '',
        billing_city: '',
        billing_zip: '',
        billing_country: 'Czech Republic',
        billing_email: lead.contact_email || '',
        contact_name: lead.contact_name,
        contact_position: lead.contact_position || '',
        contact_email: lead.contact_email || '',
        contact_phone: lead.contact_phone || '',
        contact_is_primary: true,
        contact_is_decision_maker: true,
        contact_notes: '',
        engagement_name: `${lead.potential_service} - ${lead.company_name}`,
        engagement_type: lead.offer_type,
        billing_model: 'fixed_fee',
        currency: lead.currency,
        monthly_fee: lead.offer_type === 'retainer' ? lead.estimated_price : 0,
        one_off_fee: lead.offer_type === 'one_off' ? lead.estimated_price : 0,
        target_margin_percent: 40,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        notice_period_months: 1,
        primary_service_id: '',
        engagement_notes: lead.summary,
      });
      setTeamMembers([]);
    }
  }, [lead, open, form]);

  const addTeamMember = () => {
    setTeamMembers(prev => [...prev, {
      colleague_id: '',
      role: '',
      cost_model: 'fixed_monthly' as CostModel,
      monthly_cost: 0,
      hourly_cost: 0,
      percentage_of_revenue: 0,
    }]);
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string | number) => {
    setTeamMembers(prev => prev.map((m, i) => 
      i === index ? { ...m, [field]: value } : m
    ));
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(prev => prev.filter((_, i) => i !== index));
  };

  const executeConversion = (data: ConvertFormData) => {
    if (!lead) return;

    // 1. Create Client
    const newClient = addClient({
      name: data.client_name,
      brand_name: data.brand_name,
      ico: data.ico,
      dic: data.dic || null,
      website: data.website || '',
      country: data.country || 'Czech Republic',
      industry: data.industry || '',
      status: 'active',
      tier: data.tier as ClientTier,
      sales_representative_id: lead.owner_id,
      billing_street: data.billing_street || null,
      billing_city: data.billing_city || null,
      billing_zip: data.billing_zip || null,
      billing_country: data.billing_country || null,
      billing_email: data.billing_email || null,
      main_contact_name: data.contact_name,
      main_contact_email: data.contact_email || '',
      main_contact_phone: data.contact_phone || '',
      acquisition_channel: data.acquisition_channel,
      start_date: data.start_date,
      end_date: data.end_date || null,
      notes: data.client_notes || '',
      pinned_notes: data.pinned_notes || '',
      created_by: currentUser.id,
    });

    // 2. Create ClientContact
    const newContact = addContact({
      client_id: newClient.id,
      name: data.contact_name,
      position: data.contact_position || null,
      email: data.contact_email || null,
      phone: data.contact_phone || null,
      is_primary: data.contact_is_primary,
      is_decision_maker: data.contact_is_decision_maker,
      notes: data.contact_notes || '',
    });

    // 3. Create Engagement with document links from lead
    const newEngagement = addEngagement({
      client_id: newClient.id,
      contact_person_id: newContact.id,
      name: data.engagement_name,
      type: data.engagement_type,
      billing_model: data.billing_model as BillingModel,
      currency: data.currency,
      monthly_fee: data.monthly_fee,
      one_off_fee: data.one_off_fee,
      status: 'active',
      start_date: data.start_date,
      end_date: data.end_date || null,
      notice_period_months: data.notice_period_months || null,
      freelo_url: null,
      platforms: [],
      notes: data.engagement_notes || '',
      // Copy document links from lead
      offer_url: lead.offer_url || null,
      contract_url: lead.contract_url || null,
    });

    // 4. Create Assignments for team members
    teamMembers
      .filter(m => m.colleague_id && m.role)
      .forEach(member => {
        addAssignment({
          engagement_id: newEngagement.id,
          engagement_service_id: null,
          colleague_id: member.colleague_id,
          role_on_engagement: member.role,
          cost_model: member.cost_model,
          hourly_cost: member.cost_model === 'hourly' ? member.hourly_cost : null,
          monthly_cost: member.cost_model === 'fixed_monthly' ? member.monthly_cost : null,
          percentage_of_revenue: member.cost_model === 'percentage' ? member.percentage_of_revenue : null,
          start_date: data.start_date,
          end_date: null,
          notes: '',
        });
      });

    // 5. Mark lead as converted
    markLeadAsConverted(lead.id, newClient.id, newEngagement.id);

    toast.success('Lead byl úspěšně převeden na zakázku');
    onSuccess();
  };

  const handleSubmit = (data: ConvertFormData) => {
    if (!lead) return;
    executeConversion(data);
  };

  if (!lead) return null;

  const watchCostModel = (index: number) => teamMembers[index]?.cost_model || 'fixed_monthly';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Převést lead na zakázku</DialogTitle>
          <DialogDescription>
            Vytvořte nového klienta a zakázku z leadu {lead.company_name}
          </DialogDescription>
        </DialogHeader>

        {/* Dokumenty z leadu - info sekce */}
        <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            📄 Dokumenty k převodu
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Nabídka v Notion</p>
              {lead.offer_url ? (
                <a
                  href={lead.offer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Otevřít nabídku
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Nabídka nebyla vytvořena
                </div>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Smlouva v DigiSign</p>
              {lead.contract_url ? (
                <a
                  href={lead.contract_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Otevřít smlouvu
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Smlouva nebyla podepsána
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Tyto odkazy budou automaticky přeneseny do nové zakázky.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Client Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm border-b pb-2">Klient</h4>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="client_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Název firmy *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="brand_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <FormField
                  control={form.control}
                  name="ico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IČO *</FormLabel>
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
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Web</FormLabel>
                      <FormControl>
                        <Input placeholder="https://" {...field} />
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
                      <FormLabel>Odvětví</FormLabel>
                      <FormControl>
                        <Input placeholder="E-commerce" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Země</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tier</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="gold">🥇 Gold</SelectItem>
                          <SelectItem value="platinum">💎 Platinum</SelectItem>
                          <SelectItem value="diamond">👑 Diamond</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="acquisition_channel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Akvizice</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="referral">Doporučení</SelectItem>
                          <SelectItem value="inbound">Inbound</SelectItem>
                          <SelectItem value="cold_outreach">Cold outreach</SelectItem>
                          <SelectItem value="event">Event</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="website">Web</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="pinned_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Připnutá poznámka</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Důležité info viditelné v přehledu..." {...field} rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="client_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interní poznámky</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Detailní poznámky ke klientovi..." {...field} rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Billing Address */}
              <div className="space-y-2">
                <h5 className="text-sm text-muted-foreground font-medium">Fakturační adresa</h5>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="billing_street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ulice a číslo</FormLabel>
                        <FormControl>
                          <Input placeholder="Příkladná 123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="billing_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fakturační email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="fakturace@firma.cz" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
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
                          <Input placeholder="110 00" {...field} />
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
                        <FormLabel>Fakturační země</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm border-b pb-2">Kontaktní osoba</h4>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jméno *</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input placeholder="CEO, Marketing Manager..." {...field} />
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
                        <Input type="email" {...field} />
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
                        <Input placeholder="+420..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex flex-wrap gap-6">
                <FormField
                  control={form.control}
                  name="contact_is_primary"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Primární kontakt</FormLabel>
                        <FormDescription>Hlavní osoba pro komunikaci</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact_is_decision_maker"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Rozhodovatel</FormLabel>
                        <FormDescription>Schvaluje rozpočty a smlouvy</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="contact_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poznámky ke kontaktu</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Preferuje komunikaci přes email..." {...field} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Engagement Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm border-b pb-2">Zakázka</h4>
              
              <FormField
                control={form.control}
                name="engagement_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Název zakázky *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-4">
                <FormField
                  control={form.control}
                  name="engagement_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Typ</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="retainer">Paušál</SelectItem>
                          <SelectItem value="one_off">Jednorázová</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="billing_model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model fakturace</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fixed_fee">Fixní fee</SelectItem>
                          <SelectItem value="spend_based">% ze spendu</SelectItem>
                          <SelectItem value="hybrid">Hybridní</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="primary_service_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Služba</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeServices.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
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
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Začátek *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Konec</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notice_period_months"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Výpovědní lhůta</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="měsíce" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="target_margin_percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cílová marže (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {form.watch('engagement_type') === 'retainer' ? (
                  <FormField
                    control={form.control}
                    name="monthly_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Měsíční fee</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="one_off_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jednorázová částka</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="engagement_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poznámky k zakázce</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Team Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-medium text-sm">Tým na zakázce</h4>
                <Button type="button" variant="outline" size="sm" onClick={addTeamMember}>
                  <Plus className="h-4 w-4 mr-1" />
                  Přidat člena
                </Button>
              </div>

              {teamMembers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Zatím nikdo nepřiřazen. Přidejte členy týmu.
                </p>
              )}

              {teamMembers.map((member, index) => (
                <div key={index} className="grid gap-4 sm:grid-cols-5 p-3 border rounded-lg">
                  <div>
                    <label className="text-xs text-muted-foreground">Kolega</label>
                    <Select 
                      value={member.colleague_id} 
                      onValueChange={(v) => updateTeamMember(index, 'colleague_id', v)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Vyberte" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeColleagues.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Role</label>
                    <Input
                      className="mt-1"
                      placeholder="Account Lead"
                      value={member.role}
                      onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Model nákladů</label>
                    <Select 
                      value={member.cost_model} 
                      onValueChange={(v) => updateTeamMember(index, 'cost_model', v)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed_monthly">Fixní měsíčně</SelectItem>
                        <SelectItem value="hourly">Hodinově</SelectItem>
                        <SelectItem value="percentage">% z revenue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      {watchCostModel(index) === 'hourly' ? 'Hodinová sazba' : 
                       watchCostModel(index) === 'percentage' ? '% z revenue' : 'Měsíční náklad'}
                    </label>
                    <Input
                      className="mt-1"
                      type="number"
                      value={
                        watchCostModel(index) === 'hourly' ? member.hourly_cost :
                        watchCostModel(index) === 'percentage' ? member.percentage_of_revenue : 
                        member.monthly_cost
                      }
                      onChange={(e) => {
                        const field = watchCostModel(index) === 'hourly' ? 'hourly_cost' :
                                      watchCostModel(index) === 'percentage' ? 'percentage_of_revenue' : 
                                      'monthly_cost';
                        updateTeamMember(index, field, Number(e.target.value));
                      }}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => removeTeamMember(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Zrušit
              </Button>
              <Button type="submit">
                Převést na zakázku
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
