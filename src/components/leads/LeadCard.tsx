import { Building2, User, MessageSquare, TrendingUp, CheckCircle2, Mail, ClipboardList, FileCheck2, FileSignature, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Lead } from '@/types/crm';
import { cn } from '@/lib/utils';

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

  return (
    <Card 
      className={cn(
        "cursor-grab active:cursor-grabbing hover:shadow-md transition-all hover:border-primary/50",
        isConverted && "border-emerald-500/50 bg-emerald-500/5"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        {/* Company */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-sm truncate">{lead.company_name}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {lead.access_request_sent_at && (
              <span title="Žádost o přístupy odeslána">
                <Mail className="h-3.5 w-3.5 text-blue-500" />
              </span>
            )}
            {lead.onboarding_form_sent_at && !lead.onboarding_form_completed_at && (
              <span title="Onboarding formulář odeslán">
                <ClipboardList className="h-3.5 w-3.5 text-amber-500" />
              </span>
            )}
            {lead.onboarding_form_completed_at && (
              <span title="Onboarding formulář vyplněn">
                <FileCheck2 className="h-3.5 w-3.5 text-emerald-500" />
              </span>
            )}
            {lead.contract_url && (
              <span title="Smlouva vytvořena">
                <FileSignature className="h-3.5 w-3.5 text-primary" />
              </span>
            )}
            {lead.offer_sent_at && (
              <span title="Nabídka odeslána">
                <Send className="h-3.5 w-3.5 text-pink-500" />
              </span>
            )}
            {isConverted && (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            )}
          </div>
        </div>

        {/* ICO */}
        <p className="text-xs text-muted-foreground">IČO: {lead.ico}</p>

        {/* Contact */}
        <div className="flex items-center gap-2 text-sm">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="truncate">
            {lead.contact_name}
            {lead.contact_position && (
              <span className="text-muted-foreground"> – {lead.contact_position}</span>
            )}
          </span>
        </div>

        {/* Summary */}
        {lead.summary && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <p className="line-clamp-2">{lead.summary}</p>
          </div>
        )}

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
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                  {hasServices ? (
                    <>
                      <span className="text-sm font-semibold">
                        ~{totalPrice.toLocaleString()} {lead.currency}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {OFFER_TYPE_LABELS[lead.offer_type]}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Cena není stanovena</span>
                  )}
                </div>
              </div>

              {/* Service Badges */}
              {hasServices ? (
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    {firstServiceName}
                  </Badge>
                  {serviceCount > 1 && (
                    <Badge variant="secondary" className="text-xs">
                      +{serviceCount - 1}
                    </Badge>
                  )}
                </div>
              ) : (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Žádné služby
                </Badge>
              )}
            </>
          );
        })()}
      </CardContent>
    </Card>
  );
}
