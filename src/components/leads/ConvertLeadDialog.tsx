import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Plus, Trash2, FileText, ExternalLink, AlertTriangle, Sparkles } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { useCRMData } from '@/hooks/useCRMData';
import { toDateOnlyString, toNullableNumber } from '@/lib/dbNormalize';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Lead, CostModel, ClientTier, ServiceRewardRole, ServiceRewardTierConfig } from '@/types/crm';
import { toast } from 'sonner';

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
  // Marks this row as auto-proposed from a concrete service.
  _serviceIndex?: number;
}

interface ConvertLeadDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ConvertLeadDialog({ lead, open, onOpenChange, onSuccess }: ConvertLeadDialogProps) {
  const { colleagues, services } = useCRMData();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isConverting, setIsConverting] = useState(false);

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
      start_date: '',
      end_date: '',
      notice_period_months: 3,
      engagement_notes: '',
    },
  });

  function getRewardRolesForTier(
    rewardConfig: ServiceRewardTierConfig[] | null | undefined,
    tier: string | null | undefined
  ): ServiceRewardRole[] {
    if (!rewardConfig || rewardConfig.length === 0) return [];

    if (tier) {
      const match = rewardConfig.find(cfg => cfg.tier?.toLowerCase() === tier.toLowerCase());
      if (match?.roles?.length) return match.roles;
    }

    const noTier = rewardConfig.find(cfg => !cfg.tier);
    if (noTier?.roles?.length) return noTier.roles;

    return [];
  }

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
        start_date: lead.contract_signed_at
          ? toDateOnlyString(new Date(lead.contract_signed_at))
          : toDateOnlyString(new Date()),
        end_date: '',
        notice_period_months: 3,
        engagement_notes: lead.summary,
      });

      const suggestedTeam: TeamMember[] = [];
      for (const [serviceIndex, leadService] of (lead.potential_services || []).entries()) {
        const catalogService = services.find(s => s.id === leadService.service_id);
        if (!catalogService?.reward_config?.length) continue;

        const matchedRoles = getRewardRolesForTier(catalogService.reward_config, leadService.selected_tier);
        for (const role of matchedRoles) {
          const costModel: CostModel = role.reward_type === 'hourly' ? 'hourly' : 'fixed_monthly';
          const monthlyCost = role.reward_type === 'fixed_monthly'
            ? role.reward
            : role.reward_type === 'per_credit'
              ? role.reward * 30
              : 0;

          suggestedTeam.push({
            colleague_id: '',
            role: role.role,
            cost_model: costModel,
            monthly_cost: monthlyCost,
            hourly_cost: role.reward_type === 'hourly' ? role.reward : 0,
            percentage_of_revenue: 0,
            _serviceIndex: serviceIndex,
          });
        }
      }

      setTeamMembers(suggestedTeam);
    }
  }, [lead, open, form, services]);

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
    console.log('executeConversion called', { lead: lead?.id, data });
    if (!lead) return;

    // Validate contact_name exists (Fix #2)
    if (!lead.contact_name || lead.contact_name.trim() === '') {
      toast.error('Chybí jméno kontaktní osoby. Doplňte ho před převodem.');
      return;
    }

    setIsConverting(true);
    console.log('Starting conversion, setIsConverting(true)');

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

      // NOTE: Fakturoid subject creation is now done AFTER client creation
      // to prevent orphaned subjects if the database transaction fails.
      // The fakturoid_subject_id will be updated after successful client creation.

      // STEP 2: Prepare additional contacts (from onboarding)
      const addedEmails = new Set<string>([lead.contact_email || ''].filter(Boolean));
      const additionalContacts: Array<{
        name: string;
        position: string | null;
        email: string | null;
        phone: string | null;
        is_decision_maker: boolean;
        notes: string;
      }> = [];

      // Add signatories
      for (const signatory of lead.onboarding_signatories || []) {
        if (!signatory.email || addedEmails.has(signatory.email)) continue;
        addedEmails.add(signatory.email);
        additionalContacts.push({
          name: signatory.name,
          position: signatory.position || null,
          email: signatory.email,
          phone: signatory.phone || null,
          is_decision_maker: true,
          notes: 'Z onboarding formuláře - podpisující osoba',
        });
      }

      // Add project contacts
      // Issue #14: Preserve position from project contacts
      for (const projectContact of lead.onboarding_project_contacts || []) {
        if (!projectContact.email || addedEmails.has(projectContact.email)) continue;
        addedEmails.add(projectContact.email);
        additionalContacts.push({
          name: projectContact.name,
          position: (projectContact as { position?: string }).position || 'Projektový kontakt',
          email: projectContact.email,
          phone: projectContact.phone || null,
          is_decision_maker: false,
          notes: 'Z onboarding formuláře - projektový kontakt',
        });
      }

      // STEP 3: Prepare services data
      const servicesData = (lead.potential_services || []).map(ls => ({
        service_id: ls.service_id,
        name: ls.name,
        price: ls.price,
        billing_type: ls.billing_type,
        currency: ls.currency,
        selected_tier: ls.selected_tier,
        creative_boost_fixed_billing: true,
        notes: '',
      }));

      // STEP 4: Prepare assignments data
      const assignmentsData = teamMembers
        .filter(m => m.colleague_id && m.role)
        .map(member => ({
          colleague_id: member.colleague_id,
          role: member.role,
          cost_model: member.cost_model,
          hourly_cost: member.cost_model === 'hourly' ? member.hourly_cost : null,
          monthly_cost: member.cost_model === 'fixed_monthly' ? member.monthly_cost : null,
          percentage_of_revenue: member.cost_model === 'percentage' ? member.percentage_of_revenue : null,
          start_date: data.start_date,
          end_date: null,
          notes: '',
        }));

      // STEP 5: Call atomic conversion stored procedure
      // All DB operations happen in a single transaction
      const { data: conversionResult, error: conversionError } = await supabase.rpc(
        'convert_lead_to_client',
        {
          p_lead_id: lead.id,
          p_client_data: {
            name: lead.company_name,
            brand_name: data.brand_name,
            ico: lead.ico,
            dic: lead.dic || null,
            website: data.website || '',
            country: lead.billing_country || 'Czech Republic',
            industry: data.industry || '',
            tier: data.tier,
            sales_representative_id: lead.owner_id,
            billing_street: lead.billing_street || null,
            billing_city: lead.billing_city || null,
            billing_zip: lead.billing_zip || null,
            billing_country: lead.billing_country || null,
            billing_email: lead.billing_email || lead.contact_email || null,
            // NOTE: main_contact_* fields removed - contacts now stored in client_contacts table
            acquisition_channel: data.acquisition_channel,
            start_date: data.start_date,
            end_date: data.end_date || null,
            notes: data.client_notes || '',
            pinned_notes: data.pinned_notes || '',
            fakturoid_subject_id: null, // Will be set after Fakturoid sync
            created_by: user?.id || null,
          },
          p_primary_contact: {
            name: lead.contact_name,
            position: lead.contact_position || null,
            email: lead.contact_email || null,
            phone: lead.contact_phone || null,
            notes: '',
            is_primary: true,
            is_decision_maker: true, // Primary contact from lead is always decision maker
          },
          p_additional_contacts: additionalContacts,
          p_engagement_data: {
            name: data.engagement_name,
            type: engagementType,
            billing_model: 'fixed_fee',
            currency: lead.currency,
            monthly_fee: monthlyFee,
            one_off_fee: oneOffFee,
            start_date: data.start_date,
            end_date: data.end_date || null,
            notice_period_months: toNullableNumber(data.notice_period_months),
            offer_url: lead.offer_url || null,
            contract_url: lead.contract_url || null,
            managed_countries: [],
            notes: data.engagement_notes || '',
          },
          p_services: servicesData,
          p_assignments: assignmentsData,
        }
      );

      if (conversionError) {
        console.error('Conversion RPC error:', conversionError);
        throw new Error(conversionError.message || 'Chyba při převodu leadu');
      }

      if (!conversionResult?.success) {
        throw new Error('Převod selhal - neočekávaná odpověď');
      }

      // STEP 6: Create Fakturoid subject AFTER successful conversion
      // This prevents orphaned subjects - if this fails, client exists and can be synced later manually
      const clientId = conversionResult.client_id;
      try {
        const { data: fakturoidResult, error: fakturoidError } = await supabase.functions.invoke(
          'fakturoid-create-subject',
          {
            body: {
              client_id: clientId, // Use the newly created client ID
            }
          }
        );

        if (fakturoidError || !fakturoidResult?.success) {
          console.warn('Fakturoid subject creation failed (non-blocking):', fakturoidError || fakturoidResult?.error);
          toast.warning('Klient vytvořen, ale propojení s Fakturoid selhalo. Propojte manuálně v kartě klienta.');
        }
      } catch (fakturoidErr) {
        console.warn('Fakturoid subject creation error (non-blocking):', fakturoidErr);
        toast.warning('Klient vytvořen, ale propojení s Fakturoid selhalo. Propojte manuálně v kartě klienta.');
      }

      // Invalidate all affected caches
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['leads'] }),
        queryClient.invalidateQueries({ queryKey: ['lead_history'] }),
        queryClient.invalidateQueries({ queryKey: ['clients'] }),
        queryClient.invalidateQueries({ queryKey: ['client_contacts'] }),
        queryClient.invalidateQueries({ queryKey: ['engagements'] }),
        queryClient.invalidateQueries({ queryKey: ['engagement_services'] }),
        queryClient.invalidateQueries({ queryKey: ['engagement_assignments'] }),
      ]);

      // Notify admins about the conversion
      try {
        await supabase.rpc('create_admin_notification', {
          p_type: 'lead_converted',
          p_title: 'Lead převeden na klienta!',
          p_message: `Lead "${lead.company_name}" byl úspěšně převeden.`,
          p_link: `/clients?highlight=${clientId}`,
          p_metadata: {
            lead_id: lead.id,
            client_id: clientId,
            company_name: lead.company_name,
          },
        });
      } catch {
        // Non-blocking
      }

      toast.success('Lead byl úspěšně převeden na zakázku');
      onSuccess();
    } catch (error) {
      console.error('Error converting lead:', error);
      const message = error instanceof Error ? error.message : 'Neznámá chyba';
      toast.error(`Chyba při převodu leadu: ${message}`);
    } finally {
      setIsConverting(false);
    }
  };

  const handleSubmit = async (data: ConvertFormData) => {
    console.log('handleSubmit called with data:', data);
    if (!lead) return;
    await executeConversion(data);
  };

  const handleInvalidSubmit = (errors: Record<string, unknown>) => {
    console.log('handleInvalidSubmit called with errors:', errors);
    const errorMessages = Object.entries(errors)
      .map(([field, error]) => `${field}: ${(error as { message?: string })?.message || 'Invalid'}`)
      .join(', ');
    toast.error(`Formulář obsahuje chyby: ${errorMessages}`);
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
  if (!lead.currency) {
    throw new Error(`Lead ${lead.id} has no currency`);
  }
  const currency = lead.currency;

  // Check if lead has at least one service
  const hasServices = (lead.potential_services?.length ?? 0) > 0;
  const hasSuggestedTeam = teamMembers.some(member => member._serviceIndex !== undefined);

  const monthlyRevenue = monthlyTotal > 0 ? monthlyTotal : 0;
  const totalTeamCost = teamMembers.reduce((sum, member) => {
    if (member.cost_model === 'fixed_monthly') return sum + (member.monthly_cost || 0);
    if (member.cost_model === 'hourly') return sum + ((member.hourly_cost || 0) * 160 / 12);
    if (member.cost_model === 'percentage') return sum + (monthlyRevenue * (member.percentage_of_revenue || 0) / 100);
    return sum;
  }, 0);
  const margin = monthlyRevenue > 0 ? ((monthlyRevenue - totalTeamCost) / monthlyRevenue) * 100 : 0;

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
          <form
            onSubmit={(e) => {
              console.log('Form onSubmit triggered');
              form.handleSubmit(handleSubmit, handleInvalidSubmit)(e);
            }}
            className="space-y-6"
          >
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
                        <span className="text-muted-foreground">Předběžná cena (měsíčně):</span>
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
                      <FormDescription>
                        Předvyplněno z data podpisu smlouvy, ale můžete upravit (např. u starších smluv).
                      </FormDescription>
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
                <h4 className="font-medium text-sm flex items-center gap-2">
                  Tým na zakázce
                  {hasSuggestedTeam && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Sparkles className="h-3 w-3" />
                      Navrženo automaticky
                    </Badge>
                  )}
                </h4>
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
                        watchCostModel(index) === 'hourly' ? (member.hourly_cost || '') :
                        watchCostModel(index) === 'percentage' ? (member.percentage_of_revenue || '') :
                        (member.monthly_cost || '')
                      }
                      onChange={(e) => {
                        const field = watchCostModel(index) === 'hourly' ? 'hourly_cost' :
                                      watchCostModel(index) === 'percentage' ? 'percentage_of_revenue' :
                                      'monthly_cost';
                        const raw = e.target.value;
                        updateTeamMember(index, field, raw === '' ? 0 : (Number(raw) || 0));
                      }}
                      placeholder="0"
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

            {/* Margin warning */}
            {monthlyRevenue > 0 && totalTeamCost > 0 && (
              <div className={`p-3 rounded-lg border flex items-start gap-2 ${
                margin >= 66 ? 'bg-green-500/10 border-green-500/30' :
                margin >= 50 ? 'bg-yellow-500/10 border-yellow-500/30' :
                'bg-red-500/10 border-red-500/30'
              }`}>
                {margin < 66 && (
                  <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${margin >= 50 ? 'text-yellow-600' : 'text-red-600'}`} />
                )}
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Odhadovaná marže:</span>
                    <span className={`font-bold ${
                      margin >= 66 ? 'text-green-600' : margin >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {margin.toFixed(1)} %
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({monthlyRevenue.toLocaleString('cs-CZ')} – {Math.round(totalTeamCost).toLocaleString('cs-CZ')} = {Math.round(monthlyRevenue - totalTeamCost).toLocaleString('cs-CZ')} Kč)
                    </span>
                  </div>
                  {margin < 66 && (
                    <p className="text-xs text-muted-foreground">
                      ⚠️ Minimální cílová marže je 66 %. Zvažte úpravu ceny nebo snížení interních nákladů.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isConverting}>
                Zrušit
              </Button>
              <Button
                type="button"
                disabled={isConverting || !hasServices}
                onClick={async () => {
                  console.log('Convert button clicked - manual submit');
                  if (!hasServices) {
                    toast.error('Přidejte alespoň jednu službu k leadu před převodem');
                    return;
                  }
                  // Manually trigger form validation and submission
                  const isValid = await form.trigger();
                  console.log('Form validation result:', isValid, form.formState.errors);
                  if (isValid) {
                    const data = form.getValues();
                    console.log('Submitting with data:', data);
                    await handleSubmit(data);
                  } else {
                    const errors = form.formState.errors;
                    const errorMessages = Object.entries(errors)
                      .map(([field, error]) => `${field}: ${(error as { message?: string })?.message || 'Neplatné'}`)
                      .join(', ');
                    toast.error(`Formulář obsahuje chyby: ${errorMessages}`);
                  }
                }}
              >
                {isConverting ? 'Převádím...' : !hasServices ? 'Přidejte služby' : 'Převést na zakázku'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
