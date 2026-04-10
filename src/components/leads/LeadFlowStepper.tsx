import { 
  Plus, 
  KeyRound, 
  CheckCircle2, 
  Package, 
  Link2, 
  Send, 
  ClipboardList, 
  FileSignature, 
  ArrowRightLeft,
  ExternalLink,
  X,
  Check,
  Calendar,
  CircleDot,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Lead, LeadService } from '@/types/crm';

interface LeadFlowStepperProps {
  lead: Lead;
  offerUrl?: string | null;
  hasOfferDraft?: boolean;
  offerDraftSavedAt?: number | null;
  onSendMeetingRequest: () => void;
  onQuickConfirmMeetingSent: () => void;
  onRequestAccess: () => void;
  onQuickConfirmAccessSent: () => void;
  onMarkAccessReceived: () => void;
  onAddService: () => void;
  onCreateOffer: () => void;
  onSendOffer: () => void;
  onQuickConfirmOfferSent: () => void;
  onSendOnboarding: () => void;
  onResetOnboarding: () => void;
  onViewOnboardingData: () => void;
  onSendContract: () => void;
  onMarkContractSent: () => void;
  onMarkContractSigned: () => void;
  onCheckDigiSign?: () => void;
  isCheckingDigiSign?: boolean;
  onSendWelcomeEmail: () => void;
  onMarkWelcomeEmailSent: () => void;
  onConvert: () => void;
  onRemoveService?: (index: number) => void;
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
};

