import { 
  BarChart3, 
  Target, 
  Activity, 
  Facebook, 
  Instagram,
  Calendar,
  Video,
  CheckCircle2,
  XCircle,
  Brain,
  ChevronDown,
  Sparkles,
  ShoppingCart,
  Building,
  Globe,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { Lead } from '@/types/crm';

interface LeadEnrichmentSectionProps {
  lead: Lead;
}

function BooleanBadge({ value, label }: { value: boolean | null; label: string }) {
  if (value === null || value === undefined) return null;
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-xs gap-1",
        value 
          ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" 
          : "bg-muted text-muted-foreground"
      )}
    >
      {value ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {label}
    </Badge>
  );
}

function ScoreBadge({ score, label, max = 100 }: { score: number | null; label: string; max?: number }) {
  if (score === null || score === undefined) return null;
  const percent = Math.min((score / max) * 100, 100);
  const color = percent >= 70 ? 'text-emerald-700' : percent >= 40 ? 'text-amber-700' : 'text-red-700';
  const bg = percent >= 70 ? 'bg-emerald-500' : percent >= 40 ? 'bg-amber-500' : 'bg-red-500';
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn("text-sm font-bold", color)}>{score}/{max}</span>
      </div>
      <Progress value={percent} className="h-1.5" indicatorClassName={bg} />
    </div>
  );
}

function TierBadge({ tier }: { tier: string | null }) {
  if (!tier) return null;
  const colors: Record<string, string> = {
    high: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
    medium: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    low: 'bg-red-500/10 text-red-700 border-red-500/30',
  };
  const labels: Record<string, string> = {
    high: '🔥 High quality',
    medium: '⚡ Medium quality',
    low: '❄️ Low quality',
  };
  return (
    <Badge variant="outline" className={cn("text-xs", colors[tier] || colors.medium)}>
      {labels[tier] || tier}
    </Badge>
  );
}

