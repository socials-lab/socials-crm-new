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
import { Loader2, Copy, ExternalLink, Check, TrendingUp, Plus, X } from 'lucide-react';
import { useCRMData } from '@/hooks/useCRMData';
import { toast } from 'sonner';
import type { Lead, Service } from '@/types/crm';
import type { PublicOfferService, PublicOffer, PortfolioLink } from '@/types/publicOffer';
import { addPublicOffer } from '@/data/publicOffersMockData';
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

export function CreateOfferDialog({ open, onOpenChange, lead, onSuccess }: CreateOfferDialogProps) {
  const { services, colleagues } = useCRMData();
  const [auditSummary, setAuditSummary] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [loomUrl, setLoomUrl] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [portfolioLinks, setPortfolioLinks] = useState<PortfolioLink[]>(
    DEFAULT_PORTFOLIO_OPTIONS.map((p, idx) => ({ ...p, id: `portfolio-${idx}` }))
  );
  const [monthlyDiscountPercent, setMonthlyDiscountPercent] = useState(0);
  const [discountScope, setDiscountScope] = useState<'core_only' | 'all_services'>('core_only');
  const [isCreating, setIsCreating] = useState(false);
  const [createdOfferUrl, setCreatedOfferUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Editable services state
  const [editableServices, setEditableServices] = useState<PublicOfferService[]>([]);

  // Get current user's colleague record
  const currentColleague = colleagues.find(c => c.status === 'active');

  // Initialize editable services when dialog opens
  useEffect(() => {
    if (!open) return;
    
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
  }, [open, lead.potential_services, services]);

  // Calculate totals + profitability
  const CB_DEFAULT_CREDITS = 30;
  const CB_PRICE_PER_CREDIT = 400;

  const totals = useMemo(() => {
    // Helper: get effective monthly price for a service (handles CB credit-based pricing)
    const getEffectiveMonthlyPrice = (s: PublicOfferService) => {
      const catalogService = services.find(cs => cs.id === s.service_id);
      if (catalogService?.code === 'CREATIVE_BOOST') {
        return CB_DEFAULT_CREDITS * CB_PRICE_PER_CREDIT;
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
        return sum + CB_DEFAULT_CREDITS * CB_PRICE_PER_CREDIT;
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

    // Calculate internal costs from reward configs
    let totalInternalCost = 0;
    const serviceCosts: { name: string; cost: number; revenue: number; roles: { role: string; reward: number }[] }[] = [];
    
    editableServices.forEach(es => {
      const catalogService = services.find(s => s.id === es.service_id);
      if (!catalogService) return;
      
      const isCB = catalogService.code === 'CREATIVE_BOOST';
      const serviceRevenue = getEffectiveMonthlyPrice(es);
      
      const enriched = enrichServiceWithDemoRewards(catalogService);
      const roles = getRewardsFromServiceConfig(
        enriched.reward_config as any,
        es.selected_tier
      );
      
      if (roles && roles.length > 0) {
        let svcCost = 0;
        const roleDetails: { role: string; reward: number }[] = [];
        roles.forEach(r => {
          // For per_credit (Creative Boost), estimate based on default credits
          const reward = r.rewardType === 'per_credit' ? r.reward * CB_DEFAULT_CREDITS : r.reward;
          svcCost += reward;
          roleDetails.push({ role: r.role, reward });
        });
        totalInternalCost += svcCost;
        serviceCosts.push({ name: isCB ? `${es.name} (${CB_DEFAULT_CREDITS} kreditů)` : es.name, cost: svcCost, revenue: serviceRevenue, roles: roleDetails });
      } else {
        serviceCosts.push({ name: isCB ? `${es.name} (${CB_DEFAULT_CREDITS} kreditů)` : es.name, cost: 0, revenue: serviceRevenue, roles: [] });
      }
    });

    const revenue = monthlyAfterDiscount;
    const margin = revenue > 0 ? ((revenue - totalInternalCost) / revenue) * 100 : 0;

    return { monthly, coreMonthly, addonMonthly, oneOff, totalOriginal, totalFinal, totalDiscount, monthlyAfterDiscount, monthlyDiscountAmount, totalInternalCost, serviceCosts, margin };
  }, [editableServices, monthlyDiscountPercent, discountScope, services]);

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
      const token = generateToken();
      const offerUrl = `${window.location.origin}/offer/${token}`;
      const now = new Date().toISOString();

      // Find lead owner for contact info
      const leadOwner = colleagues.find(c => c.id === lead.owner_id);

      // Create offer object for mock store
      const newOffer: PublicOffer = {
        id: crypto.randomUUID(),
        lead_id: lead.id,
        token,
        company_name: lead.company_name,
        website: lead.website || null,
        contact_name: lead.contact_name,
        audit_summary: auditSummary.trim() || null,
        recommendation_intro: null,
        custom_note: customNote.trim() || null,
        loom_url: loomUrl.trim() || null,
        services: editableServices,
        portfolio_links: portfolioLinks,
        total_price: totals.monthlyAfterDiscount + totals.oneOff,
        monthly_discount_percent: monthlyDiscountPercent > 0 ? monthlyDiscountPercent : undefined,
        discount_scope: monthlyDiscountPercent > 0 ? discountScope : undefined,
        currency: lead.currency,
        offer_type: lead.offer_type as 'retainer' | 'one_off',
        valid_until: validUntil || null,
        is_active: true,
        viewed_at: null,
        view_count: 0,
        created_by: currentColleague?.id || null,
        created_at: now,
        updated_at: now,
        // Contact person info (lead owner)
        owner_name: leadOwner?.full_name || undefined,
        owner_email: leadOwner?.email || undefined,
        owner_phone: leadOwner?.phone || undefined,
      };

      // Add to mock store
      addPublicOffer(newOffer);

      setCreatedOfferUrl(offerUrl);
      toast.success('Nabídka byla vytvořena!');
      onSuccess(token, offerUrl);
    } catch (err) {
      console.error('Error creating offer:', err);
      toast.error('Chyba při vytváření nabídky');
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
    setCustomNote('');
    setLoomUrl('');
    setValidUntil('');
    setCreatedOfferUrl(null);
    setCopied(false);
    setEditableServices([]);
    setMonthlyDiscountPercent(0);
    setDiscountScope('core_only');
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
            {createdOfferUrl ? '✅ Nabídka vytvořena' : 'Vytvořit sdílenou nabídku'}
          </DialogTitle>
        </DialogHeader>

        {createdOfferUrl ? (
          // Success state
          <div className="space-y-4 px-6 pb-6">
            <div className="p-4 rounded-lg border bg-green-500/10 border-green-500/30">
              <p className="text-sm text-green-700 font-medium mb-3">
                Nabídka byla úspěšně vytvořena! Zkopírujte odkaz a odešlete klientovi:
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
                {/* Company info */}
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Pro:</span>{' '}
                    <span className="font-medium">{lead.company_name}</span>
                    {' · '}
                    <span className="text-muted-foreground">{lead.contact_name}</span>
                  </p>
                </div>

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
                    );
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
                          {availableToAdd.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} {s.service_type === 'core' ? '(Core)' : '(Addon)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  })()}

                  {editableServices.length === 0 && (
                    <div className="p-4 text-center text-muted-foreground border rounded-lg border-dashed">
                      Žádné služby v nabídce. Použijte tlačítko výše pro přidání služeb.
                    </div>
                  )}
                  
                  {/* Price Summary */}
                  {editableServices.length > 0 && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                     <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Měsíčně celkem:</span>
                        <span className="font-medium">
                          {monthlyDiscountPercent > 0 ? (
                            <>
                              <span className="line-through text-muted-foreground mr-2">
                                {totals.monthly.toLocaleString('cs-CZ')}
                              </span>
                              {totals.monthlyAfterDiscount.toLocaleString('cs-CZ')} {lead.currency}/měs
                            </>
                          ) : (
                            <>{totals.monthly.toLocaleString('cs-CZ')} {lead.currency}/měs</>
                          )}
                        </span>
                      </div>
                      {/* Monthly discount */}
                      {totals.monthly > 0 && (
                        <div className="space-y-1.5 mb-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground text-xs">
                              Sleva při odběru všech služeb:
                            </span>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={monthlyDiscountPercent || ''}
                                onChange={(e) => setMonthlyDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
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
                        </div>
                      )}
                      {monthlyDiscountPercent > 0 && (
                        <div className="flex items-center justify-between text-sm text-green-600 mb-1">
                          <span>Sleva {monthlyDiscountPercent}% na {discountScope === 'all_services' ? 'všechny služby' : 'core služby'}:</span>
                          <span className="font-medium">
                            -{totals.monthlyDiscountAmount.toLocaleString('cs-CZ')} {lead.currency}/měs
                          </span>
                        </div>
                      )}
                      {totals.oneOff > 0 && (
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Jednorázově:</span>
                          <span className="font-medium">
                            {totals.oneOff.toLocaleString('cs-CZ')} {lead.currency}
                          </span>
                        </div>
                      )}
                      {totals.totalDiscount > 0 && (
                        <div className="flex items-center justify-between text-sm text-green-600">
                          <span>Celková sleva na služby:</span>
                          <span className="font-medium">
                            -{totals.totalDiscount.toLocaleString('cs-CZ')} {lead.currency}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Profitability / Internal costs */}
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
                              {sc.roles.map((r, ri) => (
                                <div key={ri} className="flex items-center justify-between pl-3 py-0.5">
                                  <span className="text-xs text-muted-foreground">{r.role}</span>
                                  <span className="text-xs text-muted-foreground tabular-nums">{r.reward.toLocaleString('cs-CZ')} Kč/měs</span>
                                </div>
                              ))}
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
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Příjem po nákladech</span>
                            <span className="font-semibold tabular-nums">
                              {Math.round(totals.monthlyAfterDiscount - totals.totalInternalCost).toLocaleString('cs-CZ')} Kč/měs
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Odhadovaná marže</span>
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
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Audit summary */}
                <div className="space-y-2">
                  <Label htmlFor="audit">📊 Výstup z auditu (volitelné)</Label>
                  <Textarea
                    id="audit"
                    value={auditSummary}
                    onChange={(e) => setAuditSummary(e.target.value)}
                    placeholder="Na základě analýzy vašich reklamních účtů jsme identifikovali..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Krátké shrnutí zjištění z auditu účtů klienta
                  </p>
                </div>

                {/* Custom note */}
                <div className="space-y-2">
                  <Label htmlFor="note">📝 Poznámka pro klienta (volitelné)</Label>
                  <Textarea
                    id="note"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="Těšíme se na spolupráci! V případě dotazů se neváhejte obrátit..."
                    rows={3}
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
                  <p className="text-xs text-muted-foreground">
                    Odkaz na Loom video, kde klientovi popisujete nabídku nebo výsledky auditu
                  </p>
                </div>

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
                    Vytvářím...
                  </>
                ) : (
                  'Vytvořit nabídku'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
