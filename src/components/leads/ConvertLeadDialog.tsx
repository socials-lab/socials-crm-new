import { useState, useEffect, useMemo } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useCRMData } from '@/hooks/useCRMData';
import { toDateOnlyString, toNullableNumber } from '@/lib/dbNormalize';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Lead, CostModel, ClientTier, ServiceRewardRole, ServiceRewardTierConfig } from '@/types/crm';
import { toast } from 'sonner';
import { getLeadOfferUrl } from '@/utils/offerUrl';
import { invokeWithTimeout } from '@/lib/supabaseUtils';
import { buildFreeloProjectName, buildSlackChannelNameFromWebsite } from '@/lib/slackChannelName';
import { canonicalizeAssignmentRole } from '@/lib/assignmentRoles';

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
const CREATIVE_BOOST_SERVICE_CODE = 'CREATIVE_BOOST';

interface TeamMember {
  colleague_id: string;
  role: string;
  cost_model: CostModel | 'per_credit';
  monthly_cost: number;
  hourly_cost: number;
  percentage_of_revenue: number;
  reward_per_credit: number;
  // Marks this row as auto-proposed from a concrete service.
  _serviceIndex?: number;
}

interface ConvertLeadDraftData {
  formData: ConvertFormData;
  teamMembers: TeamMember[];
  successFeeEnabled: boolean;
  successFeePercent: number;
  successFeeMonths: number;
  savedAt: number;
}

interface ConvertLeadDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function getConvertLeadDraftKey(leadId: string): string {
  return `convert-lead-draft-${leadId}`;
}

function saveConvertLeadDraft(key: string, data: ConvertLeadDraftData): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save convert lead draft:', error);
  }
}

function loadConvertLeadDraft(key: string): ConvertLeadDraftData | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as ConvertLeadDraftData;
  } catch {
    return null;
  }
}

