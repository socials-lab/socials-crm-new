import { useState, useMemo } from 'react';
import { ApplicantCard } from './ApplicantCard';
import type { Applicant, ApplicantStage } from '@/types/applicant';
import { APPLICANT_STAGE_CONFIG } from '@/types/applicant';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, ClipboardCheck, FileSignature, Send, UserCheck, ScrollText } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

interface ApplicantsKanbanProps {
  applicants: Applicant[];
  onApplicantClick: (applicant: Applicant) => void;
  onStageChange: (applicantId: string, newStage: ApplicantStage) => void;
}

// Main pipeline stages
const PIPELINE_STAGES: ApplicantStage[] = [
  'new_applicant',
  'invited_interview',
  'interview_done',
  'offer_sent',
  'hired',
];

// Closed/end stages (below the line)
const CLOSED_STAGES: ApplicantStage[] = ['rejected', 'withdrawn'];

// Onboarding sub-stages derived from timestamps
type OnboardingStep = 'onboarding_sent' | 'onboarding_done' | 'contract_created' | 'contract_sent' | 'contract_signed' | 'converted';

const ONBOARDING_STEPS: { key: OnboardingStep; label: string; icon: typeof Send }[] = [
  { key: 'onboarding_sent', label: 'Onboarding odesláno', icon: Send },
  { key: 'onboarding_done', label: 'Onboarding vyplněno', icon: ClipboardCheck },
  { key: 'contract_sent', label: 'Smlouva odeslána', icon: ScrollText },
  { key: 'contract_signed', label: 'Smlouva podepsána', icon: FileSignature },
  { key: 'converted', label: 'Převeden na kolegu', icon: UserCheck },
];

function getOnboardingStep(applicant: Applicant): OnboardingStep | null {
  if (applicant.converted_to_colleague_id) return 'converted';
  if (applicant.contract_signed_at) return 'contract_signed';
  if (applicant.contract_sent_at) return 'contract_sent';
  if (applicant.onboarding_completed_at) return 'onboarding_done';
  if (applicant.onboarding_sent_at) return 'onboarding_sent';
  return null;
}

