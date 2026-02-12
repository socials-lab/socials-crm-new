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
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Lead } from '@/types/crm';

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
}

interface LeadFlowStepperProps {
  lead: Lead;
  onRequestAccess: () => void;
  onMarkAccessReceived: () => void;
  onAddService: () => void;
  onCreateOffer: () => void;
  onSendOffer: () => void;
  onSendOnboarding: () => void;
  onMarkContractSent: () => void;
  onMarkContractSigned: () => void;
  onConvert: () => void;
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
};

export function LeadFlowStepper({
  lead,
  onRequestAccess,
  onMarkAccessReceived,
  onAddService,
  onCreateOffer,
  onSendOffer,
  onSendOnboarding,
  onMarkContractSent,
  onMarkContractSigned,
  onConvert,
}: LeadFlowStepperProps) {
  const servicesCount = lead.potential_services?.length || 0;
  const hasOffer = !!lead.offer_url;
  const canConvert = !lead.converted_to_client_id && !['won', 'lost'].includes(lead.stage);

  const steps: FlowStep[] = [
    {
      id: 'created',
      label: 'Lead vytvořen',
      icon: <Plus className="h-3.5 w-3.5" />,
      isComplete: true,
      completedAt: lead.created_at,
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
      isComplete: !!lead.onboarding_form_sent_at,
      completedAt: lead.onboarding_form_sent_at,
      detail: lead.onboarding_form_completed_at 
        ? `Vyplněn ${formatDate(lead.onboarding_form_completed_at)}` 
        : lead.onboarding_form_sent_at 
          ? 'Čeká na vyplnění' 
          : undefined,
      action: !lead.onboarding_form_sent_at ? {
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
            : undefined,
      action: lead.contract_url && !lead.contract_sent_at ? {
        label: 'Označit jako odeslanou',
        onClick: onMarkContractSent,
        variant: 'outline',
      } : lead.contract_sent_at && !lead.contract_signed_at ? {
        label: 'Potvrdit podpis',
        onClick: onMarkContractSigned,
        variant: 'default',
      } : undefined,
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

  // Find the first incomplete step index for "current" highlight
  const currentStepIndex = steps.findIndex(s => !s.isComplete);

  return (
    <div className="space-y-1">
      {steps.map((step, index) => {
        const isCurrent = index === currentStepIndex;
        const isFuture = !step.isComplete && index > currentStepIndex;
        
        return (
          <div key={step.id} className="flex gap-3 relative">
            {/* Vertical connector line */}
            {index < steps.length - 1 && (
              <div className={cn(
                "absolute left-[11px] top-6 bottom-0 w-px",
                step.isComplete ? "bg-green-500/40" : "bg-border"
              )} />
            )}
            
            {/* Icon circle */}
            <div className={cn(
              "flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 z-10 transition-colors",
              step.isComplete && "bg-green-500 text-white",
              isCurrent && "bg-amber-500 text-white ring-2 ring-amber-500/30",
              isFuture && "bg-muted text-muted-foreground border border-border",
            )}>
              {step.icon}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0 pb-3">
              <div className="flex items-center gap-2 flex-wrap min-h-[24px]">
                <span className={cn(
                  "text-sm",
                  step.isComplete && "font-medium",
                  isCurrent && "font-medium",
                  isFuture && "text-muted-foreground",
                )}>
                  {step.label}
                </span>
                {step.completedAt && (
                  <span className="text-xs text-muted-foreground">
                    {formatDate(step.completedAt)}
                  </span>
                )}
                {step.detail && (
                  <span className="text-xs text-muted-foreground">
                    • {step.detail}
                  </span>
                )}
              </div>
              {step.action && (
                <Button
                  variant={step.action.variant || 'outline'}
                  size="sm"
                  className="mt-1 h-7 text-xs"
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
