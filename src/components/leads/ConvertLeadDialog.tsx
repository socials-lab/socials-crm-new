import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, FileText, ExternalLink, AlertTriangle, Sparkles, Package, Building2, User, Mail, Phone, Globe, Hash, Calendar, TrendingUp, Percent, ClipboardCheck, ClipboardX, Check } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
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
import { enrichServiceWithDemoRewards } from '@/utils/serviceRewardDemoData';
import type { Lead, CostModel, ClientTier, BillingModel, LeadSource, LeadService, ServiceRewardTierConfig } from '@/types/crm';
import { getOffersByLeadId } from '@/data/publicOffersMockData';
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
  /** Links this member to a specific service from the offer */
  _serviceIndex?: number;
}

/** Local editable service from the lead's offer */
interface OfferServiceEntry {
  service_id: string;
  name: string;
  selected_tier: string | null;
  price: number;
  original_price: number;
  currency: string;
  billing_type: 'monthly' | 'one_off';
  discount_type: 'none' | 'permanent' | 'intro';
  discount_percent: number;
  intro_months: number;
  is_creative_boost?: boolean;
  cb_credits?: number | null;
  cb_price_per_credit?: number | null;
}

interface ConvertLeadDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ConvertLeadDialog({ lead, open, onOpenChange, onSuccess }: ConvertLeadDialogProps) {
  const { markLeadAsConverted } = useLeadsData();
  const { addClient, addContact, addEngagement, addEngagementService, addAssignment, colleagues, services } = useCRMData();
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [offerServices, setOfferServices] = useState<OfferServiceEntry[]>([]);
  const [bundleDiscountPercent, setBundleDiscountPercent] = useState(0);
  const [bundleDiscountScope, setBundleDiscountScope] = useState<'core_only' | 'all_services'>('core_only');
  const [introDiscountPercent, setIntroDiscountPercent] = useState(0);
  const [introDiscountMonths, setIntroDiscountMonths] = useState(3);

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
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      notice_period_months: 1,
      primary_service_id: '',
      engagement_notes: '',
    },
  });

  // Reset form when lead changes — auto-populate services and team from offer
  useEffect(() => {
    if (lead && open) {
      // Parse lead's potential_services
      const leadServices: LeadService[] = Array.isArray(lead.potential_services) ? lead.potential_services : [];
      
      // Look up public offer for this lead to get offer-level discounts
      const publicOffers = getOffersByLeadId(lead.id);
      const latestOffer = publicOffers.length > 0 ? publicOffers[publicOffers.length - 1] : null;
      const offerBundlePercent = latestOffer?.monthly_discount_percent || 0;
      const offerDiscountScope = latestOffer?.discount_scope || 'core_only';
      const offerIntroPercent = latestOffer?.intro_discount_percent || 0;
      const offerIntroMonths = latestOffer?.intro_discount_months || 3;
      
      // Initialize global discount state from offer
      setBundleDiscountPercent(offerBundlePercent);
      setBundleDiscountScope(offerDiscountScope as 'core_only' | 'all_services');
      setIntroDiscountPercent(offerIntroPercent);
      setIntroDiscountMonths(offerIntroMonths);
      
      // Build editable offer services — apply offer-level discounts to monthly services
      const offerSvcs: OfferServiceEntry[] = leadServices.map(ls => {
        // Per-service discount takes precedence, fallback to offer-level
        const hasPerServiceDiscount = ls.intro_discount_percent && ls.intro_discount_percent > 0;
        
        // Determine discount type and values
        let discountType: 'none' | 'permanent' | 'intro' = 'none';
        let discountPercent = 0;
        let introMonthsVal = 3;
        
        if (hasPerServiceDiscount) {
          discountType = 'intro';
          discountPercent = ls.intro_discount_percent || 0;
          introMonthsVal = ls.intro_discount_months || 3;
        } else if (offerBundlePercent > 0 && (ls.billing_type || 'monthly') === 'monthly') {
          // Offer has a permanent bundle discount
          discountType = 'permanent';
          discountPercent = offerBundlePercent;
        } else if (offerIntroPercent > 0 && (ls.billing_type || 'monthly') === 'monthly') {
          discountType = 'intro';
          discountPercent = offerIntroPercent;
          introMonthsVal = offerIntroMonths;
        }
        
        // Detect Creative Boost
        const catalogSvc = services.find(s => s.id === ls.service_id);
        const isCB = catalogSvc?.code === 'CREATIVE_BOOST';
        const cbCredits = (ls as any).creative_boost_credits || (isCB ? 30 : null);
        const cbPricePerCredit = (ls as any).creative_boost_price_per_credit || (isCB ? 400 : null);
        
        // For CB, price = credits × price_per_credit
        const effectivePrice = isCB && cbCredits && cbPricePerCredit
          ? cbCredits * cbPricePerCredit
          : (ls.price || 0);
        
        return {
          service_id: ls.service_id,
          name: ls.name,
          selected_tier: ls.selected_tier,
          price: effectivePrice,
          original_price: effectivePrice,
          currency: ls.currency || lead.currency || 'CZK',
          billing_type: ls.billing_type || 'monthly',
          discount_type: discountType,
          discount_percent: discountPercent,
          intro_months: introMonthsVal,
          is_creative_boost: isCB,
          cb_credits: cbCredits,
          cb_price_per_credit: cbPricePerCredit,
        };
      });
      setOfferServices(offerSvcs);

      // Calculate monthly_fee from offer services
      const monthlyTotal = offerSvcs
        .filter(s => s.billing_type === 'monthly')
        .reduce((sum, s) => sum + s.price, 0);
      const oneOffTotal = offerSvcs
        .filter(s => s.billing_type === 'one_off')
        .reduce((sum, s) => sum + s.price, 0);

      // Auto-suggest team members from reward configs
      const suggestedTeam: TeamMember[] = [];
      offerSvcs.forEach((offerSvc, svcIndex) => {
        // Find the catalog service to get reward_config
        const catalogService = services.find(s => s.id === offerSvc.service_id);
        if (!catalogService) return;
        
        const enriched = enrichServiceWithDemoRewards(catalogService);
        const rewardConfig = enriched.reward_config;
        
        if (!rewardConfig || rewardConfig.length === 0) return;
        
        // Match tier to get roles
        const tierLower = offerSvc.selected_tier?.toLowerCase();
        const tierMatch = tierLower
          ? rewardConfig.find(rc => rc.tier?.toLowerCase() === tierLower)
          : rewardConfig.find(rc => !rc.tier) || rewardConfig[0];
        
        if (tierMatch && tierMatch.roles.length > 0) {
          tierMatch.roles.forEach(role => {
            const costModel: CostModel = role.reward_type === 'hourly' ? 'hourly' : 'fixed_monthly';
            suggestedTeam.push({
              colleague_id: '',
              role: role.role,
              cost_model: costModel,
              monthly_cost: costModel === 'fixed_monthly' ? role.reward : 0,
              hourly_cost: costModel === 'hourly' ? role.reward : 0,
              percentage_of_revenue: 0,
              _serviceIndex: svcIndex,
            });
          });
        }
      });
      setTeamMembers(suggestedTeam);

      // Check if onboarding form was completed — use billing data from lead
      const formCompleted = !!lead.onboarding_form_completed_at;

      form.reset({
        client_name: lead.company_name,
        brand_name: lead.company_name,
        ico: lead.ico,
        dic: lead.dic || '',
        website: lead.website || '',
        industry: lead.industry || '',
        country: 'Czech Republic',
        tier: 'standard',
        acquisition_channel: lead.source === 'other' ? (lead.source_custom || 'Jiný') : lead.source,
        pinned_notes: '',
        client_notes: '',
        billing_street: lead.billing_street || '',
        billing_city: lead.billing_city || '',
        billing_zip: lead.billing_zip || '',
        billing_country: lead.billing_country || 'Czech Republic',
        billing_email: lead.billing_email || lead.contact_email || '',
        contact_name: lead.contact_name,
        contact_position: lead.contact_position || '',
        contact_email: lead.contact_email || '',
        contact_phone: lead.contact_phone || '',
        contact_is_primary: true,
        contact_is_decision_maker: true,
        contact_notes: '',
        engagement_name: lead.website 
          ? lead.website.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').replace(/^./, c => c.toUpperCase())
          : lead.company_name,
        engagement_type: lead.offer_type,
        billing_model: 'fixed_fee',
        currency: lead.currency,
        monthly_fee: monthlyTotal || (lead.offer_type === 'retainer' ? lead.estimated_price : 0),
        one_off_fee: oneOffTotal || (lead.offer_type === 'one_off' ? lead.estimated_price : 0),
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        notice_period_months: 1,
        primary_service_id: '',
        engagement_notes: lead.summary,
      });
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
    if (!lead) return;

    try {
      // 1. Create Client
      const newClient = await addClient({
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
        created_by: user?.id || null,
      });

      // 2. Create ClientContact
      const newContact = await addContact({
        client_id: newClient.id,
        name: data.contact_name,
        position: data.contact_position || null,
        email: data.contact_email || null,
        phone: data.contact_phone || null,
        is_primary: data.contact_is_primary,
        is_decision_maker: data.contact_is_decision_maker,
        notes: data.contact_notes || '',
      });

      // 3. Create Engagement — calculate fees from services
      const calculatedMonthlyFee = offerServices
        .filter(s => s.billing_type === 'monthly')
        .reduce((sum, s) => sum + s.price, 0);
      const calculatedOneOffFee = offerServices
        .filter(s => s.billing_type === 'one_off')
        .reduce((sum, s) => sum + s.price, 0);

      const newEngagement = await addEngagement({
        client_id: newClient.id,
        contact_person_id: newContact.id,
        name: data.engagement_name,
        type: data.engagement_type,
        billing_model: data.billing_model as BillingModel,
        currency: data.currency,
        monthly_fee: calculatedMonthlyFee || data.monthly_fee,
        one_off_fee: calculatedOneOffFee || data.one_off_fee,
        status: 'active',
        start_date: data.start_date,
        end_date: data.end_date || null,
        notice_period_months: data.notice_period_months || null,
        freelo_url: null,
        platforms: [],
        managed_countries: [],
        notes: data.engagement_notes || '',
        offer_url: lead.offer_url || null,
        contract_url: lead.contract_url || null,
        pinned_notes: null,
      });

      // 4. Create Engagement Services from offer
      const createdServiceIds: (string | null)[] = [];
      for (const offerSvc of offerServices) {
        try {
          const created = await addEngagementService({
            engagement_id: newEngagement.id,
            service_id: offerSvc.service_id || null,
            name: offerSvc.name,
            price: offerSvc.price,
            currency: offerSvc.currency,
            billing_type: offerSvc.billing_type,
            selected_tier: offerSvc.selected_tier as any || null,
            is_active: true,
            notes: '',
            invoicing_status: 'not_applicable',
            invoiced_at: null,
            invoice_id: null,
            invoiced_in_period: null,
            creative_boost_min_credits: offerSvc.is_creative_boost ? (offerSvc.cb_credits || null) : null,
            creative_boost_max_credits: offerSvc.is_creative_boost ? (offerSvc.cb_credits || null) : null,
            creative_boost_price_per_credit: offerSvc.is_creative_boost ? (offerSvc.cb_price_per_credit || null) : null,
            creative_boost_fixed_billing: true,
            upsold_by_id: null,
            upsell_commission_percent: null,
            effective_from: null,
            intro_discount_percent: offerSvc.discount_type !== 'none' ? offerSvc.discount_percent : null,
            intro_discount_months: offerSvc.discount_type === 'intro' ? offerSvc.intro_months : null,
            intro_discount_start_date: offerSvc.discount_type !== 'none' && offerSvc.discount_percent > 0
              ? new Date().toISOString().split('T')[0]
              : null,
          });
          createdServiceIds.push(created.id);
        } catch (e) {
          console.error('Error creating engagement service:', e);
          createdServiceIds.push(null);
        }
      }

      // 5. Create Assignments for team members, linking to engagement_service where possible
      for (const member of teamMembers.filter(m => m.colleague_id && m.role)) {
        const engagementServiceId = member._serviceIndex != null 
          ? createdServiceIds[member._serviceIndex] || null
          : null;
        
        await addAssignment({
          engagement_id: newEngagement.id,
          engagement_service_id: engagementServiceId,
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

      // 6. Mark lead as converted
      await markLeadAsConverted(lead.id, newClient.id, newEngagement.id);

      toast.success('Lead byl úspěšně převeden na zakázku');
      onSuccess();
    } catch (error) {
      console.error('Error converting lead:', error);
      toast.error('Chyba při převodu leadu');
    }
  };

  const handleSubmit = async (data: ConvertFormData) => {
    if (!lead) return;
    await executeConversion(data);
  };

  if (!lead) return null;

  const watchCostModel = (index: number) => teamMembers[index]?.cost_model || 'fixed_monthly';

  const tierLabel = (tier: string | null) => {
    if (!tier) return null;
    const labels: Record<string, string> = { growth: 'GROWTH', pro: 'PRO', elite: 'ELITE' };
    return labels[tier] || tier.toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Převést lead na zakázku</DialogTitle>
          <DialogDescription>
            Vytvořte nového klienta a zakázku z leadu {lead.company_name}
          </DialogDescription>
        </DialogHeader>

        {/* ===== SUMMARY CARD: What's being converted ===== */}
        <div className="rounded-xl border-2 border-primary/20 bg-primary/[0.03] p-4 space-y-4">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            📋 Souhrn převodu
          </h4>

          {/* Company & Contact */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Firma</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  {lead.company_name}
                </div>
                {lead.ico && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    IČO: {lead.ico}
                  </div>
                )}
                {lead.dic && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    DIČ: {lead.dic}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Kontakt</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  {lead.contact_name}
                  {lead.contact_position && <span className="text-xs text-muted-foreground font-normal">({lead.contact_position})</span>}
                </div>
                {lead.contact_email && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {lead.contact_email}
                  </div>
                )}
                {lead.contact_phone && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {lead.contact_phone}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Services summary (read-only) in header */}
          {offerServices.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Služby z nabídky</p>
              <p className="text-xs text-muted-foreground">
                {offerServices.length} {offerServices.length === 1 ? 'služba' : offerServices.length < 5 ? 'služby' : 'služeb'} · editace cen a slev v sekci 4. Zakázka
              </p>
            </div>
          )}

          {/* Documents & Onboarding */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Nabídka</p>
              {lead.offer_url ? (
                <a href={lead.offer_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <FileText className="h-3.5 w-3.5" />
                  Otevřít nabídku
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">Nebyla vytvořena</span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Smlouva</p>
              {lead.contract_url ? (
                <a href={lead.contract_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <FileText className="h-3.5 w-3.5" />
                  Otevřít smlouvu
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">Nebyla podepsána</span>
              )}
              {lead.contract_signed_at && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 mt-1">
                  <Check className="h-3 w-3" />
                  Podepsáno {new Date(lead.contract_signed_at).toLocaleDateString('cs-CZ')}
                </div>
              )}
              <div className="mt-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Podepisující</p>
                <p className="text-xs mt-0.5">
                  {lead.contact_name}
                  {lead.contact_email && <span className="text-muted-foreground"> · {lead.contact_email}</span>}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Onboarding formulář</p>
              {lead.onboarding_form_completed_at ? (
                <div className="flex items-center gap-1.5 text-sm text-emerald-600">
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  <span className="font-medium">Vyplněn</span>
                  <span className="text-[10px] text-muted-foreground">
                    ({new Date(lead.onboarding_form_completed_at).toLocaleDateString('cs-CZ')})
                  </span>
                </div>
              ) : lead.onboarding_form_sent_at ? (
                <div className="flex items-center gap-1.5 text-sm text-amber-600">
                  <ClipboardX className="h-3.5 w-3.5" />
                  <span className="font-medium">Čeká na vyplnění</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Nebyl odeslán</span>
              )}
            </div>
          </div>

          {/* Billing data from onboarding form */}
          {lead.onboarding_form_completed_at && (lead.billing_street || lead.billing_city || lead.billing_email || lead.dic) && (
            <div className="rounded-lg border border-emerald-300/40 bg-emerald-500/5 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Fakturační údaje z onboarding formuláře</span>
              </div>
              <div className="grid gap-1 sm:grid-cols-2 text-xs">
                {lead.dic && (
                  <div><span className="text-muted-foreground">DIČ:</span> {lead.dic}</div>
                )}
                {lead.billing_email && (
                  <div><span className="text-muted-foreground">Email:</span> {lead.billing_email}</div>
                )}
                {lead.billing_street && (
                  <div><span className="text-muted-foreground">Ulice:</span> {lead.billing_street}</div>
                )}
                {lead.billing_city && (
                  <div><span className="text-muted-foreground">Město:</span> {lead.billing_city} {lead.billing_zip}</div>
                )}
                {lead.billing_country && (
                  <div><span className="text-muted-foreground">Země:</span> {lead.billing_country}</div>
                )}
              </div>
              <p className="text-[10px] text-emerald-600/80">
                ↓ Tyto údaje jsou předvyplněny ve formuláři níže.
              </p>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground">
            Tyto údaje budou automaticky přeneseny do nové zakázky. Níže můžete detaily upravit.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            
            {/* ── SECTION 1: Klient ── */}
            <div className="rounded-lg border bg-card p-4 space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">1</div>
                <div>
                  <h4 className="font-semibold text-sm">Klient</h4>
                  <p className="text-xs text-muted-foreground">Základní údaje o firmě</p>
                </div>
              </div>
              
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
                      <FormLabel className="flex items-center gap-1.5">
                        DIČ
                        {lead.onboarding_form_completed_at && lead.dic && (
                          <span className="text-[9px] text-emerald-600 font-normal">(z formuláře)</span>
                        )}
                      </FormLabel>
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
            </div>

            {/* ── SECTION 2: Fakturace ── */}
            <div className="rounded-lg border bg-card p-4 space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">2</div>
                <div className="flex items-center gap-2">
                  <div>
                    <h4 className="font-semibold text-sm">Fakturační adresa</h4>
                    <p className="text-xs text-muted-foreground">Údaje pro fakturaci</p>
                  </div>
                  {lead.onboarding_form_completed_at && (lead.billing_street || lead.billing_city || lead.billing_email) && (
                    <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-600 gap-1">
                      <ClipboardCheck className="h-3 w-3" />
                      Z formuláře
                    </Badge>
                  )}
                </div>
              </div>
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

            {/* ── SECTION 3: Kontakt ── */}
            <div className="rounded-lg border bg-card p-4 space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">3</div>
                <div>
                  <h4 className="font-semibold text-sm">Kontaktní osoba</h4>
                  <p className="text-xs text-muted-foreground">Hlavní kontakt na klientovi</p>
                </div>
              </div>
              
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

            {/* ── SECTION 4: Zakázka ── */}
            <div className="rounded-lg border bg-card p-4 space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">4</div>
                <div>
                  <h4 className="font-semibold text-sm">Zakázka</h4>
                  <p className="text-xs text-muted-foreground">Parametry spolupráce a služby</p>
                </div>
              </div>
              
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

              {/* Editable services */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Služby a ceny (editovatelné)</p>
                <div className="rounded-lg border bg-background divide-y divide-border/50">
                  {offerServices.map((svc, idx) => {
                    const hasDiscount = svc.discount_type !== 'none' && svc.discount_percent > 0 && svc.billing_type === 'monthly';
                    const discountedPrice = hasDiscount 
                      ? Math.round(svc.price * (1 - svc.discount_percent / 100))
                      : svc.price;
                    return (
                      <div key={idx} className="px-3 py-2.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm">{svc.name}</span>
                            {svc.selected_tier && (
                              <Badge variant="outline" className="text-[10px] uppercase">{svc.selected_tier}</Badge>
                            )}
                            <Badge variant="secondary" className="text-[10px]">
                              {svc.billing_type === 'monthly' ? 'Měsíčně' : 'Jednorázově'}
                            </Badge>
                            {svc.is_creative_boost && (
                              <Badge variant="outline" className="text-[10px]">CB</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              min={0}
                              value={svc.price}
                              onChange={(e) => {
                                const val = Math.max(0, Number(e.target.value));
                                setOfferServices(prev => prev.map((s, i) => i === idx ? { ...s, price: val } : s));
                              }}
                              className="w-28 h-7 text-sm text-right font-semibold tabular-nums"
                            />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {svc.currency}{svc.billing_type === 'monthly' ? '/měs' : ''}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => setOfferServices(prev => prev.filter((_, i) => i !== idx))}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        {svc.is_creative_boost && svc.cb_credits && svc.cb_price_per_credit && (
                          <p className="text-[10px] text-muted-foreground tabular-nums pl-1">
                            {svc.cb_credits} × {svc.cb_price_per_credit} Kč
                          </p>
                        )}
                        {/* Discount row — for monthly services */}
                        {svc.billing_type === 'monthly' && (
                          <div className="flex items-center gap-2 pl-1 flex-wrap">
                            <Percent className="h-3 w-3 text-amber-500 shrink-0" />
                            <Select
                              value={svc.discount_type}
                              onValueChange={(val: 'none' | 'permanent' | 'intro') => {
                                setOfferServices(prev => prev.map((s, i) => i === idx ? { ...s, discount_type: val } : s));
                              }}
                            >
                              <SelectTrigger className="h-6 w-[130px] text-[11px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none" className="text-xs">Bez slevy</SelectItem>
                                <SelectItem value="permanent" className="text-xs">Trvalá sleva</SelectItem>
                                <SelectItem value="intro" className="text-xs">Úvodní sleva</SelectItem>
                              </SelectContent>
                            </Select>
                            {svc.discount_type !== 'none' && (
                              <>
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={svc.discount_percent || ''}
                                  onChange={(e) => {
                                    const val = Math.min(100, Math.max(0, Number(e.target.value)));
                                    setOfferServices(prev => prev.map((s, i) => i === idx ? { ...s, discount_percent: val } : s));
                                  }}
                                  placeholder="0"
                                  className="w-14 h-6 text-xs text-right"
                                />
                                <span className="text-[11px] text-muted-foreground">%</span>
                              </>
                            )}
                            {svc.discount_type === 'intro' && (
                              <>
                                <span className="text-[11px] text-muted-foreground">na</span>
                                <Input
                                  type="number"
                                  min={1}
                                  max={24}
                                  value={svc.intro_months || ''}
                                  onChange={(e) => {
                                    const val = Math.min(24, Math.max(1, Number(e.target.value)));
                                    setOfferServices(prev => prev.map((s, i) => i === idx ? { ...s, intro_months: val } : s));
                                  }}
                                  placeholder="3"
                                  className="w-16 h-6 text-xs text-right"
                                />
                                <span className="text-[11px] text-muted-foreground">měs.</span>
                              </>
                            )}
                            {hasDiscount && (
                              <span className="text-[11px] font-medium text-amber-600 ml-auto tabular-nums">
                                → {discountedPrice.toLocaleString('cs-CZ')} {svc.currency}/měs
                                {svc.discount_type === 'permanent' && ' (trvale)'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {offerServices.length > 0 && (
                    <>
                      <div className="flex items-center justify-between px-3 py-2 bg-muted/50">
                        <span className="text-sm font-semibold">Celkem měsíčně</span>
                        <span className="text-sm font-bold tabular-nums text-primary">
                          {offerServices
                            .filter(s => s.billing_type === 'monthly')
                            .reduce((sum, s) => sum + s.price, 0)
                            .toLocaleString('cs-CZ')} {lead.currency}/měs
                        </span>
                      </div>
                      {offerServices.some(s => s.billing_type === 'one_off') && (
                        <div className="flex items-center justify-between px-3 py-2 bg-muted/50">
                          <span className="text-sm font-semibold">Celkem jednorázově</span>
                          <span className="text-sm font-bold tabular-nums">
                            {offerServices
                              .filter(s => s.billing_type === 'one_off')
                              .reduce((sum, s) => sum + s.price, 0)
                              .toLocaleString('cs-CZ')} {lead.currency}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                {/* Add service button */}
                <div className="flex items-center gap-2">
                  <Select
                    onValueChange={(serviceId) => {
                      const catalogSvc = services.find(s => s.id === serviceId);
                      if (!catalogSvc) return;
                      const newEntry: OfferServiceEntry = {
                        service_id: catalogSvc.id,
                        name: catalogSvc.name,
                        selected_tier: null,
                        price: catalogSvc.base_price || 0,
                        original_price: catalogSvc.base_price || 0,
                        currency: catalogSvc.currency || lead.currency || 'CZK',
                        billing_type: 'monthly',
                        discount_type: 'none',
                        discount_percent: 0,
                        intro_months: 3,
                      };
                      setOfferServices(prev => [...prev, newEntry]);
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="+ Přidat službu…" />
                    </SelectTrigger>
                    <SelectContent>
                      {services
                        .filter(s => s.is_active)
                        .sort((a, b) => (a.service_type === 'core' ? -1 : 1) - (b.service_type === 'core' ? -1 : 1))
                        .map(s => (
                          <SelectItem key={s.id} value={s.id} className="text-xs">
                            {s.name} {s.base_price ? `· ${s.base_price.toLocaleString('cs-CZ')} ${s.currency || 'CZK'}` : ''}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
              </div>


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

            {/* ── SECTION 5: Tým ── */}
            <div className="rounded-lg border bg-card p-4 space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">5</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    Tým na zakázce
                    {teamMembers.length > 0 && offerServices.length > 0 && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Sparkles className="h-3 w-3" />
                        Navrženo automaticky
                      </Badge>
                    )}
                  </h4>
                  <p className="text-xs text-muted-foreground">Přiřazení kolegů a jejich odměny</p>
                </div>
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

            {/* Margin warning */}
            {(() => {
              const monthlyFee = form.watch('monthly_fee') || 0;
              const totalTeamCost = teamMembers.reduce((sum, m) => {
                if (m.cost_model === 'fixed_monthly') return sum + (m.monthly_cost || 0);
                if (m.cost_model === 'hourly') return sum + (m.hourly_cost || 0) * 160 / 12;
                return sum;
              }, 0);
              const margin = monthlyFee > 0 ? ((monthlyFee - totalTeamCost) / monthlyFee) * 100 : 0;
              
              if (monthlyFee > 0 && totalTeamCost > 0) {
                return (
                  <div className={`p-3 rounded-lg border flex items-start gap-2 ${
                    margin >= 66 ? 'bg-green-500/10 border-green-500/30' :
                    margin >= 50 ? 'bg-yellow-500/10 border-yellow-500/30' :
                    'bg-red-500/10 border-red-500/30'
                  }`}>
                    {margin < 66 && <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${margin >= 50 ? 'text-yellow-600' : 'text-red-600'}`} />}
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Odhadovaná marže:</span>
                        <span className={`font-bold ${
                          margin >= 66 ? 'text-green-600' : margin >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {margin.toFixed(1)} %
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({monthlyFee.toLocaleString('cs-CZ')} – {totalTeamCost.toLocaleString('cs-CZ')} = {Math.round(monthlyFee - totalTeamCost).toLocaleString('cs-CZ')} Kč)
                        </span>
                      </div>
                      {margin < 66 && (
                        <p className="text-xs text-muted-foreground">
                          ⚠️ Minimální cílová marže je 66 %. Zvažte úpravu ceny nebo snížení interních nákladů.
                        </p>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

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
