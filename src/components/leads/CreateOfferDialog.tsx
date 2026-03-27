import { useState, useMemo, useEffect } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Copy, ExternalLink, Check, TrendingUp, Plus, X, History, ChevronDown, ChevronUp } from 'lucide-react';
import { useCRMData } from '@/hooks/useCRMData';
import { toast } from 'sonner';
import type { Lead, Service } from '@/types/crm';
import type { PublicOfferService, PublicOffer, PortfolioLink } from '@/types/publicOffer';
import { addPublicOffer, updatePublicOffer } from '@/data/publicOffersMockData';
import { EditableOfferServiceCard } from './EditableOfferServiceCard';
import { mergeWithDefaults } from '@/constants/serviceDefaults';
import { getServiceDetail } from '@/constants/serviceDetails';
import { enrichServiceWithDemoRewards } from '@/utils/serviceRewardDemoData';
import { getRewardsFromServiceConfig, getServiceRewardRecommendation } from '@/constants/serviceRewards';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

  return {
    id: crypto.randomUUID(),
    service_id: catalogService.id,
    name: catalogService.name,
    description,
    offer_description: null,
    selected_tier: defaultTier as any,
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
  };
}

interface CreateOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onSuccess: (token: string, offerUrl: string) => void;
  existingOffer?: PublicOffer;
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
  { title: 'Case Study: E-shop Fashion Brand', url: 'https://www.canva.com/design/example1', type: 'case_study' },
  { title: 'Ukázka kampaní pro B2B klienty', url: 'https://www.canva.com/design/example2', type: 'presentation' },
  { title: 'Reference od klientů', url: 'https://socials.cz/reference', type: 'reference' },
];