export function LeadEnrichmentSection({ lead }: LeadEnrichmentSectionProps) {
  const hasEnrichmentData = lead.enrichment_completed || lead.lead_score !== null || lead.credibility_score !== null || lead.enrichment_platform || lead.pain_point || lead.company_research;
  
  if (!hasEnrichmentData) return null;

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group">
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
        <Sparkles className="h-4 w-4 text-violet-500" />
        <span className="text-sm font-medium">Lead Enrichment</span>
        {lead.enrichment_completed && (
          <Badge variant="outline" className="text-[10px] h-4 px-1.5 ml-auto bg-violet-500/10 text-violet-700 border-violet-500/30">
            ✓ Enriched
          </Badge>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-6 pt-3 space-y-4">
        
        {/* Scoring section */}
        {(lead.lead_score !== null || lead.credibility_score !== null || lead.enrichment_qualification_tier) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Target className="h-3.5 w-3.5" />
              Skóre & kvalifikace
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ScoreBadge score={lead.lead_score} label="Lead Score" />
              <ScoreBadge score={lead.credibility_score} label="Credibility Score" />
            </div>
            {lead.enrichment_qualification_tier && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Tier:</span>
                <TierBadge tier={lead.enrichment_qualification_tier} />
              </div>
            )}
          </div>
        )}

        {/* Tracking section */}
        {(lead.has_ga4 !== null || lead.has_gtm !== null || lead.has_meta_pixel !== null || lead.has_google_ads !== null) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              Tracking
            </div>
            <div className="flex flex-wrap gap-1.5">
              <BooleanBadge value={lead.has_ga4} label="GA4" />
              <BooleanBadge value={lead.has_gtm} label="GTM" />
              <BooleanBadge value={lead.has_meta_pixel} label="Meta Pixel" />
              <BooleanBadge value={lead.has_google_ads} label="Google Ads" />
            </div>
          </div>
        )}

        {/* Marketing info */}
        {(lead.enrichment_platform || lead.enrichment_ad_spend_range || lead.enrichment_services_needed || lead.marketing_maturity || lead.pain_point) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <BarChart3 className="h-3.5 w-3.5" />
              Marketing info
            </div>
            <div className="text-sm space-y-1.5">
              {lead.enrichment_platform && (
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Platforma:</span>
                  <span className="font-medium">{lead.enrichment_platform}</span>
                </div>
              )}
              {lead.enrichment_ad_spend_range && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Ad spend:</span>
                  <span className="font-medium">{lead.enrichment_ad_spend_range}</span>
                </div>
              )}
              {lead.enrichment_services_needed && (
                <div>
                  <span className="text-muted-foreground text-xs">Požadované služby:</span>
                  <p className="font-medium">{lead.enrichment_services_needed}</p>
                </div>
              )}
              {lead.marketing_experience && (
                <div>
                  <span className="text-muted-foreground text-xs">Zkušenosti:</span>
                  <p className="font-medium">{lead.marketing_experience}</p>
                </div>
              )}
              {lead.marketing_maturity && (
                <div>
                  <span className="text-muted-foreground text-xs">Vyspělost:</span>
                  <Badge variant="secondary" className="text-xs">{lead.marketing_maturity}</Badge>
                </div>
              )}
              {lead.has_creative_team && (
                <div>
                  <span className="text-muted-foreground text-xs">Kreativní tým:</span>
                  <span className="font-medium ml-1">{lead.has_creative_team}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pain point */}
        {lead.pain_point && (
          <div className="p-3 rounded-lg border-l-4 border-red-400 bg-red-500/5">
            <span className="text-xs text-muted-foreground block mb-1">🎯 Pain point:</span>
            <p className="text-sm font-medium">{lead.pain_point}</p>
          </div>
        )}

        {/* Company details */}
        {(lead.is_ecommerce !== null || lead.business_type || lead.company_address) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Building className="h-3.5 w-3.5" />
              Firma (enrichment)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {lead.is_ecommerce !== null && (
                <Badge variant="outline" className={cn("text-xs gap-1", lead.is_ecommerce ? "bg-blue-500/10 text-blue-700 border-blue-500/30" : "")}>
                  <ShoppingCart className="h-3 w-3" />
                  {lead.is_ecommerce ? 'E-shop' : 'Není e-shop'}
                </Badge>
              )}
              {lead.business_type && (
                <Badge variant="secondary" className="text-xs">{lead.business_type}</Badge>
              )}
            </div>
            {lead.company_address && (
              <p className="text-xs text-muted-foreground">{lead.company_address}</p>
            )}
          </div>
        )}

        {/* Social media */}
        {(lead.facebook_url || lead.instagram_url) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              Sociální sítě
            </div>
            <div className="flex gap-2">
              {lead.facebook_url && (
                <a href={lead.facebook_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                  <Facebook className="h-3.5 w-3.5" /> Facebook
                </a>
              )}
              {lead.instagram_url && (
                <a href={lead.instagram_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                  <Instagram className="h-3.5 w-3.5" /> Instagram
                </a>
              )}
            </div>
          </div>
        )}

        {/* Booking */}
        {(lead.booking_status || lead.booking_datetime || lead.booking_meet_link) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Booking
            </div>
            <div className="text-sm space-y-1">
              {lead.booking_status && (
                <Badge variant="outline" className={cn("text-xs", 
                  lead.booking_status === 'scheduled' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' : ''
                )}>
                  {lead.booking_status}
                </Badge>
              )}
              {lead.booking_datetime && (
                <p className="text-muted-foreground">
                  📅 {new Date(lead.booking_datetime).toLocaleString('cs-CZ')}
                </p>
              )}
              {lead.booking_meet_link && (
                <a href={lead.booking_meet_link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                  <Video className="h-3.5 w-3.5" /> Google Meet
                </a>
              )}
            </div>
          </div>
        )}

        {/* AI Company Research */}
        {lead.company_research && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Brain className="h-3.5 w-3.5" />
              AI Research
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
              {lead.company_research}
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
