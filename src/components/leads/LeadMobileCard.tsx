import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  User, 
  ExternalLink, 
  Mail, 
  ClipboardList, 
  FileCheck2, 
  FileSignature,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import type { Lead, LeadStage } from '@/types/crm';
import { cn } from '@/lib/utils';
import { getLeadLastActivity } from '@/utils/leadActivityUtils';

interface LeadMobileCardProps {
  lead: Lead;
  ownerName: string;
  onClick: () => void;
}

const STAGE_LABELS: Record<LeadStage, string> = {
  new_lead: 'Nový lead',
  meeting_done: 'Schůzka proběhla',
  waiting_access: 'Čekáme na přístupy',
  access_received: 'Přístupy přijaty',
  preparing_offer: 'Příprava nabídky',
  offer_sent: 'Nabídka odeslána',
  won: 'Vyhráno',
  lost: 'Prohráno',
  postponed: 'Odloženo',
};

const STAGE_COLORS: Record<LeadStage, string> = {
  new_lead: 'bg-slate-500/10 text-slate-700 border-slate-500/30',
  meeting_done: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  waiting_access: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  access_received: 'bg-green-500/10 text-green-700 border-green-500/30',
  preparing_offer: 'bg-violet-500/10 text-violet-700 border-violet-500/30',
  offer_sent: 'bg-pink-500/10 text-pink-700 border-pink-500/30',
  won: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  lost: 'bg-red-500/10 text-red-700 border-red-500/30',
  postponed: 'bg-gray-500/10 text-gray-700 border-gray-500/30',
};

export function LeadMobileCard({ lead, ownerName, onClick }: LeadMobileCardProps) {
  const isConverted = !!lead.converted_to_client_id;
  const activityInfo = getLeadLastActivity(lead);

  return (
    <Card 
      className={cn(
        'cursor-pointer touch-manipulation hover:shadow-md transition-all hover:border-primary/50 active:scale-[0.98]',
        isConverted && 'border-emerald-500/50 bg-emerald-500/5'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-sm truncate">{lead.company_name}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {lead.access_request_sent_at && (
              <Mail className="h-3.5 w-3.5 text-blue-500" />
            )}
            {lead.onboarding_form_sent_at && !lead.onboarding_form_completed_at && (
              <ClipboardList className="h-3.5 w-3.5 text-amber-500" />
            )}
            {lead.onboarding_form_completed_at && (
              <FileCheck2 className="h-3.5 w-3.5 text-emerald-500" />
            )}
            {lead.contract_url && (
              <FileSignature className="h-3.5 w-3.5 text-primary" />
            )}
            {isConverted && (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            )}
          </div>
        </div>

        {/* IČO */}
        <p className="text-xs text-muted-foreground">IČO: {lead.ico}</p>

        {/* Contact */}
        <div className="flex items-center gap-2 text-sm">
          <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">{lead.contact_name}</span>
        </div>

        {/* Middle row: Stage + Owner */}
        <div className="flex items-center justify-between gap-2">
          <Badge 
            variant="outline" 
            className={cn("text-xs", STAGE_COLORS[lead.stage])}
          >
            {STAGE_LABELS[lead.stage]}
          </Badge>
          <span className="text-xs text-muted-foreground truncate">{ownerName}</span>
        </div>

        {/* Footer: Price + Activity + Offer link */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              ~{lead.estimated_price.toLocaleString()} {lead.currency}
            </span>
            <Badge variant="secondary" className="text-xs">
              {lead.potential_service}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {/* Activity Indicator */}
            <div className={cn(
              "flex items-center gap-1 text-xs",
              activityInfo.isStale ? "text-amber-600" : "text-muted-foreground"
            )}>
              {activityInfo.isStale ? (
                <AlertTriangle className="h-3.5 w-3.5" />
              ) : (
                <Clock className="h-3.5 w-3.5" />
              )}
              <span>{activityInfo.activityLabel}</span>
            </div>
            {lead.offer_url && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(lead.offer_url!, '_blank');
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
