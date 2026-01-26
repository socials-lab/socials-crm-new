import { ExternalLink, Building2, MapPin, Mail, Phone, User, FileText, ClipboardCheck, Calendar, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Lead } from '@/types/crm';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

interface LeadOriginSectionProps {
  lead: Lead;
  onStopPropagation: (e: React.MouseEvent) => void;
}

export function LeadOriginSection({ lead, onStopPropagation }: LeadOriginSectionProps) {
  const hasOnboardingData = lead.onboarding_form_completed_at;
  const hasOffer = lead.offer_url || lead.offer_sent_at;
  
  if (!hasOnboardingData && !hasOffer) {
    return null;
  }

  const hasBillingAddress = lead.billing_street || lead.billing_city || lead.billing_zip;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-700 border-amber-500/30">
          📋 Z leadu
        </Badge>
        {lead.converted_at && (
          <span className="text-xs text-muted-foreground">
            Převedeno {format(new Date(lead.converted_at), 'd. MMMM yyyy', { locale: cs })}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Onboarding Form Data */}
        {hasOnboardingData && (
          <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
            <h5 className="font-medium text-sm flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-emerald-600" />
              Onboarding formulář
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
                Vyplněno
              </Badge>
            </h5>
            
            <div className="space-y-2 text-sm">
              {/* Company info */}
              <div className="flex items-start gap-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{lead.company_name}</p>
                  <p className="text-xs text-muted-foreground">
                    IČO: {lead.ico}
                    {lead.dic && ` • DIČ: ${lead.dic}`}
                  </p>
                </div>
              </div>

              {/* Billing address */}
              {hasBillingAddress && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fakturační adresa:</p>
                    <p>
                      {[lead.billing_street, lead.billing_city, lead.billing_zip]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    {lead.billing_country && (
                      <p className="text-xs text-muted-foreground">{lead.billing_country}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Billing email */}
              {lead.billing_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fakturační e-mail:</p>
                    <a 
                      href={`mailto:${lead.billing_email}`} 
                      className="text-primary hover:underline"
                      onClick={onStopPropagation}
                    >
                      {lead.billing_email}
                    </a>
                  </div>
                </div>
              )}

              {/* Contact person */}
              <div className="flex items-start gap-2 pt-2 border-t">
                <User className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{lead.contact_name}</p>
                  {lead.contact_position && (
                    <p className="text-xs text-muted-foreground">{lead.contact_position}</p>
                  )}
                  {lead.contact_email && (
                    <a 
                      href={`mailto:${lead.contact_email}`} 
                      className="text-xs text-primary hover:underline block"
                      onClick={onStopPropagation}
                    >
                      {lead.contact_email}
                    </a>
                  )}
                  {lead.contact_phone && (
                    <a 
                      href={`tel:${lead.contact_phone}`} 
                      className="text-xs text-muted-foreground hover:underline block"
                      onClick={onStopPropagation}
                    >
                      {lead.contact_phone}
                    </a>
                  )}
                </div>
              </div>

              {/* Completion date */}
              {lead.onboarding_form_completed_at && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <Calendar className="h-3 w-3" />
                  Vyplněno: {format(new Date(lead.onboarding_form_completed_at), 'd. M. yyyy HH:mm', { locale: cs })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Offer Data */}
        {hasOffer && (
          <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
            <h5 className="font-medium text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Nabídka z leadu
              {lead.offer_sent_at && (
                <Badge variant="outline" className="text-[10px] bg-pink-500/10 text-pink-700 border-pink-500/30">
                  <Send className="h-2.5 w-2.5 mr-1" />
                  Odesláno
                </Badge>
              )}
            </h5>
            
            <div className="space-y-2 text-sm">
              {/* Services from offer */}
              {lead.potential_services && lead.potential_services.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Služby v nabídce:</p>
                  <div className="flex flex-wrap gap-1">
                    {lead.potential_services.map((service) => (
                      <Badge 
                        key={service.id} 
                        variant="secondary" 
                        className="text-[10px]"
                      >
                        {service.name}
                        {service.selected_tier && (
                          <span className="ml-1 opacity-70">{service.selected_tier.toUpperCase()}</span>
                        )}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs font-medium pt-1">
                    Celkem: {lead.potential_services.reduce((sum, s) => sum + s.price, 0).toLocaleString()} {lead.currency}
                    <span className="text-muted-foreground font-normal">
                      {lead.offer_type === 'retainer' ? '/měsíc' : ' jednorázově'}
                    </span>
                  </p>
                </div>
              )}

              {/* Offer URL */}
              {lead.offer_url && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-8 text-xs"
                  onClick={(e) => {
                    onStopPropagation(e);
                    window.open(lead.offer_url!, '_blank');
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-2" />
                  Otevřít nabídku
                </Button>
              )}

              {/* Offer timeline */}
              <div className="space-y-1 text-xs text-muted-foreground pt-2 border-t">
                {lead.offer_created_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Vytvořeno: {format(new Date(lead.offer_created_at), 'd. M. yyyy', { locale: cs })}
                  </div>
                )}
                {lead.offer_sent_at && (
                  <div className="flex items-center gap-2">
                    <Send className="h-3 w-3" />
                    Odesláno: {format(new Date(lead.offer_sent_at), 'd. M. yyyy', { locale: cs })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional lead info */}
      {(lead.summary || lead.client_message) && (
        <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
          {lead.summary && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Shrnutí z leadu:</p>
              <p className="text-sm">{lead.summary}</p>
            </div>
          )}
          {lead.client_message && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Zpráva od klienta:</p>
              <p className="text-sm italic">"{lead.client_message}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
