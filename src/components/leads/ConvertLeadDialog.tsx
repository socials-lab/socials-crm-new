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
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Lead, CostModel, ClientTier, BillingModel, LeadSource, Client } from '@/types/crm';
import { toast } from '@/components/ui/sonner';

const convertSchema = z.object({
  // Editable client fields
  brand_name: z.string().min(1, 'Brand je povinný'),
  website: z.string().optional(),
  industry: z.string().optional(),
  tier: z.enum(['standard', 'gold', 'platinum', 'diamond'] as const),
  acquisition_channel: z.string().min(1, 'Zdroj je povinný'),
  pinned_notes: z.string().optional(),
  client_notes: z.string().optional(),
  // Engagement
  engagement_name: z.string().min(1, 'Název zakázky je povinný'),
  start_date: z.string().min(1, 'Datum je povinné'),
  end_date: z.string().optional(),
  notice_period_months: z.coerce.number().optional(),
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
  const { addClient, addContact, addEngagement, addAssignment, addEngagementService, deleteClient, colleagues } = useCRMData();
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const activeColleagues = colleagues.filter(c => c.status === 'active');

  const form = useForm<ConvertFormData>({
    resolver: zodResolver(convertSchema),
    defaultValues: {
      brand_name: '',
      website: '',
      industry: '',
      tier: 'standard',
      acquisition_channel: 'inbound',
      pinned_notes: '',
      client_notes: '',
      engagement_name: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      notice_period_months: 3,
      engagement_notes: '',
    },
  });

  // Reset form when lead changes
  useEffect(() => {
    if (lead && open) {
      form.reset({
        brand_name: lead.company_name,
        website: lead.website || '',
        industry: lead.industry || '',
        tier: 'standard',
        acquisition_channel: lead.source === 'other' ? (lead.source_custom || 'Jiný') : lead.source,
        pinned_notes: '',
        client_notes: '',
        engagement_name: lead.potential_services?.[0]?.name 
          ? `${lead.potential_services[0].name} - ${lead.company_name}`
          : `${lead.company_name}`,
        start_date: lead.onboarding_start_date || new Date().toISOString().split('T')[0],
        end_date: '',
        notice_period_months: 3,
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

  const executeConversion = async (data: ConvertFormData) => {
    if (!lead) return;

    let newClient: Client | null = null;

    try {
      // Derive engagement type and fees from services
      const hasMonthlyServices = lead.potential_services?.some(s => s.billing_type === 'monthly') || false;
      const engagementType = hasMonthlyServices ? 'retainer' : 'one_off';
      const monthlyFee = lead.potential_services
        ?.filter(s => s.billing_type === 'monthly')
        .reduce((sum, s) => sum + s.price, 0) || lead.estimated_price || 0;
      const oneOffFee = lead.potential_services
        ?.filter(s => s.billing_type === 'one_off')
        .reduce((sum, s) => sum + s.price, 0) || 0;

      // 1. Create Client (contract-bound data from lead, editable from form)
      newClient = await addClient({
        name: lead.company_name,  // FROM LEAD (contract-bound)
        brand_name: data.brand_name,  // FROM FORM (editable)
        ico: lead.ico,  // FROM LEAD (contract-bound)
        dic: lead.dic || null,  // FROM LEAD (contract-bound)
        website: data.website || '',
        country: lead.billing_country || 'Czech Republic',  // FROM LEAD
        industry: data.industry || '',
        status: 'active',
        tier: data.tier as ClientTier,
        sales_representative_id: lead.owner_id,
        billing_street: lead.billing_street || null,  // FROM LEAD (contract-bound)
        billing_city: lead.billing_city || null,  // FROM LEAD (contract-bound)
        billing_zip: lead.billing_zip || null,  // FROM LEAD (contract-bound)
        billing_country: lead.billing_country || null,  // FROM LEAD (contract-bound)
        billing_email: lead.billing_email || lead.contact_email || null,  // FROM LEAD
        main_contact_name: '',  // Legacy - empty
        main_contact_email: '', // Legacy - empty
        main_contact_phone: '', // Legacy - empty
        acquisition_channel: data.acquisition_channel,
        start_date: data.start_date,
        end_date: data.end_date || null,
        notes: data.client_notes || '',
        pinned_notes: data.pinned_notes || '',
        created_by: user?.id || null,
      });

      // 2. Create Primary ClientContact (from lead)
      const newContact = await addContact({
        client_id: newClient.id,
        name: lead.contact_name,  // FROM LEAD (contract-bound)
        position: lead.contact_position || null,  // FROM LEAD
        email: lead.contact_email || null,  // FROM LEAD (contract-bound)
        phone: lead.contact_phone || null,  // FROM LEAD (contract-bound)
        is_primary: true,
        is_decision_maker: true,
        notes: '',
      });

      // 2.1 Create Fakturoid subject (non-blocking, don't fail conversion)
      // Called AFTER contact creation so we can pass the phone number
      try {
        const { data: fakturoidResult, error: fakturoidError } = await supabase.functions.invoke(
          'fakturoid-create-subject',
          { body: { client_id: newClient.id, phone: lead.contact_phone || undefined } }
        );

        if (fakturoidError || !fakturoidResult?.success) {
          console.warn('Fakturoid subject creation failed:', fakturoidError || fakturoidResult?.error);
          toast.warning('Klient vytvořen, ale nepodařilo se vytvořit kontakt ve Fakturoid. Můžete to zkusit později.');
        }
      } catch (fakturoidErr) {
        console.warn('Fakturoid integration error:', fakturoidErr);
        toast.warning('Klient vytvořen, ale Fakturoid integrace selhala.');
      }

      // 2.5 Create contacts from onboarding signatories
      const addedEmails = new Set<string>([lead.contact_email || ''].filter(Boolean));
      
      for (const signatory of lead.onboarding_signatories || []) {
        if (!signatory.email || addedEmails.has(signatory.email)) continue;
        addedEmails.add(signatory.email);
        await addContact({
          client_id: newClient.id,
          name: signatory.name,
          position: signatory.position || null,
          email: signatory.email,
          phone: signatory.phone || null,
          is_primary: false,
          is_decision_maker: true,
          notes: 'Z onboarding formuláře - podpisující osoba',
        });
      }

      // 2.6 Create contacts from onboarding project contacts
      for (const projectContact of lead.onboarding_project_contacts || []) {
        if (!projectContact.email || addedEmails.has(projectContact.email)) continue;
        addedEmails.add(projectContact.email);
        await addContact({
          client_id: newClient.id,
          name: projectContact.name,
          position: null,
          email: projectContact.email,
          phone: projectContact.phone || null,
          is_primary: false,
          is_decision_maker: false,
          notes: 'Z onboarding formuláře - projektový kontakt',
        });
      }

      // 3. Create Engagement (derived values from services)
      const newEngagement = await addEngagement({
        client_id: newClient.id,
        contact_person_id: newContact.id,
        name: data.engagement_name,
        type: engagementType as 'retainer' | 'one_off',
        billing_model: 'fixed_fee' as BillingModel,  // Always fixed_fee for service-based pricing
        currency: lead.currency,  // FROM LEAD
        monthly_fee: monthlyFee,
        one_off_fee: oneOffFee,
        status: 'active',
        start_date: data.start_date,
        end_date: data.end_date || null,
        notice_period_months: data.notice_period_months || null,
        freelo_url: null,
        platforms: [],
        notes: data.engagement_notes || '',
        offer_url: lead.offer_url || null,
        contract_url: lead.contract_url || null,
      });

      // 3.5 Create EngagementServices from lead's potential_services
      for (const leadService of lead.potential_services || []) {
        await addEngagementService({
          engagement_id: newEngagement.id,
          service_id: leadService.service_id,
          name: leadService.name,
          price: leadService.price,
          billing_type: leadService.billing_type,
          currency: leadService.currency,
          is_active: true,
          notes: '',
          selected_tier: leadService.selected_tier,
          creative_boost_min_credits: null,
          creative_boost_max_credits: null,
          creative_boost_price_per_credit: null,
          invoicing_status: leadService.billing_type === 'one_off' ? 'pending' : 'not_applicable',
          invoiced_at: null,
          invoiced_in_period: null,
          invoice_id: null,
          upsold_by_id: null,
          upsell_commission_percent: null,
        });
      }

      // 4. Create Assignments for team members
      for (const member of teamMembers.filter(m => m.colleague_id && m.role)) {
        await addAssignment({
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
      }

      // 5. Mark lead as converted (LAST - so failure above keeps lead unconverted)
      await markLeadAsConverted(lead.id, newClient.id, newEngagement.id);

      toast.success('Lead byl úspěšně převeden na zakázku');
      onSuccess();
    } catch (error) {
      console.error('Error converting lead:', error);
      
      // Attempt rollback - delete client (cascades to contacts, engagements, etc.)
      if (newClient) {
        try {
          await deleteClient(newClient.id);
          toast.error('Chyba při převodu leadu. Změny byly vráceny zpět.');
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
          toast.error('Chyba při převodu leadu. Některé záznamy mohly být vytvořeny - kontaktujte admina.');
        }
      } else {
        toast.error('Chyba při vytváření klienta');
      }
    }
  };

  const handleSubmit = async (data: ConvertFormData) => {
    if (!lead) return;
    await executeConversion(data);
  };

  if (!lead) return null;

  const watchCostModel = (index: number) => teamMembers[index]?.cost_model || 'fixed_monthly';

  // Calculate service totals for display
  const monthlyTotal = lead.potential_services
    ?.filter(s => s.billing_type === 'monthly')
    .reduce((sum, s) => sum + s.price, 0) || 0;
  const oneOffTotal = lead.potential_services
    ?.filter(s => s.billing_type === 'one_off')
    .reduce((sum, s) => sum + s.price, 0) || 0;
  const currency = lead.currency || 'CZK';

  // Count contacts that will be created
  const totalContacts = 1 + // Primary contact
    (lead.onboarding_signatories?.filter(s => s.email && s.email !== lead.contact_email).length || 0) +
    (lead.onboarding_project_contacts?.filter(pc => pc.email && pc.email !== lead.contact_email && 
      !lead.onboarding_signatories?.some(s => s.email === pc.email)).length || 0);

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
            {/* Section 1: Verification - READ ONLY */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm border-b pb-2">Ověření údajů ze smlouvy</h4>
              
              <div className="p-4 rounded-lg bg-muted/30 border space-y-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Název firmy</p>
                    <p className="text-sm font-medium">{lead.company_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Brand</p>
                    <FormField
                      control={form.control}
                      name="brand_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">IČO</p>
                    <p className="text-sm font-medium">{lead.ico}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">DIČ</p>
                    <p className="text-sm font-medium">{lead.dic || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Měna</p>
                    <p className="text-sm font-medium">{currency}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Fakturační adresa</p>
                  <p className="text-sm">
                    {lead.billing_street || '-'}
                    {lead.billing_street && lead.billing_city && ', '}
                    {lead.billing_city || ''}
                    {lead.billing_zip && ` ${lead.billing_zip}`}
                    {lead.billing_country && `, ${lead.billing_country}`}
                    {!lead.billing_street && !lead.billing_city && '-'}
                  </p>
                  {lead.billing_email && (
                    <p className="text-xs text-muted-foreground mt-1">Email: {lead.billing_email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Services Preview - READ ONLY */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm border-b pb-2">Služby k převodu</h4>
              
              {lead.potential_services && lead.potential_services.length > 0 ? (
                <div className="p-4 rounded-lg bg-muted/30 border space-y-2">
                  {lead.potential_services.map((service, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{service.name}</p>
                        {service.selected_tier && (
                          <p className="text-xs text-muted-foreground">Tier: {service.selected_tier}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {service.price.toLocaleString('cs-CZ')} {service.currency}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {service.billing_type === 'monthly' ? 'měsíčně' : 'jednorázově'}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t space-y-1">
                    {monthlyTotal > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Měsíční celkem:</span>
                        <span className="font-medium">{monthlyTotal.toLocaleString('cs-CZ')} {currency}/měsíc</span>
                      </div>
                    )}
                    {oneOffTotal > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Jednorázové celkem:</span>
                        <span className="font-medium">{oneOffTotal.toLocaleString('cs-CZ')} {currency}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-muted/30 border text-sm text-muted-foreground">
                  Žádné služby k převodu
                </div>
              )}
            </div>

            {/* Section 3: Contacts Preview - READ ONLY */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm border-b pb-2">Kontakty k vytvoření</h4>
              
              <div className="p-4 rounded-lg bg-muted/30 border space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Primární kontakt</p>
                  <p className="text-sm font-medium">{lead.contact_name}</p>
                  {lead.contact_position && (
                    <p className="text-xs text-muted-foreground">{lead.contact_position}</p>
                  )}
                  {lead.contact_email && (
                    <p className="text-xs text-muted-foreground">{lead.contact_email}</p>
                  )}
                  {lead.contact_phone && (
                    <p className="text-xs text-muted-foreground">{lead.contact_phone}</p>
                  )}
                </div>

                {lead.onboarding_signatories && lead.onboarding_signatories.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Podpisující osoby (rozhodovatelé)</p>
                    {lead.onboarding_signatories
                      .filter(s => s.email && s.email !== lead.contact_email)
                      .map((signatory, idx) => (
                        <div key={idx} className="text-sm py-1">
                          <p className="font-medium">{signatory.name}</p>
                          {signatory.position && (
                            <p className="text-xs text-muted-foreground">{signatory.position}</p>
                          )}
                          {signatory.email && (
                            <p className="text-xs text-muted-foreground">{signatory.email}</p>
                          )}
                        </div>
                      ))}
                  </div>
                )}

                {lead.onboarding_project_contacts && lead.onboarding_project_contacts.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Projektové kontakty</p>
                    {lead.onboarding_project_contacts
                      .filter(pc => pc.email && 
                        pc.email !== lead.contact_email &&
                        !lead.onboarding_signatories?.some(s => s.email === pc.email))
                      .map((contact, idx) => (
                        <div key={idx} className="text-sm py-1">
                          <p className="font-medium">{contact.name}</p>
                          {contact.email && (
                            <p className="text-xs text-muted-foreground">{contact.email}</p>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Section 4: Editable Fields */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm border-b pb-2">Nastavení převodu</h4>
              
              <div className="grid gap-4 sm:grid-cols-2">
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
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
              </div>

              <div className="p-3 rounded-lg bg-muted/30 border">
                <p className="text-xs text-muted-foreground mb-1">Výpovědní lhůta (ze smlouvy)</p>
                <p className="text-sm font-medium">3 měsíce</p>
                <p className="text-xs text-muted-foreground mt-1">Dle standardní smlouvy</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
                      <FormLabel>Interní poznámky ke klientovi</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Detailní poznámky..." {...field} rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="engagement_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poznámky k zakázce</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Poznámky k zakázce..." {...field} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 5: Conversion Summary */}
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
              <h4 className="font-medium text-sm mb-3">Co bude vytvořeno:</h4>
              <ul className="space-y-1 text-sm">
                <li>• 1 klient ({lead.company_name})</li>
                <li>• {totalContacts} {totalContacts === 1 ? 'kontakt' : totalContacts < 5 ? 'kontakty' : 'kontaktů'}</li>
                <li>• 1 zakázka ({form.watch('engagement_name') || lead.company_name})</li>
                {lead.potential_services && lead.potential_services.length > 0 && (
                  <li>
                    • {lead.potential_services.length} {lead.potential_services.length === 1 ? 'služba' : lead.potential_services.length < 5 ? 'služby' : 'služeb'}
                    {monthlyTotal > 0 && ` (${monthlyTotal.toLocaleString('cs-CZ')} ${currency}/měsíc`}
                    {monthlyTotal > 0 && oneOffTotal > 0 && ' + '}
                    {oneOffTotal > 0 && `${oneOffTotal.toLocaleString('cs-CZ')} ${currency} jednorázově`}
                    {monthlyTotal > 0 || oneOffTotal > 0 ? ')' : ''}
                  </li>
                )}
              </ul>
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
