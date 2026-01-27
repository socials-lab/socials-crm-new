import { Building2, User, TrendingUp, CheckCircle2, Mail, ClipboardList, FileCheck2, FileSignature, Send, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Lead } from '@/types/crm';
import { cn } from '@/lib/utils';
import { getLeadLastActivity } from '@/utils/leadActivityUtils';

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
}

const OFFER_TYPE_LABELS: Record<Lead['offer_type'], string> = {
  retainer: '/ měsíc',
  one_off: 'jednorázově',
};

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const isConverted = !!lead.converted_to_client_id;
  const activityInfo = getLeadLastActivity(lead);

  return (
    <Card 
      className={cn(
        "cursor-grab active:cursor-grabbing hover:shadow-md transition-all hover:border-primary/50",
        isConverted && "border-emerald-500/50 bg-emerald-500/5"
      )}
      onClick={onClick}
    >
      <CardContent className="p-2 space-y-1.5">
        {/* Company */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium text-sm truncate">{lead.company_name}</span>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {lead.access_request_sent_at && (
              <span title="Žádost o přístupy odeslána">
                <Mail className="h-3 w-3 text-blue-500" />
              </span>
            )}
            {lead.onboarding_form_sent_at && !lead.onboarding_form_completed_at && (
              <span title="Onboarding formulář odeslán">
                <ClipboardList className="h-3 w-3 text-amber-500" />
              </span>
            )}
            {lead.onboarding_form_completed_at && (
              <span title="Onboarding formulář vyplněn">
                <FileCheck2 className="h-3 w-3 text-emerald-500" />
              </span>
            )}
            {lead.contract_url && (
              <span title="Smlouva vytvořena">
                <FileSignature className="h-3 w-3 text-primary" />
              </span>
            )}
            {lead.offer_sent_at && (
              <span title="Nabídka odeslána">
                <Send className="h-3 w-3 text-pink-500" />
              </span>
            )}
            {isConverted && (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span className="truncate">{lead.contact_name}</span>
        </div>

        {/* Value */}
        {(() => {
          const hasServices = lead.potential_services && lead.potential_services.length > 0;
          const totalPrice = hasServices
            ? lead.potential_services.reduce((sum, s) => sum + s.price, 0)
            : 0;
          const firstServiceName = hasServices ? lead.potential_services[0].name : lead.potential_service;
          const serviceCount = hasServices ? lead.potential_services.length : 0;

          return (
            <>
              <div className="flex items-center justify-between pt-1 border-t">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                  {hasServices ? (
                    <span className="text-xs font-semibold">
                      ~{totalPrice.toLocaleString()} {lead.currency}
                      <span className="text-muted-foreground font-normal ml-1">
                        {OFFER_TYPE_LABELS[lead.offer_type]}
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Cena není stanovena</span>
                  )}
                </div>
              </div>

              {/* Service Badges + Activity */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex flex-wrap gap-0.5 flex-1 min-w-0">
                  {hasServices ? (
                    <>
                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                        {firstServiceName}
                      </Badge>
                      {serviceCount > 1 && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                          +{serviceCount - 1}
                        </Badge>
                      )}
                    </>
                  ) : (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-muted-foreground">
                      Žádné služby
                    </Badge>
                  )}
                </div>
                
                {/* Activity Indicator */}
                <div className={cn(
                  "flex items-center gap-0.5 text-[10px] shrink-0",
                  activityInfo.isStale ? "text-amber-600" : "text-muted-foreground"
                )}>
                  {activityInfo.isStale ? (
                    <AlertTriangle className="h-3 w-3" />
                  ) : (
                    <Clock className="h-3 w-3" />
                  )}
                  <span>{activityInfo.activityLabel}</span>
                </div>
              </div>
            </>
          );
        })()}
      </CardContent>
    </Card>
  );
}