function ServicesInlineList({ 
  services, 
  currency, 
  onRemove 
}: { 
  services: LeadService[]; 
  currency: string;
  onRemove?: (index: number) => void;
}) {
  if (services.length === 0) return null;
  const total = services.reduce((sum, s) => sum + s.price, 0);
  
  return (
    <div className="mt-2 space-y-1 ml-1">
      {services.map((s, i) => (
        <div key={i} className="flex items-center gap-1.5 text-xs group">
          <span className="text-muted-foreground">•</span>
          <span className="flex-1 truncate">{s.name}</span>
          {s.selected_tier && (
            <Badge variant="outline" className="text-[10px] h-4 px-1">{s.selected_tier}</Badge>
          )}
          {s.intro_discount_percent && s.intro_discount_months && (
            <Badge variant="outline" className="text-[10px] h-4 px-1 bg-amber-500/10 text-amber-700 border-amber-500/30">
              -{s.intro_discount_percent}% / {s.intro_discount_months} měs.
            </Badge>
          )}
          <span className="font-medium tabular-nums">{s.price.toLocaleString()} {currency}</span>
          {onRemove && (
            <button
              onClick={() => onRemove(i)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
      {services.length > 1 && (
        <div className="flex items-center justify-end text-xs font-medium pt-1 border-t border-border/50">
          Celkem: {total.toLocaleString()} {currency}
        </div>
      )}
    </div>
  );
}

export function LeadFlowStepper({
  lead,
  offerUrl,
  hasOfferDraft = false,
  offerDraftSavedAt = null,
  onSendMeetingRequest,
  onQuickConfirmMeetingSent,
  onRequestAccess,
  onQuickConfirmAccessSent,
  onMarkAccessReceived,
  onAddService,
  onCreateOffer,
  onSendOffer,
  onQuickConfirmOfferSent,
  onSendOnboarding,
  onResetOnboarding,
  onViewOnboardingData,
  onSendContract,
  onMarkContractSent,
  onMarkContractSigned,
  onCheckDigiSign,
  isCheckingDigiSign,
  onSendWelcomeEmail,
  onMarkWelcomeEmailSent,
  onConvert,
  onRemoveService,
}: LeadFlowStepperProps) {
  const servicesCount = lead.potential_services?.length || 0;
  const services = lead.potential_services || [];
  const currency = lead.currency || 'CZK';
  const getServiceCountryVariants = (service: LeadService) => {
    if (!Array.isArray(service.country_variants)) return [];
    return service.country_variants
      .filter((variant): variant is { country_code: string; multiplier: number; price: number } => {
        if (!variant || typeof variant !== 'object') return false;
        return typeof variant.country_code === 'string' && variant.country_code.trim().length > 0;
      })
      .map((variant) => ({
        country_code: variant.country_code.trim().toUpperCase(),
        multiplier: Number.isFinite(variant.multiplier) ? variant.multiplier : 0,
        price: Number.isFinite(variant.price) ? variant.price : 0,
      }));
  };
  const getServiceTotalPrice = (service: LeadService) => {
    const variantsTotal = getServiceCountryVariants(service).reduce((sum, variant) => sum + (variant.price || 0), 0);
    return (service.price || 0) + variantsTotal;
  };
  const monthlyTotal = services
    .filter((service) => (service.billing_type || 'monthly') === 'monthly')
    .reduce((sum, service) => sum + getServiceTotalPrice(service), 0);
  const oneOffTotal = services
    .filter((service) => service.billing_type === 'one_off')
    .reduce((sum, service) => sum + getServiceTotalPrice(service), 0);
  const contractBillingAddress = [
    lead.billing_street,
    lead.billing_city,
    lead.billing_zip,
    lead.billing_country,
  ]
    .filter(Boolean)
    .join(', ');
  const contractInvoiceEmail = lead.billing_email || null;
  const hasOffer = !!offerUrl;
  const canConvert = !lead.converted_to_client_id && !['won', 'lost'].includes(lead.stage);

  interface StepDef {
    id: string;
    label: string;
    isComplete: boolean;
    completedAt: string | null;
    detail?: string;
    actions?: Array<{
      label: string;
      onClick: () => void;
      variant?: 'default' | 'outline' | 'ghost';
      size?: 'sm' | 'xs';
    }>;
    customContent?: React.ReactNode;
  }

  const steps: StepDef[] = [
    {
      id: 'created',
      label: 'Lead vytvořen',
      isComplete: true,
      completedAt: lead.created_at,
    },
    {
      id: 'meeting-request',
      label: 'Žádost o schůzku',
      isComplete: !!lead.meeting_request_sent_at,
      completedAt: lead.meeting_request_sent_at,
      actions: !lead.meeting_request_sent_at ? [
        { label: 'Odeslat e-mail', onClick: onSendMeetingRequest, variant: 'outline' },
        { label: '✓ Potvrdil ručně', onClick: onQuickConfirmMeetingSent, variant: 'ghost' },
      ] : [
        { label: 'Odeslat znovu', onClick: onSendMeetingRequest, variant: 'ghost' },
      ],
    },
    {
      id: 'access-sent',
      label: 'Žádost o přístupy',
      isComplete: !!lead.access_request_sent_at,
      completedAt: lead.access_request_sent_at,
      detail: lead.access_request_platforms?.length > 0 
        ? lead.access_request_platforms.join(', ')
        : undefined,
      actions: !lead.access_request_sent_at ? [
        { label: 'Odeslat e-mail', onClick: onRequestAccess, variant: 'outline' },
        { label: '✓ Potvrdil ručně', onClick: onQuickConfirmAccessSent, variant: 'ghost' },
      ] : [
        { label: 'Odeslat znovu', onClick: onRequestAccess, variant: 'ghost' },
      ],
    },
    {
      id: 'access-received',
      label: 'Přístupy přijaty',
      isComplete: !!lead.access_received_at,
      completedAt: lead.access_received_at,
      actions: lead.access_request_sent_at && !lead.access_received_at ? [
        { label: '✓ Přístupy přijaty', onClick: onMarkAccessReceived, variant: 'default' },
      ] : undefined,
    },
    {
      id: 'offer-created',
      label: 'Nabídka vytvořena',
      isComplete: !!lead.offer_created_at,
      completedAt: lead.offer_created_at,
      detail: servicesCount > 0 ? `${servicesCount} služeb` : undefined,
      actions: [
        ...(hasOffer ? [
          { label: 'Upravit nabídku', onClick: onCreateOffer, variant: 'outline' as const },
        ] : [
          { label: 'Vytvořit nabídku', onClick: onCreateOffer, variant: 'outline' as const },
        ]),
      ],
      customContent: (
        <div className="mt-1 space-y-1">
          {offerUrl && (
            <a
              href={offerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Zobrazit nabídku
            </a>
          )}
          {hasOfferDraft && (
            <div className="text-xs text-amber-700 dark:text-amber-400">
              ✍️ Rozpracovaný draft nabídky
              {offerDraftSavedAt ? ` • ${formatDate(new Date(offerDraftSavedAt).toISOString())}` : ''}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'offer-sent',
      label: 'Nabídka odeslána',
      isComplete: !!lead.offer_sent_at,
      completedAt: lead.offer_sent_at,
      actions: hasOffer && !lead.offer_sent_at ? [
        {
          label: 'Odeslat nabídku',
          onClick: onSendOffer,
          variant: 'outline',
        },
        {
          label: '✓ Označit ručně',
          onClick: onQuickConfirmOfferSent,
          variant: 'ghost',
        },
      ] : lead.offer_sent_at ? [{
        label: 'Odeslat znovu',
        onClick: onSendOffer,
        variant: 'ghost',
      }] : undefined,
    },
    {
      id: 'onboarding-sent',
      label: 'Onboarding formulář',
      isComplete: !!lead.onboarding_form_completed_at,
      completedAt: lead.onboarding_form_completed_at,
      detail: lead.onboarding_form_completed_at 
        ? `Vyplněn ${formatDate(lead.onboarding_form_completed_at)}` 
        : lead.onboarding_form_sent_at 
          ? 'Čeká na vyplnění' 
          : undefined,
      actions: [
        ...(!lead.onboarding_form_sent_at ? [{
          label: 'Odeslat formulář',
          onClick: onSendOnboarding,
          variant: 'outline' as const,
        }] : [{
          label: 'Odeslat znovu',
          onClick: onSendOnboarding,
          variant: 'ghost' as const,
        }]),
        {
          label: 'Zobrazit data',
          onClick: onViewOnboardingData,
          variant: 'ghost' as const,
        },
        ...((lead.onboarding_form_sent_at || lead.onboarding_form_completed_at || lead.ico || lead.billing_street || lead.billing_email) ? [{
          label: 'Resetovat',
          onClick: onResetOnboarding,
          variant: 'ghost' as const,
        }] : []),
      ],
    },
    {
      id: 'contract',
      label: 'Smlouva (DigiSign)',
      isComplete: !!lead.contract_signed_at,
      completedAt: lead.contract_signed_at,
      detail: lead.contract_signed_at 
        ? `Podepsána${lead.digisign_envelope_id ? ' via DigiSign' : ''}`
        : lead.contract_sent_at 
          ? `Odeslána${lead.digisign_envelope_id ? ' via DigiSign' : ''}, čeká na podpis`
          : lead.contract_url 
            ? 'Vytvořena'
            : undefined,
      actions: !lead.contract_url && !lead.digisign_envelope_id ? [{
        label: 'Připravit smlouvu',
        onClick: onSendContract,
        variant: 'outline',
      }] : lead.contract_url && !lead.contract_sent_at ? [{
        label: 'Označit jako odeslanou',
        onClick: onMarkContractSent,
        variant: 'outline',
      }, {
        label: 'Upravit',
        onClick: onSendContract,
        variant: 'ghost',
      }] : lead.contract_sent_at && !lead.contract_signed_at ? [
        ...(lead.digisign_id && onCheckDigiSign ? [{
          label: isCheckingDigiSign ? 'Kontroluji…' : 'Zkontrolovat v DigiSign',
          onClick: onCheckDigiSign,
          variant: 'default' as const,
        }] : [{
          label: 'Potvrdit podpis',
          onClick: onMarkContractSigned,
          variant: 'default' as const,
        }]),
        {
          label: 'Potvrdit ručně',
          onClick: onMarkContractSigned,
          variant: 'ghost' as const,
        },
        {
          label: 'Detail',
          onClick: onSendContract,
          variant: 'ghost' as const,
        },
      ] : lead.contract_signed_at ? [{
        label: 'Detail smlouvy',
        onClick: onSendContract,
        variant: 'ghost',
      }] : undefined,
      customContent: (
        <div className="mt-2 space-y-2">
          {(lead.contract_url || lead.signed_contract_url) && (
            <div className="space-y-1">
              {lead.signed_contract_url && (
                <a
                  href={lead.signed_contract_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  <ExternalLink className="h-3 w-3" />
                  Otevřít podepsanou smlouvu
                </a>
              )}
              {lead.contract_url && (
                <a
                  href={lead.contract_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Otevřít draft smlouvy v DigiSign
                </a>
              )}
            </div>
          )}

          <div className="rounded-md border bg-muted/30 p-2.5 text-[11px] text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Náhled dat do smlouvy</p>
            <p>
              Fakturační údaje: {contractBillingAddress || 'chybí'}
            </p>
            <p>
              Fakturační e-mail: {contractInvoiceEmail || 'chybí'}
            </p>
            <p>
              Služby: {services.length > 0
                ? services.map((service) => {
                  const variants = getServiceCountryVariants(service);
                  return `${service.name}${variants.length > 0
                    ? ` + ${variants.map((variant) => variant.country_code).join(', ')}`
                    : ''} (${getServiceTotalPrice(service).toLocaleString('cs-CZ')} ${service.currency || currency}${(service.billing_type || 'monthly') === 'monthly' ? '/měs' : ''})`;
                }).join(', ')
                : 'chybí'}
            </p>
            <p>
              Cena: {monthlyTotal.toLocaleString('cs-CZ')} {currency}/měs
              {oneOffTotal > 0 ? ` + ${oneOffTotal.toLocaleString('cs-CZ')} ${currency} jednorázově` : ''}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'welcome_email',
      label: 'Welcome e-mail',
      isComplete: !!lead.welcome_email_sent_at,
      completedAt: lead.welcome_email_sent_at,
      detail: lead.welcome_email_sent_at ? 'Odesláno' : undefined,
      actions: !lead.welcome_email_sent_at ? [{
        label: 'Připravit e-mail',
        onClick: onSendWelcomeEmail,
        variant: 'default',
      }, {
        label: 'Označit jako odeslaný',
        onClick: onMarkWelcomeEmailSent,
        variant: 'ghost',
      }] : [{
        label: 'Zobrazit',
        onClick: onSendWelcomeEmail,
        variant: 'ghost',
      }],
    },
    {
      id: 'converted',
      label: 'Převedeno na zakázku',
      isComplete: !!lead.converted_at,
      completedAt: lead.converted_at,
      actions: canConvert ? [{
        label: 'Převést na zakázku',
        onClick: onConvert,
        variant: 'default',
      }] : undefined,
    },
  ];

  const currentStepIndex = steps.findIndex(s => !s.isComplete);

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border" />

      <div className="space-y-0">
        {steps.map((step, index) => {
          const isCurrent = index === currentStepIndex;
          const isFuture = !step.isComplete && index > currentStepIndex;
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.id} className="relative flex gap-3 pb-1">
              {/* Circle indicator */}
              <div className={cn(
                "relative z-10 flex items-center justify-center w-[22px] h-[22px] rounded-full flex-shrink-0 mt-0.5 transition-colors",
                step.isComplete && "bg-emerald-500 text-white",
                isCurrent && "bg-primary text-primary-foreground ring-2 ring-primary/20",
                isFuture && "bg-muted border-2 border-border",
              )}>
                {step.isComplete ? (
                  <Check className="h-3 w-3" />
                ) : isCurrent ? (
                  <CircleDot className="h-3 w-3" />
                ) : (
                  <span className="text-[9px] font-medium text-muted-foreground">{index + 1}</span>
                )}
              </div>
              
              {/* Content */}
              <div className={cn(
                "flex-1 min-w-0 pb-3",
                !isLast && "border-b border-border/40",
              )}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn(
                    "text-sm",
                    step.isComplete && "font-medium text-foreground",
                    isCurrent && "font-semibold text-foreground",
                    isFuture && "text-muted-foreground",
                  )}>
                    {step.label}
                  </span>
                  {step.completedAt && (
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(step.completedAt)}
                    </span>
                  )}
                  {step.detail && (
                    <span className="text-[11px] text-muted-foreground">
                      • {step.detail}
                    </span>
                  )}
                </div>
                {step.customContent}
                {step.actions && step.actions.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {step.actions.map((action, ai) => (
                      <Button
                        key={ai}
                        variant={action.variant || 'outline'}
                        size="sm"
                        className={cn(
                          "h-7 text-xs px-2.5",
                          action.variant === 'ghost' && "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={action.onClick}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
