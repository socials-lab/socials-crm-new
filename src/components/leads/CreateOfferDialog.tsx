import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AuditEditor } from './AuditEditor';
import { Separator } from '@/components/ui/separator';
import { Loader2, Copy, ExternalLink, Check, TrendingUp, Plus, X, History, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCRMData } from '@/hooks/useCRMData';
import { toast } from 'sonner';
import type { Lead, Service } from '@/types/crm';
import type { PublicOfferService, PublicOffer, PortfolioLink } from '@/types/publicOffer';
import { addPublicOffer, getOffersByLeadId, getPublicOfferByToken, updatePublicOffer } from '@/data/publicOffersData';
import { EditableOfferServiceCard } from './EditableOfferServiceCard';
import { mergeWithDefaults } from '@/constants/serviceDefaults';
import { supabase } from '@/integrations/supabase/client';
import { getServiceDetail } from '@/constants/serviceDetails';
import { getRewardsFromServiceConfig, getServiceRewardRecommendation } from '@/constants/serviceRewards';
import { useAuth } from '@/hooks/useAuth';
import { buildAppUrl } from '@/utils/appUrl';
import {
  clearOfferDraftRef,
  getOfferDraftKey,
  notifyOfferDraftChanged,
  setOfferDraftRef,
} from '@/utils/offerDraft';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

// Map enrichment platform keywords to service codes
const PLATFORM_TO_SERVICE_CODES: Record<string, string[]> = {
  'meta': ['SOCIALS_BOOST'],
  'facebook': ['SOCIALS_BOOST'],
  'instagram': ['SOCIALS_BOOST'],
  'google ads': ['PPC_BOOST'],
  'google': ['PPC_BOOST'],
  'sklik': ['PPC_BOOST'],
  'seznam': ['PPC_BOOST'],
  'tiktok': ['TIKTOK_ADS'],
  'heureka': ['HEUREKA_ZBOZI'],
  'zbozi': ['HEUREKA_ZBOZI'],
  'zboží': ['HEUREKA_ZBOZI'],
  'glami': ['GLAMI'],
  'favi': ['FAVI'],
  'seo': ['AI_SEO'],
  'creative': ['CREATIVE_BOOST'],
  'kreativa': ['CREATIVE_BOOST'],
  'video': ['VIDEO_BOOST'],
  'performance': ['PERFORMANCE_BOOST'],
};

function suggestServiceCodes(lead: Lead): string[] {
  const codes = new Set<string>();
  
  // Check enrichment_platform
  const platform = (lead.enrichment_platform || '').toLowerCase();
  // Check enrichment_services_needed
  const servicesNeeded = (lead.enrichment_services_needed || '').toLowerCase();
  // Check access_request_platforms
  const accessPlatforms = (lead.access_request_platforms || []).map(p => p.toLowerCase());
  
  const allText = [platform, servicesNeeded, ...accessPlatforms].join(' ');
  
  for (const [keyword, serviceCodes] of Object.entries(PLATFORM_TO_SERVICE_CODES)) {
    if (allText.includes(keyword)) {
      serviceCodes.forEach(c => codes.add(c));
    }
  }
  
  // If both Meta and Google are detected, suggest Performance Boost instead of individual
  if (codes.has('SOCIALS_BOOST') && codes.has('PPC_BOOST')) {
    codes.delete('SOCIALS_BOOST');
    codes.delete('PPC_BOOST');
    codes.add('PERFORMANCE_BOOST');
  }
  
  // Always suggest Creative Boost if any core service is present
  if (codes.has('SOCIALS_BOOST') || codes.has('PPC_BOOST') || codes.has('PERFORMANCE_BOOST')) {
    codes.add('CREATIVE_BOOST');
  }
  
  return Array.from(codes);
}

function buildServiceFromCatalog(catalogService: Service, lead: Lead): PublicOfferService {
  const constantDetail = getServiceDetail(catalogService.code);
  const defaultTier = catalogService.service_type === 'core' ? 'growth' : null;
  const isCreativeBoost = catalogService.code === 'CREATIVE_BOOST';
  const defaultCreativeBoostCredits = 30;
  const defaultCreativeBoostPricePerCredit = 400;
  
  let price = catalogService.base_price || 0;
  let originalPrice = price;
  if (constantDetail?.tierPricing && defaultTier) {
    const tierPrice = constantDetail.tierPricing[defaultTier as keyof typeof constantDetail.tierPricing];
    if (tierPrice?.price !== null && tierPrice?.price !== undefined) {
      price = tierPrice.price;
      originalPrice = tierPrice.originalPrice ?? tierPrice.price;
    }
  }

  const description = catalogService.description || constantDetail?.tagline || '';
  const merged = mergeWithDefaults(catalogService.name, null, null, null, null, null);

  if (isCreativeBoost) {
    price = defaultCreativeBoostCredits * defaultCreativeBoostPricePerCredit;
    originalPrice = price;
  }

  return {
    id: crypto.randomUUID(),
    service_id: catalogService.id,
    name: catalogService.name,
    description,
    offer_description: null,
    selected_tier: defaultTier,
    price,
    original_price: originalPrice,
    discount_reason: '',
    currency: lead.currency,
    billing_type: 'monthly',
    service_type: catalogService.service_type,
    deliverables: merged.deliverables,
    frequency: merged.frequency,
    turnaround: merged.turnaround,
    requirements: merged.requirements,
    start_timeline: '',
    detailed_sections: merged.detailed_sections,
    ...(isCreativeBoost && {
      creative_boost_credits: defaultCreativeBoostCredits,
      creative_boost_price_per_credit: defaultCreativeBoostPricePerCredit,
    }),
  };
}

interface CreateOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onSuccess: (token: string, offerUrl: string, syncData?: { services: PublicOfferService[]; introDiscountPercent?: number; introDiscountMonths?: number; cbCredits?: number; cbPricePerCredit?: number }) => void;
  existingOffer?: PublicOffer;
}

interface OfferDraftData {
  auditSummary: string;
  auditHtml: string;
  recommendationIntro: string;
  customNote: string;
  loomUrl: string;
  validUntil: string;
  portfolioLinks: PortfolioLink[];
  monthlyDiscountPercent: number;
  discountScope: 'core_only' | 'all_services';
  introDiscountPercent: number;
  introDiscountMonths: number;
  cbCredits: number;
  cbPricePerCredit: number;
  editableServices: PublicOfferService[];
  rewardOverrides: Record<string, { role: string; reward: number; rewardType?: string }[]>;
  hideReportingSection?: boolean;
  savedAt: number;
}

function stripImagesFromHtml(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, '');
}

function saveOfferDraft(key: string, data: OfferDraftData): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to auto-save offer draft:', error);
  }
}

function loadOfferDraft(key: string): OfferDraftData | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as OfferDraftData;
  } catch {
    return null;
  }
}

function clearOfferDraft(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // noop
  }
}

function generateToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Default portfolio links that can be added
const DEFAULT_PORTFOLIO_OPTIONS: Omit<PortfolioLink, 'id'>[] = [
  { title: 'Case Study: E-shop Fashion Brand', url: 'https://socials.cz/#pripadove-studie', type: 'case_study' },
  { title: 'Ukázka kampaní pro B2B klienty', url: 'https://www.canva.com/design/example2', type: 'presentation' },
  { title: 'Reference od klientů', url: 'https://socials.cz/reference', type: 'reference' },
];

