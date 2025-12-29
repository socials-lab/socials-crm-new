import { useState, useMemo } from 'react';
import { ApplicantCard } from './ApplicantCard';
import type { Applicant, ApplicantStage } from '@/types/applicant';
import { APPLICANT_STAGE_CONFIG, APPLICANT_STAGE_ORDER } from '@/types/applicant';
import { cn } from '@/lib/utils';

interface ApplicantsKanbanProps {
  applicants: Applicant[];
  onApplicantClick: (applicant: Applicant) => void;
  onStageChange: (applicantId: string, newStage: ApplicantStage) => void;
}

export function ApplicantsKanban({ applicants, onApplicantClick, onStageChange }: ApplicantsKanbanProps) {
  const [draggedApplicantId, setDraggedApplicantId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<ApplicantStage | null>(null);

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

  const getStageStats = (stage: ApplicantStage) => {
    const stageApplicants = applicantsByStage[stage];
    return {
      count: stageApplicants.length,
    };
  };

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

  // Show main stages in kanban (hide rejected/withdrawn by default or show at end)
  const mainStages: ApplicantStage[] = ['new_applicant', 'invited_interview', 'interview_done', 'offer_sent', 'hired'];
  const endStages: ApplicantStage[] = ['rejected', 'withdrawn'];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {[...mainStages, ...endStages].map((stage) => {
        const config = APPLICANT_STAGE_CONFIG[stage];
        const stats = getStageStats(stage);
        const isDropTarget = dragOverStage === stage;
        const isEndStage = endStages.includes(stage);

        return (
          <div
            key={stage}
            className={cn(
              "flex-shrink-0 w-72 flex flex-col bg-muted/30 rounded-lg",
              isEndStage && "w-56 opacity-80"
            )}
            onDragOver={(e) => handleDragOver(e, stage)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage)}
          >
            {/* Column Header */}
            <div className={cn(
              "px-3 py-2 rounded-t-lg border-b",
              config.color
            )}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{config.title}</span>
                <span className="text-xs font-semibold bg-background/50 px-2 py-0.5 rounded-full">
                  {stats.count}
                </span>
              </div>
            </div>

            {/* Column Content */}
            <div
              className={cn(
                "flex-1 p-2 space-y-2 min-h-[200px] transition-colors",
                isDropTarget && "bg-primary/10 ring-2 ring-primary/30 ring-inset rounded-b-lg"
              )}
            >
              {applicantsByStage[stage].map((applicant) => (
                <ApplicantCard
                  key={applicant.id}
                  applicant={applicant}
                  onClick={() => onApplicantClick(applicant)}
                  onDragStart={(e) => handleDragStart(e, applicant.id)}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedApplicantId === applicant.id}
                />
              ))}
              
              {applicantsByStage[stage].length === 0 && (
                <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                  Žádní uchazeči
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
