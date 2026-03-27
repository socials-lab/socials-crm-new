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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { Lead } from '@/types/crm';

interface LeadEnrichmentSectionProps {
  lead: Lead;
}

function BooleanBadge({ value, label }: { value: boolean | null; label: string }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className={cn(
        "h-5 w-5 rounded flex items-center justify-center",
        value 
          ? "bg-emerald-500 text-white" 
          : "bg-muted text-muted-foreground"
      )}>
        {value ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      </div>
    </div>
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
        <span className={cn("text-sm font-bold", color)}>{score}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", bg)} style={{ width: `${percent}%` }} />
      </div>
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
    high: '🔥 High',
    medium: '⚡ Střední',
    low: '❄️ Low',
  };
  return (
    <Badge variant="outline" className={cn("text-xs", colors[tier] || colors.medium)}>
      {labels[tier] || tier}
    </Badge>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

/** Summary bar shown at the top of lead detail */
export function LeadSummaryBar({ lead }: LeadEnrichmentSectionProps) {
  const fields = [
    { label: 'Jméno', value: lead.contact_name },
    { label: 'E-mail', value: lead.contact_email },
    { label: 'Telefon', value: lead.contact_phone },
    { label: 'Web', value: lead.website, isLink: true },
    { label: 'Rozpočet', value: lead.enrichment_ad_spend_range || (lead.ad_spend_monthly ? `${lead.ad_spend_monthly.toLocaleString('cs-CZ')} Kč` : null) },
    { label: 'Skóre', value: lead.lead_score !== null && lead.lead_score !== undefined ? String(lead.lead_score) : null },
    { label: 'Kvalifikace', value: lead.enrichment_qualification_tier },
    { label: 'Schůzka', value: lead.booking_datetime ? new Date(lead.booking_datetime).toLocaleDateString('cs-CZ') : '–' },
    { label: 'Datum', value: lead.created_at ? new Date(lead.created_at).toLocaleDateString('cs-CZ') : null },
  ];

  return (
    <div className="rounded-lg border bg-card overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b">
            {fields.map(f => (
              <th key={f.label} className="px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-left whitespace-nowrap">
                {f.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {fields.map(f => (
              <td key={`v-${f.label}`} className="px-3 py-2.5 whitespace-nowrap">
                {f.isLink && f.value ? (
                  <a href={f.value.startsWith('http') ? f.value : `https://${f.value}`} target="_blank" rel="noopener noreferrer"
                    className="text-primary hover:underline">
                    {f.value}
                  </a>
                ) : f.label === 'Kvalifikace' && f.value ? (
                  <TierBadge tier={f.value} />
                ) : (
                  <span className={cn(!f.value && "text-muted-foreground")}>
                    {f.value || '–'}
                  </span>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** Firma card (enrichment company data) */
export function EnrichmentFirmaCard({ lead }: LeadEnrichmentSectionProps) {
  const hasData = lead.company_name || lead.ico || lead.company_address || lead.is_ecommerce !== null || lead.credibility_score !== null || lead.facebook_url || lead.instagram_url;
  if (!hasData) return null;

  return (
    <div className="p-4 rounded-lg border bg-card space-y-3">
      <h4 className="text-xs font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
        <Building className="h-3.5 w-3.5" />
        Firma
      </h4>
      
      <div className="space-y-2 text-sm">
        {lead.company_name && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{lead.company_name}</span>
            {lead.ico && (
              <a href={`https://or.justice.cz/ias/ui/rejstrik-firma.vysledky?ico=${lead.ico}`} target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary hover:underline">📋 Rejstřík</a>
            )}
            {lead.is_vat_payer && (
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
                ✅ DPH
              </Badge>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <InfoRow label="IČO" value={lead.ico} />
          <InfoRow label="Adresa" value={lead.company_address || [lead.billing_street, lead.billing_city, lead.billing_zip].filter(Boolean).join(', ')} />
          <InfoRow label="E-shop" value={lead.is_ecommerce !== null ? (lead.is_ecommerce ? 'Ano' : 'Ne') : null} />
          <InfoRow label="Kredibilita" value={lead.credibility_score !== null ? String(lead.credibility_score) : null} />
        </div>

        {/* Social links */}
        {(lead.facebook_url || lead.instagram_url) && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 pt-1">
            {lead.facebook_url && (
              <div>
                <span className="text-xs text-muted-foreground">Facebook</span>
                <a href={lead.facebook_url.startsWith('http') ? lead.facebook_url : `https://facebook.com/${lead.facebook_url}`} 
                  target="_blank" rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1">
                  <Facebook className="h-3.5 w-3.5" />
                  {lead.facebook_url.replace(/https?:\/\/(www\.)?facebook\.com\/?/, '')}
                </a>
              </div>
            )}
            {lead.instagram_url && (
              <div>
                <span className="text-xs text-muted-foreground">Instagram</span>
                <a href={lead.instagram_url.startsWith('http') ? lead.instagram_url : `https://instagram.com/${lead.instagram_url}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1">
                  <Instagram className="h-3.5 w-3.5" />
                  {lead.instagram_url.replace(/https?:\/\/(www\.)?instagram\.com\/?/, '')}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Web & Tracking card */
export function EnrichmentTrackingCard({ lead }: LeadEnrichmentSectionProps) {
  const hasData = lead.is_ecommerce !== null || lead.enrichment_platform || lead.marketing_maturity || 
    lead.has_ga4 !== null || lead.has_gtm !== null || lead.has_meta_pixel !== null || lead.has_google_ads !== null;
  if (!hasData) return null;

  return (
    <div className="p-4 rounded-lg border bg-card space-y-3">
      <h4 className="text-xs font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
        <Activity className="h-3.5 w-3.5" />
        Web & Tracking
      </h4>
      
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <InfoRow label="Typ webu" value={lead.is_ecommerce ? 'E-shop' : lead.business_type || null} />
          <InfoRow label="Platforma" value={lead.enrichment_platform} />
          <InfoRow label="Vyspělost" value={lead.marketing_maturity} />
        </div>

        {/* Tracking badges */}
        {(lead.has_ga4 !== null || lead.has_gtm !== null || lead.has_meta_pixel !== null || lead.has_google_ads !== null) && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <BooleanBadge value={lead.has_gtm} label="GTM" />
            <BooleanBadge value={lead.has_meta_pixel} label="Meta Pixel" />
            <BooleanBadge value={lead.has_google_ads} label="Google Ads" />
            <BooleanBadge value={lead.has_ga4} label="GA4" />
          </div>
        )}
      </div>
    </div>
  );
}

/** Marketing card */
export function EnrichmentMarketingCard({ lead }: LeadEnrichmentSectionProps) {
  const hasData = lead.enrichment_services_needed || lead.marketing_experience || lead.has_creative_team || lead.pain_point || lead.enrichment_ad_spend_range;
  if (!hasData) return null;

  return (
    <div className="p-4 rounded-lg border bg-card space-y-3">
      <h4 className="text-xs font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
        <BarChart3 className="h-3.5 w-3.5" />
        Marketing
      </h4>
      
      <div className="space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <InfoRow label="Kanály" value={lead.enrichment_services_needed} />
          <InfoRow label="Kdo řeší reklamu" value={lead.marketing_experience} />
          <InfoRow label="Grafický tým" value={lead.has_creative_team} />
        </div>
        
        {lead.pain_point && (
          <div className="p-2.5 rounded-lg border-l-4 border-red-400 bg-red-500/5 mt-2">
            <span className="text-xs text-muted-foreground block mb-0.5">🎯 Pain point</span>
            <p className="text-sm font-medium">{lead.pain_point}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Booking section */
export function EnrichmentBookingSection({ lead }: LeadEnrichmentSectionProps) {
  const hasData = lead.booking_status || lead.booking_datetime || lead.booking_meet_link;
  if (!hasData) return null;

  return (
    <div className="flex items-center gap-4 text-sm">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      {lead.booking_status && (
        <Badge variant="outline" className={cn("text-xs", 
          lead.booking_status === 'scheduled' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' : ''
        )}>
          {lead.booking_status}
        </Badge>
      )}
      {lead.booking_datetime && (
        <span className="text-muted-foreground">
          📅 {new Date(lead.booking_datetime).toLocaleString('cs-CZ')}
        </span>
      )}
      {lead.booking_meet_link && (
        <a href={lead.booking_meet_link} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-primary hover:underline">
          <Video className="h-3.5 w-3.5" /> Google Meet
        </a>
      )}
    </div>
  );
}

/** AI Research section - full width */
export function EnrichmentResearchSection({ lead }: LeadEnrichmentSectionProps) {
  if (!lead.company_research) return null;

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors">
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
        <Brain className="h-4 w-4 text-violet-500" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Research firmy (Perplexity)</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        <div className="p-4 rounded-lg border bg-card text-sm leading-relaxed whitespace-pre-wrap">
          {lead.company_research}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Score overview badges for header area */
export function LeadScoreBadges({ lead }: LeadEnrichmentSectionProps) {
  if (!lead.lead_score && !lead.enrichment_qualification_tier) return null;
  
  return (
    <div className="flex items-center gap-2">
      {lead.lead_score !== null && lead.lead_score !== undefined && (
        <Badge variant="outline" className="text-xs gap-1">
          <Target className="h-3 w-3" />
          Score: {lead.lead_score}
        </Badge>
      )}
      {lead.enrichment_qualification_tier && (
        <TierBadge tier={lead.enrichment_qualification_tier} />
      )}
    </div>
  );
}

/** Legacy wrapper - keeps backward compat but now renders the 3-card layout */
export function LeadEnrichmentSection({ lead }: LeadEnrichmentSectionProps) {
  const hasEnrichmentData = lead.enrichment_completed || lead.lead_score !== null || lead.credibility_score !== null || lead.enrichment_platform || lead.pain_point || lead.company_research;
  
  if (!hasEnrichmentData) return null;

  return (
    <div className="space-y-4">
      {/* Three cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <EnrichmentFirmaCard lead={lead} />
        <EnrichmentTrackingCard lead={lead} />
        <EnrichmentMarketingCard lead={lead} />
      </div>

      {/* Research - full width */}
      <EnrichmentResearchSection lead={lead} />
    </div>
  );
}
