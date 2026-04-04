import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, getDaysInMonth } from 'date-fns';
import { cs } from 'date-fns/locale';
import { CalendarIcon, Info, Plus, FileText, Check, ChevronsUpDown, Globe, Building2, Trash2, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { MANAGED_COUNTRIES, getCountryName, getCountryFlag } from '@/constants/countries';
import { Checkbox } from '@/components/ui/checkbox';
import { calculateExpansionPrice, getDefaultMultiplier, formatCZK } from '@/utils/pricingEngine';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useCRMData } from '@/hooks/useCRMData';
import { useModificationRequests } from '@/hooks/useModificationRequests';
import { useAuth } from '@/hooks/useAuth';
import type { ModificationRequestType, ServiceTier, ModificationRequestItem, ModificationProposedChanges, BulkEditProposedChanges } from '@/types/crm';
import { BulkEditStep } from '@/components/engagements/BulkEditStep';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { SERVICE_DETAILS } from '@/constants/serviceDetails';
import { getServiceDefaults } from '@/constants/serviceDefaults';
import { PricingImpactSection } from '@/components/engagements/PricingImpactSection';
import type { PricingSnapshot } from '@/utils/pricingEngine';
import { getServiceRewardRecommendation, getRewardsFromServiceConfig } from '@/constants/serviceRewards';

interface ProposeModificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRequest?: import('@/hooks/useModificationRequests').StoredModificationRequest | null;
}