export function CreateOfferDialog({ open, onOpenChange, lead, onSuccess, existingOffer }: CreateOfferDialogProps) {
  const { services, colleagues } = useCRMData();
  const { user } = useAuth();
  const initializedFormKeyRef = useRef<string>('');
  const [resolvedExistingOffer, setResolvedExistingOffer] = useState<PublicOffer | null>(null);
  const [isLoadingExistingOffer, setIsLoadingExistingOffer] = useState(false);
  const offerForEdit = existingOffer || resolvedExistingOffer;
  const isEditMode = !!offerForEdit;
  const [auditSummary, setAuditSummary] = useState('');
  const [auditHtml, setAuditHtml] = useState('');
  const [recommendationIntro, setRecommendationIntro] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [loomUrl, setLoomUrl] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [portfolioLinks, setPortfolioLinks] = useState<PortfolioLink[]>(
    DEFAULT_PORTFOLIO_OPTIONS.map((p, idx) => ({ ...p, id: `portfolio-${idx}` }))
  );
  const [monthlyDiscountPercent, setMonthlyDiscountPercent] = useState(0);
  const [discountScope, setDiscountScope] = useState<'core_only' | 'all_services'>('core_only');
  const [introDiscountPercent, setIntroDiscountPercent] = useState(0);
  const [introDiscountMonths, setIntroDiscountMonths] = useState(3);
  const [cbCredits, setCbCredits] = useState(30);
  const [cbPricePerCredit, setCbPricePerCredit] = useState(400);
  const [isCreating, setIsCreating] = useState(false);
  // Editable reward overrides per service: keyed by service_id
  const [rewardOverrides, setRewardOverrides] = useState<Record<string, { role: string; reward: number; rewardType?: string }[]>>({});
  const [createdOfferUrl, setCreatedOfferUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [hideReportingSection, setHideReportingSection] = useState(false);
  
  // Editable services state
  const [editableServices, setEditableServices] = useState<PublicOfferService[]>([]);
  const [restoredDraftAt, setRestoredDraftAt] = useState<number | null>(null);

  const isCreativeBoostService = useCallback((service: PublicOfferService) => {
    const catalogService = services.find((s) => s.id === service.service_id);
    return (
      catalogService?.code === 'CREATIVE_BOOST'
      || service.name.toLowerCase().includes('creative boost')
      || service.creative_boost_credits !== null && service.creative_boost_credits !== undefined
      || service.creative_boost_price_per_credit !== null && service.creative_boost_price_per_credit !== undefined
    );
  }, [services]);

  const applyCreativeBoostStateFromServices = useCallback((serviceList: PublicOfferService[]) => {
    const cbService = serviceList.find(isCreativeBoostService);
    if (!cbService) return;

    const nextCredits = Number.isFinite(cbService.creative_boost_credits as number) && Number(cbService.creative_boost_credits) > 0
      ? Number(cbService.creative_boost_credits)
      : 30;
    const nextPricePerCredit = Number.isFinite(cbService.creative_boost_price_per_credit as number) && Number(cbService.creative_boost_price_per_credit) >= 0
      ? Number(cbService.creative_boost_price_per_credit)
      : (nextCredits > 0 && Number.isFinite(cbService.price) ? Math.round(cbService.price / nextCredits) : 400);

    setCbCredits(nextCredits);
    setCbPricePerCredit(nextPricePerCredit);
  }, [isCreativeBoostService]);

  const draftScopeKey = useMemo(() => (offerForEdit ? `offer-${offerForEdit.id}` : `lead-${lead.id}`), [offerForEdit, lead.id]);
  const draftKey = useMemo(() => getOfferDraftKey(draftScopeKey), [draftScopeKey]);

  const applyDraft = useCallback((draft: OfferDraftData) => {
    setAuditSummary(draft.auditSummary || '');
    setAuditHtml(draft.auditHtml || '');
    setRecommendationIntro(draft.recommendationIntro || '');
    setCustomNote(draft.customNote || '');
    setLoomUrl(draft.loomUrl || '');
    setValidUntil(draft.validUntil || '');
    setPortfolioLinks(Array.isArray(draft.portfolioLinks) && draft.portfolioLinks.length > 0
      ? draft.portfolioLinks
      : DEFAULT_PORTFOLIO_OPTIONS.map((p, idx) => ({ ...p, id: `portfolio-${idx}` }))
    );
    setMonthlyDiscountPercent(Number.isFinite(draft.monthlyDiscountPercent) ? draft.monthlyDiscountPercent : 0);
    setDiscountScope(draft.discountScope === 'all_services' ? 'all_services' : 'core_only');
    setIntroDiscountPercent(Number.isFinite(draft.introDiscountPercent) ? draft.introDiscountPercent : 0);
    setIntroDiscountMonths(Number.isFinite(draft.introDiscountMonths) ? draft.introDiscountMonths : 3);
    setCbCredits(Number.isFinite(draft.cbCredits) ? Math.max(1, draft.cbCredits) : 30);
    setCbPricePerCredit(Number.isFinite(draft.cbPricePerCredit) ? Math.max(0, draft.cbPricePerCredit) : 400);
    setEditableServices(Array.isArray(draft.editableServices) ? draft.editableServices : []);
    setRewardOverrides(draft.rewardOverrides && typeof draft.rewardOverrides === 'object' ? draft.rewardOverrides : {});
    setHideReportingSection(draft.hideReportingSection === true);
    setRestoredDraftAt(typeof draft.savedAt === 'number' ? draft.savedAt : Date.now());
  }, []);

  // Get current user's colleague record
  const currentColleague = colleagues.find((c) => c.profile_id === user?.id && c.status === 'active');

  // Initialize from existing offer (edit mode) or lead services
  useEffect(() => {
    if (!open) {
      setResolvedExistingOffer(null);
      setIsLoadingExistingOffer(false);
      return;
    }
    if (existingOffer) {
      setResolvedExistingOffer(null);
      setIsLoadingExistingOffer(false);
      return;
    }

    let cancelled = false;

    async function loadExistingOffer() {
      setIsLoadingExistingOffer(true);
      try {
        let foundOffer: PublicOffer | undefined;
        if (lead.offer_token) {
          foundOffer = await getPublicOfferByToken(lead.offer_token);
        } else {
          const offers = await getOffersByLeadId(lead.id);
          foundOffer = offers[0];
        }
        if (!cancelled) {
          setResolvedExistingOffer(foundOffer || null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingExistingOffer(false);
        }
      }
    }

    loadExistingOffer();

    return () => {
      cancelled = true;
    };
  }, [open, existingOffer, lead.id, lead.offer_token]);

  useEffect(() => {
    if (!open) {
      initializedFormKeyRef.current = '';
      setRestoredDraftAt(null);
      return;
    }
    if (isLoadingExistingOffer) return;

    const initKey = offerForEdit ? `offer:${offerForEdit.id}` : `lead:${lead.id}`;
    if (initializedFormKeyRef.current === initKey) return;

    // Edit mode: always load from existing offer, ignore any stale draft
    if (offerForEdit) {
      setAuditSummary(offerForEdit.audit_summary || '');
      setAuditHtml(offerForEdit.audit_html || '');
      setRecommendationIntro(offerForEdit.recommendation_intro || '');
      setCustomNote(offerForEdit.custom_note || '');
      setLoomUrl(offerForEdit.loom_url || '');
      setHideReportingSection(offerForEdit.content_blocks_snapshot?.reporting?.content?.hide_section === true);
      setValidUntil(offerForEdit.valid_until || '');
      setEditableServices(offerForEdit.services);
      applyCreativeBoostStateFromServices(offerForEdit.services);
      setMonthlyDiscountPercent(offerForEdit.monthly_discount_percent || 0);
      setDiscountScope(offerForEdit.discount_scope || 'core_only');
      setIntroDiscountPercent(offerForEdit.intro_discount_percent || 0);
      setIntroDiscountMonths(offerForEdit.intro_discount_months || 3);
      if (offerForEdit.portfolio_links?.length > 0) {
        setPortfolioLinks(offerForEdit.portfolio_links);
      }
      initializedFormKeyRef.current = initKey;
      return;
    }
    
    // Create mode only: restore autosaved draft if available
    const savedDraft = loadOfferDraft(draftKey);
    if (savedDraft) {
      applyDraft(savedDraft);
      initializedFormKeyRef.current = initKey;
      return;
    }

    // If lead already has potential_services, use those
    if (lead.potential_services && lead.potential_services.length > 0) {
      const initialServices: PublicOfferService[] = lead.potential_services.map(ls => {
        const serviceDetails = services.find(s => s.id === ls.service_id);

        let resolvedPrice = ls.price;
        let resolvedOriginalPrice = ls.price;
        const constantDetail = serviceDetails ? getServiceDetail(serviceDetails.code) : undefined;
        if (constantDetail?.tierPricing && ls.selected_tier) {
          const tierKey = ls.selected_tier as keyof typeof constantDetail.tierPricing;
          const constantTierPrice = constantDetail.tierPricing[tierKey];
          if (constantTierPrice?.price !== null && constantTierPrice?.price !== undefined) {
            resolvedPrice = constantTierPrice.price;
            resolvedOriginalPrice = constantTierPrice.originalPrice ?? constantTierPrice.price;
          }
        }

        const description = serviceDetails?.description || constantDetail?.tagline || '';
        const merged = mergeWithDefaults(ls.name, 
          serviceDetails?.default_deliverables, null, null, null, null);

        return {
          id: ls.id,
          service_id: ls.service_id,
          name: ls.name,
          description,
          offer_description: null,
          selected_tier: ls.selected_tier,
          price: resolvedPrice,
          original_price: resolvedOriginalPrice,
          discount_reason: '',
          currency: ls.currency,
          billing_type: ls.billing_type,
          service_type: serviceDetails?.service_type,
          deliverables: merged.deliverables,
          frequency: merged.frequency,
          turnaround: merged.turnaround,
          requirements: merged.requirements,
          start_timeline: '',
          detailed_sections: merged.detailed_sections,
        };
      });
      setEditableServices(initialServices);
      applyCreativeBoostStateFromServices(initialServices);
      initializedFormKeyRef.current = initKey;
      return;
    }
    
    // Otherwise, auto-suggest services based on lead's channels/platforms
    if (services.length === 0) return;
    const suggestedCodes = suggestServiceCodes(lead);
    if (suggestedCodes.length > 0) {
      const suggested: PublicOfferService[] = [];
      for (const code of suggestedCodes) {
        const catalogService = services.find(s => s.code === code && s.is_active);
        if (catalogService) {
          suggested.push(buildServiceFromCatalog(catalogService, lead));
        }
      }
      setEditableServices(suggested);
      applyCreativeBoostStateFromServices(suggested);
    }
    initializedFormKeyRef.current = initKey;
  }, [open, lead, lead.potential_services, services, offerForEdit, isLoadingExistingOffer, draftKey, applyDraft, applyCreativeBoostStateFromServices]);

  useEffect(() => {
    const computedPrice = Math.max(0, cbCredits * cbPricePerCredit);
    setEditableServices((prev) => {
      let changed = false;
      const next = prev.map((service) => {
        if (!isCreativeBoostService(service)) return service;

        const nextService: PublicOfferService = {
          ...service,
          price: computedPrice,
          original_price: computedPrice,
          discount_reason: '',
          creative_boost_credits: cbCredits,
          creative_boost_price_per_credit: cbPricePerCredit,
        };

        if (
          service.price === nextService.price
          && (service.original_price ?? null) === (nextService.original_price ?? null)
          && (service.discount_reason || '') === (nextService.discount_reason || '')
          && (service.creative_boost_credits ?? null) === (nextService.creative_boost_credits ?? null)
          && (service.creative_boost_price_per_credit ?? null) === (nextService.creative_boost_price_per_credit ?? null)
        ) {
          return service;
        }

        changed = true;
        return nextService;
      });
      return changed ? next : prev;
    });
  }, [cbCredits, cbPricePerCredit, isCreativeBoostService]);

  useEffect(() => {
    if (!open || !initializedFormKeyRef.current || createdOfferUrl) return;
    const timer = setTimeout(() => {
      const draftToSave: OfferDraftData = {
        auditSummary,
        auditHtml: stripImagesFromHtml(auditHtml || ''),
        recommendationIntro,
        customNote,
        loomUrl,
        validUntil,
        portfolioLinks,
        monthlyDiscountPercent,
        discountScope,
        introDiscountPercent,
        introDiscountMonths,
        cbCredits,
        cbPricePerCredit,
        editableServices,
        rewardOverrides,
        hideReportingSection,
        savedAt: Date.now(),
      };
      saveOfferDraft(draftKey, draftToSave);
      setOfferDraftRef(lead.id, draftKey);
      notifyOfferDraftChanged(lead.id);
    }, 500);

    return () => clearTimeout(timer);
  }, [
    open,
    createdOfferUrl,
    draftKey,
    auditSummary,
    auditHtml,
    recommendationIntro,
    customNote,
    loomUrl,
    validUntil,
    portfolioLinks,
    monthlyDiscountPercent,
    discountScope,
    introDiscountPercent,
    introDiscountMonths,
    cbCredits,
    cbPricePerCredit,
    editableServices,
    rewardOverrides,
    hideReportingSection,
  ]);

  useEffect(() => {
    if (!open || !initializedFormKeyRef.current || createdOfferUrl) return;
    const handleBeforeUnload = () => {
      saveOfferDraft(draftKey, {
        auditSummary,
        auditHtml: stripImagesFromHtml(auditHtml || ''),
        recommendationIntro,
        customNote,
        loomUrl,
        validUntil,
        portfolioLinks,
        monthlyDiscountPercent,
        discountScope,
        introDiscountPercent,
        introDiscountMonths,
        cbCredits,
        cbPricePerCredit,
        editableServices,
        rewardOverrides,
        hideReportingSection,
        savedAt: Date.now(),
      });
      setOfferDraftRef(lead.id, draftKey);
      notifyOfferDraftChanged(lead.id);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [
    open,
    createdOfferUrl,
    draftKey,
    auditSummary,
    auditHtml,
    recommendationIntro,
    customNote,
    loomUrl,
    validUntil,
    portfolioLinks,
    monthlyDiscountPercent,
    discountScope,
    introDiscountPercent,
    introDiscountMonths,
    cbCredits,
    cbPricePerCredit,
    editableServices,
    rewardOverrides,
    hideReportingSection,
  ]);

  // Initialize reward overrides from catalog when services change
  useEffect(() => {
    if (editableServices.length === 0) return;
    setRewardOverrides(prev => {
      const next = { ...prev };
      editableServices.forEach(es => {
        if (next[es.service_id]) return; // already has overrides
        const catalogService = services.find(s => s.id === es.service_id);
        if (!catalogService) return;
        let roles = getRewardsFromServiceConfig(catalogService.reward_config as Record<string, unknown>, es.selected_tier);
        if (!roles || roles.length === 0) {
          roles = getServiceRewardRecommendation(es.name, es.selected_tier);
        }
        if (roles && roles.length > 0) {
          next[es.service_id] = roles.map(r => ({
            role: r.role,
            reward: r.reward,
            rewardType: r.rewardType || (r as { reward_type?: string }).reward_type,
          }));
        } else {
          next[es.service_id] = [];
        }
      });
      return next;
    });
  }, [editableServices, services]);

  const totals = useMemo(() => {
    // Helper: get effective monthly price for a service (handles CB credit-based pricing)
    const getEffectiveMonthlyPrice = (s: PublicOfferService) => {
      const catalogService = services.find(cs => cs.id === s.service_id);
      if (catalogService?.code === 'CREATIVE_BOOST') {
        return cbCredits * cbPricePerCredit;
      }
      const variantsTotal = (s.country_variants || []).reduce((sum, v) => sum + v.price, 0);
      return s.price + variantsTotal;
    };

    const coreMonthly = editableServices
      .filter(s => s.billing_type === 'monthly' && s.service_type === 'core')
      .reduce((sum, s) => sum + getEffectiveMonthlyPrice(s), 0);
    const addonMonthly = editableServices
      .filter(s => s.billing_type === 'monthly' && s.service_type !== 'core')
      .reduce((sum, s) => sum + getEffectiveMonthlyPrice(s), 0);
    const monthly = coreMonthly + addonMonthly;
    const oneOff = editableServices
      .filter(s => s.billing_type === 'one_off')
      .reduce((sum, s) => sum + s.price, 0);
    const totalOriginal = editableServices.reduce((sum, s) => {
      const catalogService = services.find(cs => cs.id === s.service_id);
      if (catalogService?.code === 'CREATIVE_BOOST') {
        return sum + cbCredits * cbPricePerCredit;
      }
      const variantsTotal = (s.country_variants || []).reduce((sv, v) => sv + v.price, 0);
      return sum + (s.original_price || s.price) + variantsTotal;
    }, 0);
    const totalFinal = editableServices.reduce((sum, s) => sum + getEffectiveMonthlyPrice(s), 0);
    const totalDiscount = totalOriginal - totalFinal;
    // Discount based on scope
    const discountBase = discountScope === 'all_services' ? monthly : coreMonthly;
    const discountedBase = monthlyDiscountPercent > 0 
      ? Math.round(discountBase * (1 - monthlyDiscountPercent / 100)) 
      : discountBase;
    const monthlyDiscountAmount = discountBase - discountedBase;
    const monthlyAfterDiscount = discountScope === 'all_services' 
      ? discountedBase 
      : discountedBase + addonMonthly;

    // Calculate internal costs from editable reward overrides
    let totalInternalCost = 0;
    const serviceCosts: { serviceId: string; name: string; cost: number; revenue: number; roles: { role: string; reward: number; rewardType?: string }[] }[] = [];
    
    editableServices.forEach(es => {
      const catalogService = services.find(s => s.id === es.service_id);
      if (!catalogService) return;
      
      const isCB = catalogService.code === 'CREATIVE_BOOST';
      const serviceRevenue = getEffectiveMonthlyPrice(es);
      const overrides = rewardOverrides[es.service_id] || [];
      const countryVariants = es.country_variants || [];
      
      // Calculate multiplier for country variants cost scaling
      // Country variants add proportional internal costs based on their price ratio to base
      const variantCostMultiplier = es.price > 0
        ? 1 + countryVariants.reduce((sum, v) => sum + v.multiplier, 0)
        : 1;
      
      if (overrides.length > 0) {
        let svcCost = 0;
        const roleDetails: { role: string; reward: number; rewardType?: string }[] = [];
        overrides.forEach(r => {
          const baseReward = r.rewardType === 'per_credit' ? r.reward * cbCredits : r.reward;
          // Scale reward by country variant multiplier (base + variants)
          const effectiveReward = Math.round(baseReward * variantCostMultiplier);
          svcCost += effectiveReward;
          roleDetails.push({ role: r.role, reward: effectiveReward, rewardType: r.rewardType });
        });
        totalInternalCost += svcCost;
        const variantLabel = countryVariants.length > 0 ? ` (${variantCostMultiplier.toFixed(1)}×)` : '';
        serviceCosts.push({ serviceId: es.service_id, name: isCB ? `${es.name} (${cbCredits} kr. × ${cbPricePerCredit} Kč)` : `${es.name}${variantLabel}`, cost: svcCost, revenue: serviceRevenue, roles: roleDetails });
      } else {
        serviceCosts.push({ serviceId: es.service_id, name: isCB ? `${es.name} (${cbCredits} kreditů)` : es.name, cost: 0, revenue: serviceRevenue, roles: [] });
      }
    });

    const revenue = monthlyAfterDiscount;
    // Waterfall: intro discount applies ON TOP of bundle discount
    const introAdjustedRevenue = introDiscountPercent > 0
      ? Math.round(revenue * (1 - introDiscountPercent / 100))
      : revenue;
    const margin = revenue > 0 ? ((revenue - totalInternalCost) / revenue) * 100 : 0;
    const introMargin = introAdjustedRevenue > 0 ? ((introAdjustedRevenue - totalInternalCost) / introAdjustedRevenue) * 100 : 0;

    return { monthly, coreMonthly, addonMonthly, oneOff, totalOriginal, totalFinal, totalDiscount, monthlyAfterDiscount, monthlyDiscountAmount, totalInternalCost, serviceCosts, margin, introMargin, introAdjustedRevenue };
  }, [editableServices, monthlyDiscountPercent, discountScope, introDiscountPercent, services, cbCredits, cbPricePerCredit, rewardOverrides]);

  const handleUpdateService = (index: number, updated: PublicOfferService) => {
    setEditableServices(prev => 
      prev.map((s, i) => i === index ? updated : s)
    );
  };

  const handleRemoveService = (index: number) => {
    setEditableServices(prev => prev.filter((_, i) => i !== index));
  };

  type OfferContentSnapshot = Record<string, {
    section_key?: string;
    title?: string | null;
    subtitle?: string | null;
    content?: Record<string, unknown>;
  }>;

  const applyReportingVisibility = useCallback((snapshot: OfferContentSnapshot): OfferContentSnapshot => {
    const next: OfferContentSnapshot = { ...snapshot };
    const reporting = next.reporting ? { ...next.reporting } : { section_key: 'reporting', title: null, subtitle: null, content: {} };
    const reportingContent = typeof reporting.content === 'object' && reporting.content !== null
      ? { ...reporting.content }
      : {};

    if (hideReportingSection) {
      reportingContent.hide_section = true;
    } else {
      delete reportingContent.hide_section;
      delete reportingContent.hidden;
    }

    reporting.content = reportingContent;
    next.reporting = reporting;
    return next;
  }, [hideReportingSection]);

  const handleCreate = async () => {
    if (editableServices.length === 0) {
      toast.error('Přidejte alespoň jednu službu do nabídky');
      return;
    }

    setIsCreating(true);

    try {
      const leadOwner = colleagues.find(c => c.id === lead.owner_id);
      const now = new Date().toISOString();

      if (isEditMode && offerForEdit) {
        // Edit mode: update existing offer with history
        await updatePublicOffer(offerForEdit.token, {
          audit_summary: auditSummary.trim() || null,
          audit_html: auditHtml.trim() || null,
          recommendation_intro: recommendationIntro.trim() || null,
          custom_note: customNote.trim() || null,
          loom_url: loomUrl.trim() || null,
          services: editableServices,
          portfolio_links: portfolioLinks,
          total_price: totals.monthlyAfterDiscount + totals.oneOff,
          monthly_discount_percent: monthlyDiscountPercent > 0 ? monthlyDiscountPercent : undefined,
          discount_scope: monthlyDiscountPercent > 0 ? discountScope : undefined,
          intro_discount_percent: introDiscountPercent > 0 ? introDiscountPercent : undefined,
          intro_discount_months: introDiscountPercent > 0 ? introDiscountMonths : undefined,
          valid_until: validUntil || null,
          content_blocks_snapshot: applyReportingVisibility((offerForEdit.content_blocks_snapshot || {}) as OfferContentSnapshot),
          owner_name: leadOwner?.full_name || undefined,
          owner_email: leadOwner?.email || undefined,
          owner_phone: leadOwner?.phone || undefined,
        }, undefined, {
          changedBy: currentColleague?.id || null,
        });

        const offerUrl = buildAppUrl(`/offer/${offerForEdit.token}`);
        clearOfferDraft(draftKey);
        clearOfferDraftRef(lead.id);
        notifyOfferDraftChanged(lead.id);
        setCreatedOfferUrl(offerUrl);
        toast.success('Nabídka byla aktualizována!');
        const syncData = {
          services: editableServices,
          introDiscountPercent: introDiscountPercent > 0 ? introDiscountPercent : undefined,
          introDiscountMonths: introDiscountPercent > 0 ? introDiscountMonths : undefined,
          cbCredits: cbCredits,
          cbPricePerCredit: cbPricePerCredit,
        };
        onSuccess(offerForEdit.token, offerUrl, syncData);
      } else {
        // Create mode: hard guard against accidental token rotation.
        // If an offer already exists for this lead, update it in place.
        // Prefer active offer; if only inactive exists, reactivate it.
        const existingByLead = await getOffersByLeadId(lead.id);
        const existingOfferForLead =
          existingByLead.find((offer) => offer.is_active !== false) ||
          existingByLead[0];
        if (existingOfferForLead) {
          await updatePublicOffer(existingOfferForLead.token, {
            audit_summary: auditSummary.trim() || null,
            audit_html: auditHtml.trim() || null,
            recommendation_intro: recommendationIntro.trim() || null,
            custom_note: customNote.trim() || null,
            loom_url: loomUrl.trim() || null,
            services: editableServices,
            portfolio_links: portfolioLinks,
            total_price: totals.monthlyAfterDiscount + totals.oneOff,
            monthly_discount_percent: monthlyDiscountPercent > 0 ? monthlyDiscountPercent : undefined,
            discount_scope: monthlyDiscountPercent > 0 ? discountScope : undefined,
            intro_discount_percent: introDiscountPercent > 0 ? introDiscountPercent : undefined,
            intro_discount_months: introDiscountPercent > 0 ? introDiscountMonths : undefined,
            is_active: true,
            valid_until: validUntil || null,
            content_blocks_snapshot: applyReportingVisibility((existingOfferForLead.content_blocks_snapshot || {}) as OfferContentSnapshot),
            owner_name: leadOwner?.full_name || undefined,
            owner_email: leadOwner?.email || undefined,
            owner_phone: leadOwner?.phone || undefined,
          }, undefined, {
            changedBy: currentColleague?.id || null,
          });

          const existingOfferUrl = buildAppUrl(`/offer/${existingOfferForLead.token}`);
          clearOfferDraft(draftKey);
          clearOfferDraftRef(lead.id);
          notifyOfferDraftChanged(lead.id);
          setCreatedOfferUrl(existingOfferUrl);
          toast.success('Nabídka byla aktualizována!');
          const syncData = {
            services: editableServices,
            introDiscountPercent: introDiscountPercent > 0 ? introDiscountPercent : undefined,
            introDiscountMonths: introDiscountPercent > 0 ? introDiscountMonths : undefined,
            cbCredits: cbCredits,
            cbPricePerCredit: cbPricePerCredit,
          };
          onSuccess(existingOfferForLead.token, existingOfferUrl, syncData);
          return;
        }

        // True create mode: no previous offer found.
        const token = generateToken();
        const offerUrl = buildAppUrl(`/offer/${token}`);

        // Snapshot current content blocks from DB (strict: no fallback defaults).
        interface OfferContentSnapshotRow {
          section_key: string;
          title: string | null;
          subtitle: string | null;
          content: Record<string, unknown>;
        }
        const contentSnapshot: OfferContentSnapshot = {};
        const { data } = await supabase
          .from('offer_content_blocks' as never)
          .select('section_key, title, subtitle, content');
        const snapshotRows = (data || []) as unknown as OfferContentSnapshotRow[];
        if (snapshotRows.length === 0) {
          throw new Error('Offer content blocks are empty');
        }
        snapshotRows.forEach((row) => {
          contentSnapshot[row.section_key] = {
            section_key: row.section_key,
            title: row.title,
            subtitle: row.subtitle,
            content: row.content,
          };
        });
        const contentSnapshotWithVisibility = applyReportingVisibility(contentSnapshot);

        const newOffer: PublicOffer = {
          id: crypto.randomUUID(),
          lead_id: lead.id,
          token,
          company_name: lead.company_name,
          website: lead.website || null,
          contact_name: lead.contact_name,
          audit_summary: auditSummary.trim() || null,
          audit_html: auditHtml.trim() || null,
          recommendation_intro: recommendationIntro.trim() || null,
          custom_note: customNote.trim() || null,
          loom_url: loomUrl.trim() || null,
          services: editableServices,
          portfolio_links: portfolioLinks,
          total_price: totals.monthlyAfterDiscount + totals.oneOff,
          monthly_discount_percent: monthlyDiscountPercent > 0 ? monthlyDiscountPercent : undefined,
          discount_scope: monthlyDiscountPercent > 0 ? discountScope : undefined,
          intro_discount_percent: introDiscountPercent > 0 ? introDiscountPercent : undefined,
          intro_discount_months: introDiscountPercent > 0 ? introDiscountMonths : undefined,
          currency: lead.currency,
          offer_type: lead.offer_type as 'retainer' | 'one_off',
          valid_until: validUntil || null,
          is_active: true,
          viewed_at: null,
          view_count: 0,
          created_by: currentColleague?.id || null,
          created_at: now,
          updated_at: now,
          owner_name: leadOwner?.full_name || undefined,
          owner_email: leadOwner?.email || undefined,
          owner_phone: leadOwner?.phone || undefined,
          content_blocks_snapshot: contentSnapshotWithVisibility,
        };

        await addPublicOffer(newOffer);
        clearOfferDraft(draftKey);
        clearOfferDraftRef(lead.id);
        notifyOfferDraftChanged(lead.id);
        setCreatedOfferUrl(offerUrl);
        toast.success('Nabídka byla vytvořena!');
        const syncData = {
          services: editableServices,
          introDiscountPercent: introDiscountPercent > 0 ? introDiscountPercent : undefined,
          introDiscountMonths: introDiscountPercent > 0 ? introDiscountMonths : undefined,
          cbCredits: cbCredits,
          cbPricePerCredit: cbPricePerCredit,
        };
        onSuccess(token, offerUrl, syncData);
      }
    } catch (err) {
      console.error('Error saving offer:', err);
      if (err instanceof Error && (err.message.includes('localhost') || err.message.includes('VITE_APP_URL'))) {
        toast.error(err.message);
      } else {
        toast.error('Chyba při ukládání nabídky');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!createdOfferUrl) return;
    await navigator.clipboard.writeText(createdOfferUrl);
    setCopied(true);
    toast.success('Odkaz zkopírován do schránky');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setAuditSummary('');
    setAuditHtml('');
    setRecommendationIntro('');
    setCustomNote('');
    setLoomUrl('');
    setValidUntil('');
    setCreatedOfferUrl(null);
    setCopied(false);
    setEditableServices([]);
    setHideReportingSection(false);
    setMonthlyDiscountPercent(0);
    setDiscountScope('core_only');
    setIntroDiscountPercent(0);
    setIntroDiscountMonths(3);
    onOpenChange(false);
  };

  // Default valid_until to 14 days from now
  const defaultValidUntil = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>
            {createdOfferUrl 
              ? (isEditMode ? '✅ Nabídka aktualizována' : '✅ Nabídka vytvořena')
              : (isEditMode ? 'Upravit nabídku' : 'Vytvořit sdílenou nabídku')}
          </DialogTitle>
        </DialogHeader>

        {createdOfferUrl ? (
          // Success state
          <div className="space-y-4 px-6 pb-6">
            <div className="p-4 rounded-lg border bg-emerald-500/10 border-emerald-500/30">
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium mb-3">
                {isEditMode ? 'Nabídka byla aktualizována! Klient uvidí novou verzi na stejném odkazu:' : 'Nabídka byla úspěšně vytvořena! Zkopírujte odkaz a odešlete klientovi:'}
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={createdOfferUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="outline" size="icon" asChild>
                  <a href={createdOfferUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="text-center">
              <Button onClick={handleClose}>Zavřít</Button>
            </div>
          </div>
        ) : (
          // Form state
          <>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="space-y-4 px-6 pb-4">

                {/* Audit summary - Co jsme zjistili */}
                <div className="space-y-2">
                  <Label>🔍 Co jsme zjistili (volitelné)</Label>
                  {restoredDraftAt && (
                    <p className="text-xs text-emerald-600">
                      Obnoven rozpracovaný draft ({new Date(restoredDraftAt).toLocaleString('cs-CZ')}).
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">Popis zjištění z auditu. Můžete vkládat text, odrážky i screenshoty (Ctrl+V nebo přetažením).</p>
                  <AuditEditor
                    content={auditHtml || auditSummary}
                    onChange={(html) => {
                      setAuditHtml(html);
                      // Extract plain text for backward compatibility
                      const tmp = document.createElement('div');
                      tmp.innerHTML = html;
                      setAuditSummary(tmp.textContent || '');
                    }}
                    placeholder="Reklamní účty nejsou optimálně nastaveny — chybí remarketing a audience segmentace..."
                  />
                </div>

                {/* Recommendation intro */}
                <div className="space-y-2">
                  <Label htmlFor="recommendation">✅ Naše doporučení (volitelné)</Label>
                  <p className="text-xs text-muted-foreground">Souvislý text s doporučením — zobrazí se pod findings v zelené kartě.</p>
                  <Textarea
                    id="recommendation"
                    value={recommendationIntro}
                    onChange={(e) => setRecommendationIntro(e.target.value)}
                    placeholder="Na základě auditu doporučujeme začít s kompletní restrukturalizací kampaní a nasazením nových kreativ..."
                    rows={4}
                  />
                </div>

                {/* Custom note */}
                <div className="space-y-2">
                  <Label htmlFor="note">📝 Poznámka pro klienta (volitelné)</Label>
                  <Textarea
                    id="note"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="Těšíme se na spolupráci! V případě dotazů se neváhejte obrátit..."
                    rows={2}
                  />
                </div>

                {/* Loom video */}
                <div className="space-y-2">
                  <Label htmlFor="loom">🎥 Loom video k nabídce / auditu (volitelné)</Label>
                  <Input
                    id="loom"
                    type="url"
                    value={loomUrl}
                    onChange={(e) => setLoomUrl(e.target.value)}
                    placeholder="https://www.loom.com/share/..."
                  />
                </div>

                <div className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label htmlFor="hide-reporting-switch" className="text-sm font-medium">
                        📊 Skrýt sekci „Reporting až na úroveň zisku“
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Pokud je zapnuto, sekce Reporting se ve sdílené nabídce vůbec nezobrazí.
                      </p>
                    </div>
                    <Switch
                      id="hide-reporting-switch"
                      checked={hideReportingSection}
                      onCheckedChange={setHideReportingSection}
                    />
                  </div>
                </div>

                <Separator />
                {/* Editable Services */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">📦 Služby v nabídce</Label>
                  <div className="space-y-3">
                    {editableServices.map((service, idx) => (
                      (() => {
                        const catalogService = services.find((s) => s.id === service.service_id);
                        const isCreativeBoost = catalogService?.code === 'CREATIVE_BOOST';
                        return (
                      <EditableOfferServiceCard
                        key={service.id || idx}
                        service={service}
                        onUpdate={(updated) => handleUpdateService(idx, updated)}
                        onRemove={() => handleRemoveService(idx)}
                        isCreativeBoost={isCreativeBoost}
                        creativeBoostCredits={cbCredits}
                        creativeBoostPricePerCredit={cbPricePerCredit}
                        onCreativeBoostCreditsChange={setCbCredits}
                        onCreativeBoostPricePerCreditChange={setCbPricePerCredit}
                      />
                        );
                      })()
                    ))}
                  </div>
                  
                  {/* Add service button */}
                  {(() => {
                    const availableToAdd = services.filter(s => 
                      s.is_active && !editableServices.some(es => es.service_id === s.id)
                    ).sort((a, b) => {
                      if (a.service_type !== b.service_type) return a.service_type === 'core' ? -1 : 1;
                      return a.name.localeCompare(b.name, 'cs');
                    });
                    if (availableToAdd.length === 0) return null;
                    return (
                      <Select
                        value=""
                        onValueChange={(serviceId) => {
                          const catalogService = services.find(s => s.id === serviceId);
                          if (catalogService) {
                            const newService = buildServiceFromCatalog(catalogService, lead);
                            setEditableServices(prev => [...prev, newService]);
                          }
                        }}
                      >
                        <SelectTrigger className="border-dashed text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            <span>Přidat službu</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {availableToAdd.map(s => {
                            const detail = getServiceDetail(s.code);
                            const platforms = detail?.platforms;
                            return (
                              <SelectItem key={s.id} value={s.id}>
                                <div className="flex flex-col">
                                  <span>{s.name} <span className="text-muted-foreground">({s.service_type === 'core' ? 'Core' : 'Addon'})</span></span>
                                  {platforms && platforms.length > 0 && (
                                    <span className="text-[11px] text-muted-foreground leading-tight">
                                      {platforms.join(', ')}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    );
                  })()}

                  {editableServices.length === 0 && (
                    <div className="p-4 text-center text-muted-foreground border rounded-lg border-dashed">
                      Žádné služby v nabídce. Použijte tlačítko výše pro přidání služeb.
                    </div>
                  )}
                  
                  {editableServices.length > 0 && (
                    <div className="rounded-lg border bg-muted/30 space-y-0 overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/50">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Náklady na doručení & odměny
                        </span>
                      </div>
                      
                      {totals.serviceCosts.length > 0 ? (
                        <div className="divide-y divide-border/50">
                          {totals.serviceCosts.map((sc, idx) => {
                            const matchedService = editableServices.find(es => es.id === sc.serviceId || es.service_id === sc.serviceId);
                            const countryVariants = matchedService?.country_variants || [];
                            const variantMultiplier = countryVariants.length > 0
                              ? 1 + countryVariants.reduce((sum, v) => sum + v.multiplier, 0)
                              : 1;
                            const hasVariants = variantMultiplier > 1;
                            
                            return (
                            <div key={idx} className="px-3 py-2">
                              <div className="flex items-center justify-between mb-1">
                                <div>
                                  <span className="text-xs font-medium">{sc.name}</span>
                                  {hasVariants && (
                                    <span className="text-[10px] text-muted-foreground ml-1.5">
                                      ({variantMultiplier.toFixed(1)}× — vč. {countryVariants.length} {countryVariants.length === 1 ? 'dalšího trhu' : 'dalších trhů'})
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs font-semibold tabular-nums">{sc.cost.toLocaleString('cs-CZ')} Kč</span>
                              </div>
                              {(rewardOverrides[sc.serviceId] || []).map((r, ri) => {
                                const isPerCredit = r.rewardType === 'per_credit';
                                const effectiveReward = hasVariants && !isPerCredit ? Math.round(r.reward * variantMultiplier) : r.reward;
                                return (
                                  <div key={ri} className="flex items-center pl-3 py-0.5 gap-1.5">
                                    <button
                                      onClick={() => {
                                        setRewardOverrides(prev => {
                                          const roles = [...(prev[sc.serviceId] || [])];
                                          roles.splice(ri, 1);
                                          return { ...prev, [sc.serviceId]: roles };
                                        });
                                      }}
                                      className="text-muted-foreground/40 hover:text-destructive shrink-0"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                    <Input
                                      value={r.role}
                                      onChange={(e) => {
                                        setRewardOverrides(prev => {
                                          const roles = [...(prev[sc.serviceId] || [])];
                                          roles[ri] = { ...roles[ri], role: e.target.value };
                                          return { ...prev, [sc.serviceId]: roles };
                                        });
                                      }}
                                      className="h-6 text-xs flex-1 min-w-0 border-none shadow-none p-0 bg-transparent"
                                    />
                                    <div className="flex items-center gap-1 ml-auto">
                                      <Input
                                        type="number"
                                        min={0}
                                        value={r.reward}
                                        onChange={(e) => {
                                          const val = Math.max(0, Number(e.target.value));
                                          setRewardOverrides(prev => {
                                            const roles = [...(prev[sc.serviceId] || [])];
                                            roles[ri] = { ...roles[ri], reward: val };
                                            return { ...prev, [sc.serviceId]: roles };
                                          });
                                        }}
                                        className="w-24 h-6 text-xs text-right tabular-nums px-1.5"
                                      />
                                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                        {isPerCredit ? 'Kč/kr.' : 'Kč/měs'}
                                      </span>
                                      {hasVariants && !isPerCredit && effectiveReward !== r.reward && (
                                        <span className="text-[10px] text-primary font-medium whitespace-nowrap ml-1">
                                          → {effectiveReward.toLocaleString('cs-CZ')} Kč
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              {(rewardOverrides[sc.serviceId] || []).length === 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-xs text-muted-foreground pl-3"
                                  onClick={() => {
                                    setRewardOverrides(prev => ({
                                      ...prev,
                                      [sc.serviceId]: [{ role: 'Specialista', reward: 0 }],
                                    }));
                                  }}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Přidat odměnu
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 text-[10px] text-muted-foreground pl-3 mt-0.5"
                                onClick={() => {
                                  setRewardOverrides(prev => ({
                                    ...prev,
                                    [sc.serviceId]: [...(prev[sc.serviceId] || []), { role: 'Nová role', reward: 0 }],
                                  }));
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Role
                              </Button>
                            </div>
                          )})}
                        </div>
                      ) : (
                        <div className="px-3 py-3 text-xs text-muted-foreground text-center">
                          Pro vybrané služby nejsou k dispozici data o odměnách.
                        </div>
                      )}

                      <div className="border-t bg-background px-3 py-2.5 space-y-1.5">
                          {totals.totalInternalCost > 0 && (
                            <>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Interní náklady celkem</span>
                                <span className="font-semibold tabular-nums">{totals.totalInternalCost.toLocaleString('cs-CZ')} Kč/měs</span>
                              </div>
                              {introDiscountPercent > 0 ? (
                                <>
                                  {/* Intro period */}
                                  <div className="rounded-md border border-amber-300/50 bg-amber-500/5 p-2 space-y-1">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                      Prvních {introDiscountMonths} měsíců (se slevou {introDiscountPercent} %)
                                    </p>
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-muted-foreground">Příjem</span>
                                      <span className="font-semibold tabular-nums">{totals.introAdjustedRevenue.toLocaleString('cs-CZ')} Kč/měs</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-muted-foreground">Po nákladech</span>
                                      <span className="font-semibold tabular-nums">
                                        {Math.round(totals.introAdjustedRevenue - totals.totalInternalCost).toLocaleString('cs-CZ')} Kč/měs
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-muted-foreground">Marže</span>
                                      <span className={`font-bold tabular-nums ${
                                        totals.introMargin >= 66 ? 'text-emerald-600' : 
                                        totals.introMargin >= 50 ? 'text-amber-600' : 'text-destructive'
                                      }`}>
                                        {totals.introMargin.toFixed(1)} %
                                      </span>
                                    </div>
                                  </div>
                                  {/* Regular period */}
                                  <div className="rounded-md border border-emerald-300/50 bg-emerald-500/5 p-2 space-y-1">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                      Od {introDiscountMonths + 1}. měsíce (plná cena)
                                    </p>
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-muted-foreground">Příjem</span>
                                      <span className="font-semibold tabular-nums">{totals.monthlyAfterDiscount.toLocaleString('cs-CZ')} Kč/měs</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-muted-foreground">Po nákladech</span>
                                      <span className="font-semibold tabular-nums">
                                        {Math.round(totals.monthlyAfterDiscount - totals.totalInternalCost).toLocaleString('cs-CZ')} Kč/měs
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-muted-foreground">Marže</span>
                                      <span className={`font-bold tabular-nums ${
                                        totals.margin >= 66 ? 'text-emerald-600' : 
                                        totals.margin >= 50 ? 'text-amber-600' : 'text-destructive'
                                      }`}>
                                        {totals.margin.toFixed(1)} %
                                      </span>
                                    </div>
                                  </div>
                                  {totals.introMargin < 66 && (
                                    <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/20">
                                      <TrendingUp className="h-3.5 w-3.5 text-destructive shrink-0" />
                                      <p className="text-xs text-destructive">
                                        Marže v úvodním období je pod 66 %. Zvažte nižší slevu nebo kratší období.
                                      </p>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Příjem po nákladech</span>
                                    <span className="font-semibold tabular-nums">
                                      {Math.round(totals.monthlyAfterDiscount - totals.totalInternalCost).toLocaleString('cs-CZ')} Kč/měs
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Marže</span>
                                    <span className={`font-bold tabular-nums ${
                                      totals.margin >= 66 ? 'text-emerald-600' : 
                                      totals.margin >= 50 ? 'text-amber-600' : 'text-destructive'
                                    }`}>
                                      {totals.margin.toFixed(1)} %
                                    </span>
                                  </div>
                                  {totals.margin < 66 && (
                                    <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/20 mt-1">
                                      <TrendingUp className="h-3.5 w-3.5 text-destructive shrink-0" />
                                      <p className="text-xs text-destructive">
                                        Marže je pod cílovou hodnotou 66 %. Zvažte úpravu ceny nebo rozsahu služeb.
                                      </p>
                                    </div>
                                  )}
                                </>
                              )}
                            </>
                          )}

                          {/* Bundle Discount */}
                          <Separator />
                          <div className="px-3 py-2.5 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground flex items-center gap-1">
                                Sleva při odběru všech služeb:
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[280px] text-xs">
                                      Trvalá sleva za odběr celého balíčku služeb najednou. Platí po celou dobu spolupráce a motivuje klienta k většímu rozsahu.
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </span>
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={monthlyDiscountPercent || ''}
                                  onChange={(e) => {
                                    const val = Math.min(100, Math.max(0, Number(e.target.value)));
                                    setMonthlyDiscountPercent(val);
                                  }}
                                  placeholder="0"
                                  className="w-20 h-7 text-sm text-right"
                                />
                                <span className="text-muted-foreground">%</span>
                              </div>
                            </div>
                            {monthlyDiscountPercent > 0 && totals.addonMonthly > 0 && (
                              <div className="flex items-center gap-3 text-xs">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="discountScope"
                                    checked={discountScope === 'core_only'}
                                    onChange={() => setDiscountScope('core_only')}
                                    className="accent-primary"
                                  />
                                  <span className="text-muted-foreground">Jen core služby</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="discountScope"
                                    checked={discountScope === 'all_services'}
                                    onChange={() => setDiscountScope('all_services')}
                                    className="accent-primary"
                                  />
                                  <span className="text-muted-foreground">Všechny služby</span>
                                </label>
                              </div>
                            )}
                            {monthlyDiscountPercent > 0 && (
                              <div className="flex items-center justify-between text-sm text-emerald-600">
                                <span>Sleva {monthlyDiscountPercent}% na {discountScope === 'all_services' ? 'všechny služby' : 'core služby'}:</span>
                                <span className="font-medium">
                                  -{totals.monthlyDiscountAmount.toLocaleString('cs-CZ')} Kč/měs
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Intro Discount */}
                          <Separator />
                          <div className="px-3 py-2.5 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground flex items-center gap-1">
                                Úvodní sleva (první měsíce):
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[280px] text-xs">
                                      Časově omezená sleva na prvních X měsíců spolupráce. Po uplynutí se automaticky fakturuje plná cena (resp. cena po balíčkové slevě).
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                {monthlyDiscountPercent > 0 && introDiscountPercent > 0 && <span className="text-[10px] ml-1 text-amber-500">(aplikuje se na cenu po slevě za balíček)</span>}
                              </span>
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={introDiscountPercent || ''}
                                  onChange={(e) => {
                                    const val = Math.min(100, Math.max(0, Number(e.target.value)));
                                    setIntroDiscountPercent(val);
                                  }}
                                  placeholder="0"
                                  className="w-20 h-7 text-sm text-right"
                                />
                                <span className="text-muted-foreground">%</span>
                              </div>
                            </div>
                            {introDiscountPercent > 0 && (
                              <>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Počet měsíců:</span>
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      min={1}
                                      max={24}
                                      value={introDiscountMonths}
                                      onChange={(e) => setIntroDiscountMonths(Math.min(24, Math.max(1, Number(e.target.value))))}
                                      className="w-20 h-7 text-sm text-right"
                                    />
                                    <span className="text-muted-foreground">měs.</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-sm text-amber-600">
                                  <span>Prvních {introDiscountMonths} měs. za:</span>
                                  <span className="font-medium">
                                    {Math.round(totals.monthlyAfterDiscount * (1 - introDiscountPercent / 100)).toLocaleString('cs-CZ')} Kč/měs
                                  </span>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Final Summary */}
                          <Separator />
                          <div className="px-3 py-2.5 space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Měsíčně celkem</span>
                              <span className="font-semibold tabular-nums">
                                {monthlyDiscountPercent > 0 ? (
                                  <>
                                    <span className="line-through text-muted-foreground mr-2 font-normal">
                                      {totals.monthly.toLocaleString('cs-CZ')}
                                    </span>
                                    {totals.monthlyAfterDiscount.toLocaleString('cs-CZ')} Kč/měs
                                  </>
                                ) : (
                                  <>{totals.monthly.toLocaleString('cs-CZ')} Kč/měs</>
                                )}
                              </span>
                            </div>
                            {totals.oneOff > 0 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Jednorázově</span>
                                <span className="font-semibold tabular-nums">{totals.oneOff.toLocaleString('cs-CZ')} Kč</span>
                              </div>
                            )}
                          </div>
                        </div>
                    </div>
                  )}
                </div>

                {/* History section (edit mode only) */}
                {isEditMode && offerForEdit?.history && offerForEdit.history.length > 0 && (
                  <div className="rounded-lg border bg-muted/30 overflow-hidden">
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Historie změn ({offerForEdit.history.length})
                        </span>
                      </div>
                      {showHistory ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {showHistory && (
                      <div className="border-t divide-y divide-border/50 max-h-[200px] overflow-y-auto">
                        {[...offerForEdit.history].reverse().map((entry, idx) => (
                          <div key={idx} className="px-3 py-2 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium">{entry.summary}</span>
                              <span className="text-[10px] text-muted-foreground tabular-nums">
                                {new Date(entry.timestamp).toLocaleString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              Celková cena: {entry.snapshot.total_price?.toLocaleString('cs-CZ')} Kč · {entry.snapshot.services?.length || 0} služeb
                              {entry.snapshot.monthly_discount_percent ? ` · Sleva ${entry.snapshot.monthly_discount_percent}%` : ''}
                            </div>
                            {entry.changes && entry.changes.length > 0 && (
                              <div className="mt-1.5 space-y-1">
                                {entry.changes.slice(0, 8).map((change, changeIdx) => (
                                  <div key={changeIdx} className="text-[10px] leading-snug text-muted-foreground">
                                    <span className="font-medium text-foreground/80">{change.field}:</span>{' '}
                                    <span className="line-through decoration-muted-foreground/60">{change.from}</span>{' '}
                                    <span aria-hidden="true">→</span>{' '}
                                    <span className="text-foreground/90">{change.to}</span>
                                  </div>
                                ))}
                                {entry.changes.length > 8 && (
                                  <div className="text-[10px] text-muted-foreground/80">
                                    +{entry.changes.length - 8} dalších změn
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Zrušit
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating || editableServices.length === 0 || isLoadingExistingOffer}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditMode ? 'Ukládám...' : 'Vytvářím...'}
                  </>
                ) : isLoadingExistingOffer ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Načítám nabídku...
                  </>
                ) : (
                  isEditMode ? 'Uložit změny' : 'Vytvořit nabídku'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