export function ApplicantsKanban({ applicants, onApplicantClick, onStageChange }: ApplicantsKanbanProps) {
  const [draggedApplicantId, setDraggedApplicantId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<ApplicantStage | null>(null);
  const [closedOpen, setClosedOpen] = useState(false);

  const applicantsByStage = useMemo(() => {
    const grouped: Record<ApplicantStage, Applicant[]> = {
      new_applicant: [],
      invited_interview: [],
      interview_done: [],
      offer_sent: [],
      hired: [],
      rejected: [],
      withdrawn: [],
    };
    applicants.forEach(applicant => {
      if (grouped[applicant.stage]) {
        grouped[applicant.stage].push(applicant);
      }
    });
    return grouped;
  }, [applicants]);

  // Hired applicants that are in onboarding process
  const onboardingApplicants = useMemo(() => {
    return applicants.filter(a => a.stage === 'hired' && (a.onboarding_sent_at || a.converted_to_colleague_id));
  }, [applicants]);

  const onboardingByStep = useMemo(() => {
    const grouped: Record<OnboardingStep, Applicant[]> = {
      onboarding_sent: [],
      onboarding_done: [],
      contract_created: [],
      contract_sent: [],
      contract_signed: [],
      converted: [],
    };
    onboardingApplicants.forEach(a => {
      const step = getOnboardingStep(a);
      if (step) grouped[step].push(a);
    });
    return grouped;
  }, [onboardingApplicants]);

  const closedCount = applicantsByStage.rejected.length + applicantsByStage.withdrawn.length;

  const handleDragStart = (e: React.DragEvent, applicantId: string) => {
    setDraggedApplicantId(applicantId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedApplicantId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stage: ApplicantStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, newStage: ApplicantStage) => {
    e.preventDefault();
    if (draggedApplicantId) {
      onStageChange(draggedApplicantId, newStage);
    }
    setDraggedApplicantId(null);
    setDragOverStage(null);
  };

  const renderStageColumn = (stage: ApplicantStage, compact = false) => {
    const config = APPLICANT_STAGE_CONFIG[stage];
    const stageApplicants = applicantsByStage[stage];
    const isDropTarget = dragOverStage === stage;

    return (
      <div
        key={stage}
        className={cn(
          "rounded-lg border transition-all flex flex-col bg-muted/20",
          isDropTarget && "ring-2 ring-primary shadow-lg",
          compact ? "min-h-[100px]" : "min-h-[140px]"
        )}
        onDragOver={(e) => handleDragOver(e, stage)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, stage)}
      >
        <div className={cn("p-2.5 border-b flex-shrink-0", config.color)}>
          <div className="flex items-center gap-2">
            <span className="font-medium text-xs whitespace-nowrap">{config.title}</span>
            <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0">
              {stageApplicants.length}
            </Badge>
          </div>
        </div>

        <div className={cn(
          "p-1.5 space-y-1.5 flex-1",
          compact && "max-h-[150px] overflow-y-auto"
        )}>
          {stageApplicants.map((applicant) => (
            <ApplicantCard
              key={applicant.id}
              applicant={applicant}
              onClick={() => onApplicantClick(applicant)}
              onDragStart={(e) => handleDragStart(e, applicant.id)}
              onDragEnd={handleDragEnd}
              isDragging={draggedApplicantId === applicant.id}
            />
          ))}
          {stageApplicants.length === 0 && (
            <div className="text-center py-4 text-xs text-muted-foreground">—</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. Main Pipeline */}
      <div className="overflow-x-auto scrollbar-thin pb-2">
        <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
          {PIPELINE_STAGES.map(stage => (
            <div key={stage} className="w-[260px] flex-shrink-0">
              {renderStageColumn(stage)}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Onboarding Pipeline */}
      {onboardingApplicants.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Onboarding pipeline</h3>
            <Badge variant="outline" className="text-xs">{onboardingApplicants.length}</Badge>
          </div>
          <div className="overflow-x-auto scrollbar-thin pb-2">
            <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
              {ONBOARDING_STEPS.map(step => {
                const Icon = step.icon;
                const stepApplicants = onboardingByStep[step.key];
                return (
                  <div key={step.key} className="w-[240px] flex-shrink-0 rounded-lg border bg-muted/20 flex flex-col min-h-[120px]">
                    <div className="p-2.5 border-b bg-accent/30 flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium text-xs whitespace-nowrap">{step.label}</span>
                      <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0">
                        {stepApplicants.length}
                      </Badge>
                    </div>
                    <div className="p-1.5 space-y-1.5 flex-1">
                      {stepApplicants.map(applicant => (
                        <Card
                          key={applicant.id}
                          className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
                          onClick={() => onApplicantClick(applicant)}
                        >
                          <CardContent className="p-2.5">
                            <p className="font-medium text-sm">{applicant.full_name}</p>
                            <p className="text-xs text-muted-foreground">{applicant.position}</p>
                            {step.key === 'onboarding_sent' && applicant.onboarding_sent_at && (
                              <p className="text-[10px] text-muted-foreground mt-1">
                                Odesláno {format(new Date(applicant.onboarding_sent_at), 'd. M. yyyy', { locale: cs })}
                              </p>
                            )}
                            {step.key === 'onboarding_done' && applicant.onboarding_completed_at && (
                              <p className="text-[10px] text-muted-foreground mt-1">
                                Vyplněno {format(new Date(applicant.onboarding_completed_at), 'd. M. yyyy', { locale: cs })}
                              </p>
                            )}
                            {step.key === 'contract_sent' && applicant.contract_sent_at && (
                              <p className="text-[10px] text-muted-foreground mt-1">
                                Odesláno {format(new Date(applicant.contract_sent_at), 'd. M. yyyy', { locale: cs })}
                              </p>
                            )}
                            {step.key === 'contract_signed' && applicant.contract_signed_at && (
                              <p className="text-[10px] text-muted-foreground mt-1">
                                Podepsáno {format(new Date(applicant.contract_signed_at), 'd. M. yyyy', { locale: cs })}
                              </p>
                            )}
                            {step.key === 'converted' && (
                              <Badge variant="default" className="mt-1 text-[10px] bg-primary">Kolega</Badge>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                      {stepApplicants.length === 0 && (
                        <div className="text-center py-3 text-xs text-muted-foreground">—</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Closed stages - collapsible, like leads */}
      <Collapsible open={closedOpen} onOpenChange={setClosedOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 w-full p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors text-left">
            <span className="text-sm font-medium">Uzavřené</span>
            <Badge variant="outline" className="text-xs">{closedCount}</Badge>
            <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                {applicantsByStage.rejected.length} zamítnuto
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                {applicantsByStage.withdrawn.length} staženo
              </span>
              {closedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {CLOSED_STAGES.map(stage => renderStageColumn(stage, true))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