export function CreateOfferDialog({ open, onOpenChange, lead, onSuccess, existingOffer }: CreateOfferDialogProps) {
  const { services, colleagues } = useCRMData();
  const isEditMode = !!existingOffer;
  const [auditSummary, setAuditSummary] = useState('');
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
  
  // Editable services state
  const [editableServices, setEditableServices] = useState<PublicOfferService[]>([]);

  // Get current user's colleague record
  const currentColleague = colleagues.find(c => c.status === 'active');

  // Initialize from existing offer (edit mode) or lead services
  useEffect(() => {
    if (!open) return;
    
    // Edit mode: populate from existing offer
    if (existingOffer) {
      setAuditSummary(existingOffer.audit_summary || '');
      setRecommendationIntro(existingOffer.recommendation_intro || '');
      setCustomNote(existingOffer.custom_note || '');
      setLoomUrl(existingOffer.loom_url || '');
      setValidUntil(existingOffer.valid_until || '');
      setEditableServices(existingOffer.services);
      setMonthlyDiscountPercent(existingOffer.monthly_discount_percent || 0);
      setDiscountScope(existingOffer.discount_scope || 'core_only');
      setIntroDiscountPercent(existingOffer.intro_discount_percent || 0);
      setIntroDiscountMonths(existingOffer.intro_discount_months || 3);
      if (existingOffer.portfolio_links?.length > 0) {
        setPortfolioLinks(existingOffer.portfolio_links);
      }
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
      return;
    }
    
    // Otherwise, auto-suggest services based on lead's channels/platforms
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
    }
  }, [open, lead.potential_services, services, existingOffer]);

  // Initialize reward overrides from catalog when services change
  useEffect(() => {
    if (editableServices.length === 0) return;
    setRewardOverrides(prev => {
      const next = { ...prev };
      editableServices.forEach(es => {
        if (next[es.service_id]) return; // already has overrides
        const catalogService = services.find(s => s.id === es.service_id);
        if (!catalogService) return;
        const enriched = enrichServiceWithDemoRewards(catalogService);
        let roles = getRewardsFromServiceConfig(enriched.reward_config as any, es.selected_tier);
        if (!roles || roles.length === 0) {
          roles = getServiceRewardRecommendation(es.name, es.selected_tier);
        }
        if (roles && roles.length > 0) {
          next[es.service_id] = roles.map(r => ({
            role: r.role,
            reward: r.reward,
            rewardType: r.rewardType || (r as any).reward_type,
          }));
        } else {
          next[es.service_id] = [];
        }
      });
      return next;
    });
  }, [editableServices, services]);

  const CB_CREDITS = cbCredits;
  const CB_PRICE = cbPricePerCredit;

  const totals = useMemo(() => {
    // Helper: get effective monthly price for a service (handles CB credit-based pricing)
    const getEffectiveMonthlyPrice = (s: PublicOfferService) => {
      const catalogService = services.find(cs => cs.id === s.service_id);
      if (catalogService?.code === 'CREATIVE_BOOST') {
        return CB_CREDITS * CB_PRICE;
      }
      return s.price;
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
        return sum + CB_CREDITS * CB_PRICE;
      }
      return sum + (s.original_price || s.price);
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
      
      if (overrides.length > 0) {
        let svcCost = 0;
        const roleDetails: { role: string; reward: number; rewardType?: string }[] = [];
        overrides.forEach(r => {
          const effectiveReward = r.rewardType === 'per_credit' ? r.reward * CB_CREDITS : r.reward;
          svcCost += effectiveReward;
          roleDetails.push({ role: r.role, reward: effectiveReward, rewardType: r.rewardType });
        });
        totalInternalCost += svcCost;
        serviceCosts.push({ serviceId: es.service_id, name: isCB ? `${es.name} (${CB_CREDITS} kr. × ${CB_PRICE} Kč)` : es.name, cost: svcCost, revenue: serviceRevenue, roles: roleDetails });
      } else {
        serviceCosts.push({ serviceId: es.service_id, name: isCB ? `${es.name} (${CB_CREDITS} kreditů)` : es.name, cost: 0, revenue: serviceRevenue, roles: [] });
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
  }, [editableServices, monthlyDiscountPercent, discountScope, introDiscountPercent, introDiscountMonths, services, cbCredits, cbPricePerCredit, rewardOverrides]);

  const handleUpdateService = (index: number, updated: PublicOfferService) => {
    setEditableServices(prev => 
      prev.map((s, i) => i === index ? updated : s)
    );
  };

  const handleRemoveService = (index: number) => {
    setEditableServices(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (editableServices.length === 0) {
      toast.error('Přidejte alespoň jednu službu do nabídky');
      return;
    }

    setIsCreating(true);

    try {
      const leadOwner = colleagues.find(c => c.id === lead.owner_id);
      const now = new Date().toISOString();

      if (isEditMode && existingOffer) {
        // Edit mode: update existing offer with history
        const changedParts: string[] = [];
        if (existingOffer.services.length !== editableServices.length) changedParts.push('služby');
        if (existingOffer.total_price !== totals.monthlyAfterDiscount + totals.oneOff) changedParts.push('ceny');
        if (existingOffer.monthly_discount_percent !== monthlyDiscountPercent) changedParts.push('sleva');
        if (existingOffer.audit_summary !== (auditSummary.trim() || null)) changedParts.push('audit');
        if (changedParts.length === 0) changedParts.push('drobné úpravy');
        
        updatePublicOffer(existingOffer.token, {
          audit_summary: auditSummary.trim() || null,
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
          owner_name: leadOwner?.full_name || undefined,
          owner_email: leadOwner?.email || undefined,
          owner_phone: leadOwner?.phone || undefined,
          created_by: currentColleague?.id || null,
        }, `Změna: ${changedParts.join(', ')}`);

        const offerUrl = `${window.location.origin}/offer/${existingOffer.token}`;
        setCreatedOfferUrl(offerUrl);
        toast.success('Nabídka byla aktualizována!');
        onSuccess(existingOffer.token, offerUrl);
      } else {
        // Create mode
        const token = generateToken();
        const offerUrl = `${window.location.origin}/offer/${token}`;

        const newOffer: PublicOffer = {
          id: crypto.randomUUID(),
          lead_id: lead.id,
          token,
          company_name: lead.company_name,
          website: lead.website || null,
          contact_name: lead.contact_name,
          audit_summary: auditSummary.trim() || null,
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
        };

        addPublicOffer(newOffer);
        setCreatedOfferUrl(offerUrl);
        toast.success('Nabídka byla vytvořena!');
        onSuccess(token, offerUrl);
      }
    } catch (err) {
      console.error('Error saving offer:', err);
      toast.error('Chyba při ukládání nabídky');
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
    setRecommendationIntro('');
    setCustomNote('');
    setLoomUrl('');
    setValidUntil('');
    setCreatedOfferUrl(null);
    setCopied(false);
    setEditableServices([]);
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
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] p-0">
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
            <ScrollArea className="max-h-[calc(95vh-180px)]">
              <div className="space-y-4 px-6 pb-4">

                {/* Audit summary - Co jsme zjistili */}
                <div className="space-y-2">
                  <Label htmlFor="audit">🔍 Co jsme zjistili (volitelné)</Label>
                  <p className="text-xs text-muted-foreground">Každý řádek se zobrazí jako samostatný finding. Můžete psát i souvislý text.</p>
                  <Textarea
                    id="audit"
                    value={auditSummary}
                    onChange={(e) => setAuditSummary(e.target.value)}
                    placeholder={"Reklamní účty nejsou optimálně nastaveny — chybí remarketing a audience segmentace.\nKampaně nemají strukturu podle fáze nákupního cyklu.\nKreativy se neobměňují dostatečně často, dochází k ad fatigue."}
                    rows={6}
                    className="font-mono text-xs"
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

                <Separator />
                {/* Editable Services */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">📦 Služby v nabídce</Label>
                  <div className="space-y-3">
                    {editableServices.map((service, idx) => (
                      <EditableOfferServiceCard
                        key={service.id || idx}
                        service={service}
                        onUpdate={(updated) => handleUpdateService(idx, updated)}
                        onRemove={() => handleRemoveService(idx)}
                      />
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
                  
                  {/* Creative Boost credit config */}
                  {editableServices.some(s => {
                    const cat = services.find(cs => cs.id === s.service_id);
                    return cat?.code === 'CREATIVE_BOOST';
                  }) && (
                    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🎨</span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Creative Boost — nastavení kreditů</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Počet kreditů / měsíc</Label>
                          <Input
                            type="number"
                            min={1}
                            value={cbCredits}
                            onChange={(e) => setCbCredits(Math.max(1, Number(e.target.value)))}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Cena za kredit pro klienta</Label>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min={0}
                              value={cbPricePerCredit}
                              onChange={(e) => setCbPricePerCredit(Math.max(0, Number(e.target.value)))}
                              className="h-8 text-sm"
                            />
                            <span className="text-xs text-muted-foreground shrink-0">Kč</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Celkem za Creative Boost: <span className="font-semibold">{(cbCredits * cbPricePerCredit).toLocaleString('cs-CZ')} Kč/měs</span>
                      </div>
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
                          {totals.serviceCosts.map((sc, idx) => (
                            <div key={idx} className="px-3 py-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium">{sc.name}</span>
                                <span className="text-xs font-semibold tabular-nums">{sc.cost.toLocaleString('cs-CZ')} Kč</span>
                              </div>
                              {(rewardOverrides[sc.serviceId] || []).map((r, ri) => {
                                const isPerCredit = r.rewardType === 'per_credit';
                                return (
                                  <div key={ri} className="flex items-center justify-between pl-3 py-0.5 gap-2">
                                    <span className="text-xs text-muted-foreground flex-1 min-w-0">{r.role}</span>
                                    <div className="flex items-center gap-1">
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
                                        className="w-20 h-6 text-xs text-right tabular-nums"
                                      />
                                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                        {isPerCredit ? 'Kč/kr.' : 'Kč/měs'}
                                      </span>
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
                          ))}
                        </div>
                      ) : (
                        <div className="px-3 py-3 text-xs text-muted-foreground text-center">
                          Pro vybrané služby nejsou k dispozici data o odměnách.
                        </div>
                      )}

                      {totals.totalInternalCost > 0 && (
                        <div className="border-t bg-background px-3 py-2.5 space-y-1.5">
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

                          {/* Bundle Discount */}
                          <Separator />
                          <div className="px-3 py-2.5 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Sleva při odběru všech služeb:</span>
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
                                  className="w-16 h-7 text-sm text-right"
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
                              <span className="text-muted-foreground">Úvodní sleva (první měsíce):{monthlyDiscountPercent > 0 && introDiscountPercent > 0 && <span className="text-[10px] ml-1 text-amber-500">(aplikuje se na cenu po slevě za balíček)</span>}</span>
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
                                  className="w-16 h-7 text-sm text-right"
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
                                      className="w-16 h-7 text-sm text-right"
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
                      )}
                    </div>
                  )}
                </div>

                {/* History section (edit mode only) */}
                {isEditMode && existingOffer?.history && existingOffer.history.length > 0 && (
                  <div className="rounded-lg border bg-muted/30 overflow-hidden">
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Historie změn ({existingOffer.history.length})
                        </span>
                      </div>
                      {showHistory ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {showHistory && (
                      <div className="border-t divide-y divide-border/50 max-h-[200px] overflow-y-auto">
                        {[...existingOffer.history].reverse().map((entry, idx) => (
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
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </ScrollArea>

            <DialogFooter className="px-6 py-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Zrušit
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating || editableServices.length === 0}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditMode ? 'Ukládám...' : 'Vytvářím...'}
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
