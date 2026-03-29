import { useState, useMemo } from 'react';
import { ApplicantCard } from './ApplicantCard';
import type { Applicant, ApplicantStage } from '@/types/applicant';
import { APPLICANT_STAGE_CONFIG } from '@/types/applicant';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Users, GraduationCap, Briefcase, CheckCircle2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ApplicantsKanbanProps {
  applicants: Applicant[];
  onApplicantClick: (applicant: Applicant) => void;
  onStageChange: (applicantId: string, newStage: ApplicantStage) => void;
  onUpdateApplicant?: (applicantId: string, data: Partial<Applicant>) => void;
}

// Hiring pipeline stages (before acceptance)
const HIRING_STAGES: ApplicantStage[] = [
  'new_applicant',
  'invited_interview',
  'interview_done',
  'offer_sent',
  'hired',
];

// Closed/end stages
const CLOSED_STAGES: ApplicantStage[] = ['rejected', 'withdrawn'];

// Onboarding pipeline steps (after hired)
type OnboardingStep = 'buddy_meeting' | 'academy' | 'first_clients' | 'fully_ready';

const ONBOARDING_STEP_CONFIG: Record<OnboardingStep, { label: string; icon: typeof Users; color: string }> = {
  buddy_meeting: { label: 'Schůzka s buddym', icon: Users, color: 'bg-blue-500/10 border-blue-200' },
  academy: { label: 'Akademie', icon: GraduationCap, color: 'bg-violet-500/10 border-violet-200' },
  first_clients: { label: 'Přidělení klientů', icon: Briefcase, color: 'bg-amber-500/10 border-amber-200' },
  fully_ready: { label: '100 % Ready', icon: CheckCircle2, color: 'bg-emerald-500/10 border-emerald-200' },
};

const ONBOARDING_STEP_ORDER: OnboardingStep[] = ['buddy_meeting', 'academy', 'first_clients', 'fully_ready'];

function getOnboardingStep(a: Applicant): OnboardingStep {
  if (a.fully_onboarded) return 'fully_ready';
  if (a.first_clients_assigned) return 'first_clients';
  if (a.academy_completed) return 'academy';
  return 'buddy_meeting';
}