const InfoTip = ({ text }: { text: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className="h-3.5 w-3.5 ml-1 inline-block text-muted-foreground cursor-help shrink-0" />
    </TooltipTrigger>
    <TooltipContent className="max-w-[300px] text-xs">{text}</TooltipContent>
  </Tooltip>
);

const REQUEST_TYPE_LABELS: Record<ModificationRequestType, string> = {
  expand_country: 'Přidání nové země',
  add_service: 'Přidání nové služby',
  update_service_price: 'Úprava služby (cena + odměny)',
  deactivate_service: 'Deaktivace služby',
  add_assignment: 'Přiřazení kolegy',
  update_assignment: 'Změna odměny kolegy',
  new_engagement: 'Nová zakázka',
  bulk_edit: 'Hromadná úprava zakázky',
};

const REQUEST_TYPE_DESCRIPTIONS: Record<ModificationRequestType, string> = {
  expand_country: 'Rozšíření stávající služby do další země (např. SK, DE) s multiplikátorem ceny',
  add_service: 'Přidání zcela nové služby z katalogu ke stávající zakázce',
  update_service_price: 'Změna měsíční ceny služby pro klienta a/nebo úprava odměn přiřazeným kolegům',
  deactivate_service: 'Ukončení poskytování služby v rámci zakázky od zvoleného data',
  add_assignment: 'Přiřazení nového kolegy k vybrané službě s definicí jeho odměny',
  update_assignment: 'Změna odměny přiřazeného kolegy',
  new_engagement: 'Nová zakázka pro stávajícího klienta — pod stejným nebo jiným SRO',
  bulk_edit: 'Úprava všech služeb, cen a odměn celé zakázky najednou — jeden souhrnný návrh pro klienta',
};

// Types visible in the dropdown (update_assignment is merged into update_service_price)
const VISIBLE_REQUEST_TYPES: ModificationRequestType[] = [
  'bulk_edit',
  'expand_country',
  'add_service',
  'update_service_price',
  'deactivate_service',
  'add_assignment',
  'new_engagement',
];

function getTierPrice(service: any, tier: string): number | null {
  const rawTierPricing = service?.tier_pricing;
  if (!rawTierPricing) return null;

  if (Array.isArray(rawTierPricing)) {
    const row = rawTierPricing.find((p: any) => p?.tier === tier);
    return row?.price ?? null;
  }

  // Legacy/alt shape: { growth: { price, ... }, pro: { ... }, elite: { ... } }
  if (typeof rawTierPricing === 'object') {
    const row = (rawTierPricing as Record<string, any>)[tier];
    if (row && typeof row === 'object') {
      return row.price ?? null;
    }
    return null;
  }

  console.error('Invalid tier_pricing format on service', {
    serviceId: service?.id,
    serviceCode: service?.code,
    tierPricingType: typeof rawTierPricing,
  });
  return null;
}

export function ProposeModificationDialog({ open, onOpenChange, editingRequest }: ProposeModificationDialogProps) {
  const { engagements, clients, services, colleagues, engagementServices, assignments, getEngagementServicesByEngagementId, getAssignmentsByEngagementId } = useCRMData();
  const { createRequest, updateRequest, isCreating, isUpdating } = useModificationRequests();
  const { user } = useAuth();
  const isEditMode = !!editingRequest;
  
  // Find colleague record for current user
  const currentUserColleague = colleagues.find(c => c.profile_id === user?.id);

  // Form state
  const [selectedEngagementId, setSelectedEngagementId] = useState<string>('');
  const [engagementComboOpen, setEngagementComboOpen] = useState(false);
  const [requestType, setRequestType] = useState<ModificationRequestType | ''>('');
  const [requestTypeConfirmed, setRequestTypeConfirmed] = useState(false);
  const [bulkEditChanges, setBulkEditChanges] = useState<BulkEditProposedChanges | null>(null);
  const [effectiveFrom, setEffectiveFrom] = useState<Date | undefined>(new Date());
  const [upsoldById, setUpsoldById] = useState<string>('none');
  const [note, setNote] = useState('');

  // Service-related fields
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState<number>(0);
  const [serviceCurrency, setServiceCurrency] = useState('CZK');
  const [serviceBillingType, setServiceBillingType] = useState<'monthly' | 'one_off'>('monthly');
  const [selectedTier, setSelectedTier] = useState<ServiceTier | 'none'>('none');

  // Creative Boost specific fields
  // Creative Boost specific fields
  const [cbMaxCredits, setCbMaxCredits] = useState<number>(30);
  const [cbPricePerCredit, setCbPricePerCredit] = useState<number>(400);
  const [cbColleagueReward, setCbColleagueReward] = useState<number>(150);
  const [cbEditorReward, setCbEditorReward] = useState<number>(100);

  // AI SEO specific fields
  const [aiSeoColleagueName, setAiSeoColleagueName] = useState<string>('Martin Tomčík');
  const [aiSeoHourlyRate, setAiSeoHourlyRate] = useState<number>(600);
  const [aiSeoHours, setAiSeoHours] = useState<number>(10);

  // For update_service_price (merged with update_assignment)
  const [selectedEngagementServiceId, setSelectedEngagementServiceId] = useState<string>('');
  const [newPrice, setNewPrice] = useState<number>(0);
  const lastAutoFilledServiceIdRef = useRef<string>('');
  // Editable assignments for the selected service (used in update_service_price)
  const [serviceAssignmentEdits, setServiceAssignmentEdits] = useState<Array<{
    assignment_id: string;
    colleague_name: string;
    role: string;
    cost_model: 'hourly' | 'fixed_monthly' | 'percentage';
    old_value: number;
    new_value: number;
  }>>([]);

  // Assignment-related fields
  const [selectedColleagueId, setSelectedColleagueId] = useState<string>('');
  const [roleOnEngagement, setRoleOnEngagement] = useState('');
  const [costModel, setCostModel] = useState<'hourly' | 'fixed_monthly' | 'percentage'>('fixed_monthly');
  const [hourlyCost, setHourlyCost] = useState<number>(0);
  const [monthlyCost, setMonthlyCost] = useState<number>(0);
  const [percentageOfRevenue, setPercentageOfRevenue] = useState<number>(0);
  const [assignmentServiceId, setAssignmentServiceId] = useState<string>('');

  // For update_assignment / remove_assignment
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');

  // Service description fields for client-facing offer
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceDeliverables, setServiceDeliverables] = useState('');

  // Pricing engine state
  const [pricingSnapshot, setPricingSnapshot] = useState<PricingSnapshot | null>(null);
  const [pricingInternalCost, setPricingInternalCost] = useState<number>(0);
  const [requiresAdminApproval, setRequiresAdminApproval] = useState(false);

  // Expand country state
  const [expandRefServiceId, setExpandRefServiceId] = useState<string>('');
  const [expandCountryCode, setExpandCountryCode] = useState<string>('');
  const [expandServiceName, setExpandServiceName] = useState<string>('');
  const [expandMultiplier, setExpandMultiplier] = useState<number>(0.5);
  const [expandFinalPrice, setExpandFinalPrice] = useState<number | null>(null);
  const [expandIsNewShop, setExpandIsNewShop] = useState(false);
  const [expandNewClientName, setExpandNewClientName] = useState('');
  const [expandNewClientBrand, setExpandNewClientBrand] = useState('');
  const [expandNewClientIco, setExpandNewClientIco] = useState('');
  const [expandNewClientDic, setExpandNewClientDic] = useState('');

  // New engagement state
  const [newEngIsDifferentSro, setNewEngIsDifferentSro] = useState(false);
  const [newEngClientName, setNewEngClientName] = useState('');
  const [newEngClientBrand, setNewEngClientBrand] = useState('');
  const [newEngName, setNewEngName] = useState('');
  const [newEngOnboardingEmail, setNewEngOnboardingEmail] = useState('');
  const [newEngServices, setNewEngServices] = useState<Array<{
    service_id: string | null;
    name: string;
    price: number;
    currency: string;
    billing_type: 'monthly' | 'one_off';
    selected_tier?: string | null;
    description?: string;
    deliverables?: string[];
    assignments?: Array<{
      colleague_id: string;
      colleague_name: string;
      role: string;
      cost_model: 'hourly' | 'fixed_monthly' | 'percentage';
      monthly_cost?: number;
      hourly_cost?: number;
      percentage_of_revenue?: number;
    }>;
  }>>([]);
  const [expandedNewEngServiceIdx, setExpandedNewEngServiceIdx] = useState<number | null>(null);

  // Bundled items for multi-item requests
  const [bundledItems, setBundledItems] = useState<ModificationRequestItem[]>([]);
  const [bundleDiscountPercent, setBundleDiscountPercent] = useState<number>(0);

  // Keep API surface explicit; drafts are persisted as DB records.
  const clearDraft = useCallback(() => {}, []);

  const CREATIVE_BOOST_CODE = 'CREATIVE_BOOST';
  const AI_SEO_CODE = 'AI_SEO';
  const selectedService = services.find(s => s.id === selectedServiceId);
  const isCreativeBoost = selectedService?.code === CREATIVE_BOOST_CODE;
  const isAiSeo = selectedService?.code === AI_SEO_CODE;
  const isCoreService = selectedService?.service_type === 'core' && !isCreativeBoost;

  // Get engagement-specific services and assignments
  const currentEngagementServices = selectedEngagementId 
    ? getEngagementServicesByEngagementId(selectedEngagementId)
    : [];
  const currentAssignments = selectedEngagementId
    ? getAssignmentsByEngagementId(selectedEngagementId)
    : [];

  // Detect Creative Boost in update mode
  const selectedUpdateEngService = currentEngagementServices.find(es => es.id === selectedEngagementServiceId);
  const selectedUpdateCatalogService = selectedUpdateEngService?.service_id 
    ? services.find(s => s.id === selectedUpdateEngService.service_id) 
    : null;
  const isUpdateCreativeBoost = selectedUpdateCatalogService?.code === CREATIVE_BOOST_CODE;

  // Calculate prorated amount
  const calculateProratedAmount = () => {
    if (!effectiveFrom) return null;
    
    // Get the effective monthly price
    const monthlyPrice = isCreativeBoost 
      ? cbMaxCredits * cbPricePerCredit 
      : servicePrice;
    
    if (monthlyPrice <= 0 || (!isCreativeBoost && serviceBillingType !== 'monthly')) return null;
    
    const daysInMonth = getDaysInMonth(effectiveFrom);
    const startDay = effectiveFrom.getDate();
    const remainingDays = daysInMonth - startDay + 1;
    const proratedAmount = (monthlyPrice / daysInMonth) * remainingDays;
    
    return {
      fullAmount: monthlyPrice,
      proratedAmount: Math.round(proratedAmount),
      remainingDays,
      daysInMonth,
    };
  };

  const prorationInfo = calculateProratedAmount();

  // Pre-fill from editingRequest when opening in edit mode
  useEffect(() => {
    if (open && editingRequest) {
      setSelectedEngagementId(editingRequest.engagement_id);
      setRequestType(editingRequest.request_type);
      setRequestTypeConfirmed(true);
      setEffectiveFrom(editingRequest.effective_from ? new Date(editingRequest.effective_from) : undefined);
      setUpsoldById(editingRequest.upsold_by_id || 'none');
      setNote(editingRequest.note || '');
      setPricingSnapshot(editingRequest.pricing_snapshot || null);
      
      // Pre-fill bundled items
      if (editingRequest.items && editingRequest.items.length > 0) {
        setBundledItems(editingRequest.items);
      }
      setBundleDiscountPercent((editingRequest as any).bundle_discount_percent || 0);

      const changes = editingRequest.proposed_changes as any;

      if (editingRequest.request_type === 'add_service') {
        setSelectedServiceId(changes.service_id || 'custom');
        setServiceName(changes.name || '');
        setServicePrice(changes.price || 0);
        setServiceCurrency(changes.currency || 'CZK');
        setServiceBillingType(changes.billing_type || 'monthly');
        setSelectedTier(changes.selected_tier || 'none');
        setServiceDescription(changes.description || '');
        setServiceDeliverables(changes.deliverables?.join('\n') || '');
        if (changes.creative_boost_max_credits) {
          setCbMaxCredits(changes.creative_boost_max_credits);
          setCbPricePerCredit(changes.creative_boost_price_per_credit || 400);
          setCbColleagueReward(changes.creative_boost_reward_per_credit || 150);
          setCbEditorReward(changes.creative_boost_editor_reward_per_credit || 100);
        }
      } else if (editingRequest.request_type === 'update_service_price') {
        setSelectedEngagementServiceId(changes.engagement_service_id || editingRequest.engagement_service_id || '');
        setNewPrice(changes.new_price || 0);
        if (changes.creative_boost_max_credits) {
          setCbMaxCredits(changes.creative_boost_max_credits);
          setCbPricePerCredit(changes.creative_boost_price_per_credit || 400);
          setCbColleagueReward(changes.creative_boost_reward_per_credit || 150);
          setCbEditorReward(changes.creative_boost_editor_reward_per_credit || 100);
        }
      } else if (editingRequest.request_type === 'deactivate_service') {
        setSelectedEngagementServiceId(changes.engagement_service_id || editingRequest.engagement_service_id || '');
      } else if (editingRequest.request_type === 'add_assignment') {
        setSelectedColleagueId(changes.colleague_id || '');
        setRoleOnEngagement(changes.role_on_engagement || '');
        setCostModel(changes.cost_model || 'fixed_monthly');
        setHourlyCost(changes.hourly_cost || 0);
        setMonthlyCost(changes.monthly_cost || 0);
        setPercentageOfRevenue(changes.percentage_of_revenue || 0);
      } else if (editingRequest.request_type === 'update_assignment') {
        setSelectedAssignmentId(changes.engagement_assignment_id || editingRequest.engagement_assignment_id || '');
        if (editingRequest.request_type === 'update_assignment') {
          setCostModel(changes.cost_model || 'fixed_monthly');
          setHourlyCost(changes.hourly_cost || 0);
          setMonthlyCost(changes.monthly_cost || 0);
          setPercentageOfRevenue(changes.percentage_of_revenue || 0);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingRequest?.id]);

  // Reset form when dialog closes (only when not in edit mode, or always on close)
  useEffect(() => {
    if (!open) {
      setSelectedEngagementId('');
      setRequestType('');
      setRequestTypeConfirmed(false);
      setEffectiveFrom(new Date());
      setUpsoldById('none');
      setNote('');
      setSelectedServiceId('');
      setServiceName('');
      setServicePrice(0);
      setServiceCurrency('CZK');
      setServiceBillingType('monthly');
      setSelectedTier('none');
      setCbMaxCredits(30);
      setCbPricePerCredit(400);
      setCbColleagueReward(150);
      setCbEditorReward(100);
      setAiSeoColleagueName('Martin Tomčík');
      setAiSeoHourlyRate(600);
      setAiSeoHours(10);
      setSelectedEngagementServiceId('');
      setServiceAssignmentEdits([]);
      setNewPrice(0);
      setSelectedColleagueId('');
      setRoleOnEngagement('');
      setCostModel('fixed_monthly');
      setHourlyCost(0);
      setMonthlyCost(0);
      setPercentageOfRevenue(0);
      setSelectedAssignmentId('');
      setServiceDescription('');
      setServiceDeliverables('');
      setPricingSnapshot(null);
      setPricingInternalCost(0);
      setRequiresAdminApproval(false);
      setExpandRefServiceId('');
      setExpandCountryCode('');
      setExpandServiceName('');
      setExpandMultiplier(0.5);
      setExpandFinalPrice(null);
      setExpandIsNewShop(false);
      setExpandNewClientName('');
      setExpandNewClientBrand('');
      setExpandNewClientIco('');
      setExpandNewClientDic('');
      // New engagement reset
      setNewEngIsDifferentSro(false);
      setNewEngClientName('');
      setNewEngClientBrand('');
      setNewEngName('');
      setNewEngOnboardingEmail('');
      setNewEngServices([]);
      // Bulk edit reset
      setBulkEditChanges(null);
      // Bundled items reset
      setBundledItems([]);
      setBundleDiscountPercent(0);
    }
  }, [open]);

  // Auto-fill service name and description when selecting from catalog
  useEffect(() => {
    if (selectedServiceId && selectedServiceId !== 'custom') {
      const service = services.find(s => s.id === selectedServiceId);
      if (service) {
        setServiceName(service.name);
        
        // Load service description from SERVICE_DETAILS or service.description
        const details = SERVICE_DETAILS[service.code];
        if (details) {
          setServiceDescription(details.tagline || '');
          // Use benefits as deliverables (first 4-5 items)
          setServiceDeliverables(details.benefits?.slice(0, 5).join('\n') || '');
        } else {
          setServiceDescription(service.description || '');
          setServiceDeliverables('');
        }
        
        if (service.code === CREATIVE_BOOST_CODE) {
          // Creative Boost: set defaults, price is calculated from credits
          setCbMaxCredits(30);
          setCbPricePerCredit(400);
          setCbColleagueReward(150);
          setCbEditorReward(100);
          setServicePrice(0); // Price is calculated
          setSelectedTier('none');
        } else if (service.service_type === 'core') {
          // Core service with tiers
          setSelectedTier('growth');
          const growthPrice = getTierPrice(service, 'growth');
          setServicePrice(growthPrice ?? service.base_price ?? 0);
        } else if (service.code === AI_SEO_CODE) {
          // AI SEO: hourly-based with default colleague
          setServicePrice(service.base_price || 0);
          setSelectedTier('none');
          setAiSeoColleagueName('Martin Tomčík');
          setAiSeoHourlyRate(600);
          setAiSeoHours(10);
        } else {
          // Addon or other service
          setServicePrice(service.base_price || 0);
          setSelectedTier('none');
        }
      }
    } else if (selectedServiceId === 'custom') {
      // Custom service - clear description
      setServiceDescription('');
      setServiceDeliverables('');
    }
  }, [selectedServiceId, services]);

  // Auto-fill price and assignments when selecting engagement service for update
  useEffect(() => {
    if (!selectedEngagementServiceId) {
      lastAutoFilledServiceIdRef.current = '';
      return;
    }

    if (selectedEngagementServiceId) {
      const engService = currentEngagementServices.find(es => es.id === selectedEngagementServiceId);
      if (engService) {
        if (lastAutoFilledServiceIdRef.current !== selectedEngagementServiceId) {
          setNewPrice(engService.price);
          const catalogSvc = engService.service_id ? services.find(s => s.id === engService.service_id) : null;
          if (catalogSvc?.code === CREATIVE_BOOST_CODE) {
            setCbMaxCredits(engService.creative_boost_max_credits ?? 30);
            setCbPricePerCredit(engService.creative_boost_price_per_credit ?? 400);
            setCbColleagueReward(150); // defaults, could be stored in assignments
            setCbEditorReward(100);
          }
          lastAutoFilledServiceIdRef.current = selectedEngagementServiceId;
        }
      }
      // Load assignments linked to this service (or all for the engagement)
      const serviceAssignments = currentAssignments.filter(
        a => a.engagement_service_id === selectedEngagementServiceId || !a.engagement_service_id
      );
      setServiceAssignmentEdits(
        serviceAssignments.map(a => {
          const colleague = colleagues.find(c => c.id === a.colleague_id);
          const currentValue = a.cost_model === 'hourly' 
            ? (a.hourly_cost || 0) 
            : a.cost_model === 'percentage' 
              ? (a.percentage_of_revenue || 0) 
              : (a.monthly_cost || 0);
          return {
            assignment_id: a.id,
            colleague_name: colleague?.full_name || 'Neznámý',
            role: a.role_on_engagement || '',
            cost_model: a.cost_model || 'fixed_monthly',
            old_value: currentValue,
            new_value: currentValue,
          };
        })
      );
    }
  }, [selectedEngagementServiceId, currentEngagementServices, currentAssignments, colleagues, services]);

  // Auto-detect role from colleague position for add_assignment
  useEffect(() => {
    if (requestType !== 'add_assignment' || !selectedColleagueId) return;
    const colleague = colleagues.find(c => c.id === selectedColleagueId);
    if (!colleague) return;
    const pos = colleague.position.toLowerCase();
    if (pos.includes('video')) {
      setRoleOnEngagement('Video Editor');
    } else if (pos.includes('design') || pos.includes('grafik')) {
      setRoleOnEngagement('Graphic Designer');
    } else if (pos.includes('ppc') || pos.includes('google')) {
      setRoleOnEngagement('PPC Specialist');
    } else if (pos.includes('meta') || pos.includes('facebook') || pos.includes('social')) {
      setRoleOnEngagement('Meta Ads Specialist');
    } else if (pos.includes('seo')) {
      setRoleOnEngagement('SEO Specialist');
    } else if (pos.includes('sales') || pos.includes('obchod')) {
      setRoleOnEngagement('Sales Specialist');
    } else if (pos.includes('account') || pos.includes('pm') || pos.includes('project')) {
      setRoleOnEngagement('Account Manager');
    }
  }, [selectedColleagueId, requestType, colleagues]);

  // Auto-fill reward from service config when service or colleague changes for add_assignment
  useEffect(() => {
    if (requestType !== 'add_assignment' || !assignmentServiceId) return;
    const engService = currentEngagementServices.find(es => es.id === assignmentServiceId);
    if (!engService) return;

    // Find matching service in catalog
    const catalogService = services.find(s => s.id === engService.service_id);
    const tier = engService.selected_tier || null;
    
    // Try DB reward_config first, then fallback to hardcoded
    let recommended = catalogService?.reward_config 
      ? getRewardsFromServiceConfig(catalogService.reward_config as any, tier)
      : null;
    if (!recommended) {
      recommended = getServiceRewardRecommendation(engService.name, tier);
    }

    if (recommended && recommended.length > 0) {
      // Find match by role if colleague is already selected
      const colleague = colleagues.find(c => c.id === selectedColleagueId);
      const pos = colleague?.position?.toLowerCase() || '';
      
      // Try to match role to colleague position
      let matchedReward = recommended[0]; // default to first
      for (const r of recommended) {
        const roleLower = r.role.toLowerCase();
        if (
          (roleLower.includes('meta') && (pos.includes('meta') || pos.includes('social') || pos.includes('facebook'))) ||
          (roleLower.includes('ppc') && (pos.includes('ppc') || pos.includes('google'))) ||
          (roleLower.includes('graphic') && (pos.includes('design') || pos.includes('grafik'))) ||
          (roleLower.includes('seo') && pos.includes('seo')) ||
          (roleLower.includes('video') && pos.includes('video'))
        ) {
          matchedReward = r;
          break;
        }
      }

      setCostModel(matchedReward.rewardType === 'hourly' ? 'hourly' : matchedReward.rewardType === 'per_credit' ? 'fixed_monthly' : 'fixed_monthly');
      if (matchedReward.rewardType === 'hourly') {
        setHourlyCost(matchedReward.reward);
      } else {
        setMonthlyCost(matchedReward.reward);
      }
    }
  }, [assignmentServiceId, requestType, selectedColleagueId, currentEngagementServices, services, colleagues]);

  // Auto-fill onboarding email from engagement's client contact for new_engagement
  useEffect(() => {
    if (requestType !== 'new_engagement' || !selectedEngagementId) return;
    const engagement = engagements.find(e => e.id === selectedEngagementId);
    if (!engagement) return;
    const client = clients.find(c => c.id === engagement.client_id);
    if (client?.main_contact_email) {
      setNewEngOnboardingEmail(client.main_contact_email);
    }
  }, [requestType, selectedEngagementId, engagements, clients]);

  // Build proposed_changes from current form state
  const buildCurrentProposedChanges = (): { proposed_changes: Record<string, unknown>; engagement_service_id?: string | null; engagement_assignment_id?: string | null } | null => {
    if (!requestType) return null;

    let proposed_changes: Record<string, unknown> = {};
    let eng_service_id: string | null = null;
    let eng_assignment_id: string | null = null;

    switch (requestType) {
      case 'expand_country': {
        const refEngService = currentEngagementServices.find(es => es.id === expandRefServiceId);
        const refCatalogSvc = refEngService?.service_id ? services.find(s => s.id === refEngService.service_id) : null;
        const refPrice = refEngService?.price || 0;
        const calcPrice = expandFinalPrice !== null ? expandFinalPrice : Math.round(refPrice * expandMultiplier);
        proposed_changes = {
          reference_service_id: expandRefServiceId,
          reference_service_name: refEngService?.name,
          reference_price: refPrice,
          new_country_code: expandCountryCode,
          new_country_name: getCountryName(expandCountryCode),
          service_name: expandServiceName,
          price: calcPrice,
          multiplier: expandMultiplier,
          currency: refEngService?.currency || 'CZK',
          billing_type: 'monthly',
          service_id: refCatalogSvc?.id || null,
          selected_tier: refEngService?.selected_tier || null,
          requires_new_client: expandIsNewShop || undefined,
          new_client_data: expandIsNewShop ? {
            company_name: expandNewClientName,
            brand_name: expandNewClientBrand || undefined,
            ico: expandNewClientIco || undefined,
            dic: expandNewClientDic || undefined,
          } : undefined,
        };
        break;
      }
      case 'add_service':
        if (isCreativeBoost) {
          proposed_changes = {
            service_id: selectedServiceId,
            name: serviceName,
            price: cbMaxCredits * cbPricePerCredit,
            currency: serviceCurrency,
            billing_type: 'monthly',
            selected_tier: null,
            creative_boost_max_credits: cbMaxCredits,
            creative_boost_price_per_credit: cbPricePerCredit,
            creative_boost_reward_per_credit: cbColleagueReward,
            creative_boost_editor_reward_per_credit: cbEditorReward,
          };
        } else if (isAiSeo) {
          proposed_changes = {
            service_id: selectedServiceId,
            name: serviceName,
            price: servicePrice,
            currency: serviceCurrency,
            billing_type: serviceBillingType,
            selected_tier: null,
            description: serviceDescription || undefined,
            deliverables: serviceDeliverables ? serviceDeliverables.split('\n').filter(Boolean) : undefined,
            ai_seo_colleague_name: aiSeoColleagueName,
            ai_seo_hourly_rate: aiSeoHourlyRate,
            ai_seo_hours: aiSeoHours,
            ai_seo_total_reward: aiSeoHourlyRate * aiSeoHours,
          };
        } else {
          proposed_changes = {
            service_id: selectedServiceId === 'custom' ? null : selectedServiceId,
            name: serviceName,
            price: servicePrice,
            currency: serviceCurrency,
            billing_type: serviceBillingType,
            selected_tier: selectedTier === 'none' ? null : selectedTier,
            description: serviceDescription || undefined,
            deliverables: serviceDeliverables ? serviceDeliverables.split('\n').filter(Boolean) : undefined,
          };
        }
        break;
      case 'update_service_price': {
        const oldService = currentEngagementServices.find(es => es.id === selectedEngagementServiceId);
        const changedAssignments = serviceAssignmentEdits.filter(a => a.new_value !== a.old_value);
        const cbNewPrice = isUpdateCreativeBoost ? cbMaxCredits * cbPricePerCredit : newPrice;
        proposed_changes = {
          engagement_service_id: selectedEngagementServiceId,
          service_name: oldService?.name || '',
          old_price: oldService?.price || 0,
          new_price: cbNewPrice,
          currency: oldService?.currency || 'CZK',
          ...(isUpdateCreativeBoost ? {
            creative_boost_max_credits: cbMaxCredits,
            creative_boost_price_per_credit: cbPricePerCredit,
            creative_boost_reward_per_credit: cbColleagueReward,
            creative_boost_editor_reward_per_credit: cbEditorReward,
          } : {}),
          assignment_changes: changedAssignments.length > 0 ? changedAssignments.map(a => ({
            assignment_id: a.assignment_id,
            colleague_name: a.colleague_name,
            role: a.role,
            cost_model: a.cost_model,
            old_value: a.old_value,
            new_value: a.new_value,
          })) : undefined,
        };
        eng_service_id = selectedEngagementServiceId;
        break;
      }
      case 'deactivate_service':
        proposed_changes = { engagement_service_id: selectedEngagementServiceId };
        eng_service_id = selectedEngagementServiceId;
        break;
      case 'add_assignment':
        proposed_changes = {
          colleague_id: selectedColleagueId,
          colleague_name: getColleagueName(selectedColleagueId),
          engagement_service_id: assignmentServiceId || null,
          role_on_engagement: roleOnEngagement,
          cost_model: costModel,
          hourly_cost: costModel === 'hourly' ? hourlyCost : null,
          monthly_cost: costModel === 'fixed_monthly' ? monthlyCost : null,
          percentage_of_revenue: costModel === 'percentage' ? percentageOfRevenue : null,
        };
        break;
      case 'update_assignment':
        proposed_changes = {
          engagement_assignment_id: selectedAssignmentId,
          cost_model: costModel,
          hourly_cost: costModel === 'hourly' ? hourlyCost : null,
          monthly_cost: costModel === 'fixed_monthly' ? monthlyCost : null,
          percentage_of_revenue: costModel === 'percentage' ? percentageOfRevenue : null,
        };
        eng_assignment_id = selectedAssignmentId;
        break;
      case 'new_engagement': {
        const totalMonthly = newEngServices.reduce((sum, s) => sum + (s.billing_type === 'monthly' ? s.price : 0), 0);
        proposed_changes = {
          is_different_sro: newEngIsDifferentSro,
          new_client_data: newEngIsDifferentSro && newEngClientName ? {
            company_name: newEngClientName,
            brand_name: newEngClientBrand || undefined,
          } : undefined,
          engagement_name: newEngName,
          services: newEngServices,
          total_monthly_price: totalMonthly,
          currency: 'CZK',
          onboarding_email: newEngIsDifferentSro ? newEngOnboardingEmail : undefined,
          send_onboarding_form: newEngIsDifferentSro,
        };
        break;
      }
      case 'bulk_edit': {
        if (!bulkEditChanges) return null;
        proposed_changes = { ...bulkEditChanges };
        break;
      }
    }

    return { proposed_changes, engagement_service_id: eng_service_id, engagement_assignment_id: eng_assignment_id };
  };

  // Get a label for a bundled item
  const getItemLabel = (item: ModificationRequestItem): string => {
    const c = item.proposed_changes as any;
    switch (item.request_type) {
      case 'expand_country': return `🌍 ${c.service_name || c.reference_service_name || 'Nová země'} ${c.new_country_code || ''}`;
      case 'add_service': return `📦 ${c.name || 'Nová služba'}`;
      case 'update_service_price': return `💰 ${c.service_name || 'Změna ceny'}`;
      case 'deactivate_service': return `❌ ${c.service_name || 'Deaktivace'}`;
      case 'add_assignment': return `👤 ${c.colleague_name || 'Přiřazení kolegy'}`;
      case 'update_assignment': return `⚙️ ${c.colleague_name || 'Změna odměny'}`;
      case 'new_engagement': return `🏢 ${c.engagement_name || 'Nová zakázka'}`;
      default: return 'Položka';
    }
  };

  const getItemPrice = (item: ModificationRequestItem): number | null => {
    const c = item.proposed_changes as any;
    switch (item.request_type) {
      case 'expand_country': return c.price || null;
      case 'add_service': return c.price || null;
      case 'update_service_price': return c.new_price ? (c.new_price - (c.old_price || 0)) : null;
      case 'deactivate_service': return c.price ? -(c.price) : null;
      default: return null;
    }
  };

  const getItemInternalCost = (item: ModificationRequestItem): number => {
    if (item.pricing_snapshot) {
      return item.pricing_snapshot.delta_internal_cost || 0;
    }
    return 0;
  };

  // Save current item to bundle and reset for next item
  const handleAddAnotherItem = () => {
    const built = buildCurrentProposedChanges();
    if (!built || !requestType) return;

    const newItem: ModificationRequestItem = {
      id: crypto.randomUUID(),
      request_type: requestType as ModificationRequestType,
      proposed_changes: built.proposed_changes as unknown as ModificationProposedChanges,
      engagement_service_id: built.engagement_service_id,
      engagement_assignment_id: built.engagement_assignment_id,
      pricing_snapshot: pricingSnapshot,
    };

    setBundledItems(prev => [...prev, newItem]);

    // Reset type-specific fields but keep engagement and step 4 fields
    setRequestType('');
    setRequestTypeConfirmed(false);
    setSelectedServiceId('');
    setSelectedEngagementServiceId('');
    setSelectedAssignmentId('');
    setSelectedColleagueId('');
    setServiceName('');
    setServicePrice(0);
    setServiceDescription('');
    setServiceDeliverables('');
    setPricingSnapshot(null);
    setPricingInternalCost(0);
    setRequiresAdminApproval(false);
    setExpandRefServiceId('');
    setExpandCountryCode('');
    setExpandServiceName('');
    setExpandMultiplier(0.5);
    setExpandFinalPrice(null);
    setExpandIsNewShop(false);
    setExpandNewClientName('');
    setExpandNewClientBrand('');
    setExpandNewClientIco('');
    setExpandNewClientDic('');
    setNewEngIsDifferentSro(false);
    setNewEngClientName('');
    setNewEngClientBrand('');
    setNewEngName('');
    setNewEngOnboardingEmail('');
    setNewEngServices([]);
    setServiceAssignmentEdits([]);
    setNewPrice(0);
    setRoleOnEngagement('');
    setCostModel('fixed_monthly');
    setHourlyCost(0);
    setMonthlyCost(0);
    setPercentageOfRevenue(0);

    toast.success('Položka přidána do nabídky');
  };

  const handleSubmit = async (asDraft = false) => {
    if (!selectedEngagementId) return;

    // Collect all items: bundled items + current item (if any)
    let allItems = [...bundledItems];
    
    if (requestType) {
      const built = buildCurrentProposedChanges();
      if (built) {
        allItems.push({
          id: crypto.randomUUID(),
          request_type: requestType as ModificationRequestType,
          proposed_changes: built.proposed_changes as unknown as ModificationProposedChanges,
          engagement_service_id: built.engagement_service_id,
          engagement_assignment_id: built.engagement_assignment_id,
          pricing_snapshot: pricingSnapshot,
        });
      }
    }

    // Must have at least one item (for drafts, allow saving with engagement only)
    if (allItems.length === 0 && !asDraft) return;

    // For drafts with no items yet, create a placeholder
    if (allItems.length === 0 && asDraft) {
      allItems.push({
        id: crypto.randomUUID(),
        request_type: 'add_service' as ModificationRequestType,
        proposed_changes: { name: '(rozpracováno)', price: 0, currency: 'CZK', billing_type: 'monthly' } as unknown as ModificationProposedChanges,
      });
    }

    // Use the first item's type/changes as the "primary" for backward compat
    const primaryItem = allItems[0];
    const isBundled = allItems.length > 1;

    try {
      if (isEditMode && editingRequest) {
        await updateRequest(editingRequest.id, {
          proposed_changes: primaryItem.proposed_changes,
          effective_from: effectiveFrom ? format(effectiveFrom, 'yyyy-MM-dd') : null,
          note: note || null,
          upsell_commission_percent: upsoldById === 'none' ? 0 : 10,
          items: isBundled ? allItems : undefined,
          bundle_discount_percent: isBundled && bundleDiscountPercent > 0 ? bundleDiscountPercent : undefined,
        });
      } else {
        await createRequest({
          engagement_id: selectedEngagementId,
          request_type: primaryItem.request_type,
          proposed_changes: primaryItem.proposed_changes,
          engagement_service_id: primaryItem.engagement_service_id || null,
          engagement_assignment_id: primaryItem.engagement_assignment_id || null,
          effective_from: effectiveFrom ? format(effectiveFrom, 'yyyy-MM-dd') : null,
          upsold_by_id: upsoldById === 'none' ? null : upsoldById,
          note: note || null,
          pricing_snapshot: primaryItem.pricing_snapshot || pricingSnapshot,
          items: isBundled ? allItems : undefined,
          bundle_discount_percent: isBundled && bundleDiscountPercent > 0 ? bundleDiscountPercent : undefined,
          status: asDraft ? 'draft' : 'pending',
        });
      }
      
      clearDraft();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save modification request:', error);
    }
  };

  const activeEngagements = engagements.filter(e => e.status === 'active');

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.brand_name || client?.name || 'Neznámý klient';
  };

  const getColleagueName = (colleagueId: string) => {
    const colleague = colleagues.find(c => c.id === colleagueId);
    return colleague?.full_name || 'Neznámý kolega';
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        // Prevent accidental close while editing a non-empty form.
        if (!isOpen && selectedEngagementId) {
          // Intentionally left empty; explicit submit flow handles persistence.
        }
        onOpenChange(isOpen);
      }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => {
        // Prevent closing on outside click if form has data
        if (selectedEngagementId) {
          e.preventDefault();
        }
      }}>
       <TooltipProvider delayDuration={200}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditMode ? <FileText className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {isEditMode ? 'Upravit návrh změny' : 'Navrhnout úpravu zakázky'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* ===== STEP 1: Engagement Selection ===== */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">1. Zakázka *</Label>
            <Popover open={engagementComboOpen} onOpenChange={setEngagementComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={engagementComboOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedEngagementId
                    ? (() => {
                        const eng = activeEngagements.find(e => e.id === selectedEngagementId);
                        return eng ? `${getClientName(eng.client_id)} – ${eng.name}` : 'Vyberte zakázku';
                      })()
                    : 'Vyberte zakázku'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 max-h-[300px]" align="start" side="bottom"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                <Command>
                  <CommandInput placeholder="Hledat zakázku..." />
                  <CommandList className="max-h-[240px] overscroll-contain">
                    <CommandEmpty>Žádná zakázka nenalezena.</CommandEmpty>
                    <CommandGroup>
                      {activeEngagements.map((engagement) => (
                        <CommandItem
                          key={engagement.id}
                          value={`${getClientName(engagement.client_id)} ${engagement.name}`}
                          onSelect={() => {
                            setSelectedEngagementId(engagement.id);
                            setSelectedServiceId('');
                            setSelectedEngagementServiceId('');
                            setSelectedAssignmentId('');
                            setEngagementComboOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", selectedEngagementId === engagement.id ? "opacity-100" : "opacity-0")} />
                          {getClientName(engagement.client_id)} – {engagement.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* ===== STEP 2: Request Type (only after engagement selected) ===== */}
          {selectedEngagementId && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">2. Typ úpravy *</Label>
              <Select value={requestType || undefined} onValueChange={(v) => {
                setRequestType(v as ModificationRequestType);
                setRequestTypeConfirmed(true);
                // Reset type-dependent selections
                setSelectedServiceId('');
                setSelectedEngagementServiceId('');
                setSelectedAssignmentId('');
                setSelectedColleagueId('');
              }}>
                <SelectTrigger className="border-2 border-primary/30 hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="Vyberte typ úpravy" />
                </SelectTrigger>
                <SelectContent>
                  {VISIBLE_REQUEST_TYPES.map((value) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex flex-col gap-0.5 py-0.5 text-left">
                        <span className="font-medium">{REQUEST_TYPE_LABELS[value]}</span>
                        <span className="text-xs text-muted-foreground leading-tight">{REQUEST_TYPE_DESCRIPTIONS[value]}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ===== BUNDLED ITEMS SUMMARY (below type selector, above new item form) ===== */}
          {selectedEngagementId && bundledItems.length > 0 && (
            <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                📋 Položky v nabídce ({bundledItems.length})
              </p>
              {bundledItems.map((item, idx) => {
                const price = getItemPrice(item);
                const cost = getItemInternalCost(item);
                return (
                  <div key={item.id} className="flex items-center justify-between gap-2 p-2 rounded border bg-background">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-medium text-muted-foreground">{idx + 1}.</span>
                      <span className="text-sm truncate">{getItemLabel(item)}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {price !== null && (
                        <div className="text-right">
                          <span className={cn("text-xs font-medium", price >= 0 ? "text-green-600" : "text-destructive")}>
                            {price >= 0 ? '+' : ''}{price.toLocaleString('cs-CZ')} Kč
                          </span>
                          {cost > 0 && (
                            <p className="text-[10px] text-muted-foreground">
                              náklad: {cost.toLocaleString('cs-CZ')} Kč
                            </p>
                          )}
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        onClick={() => setBundledItems(prev => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* Bundle economics summary */}
              {(() => {
                const totalRevenue = bundledItems.reduce((sum, item) => sum + (getItemPrice(item) || 0), 0);
                const totalInternalCost = bundledItems.reduce((sum, item) => sum + getItemInternalCost(item), 0);
                const discountAmount = bundleDiscountPercent > 0 ? Math.round(totalRevenue * bundleDiscountPercent / 100) : 0;
                const revenueAfterDiscount = totalRevenue - discountAmount;
                const marginAmount = revenueAfterDiscount - totalInternalCost;
                const marginPercent = revenueAfterDiscount > 0 ? Math.round((marginAmount / revenueAfterDiscount) * 100) : 0;
                const marginColor = marginPercent >= 66 ? 'text-green-600' : marginPercent >= 63 ? 'text-yellow-600' : 'text-destructive';

                const firstSnapshot = bundledItems.find(i => i.pricing_snapshot)?.pricing_snapshot;
                const currentRevenue = firstSnapshot?.current_total_revenue || 0;
                const currentCost = firstSnapshot?.current_total_internal_cost || 0;
                const hasCurrentData = currentRevenue > 0;

                const newTotalRevenue = currentRevenue + revenueAfterDiscount;
                const newTotalCost = currentCost + totalInternalCost;
                const newTotalMargin = newTotalRevenue - newTotalCost;
                const newTotalMarginPercent = newTotalRevenue > 0 ? Math.round((newTotalMargin / newTotalRevenue) * 100) : 0;
                const totalMarginColor = newTotalMarginPercent >= 66 ? 'text-green-600' : newTotalMarginPercent >= 63 ? 'text-yellow-600' : 'text-destructive';

                return (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Nové příjmy<InfoTip text="Celková měsíční cena pro klienta ze všech nových/upravených služeb v tomto balíčku." /></p>
                        <p className="font-semibold text-green-600">+{totalRevenue.toLocaleString('cs-CZ')} Kč</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Interní náklady<InfoTip text="Součet odměn kolegů přiřazených ke všem službám v balíčku." /></p>
                        <p className="font-semibold text-destructive">-{totalInternalCost.toLocaleString('cs-CZ')} Kč</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Marže balíčku<InfoTip text="Marže = (příjmy − náklady) / příjmy. Cíl: 66 %+ (zelená). 63–65 % (oranžová). Pod 63 % (červená) vyžaduje schválení." /></p>
                        <p className={cn("font-semibold", marginColor)}>
                          {marginAmount.toLocaleString('cs-CZ')} Kč ({marginPercent} %)
                        </p>
                      </div>
                    </div>

                    {bundleDiscountPercent > 0 && (
                      <div className="flex items-center justify-between text-xs p-1.5 rounded bg-primary/5 border border-primary/20">
                        <span>🏷️ Po slevě {bundleDiscountPercent} %:</span>
                        <span className="font-semibold">
                          <span className="line-through text-muted-foreground mr-1">{totalRevenue.toLocaleString('cs-CZ')}</span>
                          → {revenueAfterDiscount.toLocaleString('cs-CZ')} Kč/měs
                        </span>
                      </div>
                    )}

                    {hasCurrentData && (
                      <div className="p-2 rounded border bg-background space-y-1">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">📊 Celková ekonomika klienta po změně<InfoTip text="Projekce celkové zakázky po aplikování všech navržených změn — zahrnuje stávající služby + nové položky." /></p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Celkové příjmy</p>
                            <p className="font-semibold">{newTotalRevenue.toLocaleString('cs-CZ')} Kč</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Celkové náklady</p>
                            <p className="font-semibold">{newTotalCost.toLocaleString('cs-CZ')} Kč</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Celková marže</p>
                            <p className={cn("font-bold", totalMarginColor)}>
                              {newTotalMarginPercent} %
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ===== STEP 3: Type-specific fields (only after type selected) ===== */}
          {selectedEngagementId && requestTypeConfirmed && requestType && (
            <>
              {/* EXPAND COUNTRY FIELDS */}
              {requestType === 'expand_country' && (
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    3. Přidání nové země
                  </h4>
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  
                  {/* Reference service */}
                  <div className="space-y-2">
                    <Label>Referenční služba (základ pro výpočet ceny) *</Label>
                    <Select value={expandRefServiceId} onValueChange={(v) => {
                      setExpandRefServiceId(v);
                      // Auto-generate name
                      const refSvc = currentEngagementServices.find(es => es.id === v);
                      if (refSvc && expandCountryCode) {
                        setExpandServiceName(`${refSvc.name} ${expandCountryCode}`);
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte stávající službu klienta" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentEngagementServices.filter(es => es.is_active && es.billing_type === 'monthly').map((es) => (
                          <SelectItem key={es.id} value={es.id}>
                            {es.name} ({es.price?.toLocaleString('cs-CZ')} {es.currency})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Country selector */}
                  <div className="space-y-2">
                    <Label>Nová země *</Label>
                    <Select value={expandCountryCode} onValueChange={(v) => {
                      setExpandCountryCode(v);
                      // Auto-generate name
                      const refSvc = currentEngagementServices.find(es => es.id === expandRefServiceId);
                      if (refSvc) {
                        setExpandServiceName(`${refSvc.name} ${v}`);
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte zemi" />
                      </SelectTrigger>
                      <SelectContent>
                        {MANAGED_COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.flag} {c.name} ({c.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Service name (auto-generated, editable) */}
                  {expandRefServiceId && expandCountryCode && (
                    <>
                      <div className="space-y-2">
                        <Label>Název nové služby</Label>
                        <Input 
                          value={expandServiceName}
                          onChange={(e) => setExpandServiceName(e.target.value)}
                          placeholder="Např. Socials Boost SK"
                        />
                      </div>

                      {/* Multiplier + price calculation */}
                      {(() => {
                        const refSvc = currentEngagementServices.find(es => es.id === expandRefServiceId);
                        if (!refSvc) return null;
                        const recommendedPrice = Math.round(refSvc.price * expandMultiplier);
                        const effectivePrice = expandFinalPrice !== null ? expandFinalPrice : recommendedPrice;
                        
                        return (
                          <div className="space-y-3 p-3 rounded-md border bg-background">
                            <p className="text-xs font-medium text-muted-foreground">Cenová kalkulace</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">
                                  Multiplikátor<InfoTip text="Koeficient pro výpočet ceny nové země. 0.5 = polovina ceny CZ služby. Např. CZ služba za 20 000 Kč × 0.5 = 10 000 Kč pro SK." />
                                  <span className="text-muted-foreground ml-1">(doporučeno: 0.5)</span>
                                </Label>
                                <Input
                                  type="number"
                                  step="0.05"
                                  min="0.1"
                                  max="2"
                                  value={expandMultiplier}
                                  onChange={(e) => {
                                    setExpandMultiplier(Number(e.target.value));
                                    setExpandFinalPrice(null);
                                  }}
                                  className="h-9"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Finální cena<InfoTip text="Výsledná měsíční cena pro klienta. Automaticky se počítá z multiplikátoru, ale můžete ji ručně upravit." /></Label>
                                <Input
                                  type="number"
                                  value={expandFinalPrice !== null ? expandFinalPrice : recommendedPrice}
                                  onChange={(e) => setExpandFinalPrice(Number(e.target.value))}
                                  className="h-9"
                                  step="100"
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                Doporučená cena: {formatCZK(recommendedPrice)}
                                {' '}({formatCZK(refSvc.price)} × {expandMultiplier})
                              </span>
                              {expandFinalPrice !== null && expandFinalPrice !== recommendedPrice && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 px-1.5 text-xs text-primary"
                                  onClick={() => setExpandFinalPrice(null)}
                                >
                                  Použít doporučenou
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Existing colleagues on this service */}
                      {(() => {
                        const serviceAssignments = currentAssignments.filter(
                          a => a.engagement_service_id === expandRefServiceId
                        );
                        if (serviceAssignments.length === 0) return null;

                        return (
                          <div className="space-y-3 p-3 rounded-md border bg-background">
                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              Stávající kolegové na této službě
                              <InfoTip text="Kolegové aktuálně přiřazení k referenční službě. Navýšení odměny se počítá z multiplikátoru. Celková odměna = součet všech odměn kolegy napříč zakázkou." />
                            </p>
                            {serviceAssignments.map(a => {
                              const colleague = colleagues.find(c => c.id === a.colleague_id);
                              const isFixed = a.cost_model === 'fixed_monthly';
                              const currentReward = isFixed ? (a.monthly_cost || 0) : (a.hourly_cost || 0);
                              const rewardIncrease = Math.round(currentReward * expandMultiplier);
                              const newServiceTotal = currentReward + rewardIncrease;
                              const unit = isFixed ? '/měs' : '/hod';

                              // Calculate total reward for this colleague across ALL services in this engagement
                              const allColleagueAssignments = currentAssignments.filter(
                                ca => ca.colleague_id === a.colleague_id
                              );
                              const currentTotalReward = allColleagueAssignments.reduce((sum, ca) => {
                                if (ca.cost_model === 'fixed_monthly') return sum + (ca.monthly_cost || 0);
                                return sum;
                              }, 0);
                              const newTotalReward = currentTotalReward + rewardIncrease;

                              return (
                                <div key={a.id} className="p-2.5 rounded bg-muted/50 space-y-1.5">
                                  <div className="flex items-center justify-between gap-3 text-sm">
                                    <div className="min-w-0">
                                      <p className="font-medium truncate">{colleague?.full_name || 'Neznámý'}</p>
                                      <p className="text-xs text-muted-foreground">{a.role_on_engagement || colleague?.position}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <div className="flex items-center gap-1.5 text-xs">
                                        <span className="text-muted-foreground">{formatCZK(currentReward)}{unit}</span>
                                        <span className="text-primary font-medium">+{formatCZK(rewardIncrease)}</span>
                                        <span className="font-semibold">→ {formatCZK(newServiceTotal)}{unit}</span>
                                      </div>
                                    </div>
                                  </div>
                                  {isFixed && allColleagueAssignments.length > 1 && (
                                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                                      <span className="text-muted-foreground">
                                        Celková odměna na zakázce ({allColleagueAssignments.length} služeb)
                                        <InfoTip text="Součet měsíčních odměn tohoto kolegy za všechny služby v rámci zakázky, včetně navrhovaného navýšení." />
                                      </span>
                                      <span className="font-semibold">
                                        {formatCZK(currentTotalReward)} → {formatCZK(newTotalReward)}/měs
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}

                      {/* New shop / different SRO checkbox */}
                      <div className="space-y-3 p-3 rounded-md border bg-background">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="expand-new-shop"
                            checked={expandIsNewShop}
                            onCheckedChange={(checked) => setExpandIsNewShop(checked === true)}
                          />
                          <Label htmlFor="expand-new-shop" className="text-sm cursor-pointer">
                            Nový shop je pod jiným SRO (nový klient)<InfoTip text="Zaškrtněte, pokud nová země běží pod jinou právní entitou (jiné IČO). Klientovi se odešle onboarding formulář pro vyplnění fakturačních údajů." />
                          </Label>
                        </div>

                        {expandIsNewShop && (
                          <div className="space-y-3 ml-6 pt-2 border-t">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Název společnosti *</Label>
                                <Input
                                  value={expandNewClientName}
                                  onChange={(e) => setExpandNewClientName(e.target.value)}
                                  placeholder="Např. NovýShop s.r.o."
                                  className="h-9"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Název značky</Label>
                                <Input
                                  value={expandNewClientBrand}
                                  onChange={(e) => setExpandNewClientBrand(e.target.value)}
                                  placeholder="Např. NovýShop.cz"
                                  className="h-9"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">IČO</Label>
                                <Input
                                  value={expandNewClientIco}
                                  onChange={(e) => setExpandNewClientIco(e.target.value)}
                                  placeholder="12345678"
                                  className="h-9"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">DIČ</Label>
                                <Input
                                  value={expandNewClientDic}
                                  onChange={(e) => setExpandNewClientDic(e.target.value)}
                                  placeholder="CZ12345678"
                                  className="h-9"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  </div>
                </div>
              )}

              {/* ADD SERVICE FIELDS */}
              {requestType === 'add_service' && (
                <div className="space-y-4">
                  <h4 className="font-medium">3. Nová služba</h4>
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Služba z katalogu</Label>
                      <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Vyberte službu">
                            {selectedServiceId === 'custom' ? 'Vlastní služba' : (() => {
                              const s = services.find(sv => sv.id === selectedServiceId);
                              if (!s) return 'Vyberte službu';
                              return (
                                <span className="flex items-center gap-2">
                                  {s.name}
                                  <span className={cn(
                                    "text-[10px] font-medium uppercase px-1.5 py-0.5 rounded",
                                    s.service_type === 'core'
                                      ? "bg-primary/10 text-primary"
                                      : "bg-muted text-muted-foreground"
                                  )}>
                                    {s.service_type === 'core' ? 'Core' : 'Addon'}
                                  </span>
                                </span>
                              );
                            })()}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Vlastní služba</SelectItem>
                          {[...services.filter(s => s.is_active)].sort((a, b) => {
                            if (a.service_type === b.service_type) return a.name.localeCompare(b.name);
                            return a.service_type === 'core' ? -1 : 1;
                          }).map((service) => {
                            const details = SERVICE_DETAILS[service.code];
                            const platforms = details?.platforms || [];
                            return (
                              <SelectItem key={service.id} value={service.id}>
                                <div className="flex flex-col gap-0.5">
                                  <span className="flex items-center gap-2">
                                    {service.name}
                                    <span className={cn(
                                      "text-[10px] font-medium uppercase px-1.5 py-0.5 rounded",
                                      service.service_type === 'core'
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted text-muted-foreground"
                                    )}>
                                      {service.service_type === 'core' ? 'Core' : 'Addon'}
                                    </span>
                                  </span>
                                  {platforms.length > 0 && (
                                    <span className="text-[10px] text-muted-foreground leading-tight">
                                      {platforms.join(' · ')}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Název služby *</Label>
                      <Input 
                        value={serviceName} 
                        onChange={(e) => setServiceName(e.target.value)}
                        placeholder="Např. Meta Ads SK"
                      />
                    </div>
                  </div>

                  {/* Creative Boost specific fields */}
                  {isCreativeBoost && (
                    <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <h5 className="font-medium text-sm flex items-center gap-2">🎨 Nastavení Creative Boost</h5>
                      
                      <div className="space-y-2">
                        <Label>Měsíční kreditový balíček<InfoTip text="Maximální počet kreditů, které klient může měsíčně využít. 1 kredit = 1 grafický výstup (post, story, reel cover)." /></Label>
                        <Input 
                          type="number" 
                          value={cbMaxCredits} 
                          onChange={(e) => setCbMaxCredits(Number(e.target.value))}
                          min={0}
                        />
                        <p className="text-xs text-muted-foreground">Kolik kreditů má klient k dispozici měsíčně</p>
                      </div>

                      <div className="space-y-2">
                        <Label>💰 Cena za kredit pro klienta (CZK)<InfoTip text="Kolik klient platí za každý využitý kredit. Doporučeno 400 Kč — nižší cena snižuje marži." /></Label>
                        <Input 
                          type="number" 
                          value={cbPricePerCredit} 
                          onChange={(e) => setCbPricePerCredit(Number(e.target.value))}
                          min={0}
                        />
                        <p className="text-xs text-muted-foreground">Doporučeno: 400 Kč</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>🎨 Odměna za kredit — Grafik (CZK)<InfoTip text="Interní odměna grafikovi za zpracování jednoho kreditu. Marže = cena pro klienta − odměna grafik − odměna editor." /></Label>
                          <Input 
                            type="number" 
                            value={cbColleagueReward} 
                            onChange={(e) => setCbColleagueReward(Number(e.target.value))}
                            min={0}
                          />
                          <p className="text-xs text-muted-foreground">Doporučeno: 150 Kč</p>
                        </div>
                        <div className="space-y-2">
                          <Label>🎬 Odměna za kredit — Editor (CZK)<InfoTip text="Interní odměna editorovi za zpracování jednoho kreditu. Marže = cena pro klienta − odměna grafik − odměna editor." /></Label>
                          <Input 
                            type="number" 
                            value={cbEditorReward} 
                            onChange={(e) => setCbEditorReward(Number(e.target.value))}
                            min={0}
                          />
                          <p className="text-xs text-muted-foreground">Doporučeno: 100 Kč</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t space-y-1">
                        <p className="text-sm font-medium">
                          Měsíční fakturace: <span className="text-primary">{(cbMaxCredits * cbPricePerCredit).toLocaleString('cs-CZ')} CZK</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          = {cbMaxCredits} kreditů × {cbPricePerCredit} Kč/kredit
                        </p>
                        {(cbColleagueReward > 0 || cbEditorReward > 0) && (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {cbColleagueReward > 0 && (
                              <div>
                                <p className="text-sm font-medium">
                                  Odměna grafik: <span className="text-green-600">{(cbMaxCredits * cbColleagueReward).toLocaleString('cs-CZ')} Kč/měs</span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  = {cbMaxCredits} kr. × {cbColleagueReward} Kč
                                </p>
                              </div>
                            )}
                            {cbEditorReward > 0 && (
                              <div>
                                <p className="text-sm font-medium">
                                  Odměna editor: <span className="text-green-600">{(cbMaxCredits * cbEditorReward).toLocaleString('cs-CZ')} Kč/měs</span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  = {cbMaxCredits} kr. × {cbEditorReward} Kč
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI SEO specific fields */}
                  {isAiSeo && (
                    <div className="space-y-4 p-4 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
                      <h5 className="font-medium text-sm">🤖 AI SEO – Řešitel & odměna</h5>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Řešitel</Label>
                          <Input 
                            value={aiSeoColleagueName}
                            onChange={(e) => setAiSeoColleagueName(e.target.value)}
                            className="text-sm"
                          />
                          <p className="text-xs text-muted-foreground">SEO specialista</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Hodinová sazba (Kč)</Label>
                          <Input 
                            type="number"
                            value={aiSeoHourlyRate}
                            onChange={(e) => setAiSeoHourlyRate(Number(e.target.value))}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Počet hodin / měsíc</Label>
                          <Input 
                            type="number"
                            value={aiSeoHours}
                            onChange={(e) => setAiSeoHours(Number(e.target.value))}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      <div className="text-sm font-medium">
                        Celková měsíční odměna: <span className="text-green-600 dark:text-green-400">{(aiSeoHourlyRate * aiSeoHours).toLocaleString('cs-CZ')} Kč</span>
                        <span className="text-muted-foreground ml-1">({aiSeoHours}h × {aiSeoHourlyRate} Kč)</span>
                      </div>
                    </div>
                  )}

                  {/* Standard service fields (non-Creative Boost) */}
                  {!isCreativeBoost && (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Cena *</Label>
                          <Input 
                            type="number" 
                            value={servicePrice} 
                            onChange={(e) => setServicePrice(Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Měna</Label>
                          <Select value={serviceCurrency} onValueChange={setServiceCurrency}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CZK">CZK</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Fakturace</Label>
                          <Select value={serviceBillingType} onValueChange={(v) => setServiceBillingType(v as 'monthly' | 'one_off')}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Měsíční</SelectItem>
                              <SelectItem value="one_off">Jednorázová</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Tier selector only for core services */}
                      {isCoreService && (
                        <div className="space-y-2">
                          <Label>Tier<InfoTip text="Úroveň služby určuje rozsah práce a doporučenou cenu. Growth = základní, Pro = rozšířená, Elite = premium." /></Label>
                          <Select value={selectedTier} onValueChange={(v) => setSelectedTier(v as ServiceTier | 'none')}>
                            <SelectTrigger>
                              <SelectValue placeholder="Vyberte tier" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Žádný</SelectItem>
                              <SelectItem value="growth">
                                <span className="flex flex-col">
                                  <span>GROWTH</span>
                                  <span className="text-[10px] text-muted-foreground">spend do 400 000 Kč</span>
                                </span>
                              </SelectItem>
                              <SelectItem value="pro">
                                <span className="flex flex-col">
                                  <span>PRO</span>
                                  <span className="text-[10px] text-muted-foreground">spend 400 – 800 000 Kč</span>
                                </span>
                              </SelectItem>
                              <SelectItem value="elite">
                                <span className="flex flex-col">
                                  <span>ELITE</span>
                                  <span className="text-[10px] text-muted-foreground">spend nad 800 000 Kč</span>
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          {/* Platform info for core services */}
                          {selectedService && (
                            <p className="text-xs text-muted-foreground">
                              Platformy:{' '}
                              <span className="font-medium text-foreground">
                                {selectedService.code === 'PPC_BOOST' && 'Google Ads + S-klik'}
                                {selectedService.code === 'PERFORMANCE_BOOST' && 'Meta Ads, Google Ads, S-klik'}
                                {selectedService.code === 'SOCIALS_BOOST' && 'Meta Ads'}
                              </span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Service description for client */}
                      <div className="space-y-4 mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <h5 className="font-medium text-sm text-blue-900 dark:text-blue-300">Popis služby pro klienta</h5>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm">Stručný popis</Label>
                          <Textarea 
                            value={serviceDescription}
                            onChange={(e) => setServiceDescription(e.target.value)}
                            placeholder="Např. Komplexní správa reklamních kampaní na Facebooku a Instagramu"
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm">Co klient dostane (každý řádek = 1 bod)</Label>
                          <Textarea 
                            value={serviceDeliverables}
                            onChange={(e) => setServiceDeliverables(e.target.value)}
                            placeholder="• Kompletní správa Meta Ads&#10;• Looker Studio reporting 24/7&#10;• Měsíční strategické konzultace"
                            rows={4}
                            className="text-sm font-mono"
                          />
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          ⓘ Pro služby z katalogu se popis načte automaticky - můžete ho upravit
                        </p>
                      </div>
                    </>
                  )}
                  </div>
                </div>
              )}

              {/* UPDATE SERVICE (PRICE + ASSIGNMENTS) FIELDS */}
              {requestType === 'update_service_price' && (
                <div className="space-y-4">
                  <h4 className="font-medium">3. Úprava služby</h4>
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  
                  <div className="space-y-2">
                    <Label>Služba *</Label>
                    <Select value={selectedEngagementServiceId} onValueChange={setSelectedEngagementServiceId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte stávající službu" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentEngagementServices.filter(es => es.is_active).map((es) => (
                          <SelectItem key={es.id} value={es.id}>
                            {es.name} ({es.price.toLocaleString()} {es.currency})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedEngagementServiceId && (
                    <>
                      {/* Creative Boost credit fields for update */}
                      {isUpdateCreativeBoost ? (
                        <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                          <h5 className="font-medium text-sm flex items-center gap-2">🎨 Úprava Creative Boost</h5>
                          
                          <div className="space-y-2">
                            <Label>Měsíční kreditový balíček<InfoTip text="Maximální počet kreditů, které klient může měsíčně využít. 1 kredit = 1 grafický výstup (post, story, reel cover)." /></Label>
                            <Input 
                              type="number" 
                              value={cbMaxCredits} 
                              onChange={(e) => {
                                setCbMaxCredits(Number(e.target.value));
                                setNewPrice(Number(e.target.value) * cbPricePerCredit);
                              }}
                              min={0}
                            />
                            <p className="text-xs text-muted-foreground">Kolik kreditů má klient k dispozici měsíčně</p>
                          </div>

                          <div className="space-y-2">
                            <Label>💰 Cena za kredit pro klienta (CZK)<InfoTip text="Kolik klient platí za každý využitý kredit. Doporučeno 400 Kč — nižší cena snižuje marži." /></Label>
                            <Input 
                              type="number" 
                              value={cbPricePerCredit} 
                              onChange={(e) => {
                                setCbPricePerCredit(Number(e.target.value));
                                setNewPrice(cbMaxCredits * Number(e.target.value));
                              }}
                              min={0}
                            />
                            <p className="text-xs text-muted-foreground">Doporučeno: 400 Kč</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>🎨 Odměna za kredit — Grafik (CZK)<InfoTip text="Interní odměna grafikovi za zpracování jednoho kreditu." /></Label>
                              <Input 
                                type="number" 
                                value={cbColleagueReward} 
                                onChange={(e) => setCbColleagueReward(Number(e.target.value))}
                                min={0}
                              />
                              <p className="text-xs text-muted-foreground">Doporučeno: 150 Kč</p>
                            </div>
                            <div className="space-y-2">
                              <Label>🎬 Odměna za kredit — Editor (CZK)<InfoTip text="Interní odměna editorovi za zpracování jednoho kreditu." /></Label>
                              <Input 
                                type="number" 
                                value={cbEditorReward} 
                                onChange={(e) => setCbEditorReward(Number(e.target.value))}
                                min={0}
                              />
                              <p className="text-xs text-muted-foreground">Doporučeno: 100 Kč</p>
                            </div>
                          </div>

                          <div className="pt-2 border-t space-y-1">
                            <p className="text-sm font-medium">
                              Nová měsíční fakturace: <span className="text-primary">{(cbMaxCredits * cbPricePerCredit).toLocaleString('cs-CZ')} CZK</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              = {cbMaxCredits} kreditů × {cbPricePerCredit} Kč/kredit
                            </p>
                            {(() => {
                              const engService = currentEngagementServices.find(es => es.id === selectedEngagementServiceId);
                              const oldPrice = engService?.price || 0;
                              const newCbPrice = cbMaxCredits * cbPricePerCredit;
                              if (newCbPrice !== oldPrice) {
                                const diff = newCbPrice - oldPrice;
                                return (
                                  <p className={cn("text-xs font-medium", diff > 0 ? "text-green-600" : "text-destructive")}>
                                    {diff > 0 ? '+' : ''}{diff.toLocaleString('cs-CZ')} Kč ({diff > 0 ? '+' : ''}{((diff / oldPrice) * 100).toFixed(1)}%)
                                  </p>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Standard price edit */}
                          <div className="space-y-2">
                            <Label>Nová cena (CZK) *</Label>
                            <Input 
                              type="number" 
                              value={newPrice} 
                              onChange={(e) => setNewPrice(Number(e.target.value))}
                            />
                            {(() => {
                              const engService = currentEngagementServices.find(es => es.id === selectedEngagementServiceId);
                              if (engService && newPrice !== engService.price) {
                                const diff = newPrice - engService.price;
                                return (
                                  <p className={cn("text-xs font-medium", diff > 0 ? "text-green-600" : "text-destructive")}>
                                    {diff > 0 ? '+' : ''}{diff.toLocaleString('cs-CZ')} Kč ({diff > 0 ? '+' : ''}{((diff / engService.price) * 100).toFixed(1)}%)
                                  </p>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </>
                      )}

                      {/* Colleague assignments for this service (hidden for Creative Boost — rewards are per-credit) */}
                      {!isUpdateCreativeBoost && serviceAssignmentEdits.length > 0 && (
                        <div className="space-y-3 pt-2 border-t">
                          <h5 className="text-sm font-medium flex items-center gap-2">
                            👥 Odměny kolegů na této službě
                          </h5>
                          
                          {serviceAssignmentEdits.map((assignment, idx) => (
                            <div key={assignment.assignment_id} className="grid grid-cols-4 gap-3 items-end p-3 rounded-md border bg-background">
                              <div className="col-span-2">
                                <p className="text-sm font-medium">{assignment.colleague_name}</p>
                                <p className="text-xs text-muted-foreground">{assignment.role || 'bez role'}</p>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Aktuální</Label>
                                <p className="text-sm text-muted-foreground">
                                  {assignment.old_value.toLocaleString('cs-CZ')} Kč /měs
                                </p>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Nová odměna</Label>
                                <Input
                                  type="number"
                                  value={assignment.new_value}
                                  onChange={(e) => {
                                    const updated = [...serviceAssignmentEdits];
                                    updated[idx] = { ...updated[idx], new_value: Number(e.target.value) };
                                    setServiceAssignmentEdits(updated);
                                  }}
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                          ))}

                          {/* Margin summary */}
                          {(() => {
                            const totalOldCost = serviceAssignmentEdits.reduce((sum, a) => sum + a.old_value, 0);
                            const totalNewCost = serviceAssignmentEdits.reduce((sum, a) => sum + a.new_value, 0);
                            const engService = currentEngagementServices.find(es => es.id === selectedEngagementServiceId);
                            const oldPrice = engService?.price || 0;
                            const oldMargin = oldPrice > 0 ? ((oldPrice - totalOldCost) / oldPrice * 100) : 0;
                            const newMargin = newPrice > 0 ? ((newPrice - totalNewCost) / newPrice * 100) : 0;
                            
                            const getMarginColor = (m: number) => m >= 66 ? 'text-green-600' : m >= 63 ? 'text-orange-500' : 'text-destructive';
                            
                            return (
                              <div className="grid grid-cols-2 gap-3 p-3 rounded-md border bg-muted/50">
                                <div>
                                  <p className="text-xs text-muted-foreground">Aktuální marže služby<InfoTip text="Marže = (příjmy − náklady) / příjmy. Cíl: 66 %+ (zelená). 63–65 % (oranžová). Pod 63 % (červená) vyžaduje schválení." /></p>
                                  <p className={cn("text-sm font-semibold", getMarginColor(oldMargin))}>
                                    {oldMargin.toFixed(1)}% ({(oldPrice - totalOldCost).toLocaleString('cs-CZ')} Kč)
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Nová marže služby</p>
                                  <p className={cn("text-sm font-semibold", getMarginColor(newMargin))}>
                                    {newMargin.toFixed(1)}% ({(newPrice - totalNewCost).toLocaleString('cs-CZ')} Kč)
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {serviceAssignmentEdits.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">
                          K této službě nejsou přiřazeni žádní kolegové.
                        </p>
                      )}
                    </>
                  )}
                  </div>
                </div>
              )}

              {/* DEACTIVATE SERVICE FIELDS */}
              {requestType === 'deactivate_service' && (
                <div className="space-y-4">
                  <h4 className="font-medium">3. Deaktivace služby</h4>
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  
                  <div className="space-y-2">
                    <Label>Služba k deaktivaci *</Label>
                    <Select value={selectedEngagementServiceId} onValueChange={setSelectedEngagementServiceId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte službu" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentEngagementServices.filter(es => es.is_active).map((es) => (
                          <SelectItem key={es.id} value={es.id}>
                            {es.name} ({es.price.toLocaleString()} {es.currency})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  </div>
                </div>
              )}

              {/* ADD ASSIGNMENT FIELDS */}
              {requestType === 'add_assignment' && (
                <div className="space-y-4">
                  <h4 className="font-medium">3. Přiřazení kolegy ke službě</h4>
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  
                  {/* Service selection */}
                  <div className="space-y-2">
                    <Label>Služba na zakázce *</Label>
                    <Select value={assignmentServiceId} onValueChange={setAssignmentServiceId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte službu" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentEngagementServices.filter(es => es.is_active).map((es) => (
                          <SelectItem key={es.id} value={es.id}>
                            {es.name} ({es.price?.toLocaleString()} {es.currency})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {assignmentServiceId && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Kolega *</Label>
                          <Select value={selectedColleagueId} onValueChange={setSelectedColleagueId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Vyberte kolegu" />
                            </SelectTrigger>
                            <SelectContent>
                              {colleagues.filter(c => c.status === 'active').map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.full_name} ({c.position})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Role na projektu</Label>
                          <Input 
                            value={roleOnEngagement} 
                            onChange={(e) => setRoleOnEngagement(e.target.value)}
                            placeholder="Např. Specialist"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Model odměny</Label>
                          <Select value={costModel} onValueChange={(v) => setCostModel(v as 'hourly' | 'fixed_monthly' | 'percentage')}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed_monthly">Fixní měsíční</SelectItem>
                              <SelectItem value="hourly">Hodinová</SelectItem>
                              <SelectItem value="percentage">% z revenue</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {costModel === 'fixed_monthly' && (
                          <div className="space-y-2">
                            <Label>Měsíční odměna (CZK)</Label>
                            <Input 
                              type="number" 
                              value={monthlyCost} 
                              onChange={(e) => setMonthlyCost(Number(e.target.value))}
                            />
                          </div>
                        )}

                        {costModel === 'hourly' && (
                          <div className="space-y-2">
                            <Label>Hodinová sazba (CZK)</Label>
                            <Input 
                              type="number" 
                              value={hourlyCost} 
                              onChange={(e) => setHourlyCost(Number(e.target.value))}
                            />
                          </div>
                        )}

                        {costModel === 'percentage' && (
                          <div className="space-y-2">
                            <Label>% z revenue</Label>
                            <Input 
                              type="number" 
                              value={percentageOfRevenue} 
                              onChange={(e) => setPercentageOfRevenue(Number(e.target.value))}
                            />
                          </div>
                        )}
                      </div>

                      {(monthlyCost > 0 || hourlyCost > 0) && (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Odměna byla předvyplněna dle konfigurace služby. Můžete ji upravit.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}
                  </div>
                </div>
              )}

               {/* UPDATE ASSIGNMENT FIELDS (legacy - hidden from dropdown but kept for backward compat) */}
              {requestType === 'update_assignment' && (
                <div className="space-y-4">
                  <h4 className="font-medium">3. Změna odměny kolegy</h4>
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    Pro úpravu odměn kolegů použijte typ „Úprava služby (cena + odměny)" – kde uvidíte i marži.
                   </p>
                  </div>
                </div>
              )}

              {/* NEW ENGAGEMENT FIELDS */}
              {requestType === 'bulk_edit' && selectedEngagementId && (
                <BulkEditStep
                  engagementId={selectedEngagementId}
                  onChange={setBulkEditChanges}
                  initialData={bulkEditChanges}
                />
              )}

              {requestType === 'new_engagement' && (
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    3. Nová zakázka
                  </h4>
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">

                  {/* Same vs different SRO toggle */}
                  <div className="flex items-center gap-2 p-3 rounded-md border bg-background">
                    <Checkbox
                      id="different-sro"
                      checked={newEngIsDifferentSro}
                      onCheckedChange={(checked) => setNewEngIsDifferentSro(checked === true)}
                    />
                    <Label htmlFor="different-sro" className="text-sm cursor-pointer">
                      Zakázka je pod jiným SRO (nová firma)
                    </Label>
                  </div>
                  
                  {/* New SRO fields - only shown when different SRO */}
                  {newEngIsDifferentSro && (
                    <>
                      <div className="space-y-3 p-3 rounded-md border bg-background">
                        <h5 className="text-sm font-medium">🏢 Nový klient (orientační)</h5>
                        <p className="text-xs text-muted-foreground">Klient doplní vše sám přes onboarding formulář (IČO, DIČ, fakturační údaje).</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Název společnosti</Label>
                            <Input
                              value={newEngClientName}
                              onChange={(e) => setNewEngClientName(e.target.value)}
                              placeholder="Např. NovýEshop s.r.o."
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Název značky</Label>
                            <Input
                              value={newEngClientBrand}
                              onChange={(e) => setNewEngClientBrand(e.target.value)}
                              placeholder="Např. NovýEshop.cz"
                              className="h-9"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Onboarding email */}
                      <div className="space-y-1">
                        <Label className="text-xs">E-mail pro onboarding formulář *</Label>
                        <Input
                          type="email"
                          value={newEngOnboardingEmail}
                          onChange={(e) => setNewEngOnboardingEmail(e.target.value)}
                          placeholder="klient@firma.cz"
                          className="h-9"
                        />
                        <p className="text-xs text-muted-foreground">Na tento e-mail bude odeslán onboarding formulář + nabídka.</p>
                      </div>
                    </>
                  )}

                  {/* Engagement name */}
                  <div className="space-y-1">
                    <Label className="text-xs">Název zakázky *</Label>
                    <Input
                      value={newEngName}
                      onChange={(e) => setNewEngName(e.target.value)}
                      placeholder="Např. NovýEshop.cz – Správa reklamy"
                      className="h-9"
                    />
                  </div>

                  {/* Services selection */}
                  <div className="space-y-3 p-3 rounded-md border bg-background">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium">📦 Služby</h5>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" size="sm" className="h-7 text-xs">
                            <Plus className="h-3 w-3 mr-1" />
                            Přidat službu
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="end">
                          <Command>
                            <CommandInput placeholder="Hledat službu..." />
                            <CommandList>
                              <CommandEmpty>Žádná služba nenalezena.</CommandEmpty>
                              <CommandGroup>
                                {[...services.filter(s => s.is_active)].sort((a, b) => {
                                  if (a.service_type === b.service_type) return a.name.localeCompare(b.name);
                                  return a.service_type === 'core' ? -1 : 1;
                                }).map((service) => (
                                  <CommandItem
                                    key={service.id}
                                    value={service.name}
                                    onSelect={() => {
                                      const defaultPrice = service.service_type === 'core'
                                        ? (getTierPrice(service, 'growth') ?? service.base_price ?? 0)
                                        : (service.base_price || 0);
                                      const defaults = getServiceDefaults(service.name);
                                      const detail = SERVICE_DETAILS[service.code];
                                      setNewEngServices(prev => [...prev, {
                                        service_id: service.id,
                                        name: service.name,
                                        price: defaultPrice,
                                        currency: service.currency || 'CZK',
                                        billing_type: 'monthly',
                                        selected_tier: service.service_type === 'core' ? 'growth' : null,
                                        description: detail?.tagline || service.description || '',
                                        deliverables: defaults.deliverables?.length ? defaults.deliverables : [],
                                      }]);
                                    }}
                                  >
                                    <span className="flex items-center gap-2">
                                      {service.name}
                                      <span className={cn(
                                        "text-[10px] font-medium uppercase px-1.5 py-0.5 rounded",
                                        service.service_type === 'core'
                                          ? "bg-primary/10 text-primary"
                                          : "bg-muted text-muted-foreground"
                                      )}>
                                        {service.service_type === 'core' ? 'Core' : 'Addon'}
                                      </span>
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {newEngServices.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">Zatím nepřidána žádná služba.</p>
                    )}

                    {newEngServices.map((svc, idx) => {
                      const catalogSvc = svc.service_id ? services.find(s => s.id === svc.service_id) : null;
                      const isCoreType = catalogSvc?.service_type === 'core';
                      const isExpanded = expandedNewEngServiceIdx === idx;
                      return (
                        <div key={idx} className="rounded border bg-muted/30 overflow-hidden">
                          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-end p-2">
                            <div className="space-y-1">
                              <Label className="text-xs">{svc.name}</Label>
                              {isCoreType && (
                                <Select
                                  value={svc.selected_tier || 'growth'}
                                  onValueChange={(v) => {
                                    const updated = [...newEngServices];
                                    updated[idx] = { ...updated[idx], selected_tier: v };
                                    const tierPrice = getTierPrice(catalogSvc, v);
                                    if (tierPrice != null) updated[idx].price = tierPrice;
                                    setNewEngServices(updated);
                                  }}
                                >
                                  <SelectTrigger className="h-7 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="growth">Growth</SelectItem>
                                    <SelectItem value="pro">Pro</SelectItem>
                                    <SelectItem value="elite">Elite</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Cena</Label>
                              <Input
                                type="number"
                                value={svc.price}
                                onChange={(e) => {
                                  const updated = [...newEngServices];
                                  updated[idx] = { ...updated[idx], price: Number(e.target.value) };
                                  setNewEngServices(updated);
                                }}
                                className="h-7 w-24 text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Typ</Label>
                              <Select
                                value={svc.billing_type}
                                onValueChange={(v) => {
                                  const updated = [...newEngServices];
                                  updated[idx] = { ...updated[idx], billing_type: v as 'monthly' | 'one_off' };
                                  setNewEngServices(updated);
                                }}
                              >
                                <SelectTrigger className="h-7 w-24 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="monthly">Měsíčně</SelectItem>
                                  <SelectItem value="one_off">Jednorázově</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setExpandedNewEngServiceIdx(isExpanded ? null : idx)}
                              title="Upravit popis a deliverables"
                            >
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={() => {
                                setNewEngServices(prev => prev.filter((_, i) => i !== idx));
                                if (expandedNewEngServiceIdx === idx) setExpandedNewEngServiceIdx(null);
                                else if (expandedNewEngServiceIdx !== null && expandedNewEngServiceIdx > idx) {
                                  setExpandedNewEngServiceIdx(expandedNewEngServiceIdx - 1);
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          
                          {/* Compact assignment summary when collapsed */}
                          {!isExpanded && (svc.assignments || []).length > 0 && (
                            <div className="px-2 pb-2 flex flex-wrap gap-1">
                              {(svc.assignments || []).map((asn, aIdx) => (
                                <span key={aIdx} className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5">
                                  {asn.colleague_name}
                                  <span className="text-primary/60">
                                    ({asn.cost_model === 'hourly' ? `${asn.hourly_cost || 0} Kč/h` : asn.cost_model === 'percentage' ? `${asn.percentage_of_revenue || 0}%` : `${asn.monthly_cost || 0} Kč/m`})
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* Expandable description & deliverables */}
                          {isExpanded && (
                            <div className="px-2 pb-3 pt-1 space-y-3 border-t">
                              <div className="space-y-1">
                                <Label className="text-xs font-medium">Popis služby</Label>
                                <Textarea
                                  value={svc.description || ''}
                                  onChange={(e) => {
                                    const updated = [...newEngServices];
                                    updated[idx] = { ...updated[idx], description: e.target.value };
                                    setNewEngServices(updated);
                                  }}
                                  placeholder="Krátký popis služby pro klienta..."
                                  rows={2}
                                  className="text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs font-medium">Co v rámci služby děláme (deliverables)</Label>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs gap-1"
                                    onClick={() => {
                                      const updated = [...newEngServices];
                                      updated[idx] = { 
                                        ...updated[idx], 
                                        deliverables: [...(updated[idx].deliverables || []), ''] 
                                      };
                                      setNewEngServices(updated);
                                    }}
                                  >
                                    <Plus className="h-3 w-3" /> Přidat bod
                                  </Button>
                                </div>
                                <div className="space-y-1.5">
                                  {(svc.deliverables || []).map((item, dIdx) => (
                                    <div key={dIdx} className="flex items-center gap-1.5">
                                      <span className="text-xs text-muted-foreground shrink-0">{dIdx + 1}.</span>
                                      <Input
                                        value={item}
                                        onChange={(e) => {
                                          const updated = [...newEngServices];
                                          const newDeliverables = [...(updated[idx].deliverables || [])];
                                          newDeliverables[dIdx] = e.target.value;
                                          updated[idx] = { ...updated[idx], deliverables: newDeliverables };
                                          setNewEngServices(updated);
                                        }}
                                        className="h-7 text-xs"
                                        placeholder="Deliverable..."
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 shrink-0 text-destructive hover:text-destructive"
                                        onClick={() => {
                                          const updated = [...newEngServices];
                                          const newDeliverables = (updated[idx].deliverables || []).filter((_, i) => i !== dIdx);
                                          updated[idx] = { ...updated[idx], deliverables: newDeliverables };
                                          setNewEngServices(updated);
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                  {(!svc.deliverables || svc.deliverables.length === 0) && (
                                    <p className="text-xs text-muted-foreground italic">Žádné deliverables. Klikněte na "Přidat bod".</p>
                                  )}
                                </div>
                              </div>
                              
                              {/* Colleague assignments */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs font-medium">Přiřazení kolegové</Label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button type="button" variant="ghost" size="sm" className="h-6 text-xs gap-1">
                                        <Plus className="h-3 w-3" /> Přidat kolegu
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-0" align="end">
                                      <Command>
                                        <CommandInput placeholder="Hledat kolegu..." />
                                        <CommandList>
                                          <CommandEmpty>Nenalezeno.</CommandEmpty>
                                          <CommandGroup>
                                            {colleagues.filter(c => c.status === 'active').sort((a, b) => a.full_name.localeCompare(b.full_name)).map((col) => {
                                              const alreadyAdded = (svc.assignments || []).some(a => a.colleague_id === col.id);
                                              if (alreadyAdded) return null;
                                              // Auto-detect role from position
                                              const pos = col.position.toLowerCase();
                                              let autoRole = '';
                                              if (pos.includes('video')) autoRole = 'Video Editor';
                                              else if (pos.includes('design') || pos.includes('grafik')) autoRole = 'Graphic Designer';
                                              else if (pos.includes('ppc') || pos.includes('google')) autoRole = 'PPC Specialist';
                                              else if (pos.includes('meta') || pos.includes('facebook') || pos.includes('social')) autoRole = 'Meta Ads Specialist';
                                              else if (pos.includes('seo')) autoRole = 'SEO Specialist';
                                              else if (pos.includes('sales') || pos.includes('obchod')) autoRole = 'Sales Specialist';
                                              else if (pos.includes('account') || pos.includes('pm') || pos.includes('project')) autoRole = 'Account Manager';
                                              
                                              // Look up default reward from service config
                                              const rewardRoles = catalogSvc 
                                                ? (getRewardsFromServiceConfig((catalogSvc as any).reward_config, svc.selected_tier) 
                                                  ?? getServiceRewardRecommendation(svc.name, svc.selected_tier))
                                                : getServiceRewardRecommendation(svc.name, svc.selected_tier);
                                              const matchedReward = rewardRoles?.find(r => r.role === autoRole);
                                              
                                              const defaultCostModel = matchedReward 
                                                ? (matchedReward.rewardType === 'per_credit' ? 'fixed_monthly' : matchedReward.rewardType === 'hourly' ? 'hourly' : 'fixed_monthly')
                                                : 'fixed_monthly';
                                              const defaultMonthlyCost = matchedReward && matchedReward.rewardType === 'fixed_monthly' ? matchedReward.reward : 0;
                                              const defaultHourlyCost = matchedReward && matchedReward.rewardType === 'hourly' ? matchedReward.reward : 0;

                                              return (
                                                <CommandItem
                                                  key={col.id}
                                                  value={col.full_name}
                                                  onSelect={() => {
                                                    const updated = [...newEngServices];
                                                    const newAssignment = {
                                                      colleague_id: col.id,
                                                      colleague_name: col.full_name,
                                                      role: autoRole,
                                                      cost_model: defaultCostModel as 'hourly' | 'fixed_monthly' | 'percentage',
                                                      monthly_cost: defaultMonthlyCost,
                                                      hourly_cost: defaultHourlyCost,
                                                    };
                                                    updated[idx] = {
                                                      ...updated[idx],
                                                      assignments: [...(updated[idx].assignments || []), newAssignment],
                                                    };
                                                    setNewEngServices(updated);
                                                    // Auto-expand service to show the assignment
                                                    setExpandedNewEngServiceIdx(idx);
                                                  }}
                                                >
                                                  <span className="text-xs">{col.full_name}</span>
                                                  <span className="text-[10px] text-muted-foreground ml-1">({col.position})</span>
                                                </CommandItem>
                                              );
                                            })}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                                
                                {(svc.assignments || []).length === 0 && (
                                  <p className="text-xs text-muted-foreground italic">Zatím nepřiřazen žádný kolega.</p>
                                )}
                                
                                {(svc.assignments || []).map((asn, aIdx) => (
                                  <div key={aIdx} className="flex items-center gap-2 p-1.5 rounded border bg-background">
                                    <div className="flex-1 min-w-0">
                                      <span className="text-xs font-medium truncate block">{asn.colleague_name}</span>
                                    </div>
                                    <Input
                                      value={asn.role}
                                      onChange={(e) => {
                                        const updated = [...newEngServices];
                                        const assignments = [...(updated[idx].assignments || [])];
                                        assignments[aIdx] = { ...assignments[aIdx], role: e.target.value };
                                        updated[idx] = { ...updated[idx], assignments };
                                        setNewEngServices(updated);
                                      }}
                                      placeholder="Role"
                                      className="h-6 w-28 text-[11px]"
                                    />
                                    <Select
                                      value={asn.cost_model}
                                      onValueChange={(v) => {
                                        const updated = [...newEngServices];
                                        const assignments = [...(updated[idx].assignments || [])];
                                        assignments[aIdx] = { ...assignments[aIdx], cost_model: v as any };
                                        updated[idx] = { ...updated[idx], assignments };
                                        setNewEngServices(updated);
                                      }}
                                    >
                                      <SelectTrigger className="h-6 w-24 text-[11px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="fixed_monthly">Kč/měs</SelectItem>
                                        <SelectItem value="hourly">Kč/hod</SelectItem>
                                        <SelectItem value="percentage">% z revenue</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      type="number"
                                      value={asn.cost_model === 'hourly' ? (asn.hourly_cost || 0) : asn.cost_model === 'percentage' ? (asn.percentage_of_revenue || 0) : (asn.monthly_cost || 0)}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        const updated = [...newEngServices];
                                        const assignments = [...(updated[idx].assignments || [])];
                                        if (asn.cost_model === 'hourly') {
                                          assignments[aIdx] = { ...assignments[aIdx], hourly_cost: val };
                                        } else if (asn.cost_model === 'percentage') {
                                          assignments[aIdx] = { ...assignments[aIdx], percentage_of_revenue: val };
                                        } else {
                                          assignments[aIdx] = { ...assignments[aIdx], monthly_cost: val };
                                        }
                                        updated[idx] = { ...updated[idx], assignments };
                                        setNewEngServices(updated);
                                      }}
                                      className="h-6 w-20 text-[11px]"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 shrink-0 text-destructive hover:text-destructive"
                                      onClick={() => {
                                        const updated = [...newEngServices];
                                        const assignments = (updated[idx].assignments || []).filter((_, i) => i !== aIdx);
                                        updated[idx] = { ...updated[idx], assignments };
                                        setNewEngServices(updated);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Total */}
                    {newEngServices.length > 0 && (
                      <div className="pt-2 border-t flex items-center justify-between">
                        <span className="text-sm font-medium">Celkem měsíčně:</span>
                        <span className="text-sm font-semibold text-primary">
                          {newEngServices
                            .filter(s => s.billing_type === 'monthly')
                            .reduce((sum, s) => sum + s.price, 0)
                            .toLocaleString('cs-CZ')} CZK
                        </span>
                      </div>
                    )}
                  </div>

                  {newEngIsDifferentSro ? (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Po schválení se klientovi odešle onboarding formulář na <strong>{newEngOnboardingEmail || '...'}</strong>. 
                        Klient vyplní fakturační údaje (IČO, DIČ, adresa) a kontaktní osobu. 
                        Následně se automaticky vytvoří smlouva — stejný proces jako u nového klienta.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Nová zakázka bude navázána na stávajícího klienta a jeho SRO. 
                        Po schválení se vytvoří zakázka s vybranými službami.
                      </AlertDescription>
                    </Alert>
                  )}
                  </div>
                </div>
              )}


              {/* PRICING IMPACT SECTION - for add_service, update_service_price, and expand_country */}
              {((requestType === 'add_service' && selectedServiceId) || (requestType === 'update_service_price' && selectedEngagementServiceId) || (requestType === 'expand_country' && expandRefServiceId && expandCountryCode)) && (() => {
                const selectedEng = engagements.find(e => e.id === selectedEngagementId);
                if (!selectedEng) return null;
                
                if (requestType === 'expand_country') {
                  // For expand_country, the reference service IS the selected service
                  const refEngSvc = currentEngagementServices.find(es => es.id === expandRefServiceId);
                  const refCatalogSvc = refEngSvc?.service_id ? services.find(s => s.id === refEngSvc.service_id) : null;
                  const refPrice = refEngSvc?.price || 0;
                  const calcPrice = expandFinalPrice !== null ? expandFinalPrice : Math.round(refPrice * expandMultiplier);
                  return (
                    <PricingImpactSection
                      clientId={selectedEng.client_id}
                      engagementId={selectedEngagementId}
                      proposedPrice={calcPrice}
                      selectedServiceId={refCatalogSvc?.id || ''}
                      isAddonService={false}
                      selectedTier={refEngSvc?.selected_tier || null}
                      requestType="expand_country"
                      expandMultiplier={expandMultiplier}
                      expandRefServiceId={expandRefServiceId}
                      onPriceChange={() => {}}
                      onInternalCostChange={setPricingInternalCost}
                      onSnapshotChange={setPricingSnapshot}
                      onRequiresAdminApproval={setRequiresAdminApproval}
                    />
                  );
                }
                
                const isAddon = selectedService?.service_type === 'addon';
                return (
                  <PricingImpactSection
                    clientId={selectedEng.client_id}
                    engagementId={selectedEngagementId}
                    proposedPrice={requestType === 'add_service' ? (isCreativeBoost ? cbMaxCredits * cbPricePerCredit : servicePrice) : newPrice}
                    selectedServiceId={selectedServiceId}
                    isAddonService={isAddon}
                    selectedTier={selectedTier === 'none' ? null : selectedTier}
                    requestType={requestType === 'add_service' ? 'add_service' : requestType === 'update_service_price' ? 'update_service_price' : undefined}
                    onPriceChange={(price) => {
                      if (requestType === 'add_service') setServicePrice(price);
                      else setNewPrice(price);
                    }}
                    onInternalCostChange={setPricingInternalCost}
                    onSnapshotChange={setPricingSnapshot}
                    onRequiresAdminApproval={setRequiresAdminApproval}
                  />
                );
              })()}
            </>
          )}

          {/* ===== ADD ANOTHER ITEM BUTTON (after step 3 form) ===== */}
          {selectedEngagementId && requestType && requestType !== 'bulk_edit' && bundledItems.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full border-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 text-primary font-medium"
              onClick={handleAddAnotherItem}
            >
              <Plus className="h-4 w-4 mr-2" />
              Uložit položku a přidat další
            </Button>
          )}

          {/* ===== STEP 4: Details (only after engagement + type selected OR bundled items exist) ===== */}
          {selectedEngagementId && (requestType || bundledItems.length > 0) && (
            <div className="space-y-4 pt-2 border-t">
              {/* Effective From */}
              <div className="space-y-2">
                <Label>Platnost od</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !effectiveFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {effectiveFrom ? format(effectiveFrom, 'd. MMMM yyyy', { locale: cs }) : 'Vyberte datum'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={effectiveFrom}
                      onSelect={setEffectiveFrom}
                      locale={cs}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Proration Info */}
              {prorationInfo && requestType === 'add_service' && effectiveFrom && effectiveFrom.getDate() > 1 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Poměrná fakturace:</strong> Služba začíná {format(effectiveFrom, 'd.M.', { locale: cs })} 
                    → fakturace za {format(effectiveFrom, 'MMMM', { locale: cs })}: <strong>{prorationInfo.proratedAmount.toLocaleString()} {serviceCurrency}</strong>
                    {' '}({prorationInfo.remainingDays} z {prorationInfo.daysInMonth} dní)
                  </AlertDescription>
                </Alert>
              )}

              {/* Bundle Discount - only for multi-item requests */}
              {(bundledItems.length > 0 || (bundledItems.length === 0 && requestType)) && (bundledItems.length + (requestType ? 1 : 0)) > 1 && (
                <div className="space-y-2 p-3 rounded-lg border border-dashed border-primary/40 bg-primary/5">
                  <Label className="flex items-center gap-2">
                    🏷️ Sleva za balíček<InfoTip text="Procentuální sleva z celkové ceny, pokud klient přijme všechny položky najednou. Maximum 50 %." />
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      value={bundleDiscountPercent}
                      onChange={(e) => setBundleDiscountPercent(Math.min(50, Math.max(0, Number(e.target.value))))}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                    {bundleDiscountPercent > 0 && (() => {
                      // Calculate total price of all items
                      let totalPrice = 0;
                      const allCurrentItems = [...bundledItems];
                      if (requestType) {
                        const built = buildCurrentProposedChanges();
                        if (built) {
                          const c = built.proposed_changes as any;
                          if (requestType === 'add_service' || requestType === 'expand_country') totalPrice += c.price || 0;
                          else if (requestType === 'update_service_price') totalPrice += (c.new_price || 0) - (c.old_price || 0);
                        }
                      }
                      for (const item of allCurrentItems) {
                        const c = item.proposed_changes as any;
                        if (item.request_type === 'add_service' || item.request_type === 'expand_country') totalPrice += c.price || 0;
                        else if (item.request_type === 'update_service_price') totalPrice += (c.new_price || 0) - (c.old_price || 0);
                      }
                      const discountAmount = Math.round(totalPrice * bundleDiscountPercent / 100);
                      const finalPrice = totalPrice - discountAmount;
                      return (
                        <div className="text-sm">
                          <span className="text-muted-foreground line-through">{totalPrice.toLocaleString('cs-CZ')}</span>
                          {' → '}
                          <span className="font-semibold text-primary">{finalPrice.toLocaleString('cs-CZ')} Kč/měs</span>
                          <span className="text-xs text-muted-foreground ml-1">(-{discountAmount.toLocaleString('cs-CZ')})</span>
                        </div>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-muted-foreground">Sleva se aplikuje na celkovou cenu balíčku, pokud klient přijme všechny položky najednou.</p>
                </div>
              )}

              {/* Upsold By (commission tracking) */}
              <div className="space-y-2">
                <Label>Kdo dohodl (pro provizi)<InfoTip text="Kolega, který dohodl upsell s klientem. Dostane 10 % z nového měsíčního fee jako měsíční provizi." /></Label>
                <Select value={upsoldById} onValueChange={setUpsoldById}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte kolegu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nikdo (bez provize)</SelectItem>
                    {colleagues.filter(c => c.status === 'active').map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Commission calculation */}
                {upsoldById !== 'none' && (() => {
                  // Calculate commission base from current item
                  let currentItemBase = 0;
                  if (requestType) {
                    currentItemBase = requestType === 'expand_country'
                      ? (() => {
                          const refSvc = currentEngagementServices.find(es => es.id === expandRefServiceId);
                          const refPrice = refSvc?.price || 0;
                          return expandFinalPrice !== null ? expandFinalPrice : Math.round(refPrice * expandMultiplier);
                        })()
                      : requestType === 'add_service'
                      ? (isCreativeBoost ? cbMaxCredits * cbPricePerCredit : servicePrice)
                      : requestType === 'update_service_price'
                        ? Math.max(0, newPrice - (currentEngagementServices.find(es => es.id === selectedEngagementServiceId)?.price || 0))
                        : requestType === 'add_assignment'
                          ? (costModel === 'fixed_monthly' ? monthlyCost : costModel === 'hourly' ? hourlyCost : 0)
                          : 0;
                  }

                  // Sum bundled items' prices
                  let bundledBase = 0;
                  for (const item of bundledItems) {
                    const pc = item.proposed_changes as any;
                    if (item.request_type === 'add_service' || item.request_type === 'expand_country') {
                      bundledBase += pc.price || 0;
                    } else if (item.request_type === 'update_service_price') {
                      bundledBase += Math.max(0, (pc.new_price || 0) - (pc.old_price || 0));
                    } else if (item.request_type === 'add_assignment') {
                      bundledBase += pc.monthly_cost || pc.hourly_cost || 0;
                    }
                  }

                  const totalBase = currentItemBase + bundledBase;
                  
                  // Apply bundle discount if set
                  const discountedBase = bundleDiscountPercent > 0 && bundledItems.length > 0
                    ? Math.round(totalBase * (1 - bundleDiscountPercent / 100))
                    : totalBase;
                  
                  const commission = Math.round(discountedBase * 0.1);
                  const upsoldColleague = colleagues.find(c => c.id === upsoldById);
                  if (totalBase <= 0) return null;
                  return (
                    <div className="rounded-md border bg-primary/5 p-3 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Jednorázová provize za upsell (10 %)
                        <InfoTip text="Jednorázová provize = 10 % z nového měsíčního fee. Vyplácí se v prvním plném měsíci fakturace." />
                      </p>
                      <p className="text-lg font-bold text-primary">
                        {commission.toLocaleString('cs-CZ')} CZK
                      </p>
                      <p className="text-xs text-muted-foreground">
                        = 10 % z {discountedBase.toLocaleString('cs-CZ')} CZK
                        {bundleDiscountPercent > 0 && bundledItems.length > 0 && (
                          <span> (po slevě {bundleDiscountPercent} %)</span>
                        )}
                        {upsoldColleague && <> → <span className="font-medium text-foreground">{upsoldColleague.full_name}</span></>}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label>Poznámka</Label>
                <Textarea 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Např. Klient požádal o rozšíření služeb po meetingu..."
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => { clearDraft(); onOpenChange(false); }}>
            Zrušit
          </Button>
          {!isEditMode && (
            <Button 
              variant="secondary"
              onClick={() => handleSubmit(true)} 
              disabled={isCreating || !selectedEngagementId}
            >
              <FileText className="h-4 w-4 mr-2" />
              {isCreating ? 'Ukládám...' : 'Uložit jako draft'}
            </Button>
          )}
          <Button 
            onClick={() => handleSubmit(false)} 
            disabled={(isCreating || isUpdating) || !selectedEngagementId || (!requestType && bundledItems.length === 0)}
          >
            {isEditMode
              ? (isUpdating ? 'Ukládám...' : 'Uložit změny')
              : (isCreating ? 'Odesílám...' : (bundledItems.length > 0 
                  ? `Odeslat nabídku (${bundledItems.length + (requestType ? 1 : 0)} položek)` 
                  : 'Odeslat ke schválení administrátorovi'))}
          </Button>
        </DialogFooter>
       </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}
