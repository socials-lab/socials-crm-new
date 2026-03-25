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
  Loader2,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Lead, LeadService } from '@/types/crm';

interface FlowStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  isComplete: boolean;
  completedAt: string | null;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline';
  };
  detail?: string;
  customContent?: React.ReactNode;
}

interface LeadFlowStepperProps {
  lead: Lead;
  onSendMeetingRequest: () => void;
  onRequestAccess: () => void;
  onMarkAccessReceived: () => void;
  onAddService: () => void;
  onCreateOffer: () => void;
  onSendOffer: () => void;
  onSendOnboarding: () => void;
  onCreateContract: () => void;
  onMarkContractSent: () => void;
  onMarkContractSigned: () => void;
  onConvert: () => void;
  onRemoveService?: (index: number) => void;
  isCreatingContract?: boolean;
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
    <div className="mt-1.5 space-y-1">
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
        <div className="flex items-center justify-end text-xs font-medium pt-0.5 border-t border-border/50">
          Celkem: {total.toLocaleString()} {currency}
        </div>
      )}
    </div>
  );
}

export function LeadFlowStepper({
  lead,
  onSendMeetingRequest,
  onRequestAccess,
  onMarkAccessReceived,
  onAddService,
  onCreateOffer,
  onSendOffer,
  onSendOnboarding,
  onCreateContract,
  onMarkContractSent,
  onMarkContractSigned,
  onConvert,
  onRemoveService,
  isCreatingContract,
}: LeadFlowStepperProps) {
  const servicesCount = lead.potential_services?.length || 0;
  const hasOffer = !!lead.offer_url;
  const isArchived = ['lost', 'postponed'].includes(lead.stage);
  const canConvert = !lead.converted_to_client_id && !['won', 'lost', 'postponed'].includes(lead.stage);

  const steps: FlowStep[] = [
    {
      id: 'created',
      label: 'Lead vytvořen',
      icon: <Plus className="h-3.5 w-3.5" />,
      isComplete: true,
      completedAt: lead.created_at,
    },
    {
      id: 'meeting-request',
      label: 'Žádost o schůzku',
      icon: <Calendar className="h-3.5 w-3.5" />,
      isComplete: !!lead.meeting_request_sent_at,
      completedAt: lead.meeting_request_sent_at,
      action: !lead.meeting_request_sent_at ? {
        label: 'Odeslat',
        onClick: onSendMeetingRequest,
        variant: 'outline',
      } : undefined,
    },
    {
      id: 'access-sent',
      label: 'Žádost o přístupy',
      icon: <KeyRound className="h-3.5 w-3.5" />,
      isComplete: !!lead.access_request_sent_at,
      completedAt: lead.access_request_sent_at,
      detail: lead.access_request_platforms?.length > 0
        ? lead.access_request_platforms.join(', ')
        : undefined,
      action: !lead.access_request_sent_at ? {
        label: 'Odeslat',
        onClick: onRequestAccess,
        variant: 'outline',
      } : undefined,
    },
    {
      id: 'access-received',
      label: 'Přístupy přijaty',
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      isComplete: !!lead.access_received_at,
      completedAt: lead.access_received_at,
      action: lead.access_request_sent_at && !lead.access_received_at ? {
        label: 'Potvrdit',
        onClick: onMarkAccessReceived,
        variant: 'default',
      } : undefined,
    },
    {
      id: 'services',
      label: 'Služby v nabídce',
      icon: <Package className="h-3.5 w-3.5" />,
      isComplete: servicesCount > 0,
      completedAt: null,
      detail: servicesCount > 0 ? `${servicesCount} služeb` : undefined,
      action: {
        label: servicesCount > 0 ? 'Přidat další' : 'Přidat službu',
        onClick: onAddService,
        variant: 'outline',
      },
      customContent: servicesCount > 0 ? (
        <ServicesInlineList
          services={lead.potential_services!}
          currency={lead.currency}
          onRemove={onRemoveService}
        />
      ) : undefined,
    },
    {
      id: 'offer-created',
      label: 'Nabídka vytvořena',
      icon: <Link2 className="h-3.5 w-3.5" />,
      isComplete: !!lead.offer_created_at,
      completedAt: lead.offer_created_at,
      action: !hasOffer && servicesCount > 0 ? {
        label: 'Vytvořit nabídku',
        onClick: onCreateOffer,
        variant: 'outline',
      } : hasOffer ? {
        label: 'Nová nabídka',
        onClick: onCreateOffer,
        variant: 'outline',
      } : undefined,
      customContent: lead.offer_url ? (
        <a
          href={lead.offer_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
        >
          <ExternalLink className="h-3 w-3" />
          Zobrazit nabídku
        </a>
      ) : undefined,
    },
    {
      id: 'offer-sent',
      label: 'Nabídka odeslána',
      icon: <Send className="h-3.5 w-3.5" />,
      isComplete: !!lead.offer_sent_at,
      completedAt: lead.offer_sent_at,
      action: hasOffer && !lead.offer_sent_at ? {
        label: 'Odeslat nabídku',
        onClick: onSendOffer,
        variant: 'outline',
      } : undefined,
    },
    {
      id: 'onboarding-sent',
      label: 'Onboarding formulář',
      icon: <ClipboardList className="h-3.5 w-3.5" />,
      // Complete if form was sent OR completed (form can be completed via direct link)
      isComplete: !!lead.onboarding_form_sent_at || !!lead.onboarding_form_completed_at,
      completedAt: lead.onboarding_form_completed_at || lead.onboarding_form_sent_at,
      detail: lead.onboarding_form_completed_at
        ? `Vyplněn ${formatDate(lead.onboarding_form_completed_at)}`
        : lead.onboarding_form_sent_at
          ? 'Čeká na vyplnění'
          : undefined,
      // Don't show "send" action if form was already completed
      action: !lead.onboarding_form_sent_at && !lead.onboarding_form_completed_at ? {
        label: 'Odeslat formulář',
        onClick: onSendOnboarding,
        variant: 'outline',
      } : undefined,
    },
    {
      id: 'contract',
      label: 'Smlouva',
      icon: <FileSignature className="h-3.5 w-3.5" />,
      isComplete: !!lead.contract_signed_at,
      completedAt: lead.contract_signed_at,
      detail: lead.contract_signed_at
        ? 'Podepsána'
        : lead.contract_sent_at
          ? 'Odeslána, čeká na podpis'
          : lead.contract_url
            ? 'Vytvořena'
            : lead.onboarding_form_completed_at
              ? 'Připraveno k vytvoření'
              : 'Čeká na onboarding',
      action: !lead.contract_url && lead.onboarding_form_completed_at && servicesCount > 0 ? {
        label: isCreatingContract ? 'Vytvářím...' : 'Vytvořit smlouvu',
        onClick: onCreateContract,
        variant: 'default',
      } : lead.contract_url && !lead.contract_sent_at ? {
        label: 'Označit jako odeslanou',
        onClick: onMarkContractSent,
        variant: 'outline',
      } : lead.contract_sent_at && !lead.contract_signed_at ? {
        label: 'Potvrdit podpis',
        onClick: onMarkContractSigned,
        variant: 'default',
      } : undefined,
      customContent: lead.contract_url ? (
        <a
          href={lead.contract_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
        >
          <ExternalLink className="h-3 w-3" />
          Zobrazit v DigiSign
        </a>
      ) : undefined,
    },
    {
      id: 'converted',
      label: 'Převedeno na zakázku',
      icon: <ArrowRightLeft className="h-3.5 w-3.5" />,
      isComplete: !!lead.converted_at,
      completedAt: lead.converted_at,
      action: canConvert ? {
        label: 'Převést na zakázku',
        onClick: onConvert,
        variant: 'default',
      } : undefined,
    },
  ];

  if (isArchived) {
    steps.push({
      id: 'archived',
      label: 'Archivováno',
      icon: <X className="h-3.5 w-3.5" />,
      isComplete: true,
      completedAt: lead.updated_at,
      detail: lead.stage === 'lost' ? 'Důvod: Prohráno' : 'Důvod: Odloženo',
    });
  }

  const currentStepIndex = steps.findIndex(s => !s.isComplete);

  return (
    <div className="space-y-1">
      {steps.map((step, index) => {
        const isCurrent = index === currentStepIndex;
        const isFuture = !step.isComplete && index > currentStepIndex;

        return (
          <div
            key={step.id}
            className={cn(
              "flex gap-2.5 items-start p-2 rounded-lg transition-colors",
              step.isComplete && "bg-muted/30",
              isCurrent && "bg-amber-500/5 ring-1 ring-amber-500/20",
            )}
          >
            {/* Checkbox-style icon */}
            <div className={cn(
              "flex items-center justify-center w-5 h-5 rounded mt-0.5 flex-shrink-0 transition-colors",
              step.isComplete && "bg-green-500 text-white",
              isCurrent && "bg-amber-500 text-white",
              isFuture && "border border-border bg-background text-muted-foreground",
            )}>
              {step.isComplete ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className="text-[10px] font-medium">{index + 1}</span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap min-h-[20px]">
                <span className={cn(
                  "text-sm",
                  step.isComplete && "font-medium",
                  isCurrent && "font-medium",
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
              {step.action && (
                <Button
                  variant={step.action.variant || 'outline'}
                  size="sm"
                  className="mt-1 h-6 text-xs px-2"
                  onClick={step.action.onClick}
                >
                  {step.action.label}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