function clearConvertLeadDraft(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // noop
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function invokeEdgeWithRetry<T>(
  functionName: string,
  options: Parameters<typeof invokeWithTimeout>[1],
  timeoutMs = 30000,
  attempts = 3,
): Promise<T> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const { data, error } = await invokeWithTimeout<T>(functionName, options, timeoutMs);
      if (error) {
        lastError = error;
      } else if (!data) {
        lastError = new Error(`Prázdná odpověď z ${functionName}`);
      } else {
        return data;
      }
    } catch (error) {
      lastError = error;
    }

    if (attempt < attempts) {
      await sleep(1000 * attempt);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Volání ${functionName} selhalo po ${attempts} pokusech`);
}

export function ConvertLeadDialog({ lead, open, onOpenChange, onSuccess }: ConvertLeadDialogProps) {
  const { colleagues, services } = useCRMData();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [successFeeEnabled, setSuccessFeeEnabled] = useState(true);
  const [successFeePercent, setSuccessFeePercent] = useState(10);
  const [successFeeMonths, setSuccessFeeMonths] = useState(1);
  const [isConverting, setIsConverting] = useState(false);
  const [restoredDraftAt, setRestoredDraftAt] = useState<number | null>(null);

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
      notice_period_months: 1,
      engagement_notes: '',
    },
  });

  const safePotentialServices = useMemo(
    () => (Array.isArray(lead?.potential_services)
      ? lead.potential_services.filter((service) => Boolean(service))
      : []),
    [lead?.potential_services]
  );
  const safeOnboardingSignatories = useMemo(
    () => (Array.isArray(lead?.onboarding_signatories)
      ? lead.onboarding_signatories.filter((contact) => Boolean(contact))
      : []),
    [lead?.onboarding_signatories]
  );
  const safeOnboardingProjectContacts = useMemo(
    () => (Array.isArray(lead?.onboarding_project_contacts)
      ? lead.onboarding_project_contacts.filter((contact) => Boolean(contact))
      : []),
    [lead?.onboarding_project_contacts]
  );

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
      setSuccessFeeEnabled(true);
      setSuccessFeePercent(10);
      setSuccessFeeMonths(1);
      const autoEngagementName = buildFreeloProjectName(lead.website || '', lead.company_name);

      const defaultFormValues: ConvertFormData = {
        brand_name: lead.company_name,
        website: lead.website || '',
        industry: lead.industry || '',
        tier: 'standard',
        acquisition_channel: lead.source === 'other' ? (lead.source_custom || 'Jiný') : lead.source,
        pinned_notes: '',
        client_notes: '',
        engagement_name: autoEngagementName,
        start_date: lead.onboarding_start_date
          ? toDateOnlyString(new Date(lead.onboarding_start_date))
          : lead.contract_signed_at
            ? toDateOnlyString(new Date(lead.contract_signed_at))
            : toDateOnlyString(new Date()),
        end_date: '',
        notice_period_months: 1,
        engagement_notes: lead.summary,
      };

      const suggestedTeam: TeamMember[] = [];
      for (const [serviceIndex, leadService] of safePotentialServices.entries()) {
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
          const isPerCreditReward = role.reward_type === 'per_credit';

          suggestedTeam.push({
            colleague_id: '',
            role: role.role,
            cost_model: isPerCreditReward ? 'per_credit' : costModel,
            monthly_cost: monthlyCost,
            hourly_cost: role.reward_type === 'hourly' ? role.reward : 0,
            percentage_of_revenue: 0,
            reward_per_credit: isPerCreditReward ? role.reward : 0,
            _serviceIndex: serviceIndex,
          });
        }
      }

      const draftKey = getConvertLeadDraftKey(lead.id);
      const savedDraft = loadConvertLeadDraft(draftKey);

      if (savedDraft) {
        form.reset({
          ...defaultFormValues,
          ...savedDraft.formData,
          engagement_name: autoEngagementName,
        });
        setTeamMembers(Array.isArray(savedDraft.teamMembers) ? savedDraft.teamMembers : suggestedTeam);
        setSuccessFeeEnabled(savedDraft.successFeeEnabled === true);
        setSuccessFeePercent(
          Number.isFinite(savedDraft.successFeePercent)
            ? Math.min(100, Math.max(0, Number(savedDraft.successFeePercent)))
            : 10
        );
        setSuccessFeeMonths(1);
        setRestoredDraftAt(typeof savedDraft.savedAt === 'number' ? savedDraft.savedAt : null);
      } else {
        form.reset(defaultFormValues);
        setTeamMembers(suggestedTeam);
        setRestoredDraftAt(null);
      }
    }
  }, [lead, open, form, services, safePotentialServices]);

  const watchedBrandName = form.watch('brand_name');
  const watchedWebsite = form.watch('website');
  const watchedIndustry = form.watch('industry');
  const watchedTier = form.watch('tier');
  const watchedAcquisitionChannel = form.watch('acquisition_channel');
  const watchedPinnedNotes = form.watch('pinned_notes');
  const watchedClientNotes = form.watch('client_notes');
  const watchedEngagementName = form.watch('engagement_name');
  const watchedStartDate = form.watch('start_date');
  const watchedEndDate = form.watch('end_date');
  const watchedNoticePeriodMonths = form.watch('notice_period_months');
  const watchedEngagementNotes = form.watch('engagement_notes');

  useEffect(() => {
    if (!open || !lead?.id || isConverting) return;

    const draftKey = getConvertLeadDraftKey(lead.id);
    const timer = setTimeout(() => {
      const draftToSave: ConvertLeadDraftData = {
        formData: {
          brand_name: watchedBrandName || '',
          website: watchedWebsite || '',
          industry: watchedIndustry || '',
          tier: watchedTier || 'standard',
          acquisition_channel: watchedAcquisitionChannel || 'inbound',
          pinned_notes: watchedPinnedNotes || '',
          client_notes: watchedClientNotes || '',
          engagement_name: watchedEngagementName || '',
          start_date: watchedStartDate || '',
          end_date: watchedEndDate || '',
          notice_period_months: Number.isFinite(Number(watchedNoticePeriodMonths))
            ? Number(watchedNoticePeriodMonths)
            : 1,
          engagement_notes: watchedEngagementNotes || '',
        },
        teamMembers,
        successFeeEnabled,
        successFeePercent: Number.isFinite(successFeePercent) ? Math.min(100, Math.max(0, successFeePercent)) : 10,
        successFeeMonths: 1,
        savedAt: Date.now(),
      };

      saveConvertLeadDraft(draftKey, draftToSave);
    }, 500);

    return () => clearTimeout(timer);
  }, [
    open,
    lead?.id,
    isConverting,
    watchedBrandName,
    watchedWebsite,
    watchedIndustry,
    watchedTier,
    watchedAcquisitionChannel,
    watchedPinnedNotes,
    watchedClientNotes,
    watchedEngagementName,
    watchedStartDate,
    watchedEndDate,
    watchedNoticePeriodMonths,
    watchedEngagementNotes,
    teamMembers,
    successFeeEnabled,
    successFeePercent,
    successFeeMonths,
  ]);

  useEffect(() => {
    if (!open || !lead) return;
    const autoEngagementName = buildFreeloProjectName(watchedWebsite || lead.website || '', lead.company_name);
    const currentEngagementName = form.getValues('engagement_name');
    if (currentEngagementName !== autoEngagementName) {
      form.setValue('engagement_name', autoEngagementName, { shouldDirty: true });
    }
  }, [open, lead, watchedWebsite, form]);

  const addTeamMember = () => {
    setTeamMembers(prev => [...prev, {
      colleague_id: '',
      role: '',
      cost_model: 'fixed_monthly' as CostModel,
      monthly_cost: 0,
      hourly_cost: 0,
      percentage_of_revenue: 0,
      reward_per_credit: 0,
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
      const hasMonthlyServices = safePotentialServices.some(s => s.billing_type === 'monthly');
      const engagementType = hasMonthlyServices ? 'retainer' : 'one_off';
      const monthlyFee = safePotentialServices
        .filter(s => s.billing_type === 'monthly')
        .reduce((sum, s) => sum + s.price, 0) || lead.estimated_price || 0;
      const oneOffFee = safePotentialServices
        .filter(s => s.billing_type === 'one_off')
        .reduce((sum, s) => sum + s.price, 0) || 0;
      const normalizedEngagementName = buildFreeloProjectName(data.website || lead.website || '', lead.company_name);
      const effectiveStartDate = lead.onboarding_start_date
        ? toDateOnlyString(new Date(lead.onboarding_start_date))
        : data.start_date;
      const hasCreativeBoostService = safePotentialServices.some((leadService) => {
        const catalogService = services.find((service) => service.id === leadService.service_id);
        return (
          catalogService?.code === CREATIVE_BOOST_SERVICE_CODE ||
          leadService.name?.toLowerCase().includes('creative boost')
        );
      });

      const invalidPerCreditMember = teamMembers.find((member) => {
        if (member.cost_model !== 'per_credit') return false;
        const canonicalRole = canonicalizeAssignmentRole(member.role || '');
        const roleEligible = canonicalRole === 'Graphic Designer' || canonicalRole === 'Video Editor';
        return !hasCreativeBoostService || !roleEligible || !Number.isFinite(member.reward_per_credit) || member.reward_per_credit <= 0;
      });

      if (invalidPerCreditMember) {
        toast.error('Pro odměnu za kredit vyberte roli Graphic Designer/Video Editor, nastavte částku > 0 a mějte v zakázce Creative Boost.');
        return;
      }

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
      for (const signatory of safeOnboardingSignatories) {
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
      for (const projectContact of safeOnboardingProjectContacts) {
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
      const servicesData = safePotentialServices.map(ls => ({
        service_id: ls.service_id,
        name: ls.name,
        price: ls.price,
        billing_type: ls.billing_type,
        currency: ls.currency,
        selected_tier: ls.selected_tier || null,
        intro_discount_percent: ls.intro_discount_percent ?? null,
        intro_discount_months: ls.intro_discount_months ?? null,
        creative_boost_credits: ls.creative_boost_credits ?? null,
        creative_boost_price_per_credit: ls.creative_boost_price_per_credit ?? null,
        creative_boost_graphic_reward: ls.creative_boost_graphic_reward ?? null,
        creative_boost_editor_reward: ls.creative_boost_editor_reward ?? null,
        intro_discount_start_date: ls.intro_discount_percent && ls.intro_discount_months
          ? toDateOnlyString(new Date())
          : null,
        creative_boost_fixed_billing: true,
        notes: '',
      }));

      // STEP 4: Prepare assignments data
      const assignmentsData = teamMembers
        .filter(m => m.colleague_id && m.role)
        .map(member => ({
          colleague_id: member.colleague_id,
          role: member.role,
          cost_model: member.cost_model === 'per_credit' ? 'fixed_monthly' : member.cost_model,
          hourly_cost: member.cost_model === 'hourly' ? member.hourly_cost : null,
          monthly_cost: member.cost_model === 'fixed_monthly' ? member.monthly_cost : null,
          percentage_of_revenue: member.cost_model === 'percentage' ? member.percentage_of_revenue : null,
          start_date: effectiveStartDate,
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
            start_date: effectiveStartDate,
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
            name: normalizedEngagementName,
            type: engagementType,
            billing_model: 'fixed_fee',
            currency: lead.currency,
            monthly_fee: monthlyFee,
            one_off_fee: oneOffFee,
            start_date: effectiveStartDate,
            end_date: data.end_date || null,
            notice_period_months: toNullableNumber(data.notice_period_months),
            offer_url: offerUrl || null,
            contract_url: lead.contract_url || null,
            signed_contract_url: lead.signed_contract_url || null,
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

      // STEP 5b: Ensure Creative Boost service settings + client month are initialized
      // RPC currently does not persist Creative Boost-specific fields from lead services.
      try {
        const cbLeadServices = safePotentialServices.filter((leadService) => {
          const catalogService = services.find((service) => service.id === leadService.service_id);
          return (
            catalogService?.code === CREATIVE_BOOST_SERVICE_CODE ||
            leadService.name?.toLowerCase().includes('creative boost')
          );
        });

        if (cbLeadServices.length > 0 && conversionResult.engagement_id && conversionResult.client_id) {
          const { data: createdEngagementServices, error: createdServicesError } = await supabase
            .from('engagement_services')
            .select('id, service_id, name')
            .eq('engagement_id', conversionResult.engagement_id)
            .eq('is_active', true);

          if (createdServicesError) throw createdServicesError;

          const startDate = effectiveStartDate ? new Date(effectiveStartDate) : new Date();
          const monthDate = Number.isNaN(startDate.getTime()) ? new Date() : startDate;
          const targetYear = monthDate.getFullYear();
          const targetMonth = monthDate.getMonth() + 1;

          for (const cbLeadService of cbLeadServices) {
            const matchedEngagementService = (createdEngagementServices || []).find((service) =>
              service.service_id === cbLeadService.service_id || service.name === cbLeadService.name,
            );
            if (!matchedEngagementService) continue;

            let credits = cbLeadService.creative_boost_credits && cbLeadService.creative_boost_credits > 0
              ? cbLeadService.creative_boost_credits
              : null;
            let pricePerCredit = cbLeadService.creative_boost_price_per_credit && cbLeadService.creative_boost_price_per_credit > 0
              ? cbLeadService.creative_boost_price_per_credit
              : null;

            if (!credits && pricePerCredit && cbLeadService.price > 0) {
              credits = Math.round(cbLeadService.price / pricePerCredit);
            }
            if (!pricePerCredit && credits && credits > 0 && cbLeadService.price > 0) {
              pricePerCredit = Math.round(cbLeadService.price / credits);
            }
            if (!credits && !pricePerCredit && cbLeadService.price > 0) {
              pricePerCredit = 400;
              credits = Math.round(cbLeadService.price / pricePerCredit);
            }

            if (!credits || !pricePerCredit) continue;

            const graphicPerCreditMember = teamMembers.find((member) =>
              member.cost_model === 'per_credit'
              && canonicalizeAssignmentRole(member.role || '') === 'Graphic Designer'
              && Number.isFinite(member.reward_per_credit)
              && member.reward_per_credit > 0
            );
            const videoPerCreditMember = teamMembers.find((member) =>
              member.cost_model === 'per_credit'
              && canonicalizeAssignmentRole(member.role || '') === 'Video Editor'
              && Number.isFinite(member.reward_per_credit)
              && member.reward_per_credit > 0
            );

            const { error: updateServiceError } = await supabase
              .from('engagement_services')
              .update({
                creative_boost_min_credits: credits,
                creative_boost_max_credits: credits,
                creative_boost_price_per_credit: pricePerCredit,
                creative_boost_reward_per_credit_banner:
                  graphicPerCreditMember?.reward_per_credit
                  ?? cbLeadService.creative_boost_graphic_reward
                  ?? 150,
                creative_boost_reward_per_credit_video:
                  videoPerCreditMember?.reward_per_credit
                  ?? cbLeadService.creative_boost_editor_reward
                  ?? 100,
                creative_boost_fixed_billing: true,
              })
              .eq('id', matchedEngagementService.id);

            if (updateServiceError) throw updateServiceError;

            const { error: upsertMonthError } = await supabase
              .from('creative_boost_client_months')
              .upsert({
                client_id: conversionResult.client_id,
                year: targetYear,
                month: targetMonth,
                min_credits: credits,
                max_credits: credits,
                price_per_credit: pricePerCredit,
                status: 'active',
                engagement_id: conversionResult.engagement_id,
                engagement_service_id: matchedEngagementService.id,
              }, { onConflict: 'client_id,year,month' });

            if (upsertMonthError) throw upsertMonthError;
          }
        }
      } catch (cbInitErr) {
        console.warn('Creative Boost initialization failed after conversion (non-blocking):', cbInitErr);
        toast.warning('Zakázka vytvořena, ale Creative Boost měsíc se nepodařilo inicializovat automaticky.');
      }

      // STEP 6: Create integrations AFTER successful conversion (with retry)
      const clientId = conversionResult.client_id;
      const integrationFailures: string[] = [];

      try {
        const fakturoidResult = await invokeEdgeWithRetry<{
          success?: boolean;
          error?: string;
        }>('fakturoid-create-subject', {
          body: {
            client_id: clientId,
          },
        }, 45000, 3);

        if (!fakturoidResult?.success) {
          throw new Error(fakturoidResult?.error || 'Neznámá chyba Fakturoid');
        }
      } catch (fakturoidErr) {
        integrationFailures.push('Fakturoid');
        console.warn('Fakturoid subject creation failed:', fakturoidErr);
      }

      // Save success fee to engagement
      if (successFeeEnabled && lead.owner_id && conversionResult.engagement_id) {
        const normalizedSuccessFeePercent = Number.isFinite(successFeePercent)
          ? Math.min(100, Math.max(0, successFeePercent))
          : 10;
        const normalizedSuccessFeeMonths = 1;

        const { error: successFeeError } = await supabase.from('engagements').update({
          success_fee_colleague_id: lead.owner_id,
          success_fee_percent: normalizedSuccessFeePercent,
          success_fee_months: normalizedSuccessFeeMonths,
        }).eq('id', conversionResult.engagement_id);

        if (successFeeError) {
          console.warn('Success fee save failed (non-blocking):', successFeeError);
          toast.warning('Zakázka vytvořena, ale success fee se nepodařilo uložit.');
        }
      }

      // STEP 7: Create Freelo project (with retry)
      const websiteName = form.getValues('website') || lead.website || '';
      const clientNameFallback = form.getValues('brand_name') || lead.company_name;
      const freeloProjectName = buildFreeloProjectName(websiteName, clientNameFallback);
      const defaultEmails = ['danny@socials.cz', 'otas@socials.cz', 'david.hala@socials.cz'];
      const teamEmails = teamMembers
        .map(m => colleagues.find(c => c.id === m.colleague_id)?.email)
        .filter(Boolean) as string[];
      const allEmails = [...new Set([...defaultEmails, ...teamEmails])];

      try {
        const freeloResult = await invokeEdgeWithRetry<{
          success?: boolean;
          project_url?: string;
          error?: string;
        }>('create-freelo-project', {
          body: {
            project_name: freeloProjectName,
            currency: lead.currency || 'CZK',
            team_emails: allEmails,
          },
        }, 45000, 3);

        if (!freeloResult?.success) {
          throw new Error(freeloResult?.error || 'Neznámá chyba Freelo');
        } else if (freeloResult.project_url && conversionResult.engagement_id) {
          const { error: freeloLinkError } = await supabase
            .from('engagements')
            .update({ freelo_url: freeloResult.project_url })
            .eq('id', conversionResult.engagement_id);
          if (freeloLinkError) throw freeloLinkError;
        }
      } catch (err) {
        integrationFailures.push('Freelo');
        console.warn('Freelo project creation failed:', err);
      }

      // STEP 7b: Create Slack channel (with retry)
      try {
        const channelName = buildSlackChannelNameFromWebsite(websiteName, lead.company_name || data.brand_name);
        const slackResult = await invokeEdgeWithRetry<{
          success?: boolean;
          channel_name?: string;
          error?: string;
        }>('create-slack-channel', {
          body: {
            channel_name: channelName,
            team_emails: allEmails,
          },
        }, 45000, 3);

        if (!slackResult?.success) {
          throw new Error(slackResult?.error || 'Neznámá chyba Slack');
        } else if (slackResult.channel_name && conversionResult.engagement_id) {
          const { error: slackLinkError } = await supabase
            .from('engagements')
            .update({ slack_channel_name: slackResult.channel_name } as any)
            .eq('id', conversionResult.engagement_id);
          if (slackLinkError) throw slackLinkError;
        }
      } catch (err) {
        integrationFailures.push('Slack');
        console.warn('Slack channel creation failed:', err);
      }

      if (integrationFailures.length > 0) {
        const failedParts = integrationFailures.join(', ');
        toast.error(`Zakázka vytvořena, ale nepodařilo se dokončit integrace: ${failedParts}. Opravte prosím integrace v detailu klienta/zakázky.`);
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

      clearConvertLeadDraft(getConvertLeadDraftKey(lead.id));
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
  const getAutoRoleForColleague = (colleagueId: string): string => {
    const colleague = activeColleagues.find((item) => item.id === colleagueId);
    return (colleague?.position || '').trim();
  };

  // Calculate service totals for display
  const monthlyTotal = safePotentialServices
    .filter(s => s.billing_type === 'monthly')
    .reduce((sum, s) => sum + s.price, 0);
  const oneOffTotal = safePotentialServices
    .filter(s => s.billing_type === 'one_off')
    .reduce((sum, s) => sum + s.price, 0);
  const currency = lead.currency || 'CZK';

  // Check if lead has at least one service
  const hasServices = safePotentialServices.length > 0;
  const offerUrl = getLeadOfferUrl(lead);
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
    (safeOnboardingSignatories.filter(s => s.email && s.email !== lead.contact_email).length || 0) +
    (safeOnboardingProjectContacts.filter(pc => pc.email && pc.email !== lead.contact_email &&
      !safeOnboardingSignatories.some(s => s.email === pc.email)).length || 0);

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
              {offerUrl ? (
                <a
                  href={offerUrl}
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

              {safePotentialServices.length > 0 ? (
                <div className="p-4 rounded-lg bg-muted/30 border space-y-2">
                  {safePotentialServices.map((service, idx) => (
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

                {safeOnboardingSignatories.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Podpisující osoby (rozhodovatelé)</p>
                    {safeOnboardingSignatories
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

                {safeOnboardingProjectContacts.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Projektové kontakty</p>
                    {safeOnboardingProjectContacts
                      .filter(pc => pc.email &&
                        pc.email !== lead.contact_email &&
                        !safeOnboardingSignatories.some(s => s.email === pc.email))
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
              {restoredDraftAt && (
                <p className="text-xs text-emerald-600">
                  Obnoven rozpracovaný draft převodu ({new Date(restoredDraftAt).toLocaleString('cs-CZ')}).
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="engagement_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Název zakázky *</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly />
                      </FormControl>
                      <FormDescription>
                        Název se vždy generuje automaticky podle URL webu klienta.
                      </FormDescription>
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
                        Převod používá datum z onboarding formuláře. Pokud tam není vyplněné, použije se hodnota z tohoto pole.
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
                <p className="text-sm font-medium">1 měsíc</p>
                <p className="text-xs text-muted-foreground mt-1">Default pro nové zakázky</p>
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
                {safePotentialServices.length > 0 && (
                  <li>
                    • {safePotentialServices.length} {safePotentialServices.length === 1 ? 'služba' : safePotentialServices.length < 5 ? 'služby' : 'služeb'}
                    {monthlyTotal > 0 && ` (${monthlyTotal.toLocaleString('cs-CZ')} ${currency}/měsíc`}
                    {monthlyTotal > 0 && oneOffTotal > 0 && ' + '}
                    {oneOffTotal > 0 && `${oneOffTotal.toLocaleString('cs-CZ')} ${currency} jednorázově`}
                    {monthlyTotal > 0 || oneOffTotal > 0 ? ')' : ''}
                  </li>
                )}
              </ul>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 flex items-center gap-1.5">
                ℹ️ Při převodu se automaticky vytvoří <strong>Freelo projekt</strong> a <strong>Slack kanál</strong>. Přiřazení kolegové budou pozváni do obou platforem.
              </p>
            </div>

            {/* Success Fee Section */}
            <div className="space-y-3 p-4 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  🏆 Success fee za uzavření klienta
                </h4>
                <Checkbox
                  checked={successFeeEnabled}
                  onCheckedChange={(checked) => setSuccessFeeEnabled(checked === true)}
                />
              </div>
              {successFeeEnabled && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Kolega:</span>
                    <span className="font-medium text-foreground">
                      {colleagues.find(c => c.id === lead.owner_id)?.full_name || 'Nepřiřazeno'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Procento z MRR</Label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          value={successFeePercent}
                          onChange={(e) => setSuccessFeePercent(Number(e.target.value))}
                          min={0}
                          max={100}
                          className="h-8 text-sm"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                  {monthlyTotal > 0 && (
                    <p className="text-xs text-muted-foreground">
                      = {Math.round(monthlyTotal * successFeePercent / 100).toLocaleString('cs-CZ')} {currency}/měsíc po dobu 1 měsíce
                    </p>
                  )}
                </div>
              )}
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
                      onValueChange={(v) => {
                        const previousAutoRole = member.colleague_id ? getAutoRoleForColleague(member.colleague_id) : '';
                        const nextAutoRole = getAutoRoleForColleague(v);
                        const shouldReplaceRole = !member.role || (previousAutoRole !== '' && member.role === previousAutoRole);

                        setTeamMembers((prev) => prev.map((currentMember, currentIndex) => {
                          if (currentIndex !== index) return currentMember;
                          return {
                            ...currentMember,
                            colleague_id: v,
                            role: shouldReplaceRole && nextAutoRole ? nextAutoRole : currentMember.role,
                          };
                        }));
                      }}
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
                        <SelectItem value="per_credit">Odměna za kredit (Creative Boost)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      {watchCostModel(index) === 'hourly' ? 'Hodinová sazba' :
                       watchCostModel(index) === 'per_credit' ? 'Odměna za kredit' :
                       watchCostModel(index) === 'percentage' ? '% z revenue' : 'Měsíční náklad'}
                    </label>
                    <Input
                      className="mt-1"
                      type="number"
                      value={
                        watchCostModel(index) === 'hourly' ? (member.hourly_cost || '') :
                        watchCostModel(index) === 'per_credit' ? (member.reward_per_credit || '') :
                        watchCostModel(index) === 'percentage' ? (member.percentage_of_revenue || '') :
                        (member.monthly_cost || '')
                      }
                      onChange={(e) => {
                        const field = watchCostModel(index) === 'hourly' ? 'hourly_cost' :
                                      watchCostModel(index) === 'per_credit' ? 'reward_per_credit' :
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