export function ApplicantsKanban({ applicants, onApplicantClick, onStageChange }: ApplicantsKanbanProps) {
  const [draggedApplicantId, setDraggedApplicantId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<ApplicantStage | null>(null);
  const [closedOpen, setClosedOpen] = useState(false);

  const applicantsByStage = useMemo(() => {
    const grouped: Record<ApplicantStage, Applicant[]> = {
      new_applicant: [], invited_interview: [], interview_done: [],
      offer_sent: [], hired: [], rejected: [], withdrawn: [],
    };
    applicants.forEach(a => { if (grouped[a.stage]) grouped[a.stage].push(a); });
    return grouped;
  }, [applicants]);

  // Hired applicants split into onboarding steps
  const hiredApplicants = applicantsByStage.hired;
  const onboardingByStep = useMemo(() => {
    const grouped: Record<OnboardingStep, Applicant[]> = {
      buddy_meeting: [], academy: [], first_clients: [], fully_ready: [],
    };
    hiredApplicants.forEach(a => {
      grouped[getOnboardingStep(a)].push(a);
    });
    return grouped;
  }, [hiredApplicants]);

  const closedCount = applicantsByStage.rejected.length + applicantsByStage.withdrawn.length;

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedApplicantId(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragEnd = () => { setDraggedApplicantId(null); setDragOverStage(null); };
  const handleDragOver = (e: React.DragEvent, stage: ApplicantStage) => {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverStage(stage);
  };
  const handleDragLeave = () => setDragOverStage(null);
  const handleDrop = (e: React.DragEvent, newStage: ApplicantStage) => {
    e.preventDefault();
    if (draggedApplicantId) onStageChange(draggedApplicantId, newStage);
    setDraggedApplicantId(null); setDragOverStage(null);
  };

  const renderStageColumn = (stage: ApplicantStage, compact = false) => {
    const config = APPLICANT_STAGE_CONFIG[stage];
    const stageApplicants = applicantsByStage[stage];
    const isDropTarget = dragOverStage === stage;
    // Don't show "hired" in hiring pipeline - they appear in onboarding
    if (stage === 'hired') {
      return (
        <div
          key={stage}
          className={cn(
            "rounded-lg border transition-all flex flex-col bg-muted/20 min-h-[140px]",
            isDropTarget && "ring-2 ring-primary shadow-lg"
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
          <div className="p-3 flex-1 flex items-center justify-center">
            <p className="text-xs text-muted-foreground text-center">
              {stageApplicants.length > 0 
                ? `${stageApplicants.length} kandidát${stageApplicants.length > 1 ? 'ů' : ''} v onboarding pipeline ↓`
                : 'Přetáhněte sem kandidáta'}
            </p>
          </div>
        </div>
      );
    }

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
          {stageApplicants.map(applicant => (
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
    <div className="space-y-6">
      {/* 1. Hiring Pipeline */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          📋 Nábor
        </h3>
        <div className="overflow-x-auto scrollbar-thin pb-2">
          <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
            {HIRING_STAGES.map(stage => (
              <div key={stage} className="w-[260px] flex-shrink-0">
                {renderStageColumn(stage)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Onboarding Pipeline */}
      {hiredApplicants.length > 0 && (
        <div>
          <Separator className="mb-4" />
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            🚀 Zapracování
            <Badge variant="outline" className="text-xs">{hiredApplicants.length}</Badge>
          </h3>
          <div className="overflow-x-auto scrollbar-thin pb-2">
            <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
              {ONBOARDING_STEP_ORDER.map(step => {
                const config = ONBOARDING_STEP_CONFIG[step];
                const Icon = config.icon;
                const stepApplicants = onboardingByStep[step];

                return (
                  <div key={step} className={cn("w-[260px] flex-shrink-0 rounded-lg border flex flex-col min-h-[140px]", config.color)}>
                    <div className="p-2.5 border-b flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium text-xs whitespace-nowrap">{config.label}</span>
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
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{applicant.full_name}</p>
                                <p className="text-xs text-muted-foreground">{applicant.position}</p>
                              </div>
                              {applicant.buddy_id && (
                                <Badge variant="outline" className="text-[10px]">Buddy</Badge>
                              )}
                            </div>
                            {/* Mini checklist */}
                            <div className="mt-2 space-y-0.5">
                              <div className="flex items-center gap-1.5 text-[11px]">
                                <div className={cn("h-2 w-2 rounded-full", applicant.buddy_meeting_done ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                                <span className={applicant.buddy_meeting_done ? "text-foreground" : "text-muted-foreground"}>Schůzka s buddym</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px]">
                                <div className={cn("h-2 w-2 rounded-full", applicant.academy_completed ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                                <span className={applicant.academy_completed ? "text-foreground" : "text-muted-foreground"}>Akademie</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px]">
                                <div className={cn("h-2 w-2 rounded-full", applicant.first_clients_assigned ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                                <span className={applicant.first_clients_assigned ? "text-foreground" : "text-muted-foreground"}>Přidělení klientů</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px]">
                                <div className={cn("h-2 w-2 rounded-full", applicant.fully_onboarded ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                                <span className={applicant.fully_onboarded ? "text-foreground font-medium" : "text-muted-foreground"}>100 % Ready</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {stepApplicants.length === 0 && (
                        <div className="text-center py-4 text-xs text-muted-foreground">—</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Closed - collapsible */}
      <Collapsible open={closedOpen} onOpenChange={setClosedOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 w-full p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors text-left">
            <span className="text-sm font-medium">Uzavřené</span>
            <Badge variant="outline" className="text-xs">{closedCount}</Badge>
            <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-destructive" />
                {applicantsByStage.rejected.length} zamítnuto
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
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
