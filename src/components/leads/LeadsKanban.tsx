import { useMemo, useState } from 'react';
import { LeadCard } from './LeadCard';
import { ConfirmStageTransitionDialog } from './ConfirmStageTransitionDialog';
import type { Lead, LeadStage } from '@/types/crm';
import type { PendingTransition } from '@/types/leadTransitions';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLeadTransitions } from '@/hooks/useLeadTransitions';

interface LeadsKanbanProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onStageChange: (leadId: string, newStage: LeadStage) => void;
}

const STAGE_CONFIG: Record<LeadStage, { title: string; shortTitle: string; color: string; bgColor: string }> = {
  new_lead: { title: 'Nový lead', shortTitle: 'Nový', color: 'bg-slate-500', bgColor: 'bg-slate-500/10' },
  meeting_done: { title: 'Schůzka proběhla', shortTitle: 'Schůzka', color: 'bg-blue-500', bgColor: 'bg-blue-500/10' },
  waiting_access: { title: 'Čekáme na přístupy', shortTitle: 'Čekáme', color: 'bg-amber-500', bgColor: 'bg-amber-500/10' },
  access_received: { title: 'Přístupy přijaty', shortTitle: 'Přístupy', color: 'bg-green-500', bgColor: 'bg-green-500/10' },
  preparing_offer: { title: 'Příprava nabídky', shortTitle: 'Nabídka', color: 'bg-violet-500', bgColor: 'bg-violet-500/10' },
  offer_sent: { title: 'Nabídka odeslána', shortTitle: 'Odesláno', color: 'bg-pink-500', bgColor: 'bg-pink-500/10' },
  won: { title: 'Vyhráno', shortTitle: 'Won', color: 'bg-emerald-500', bgColor: 'bg-emerald-500/10' },
  lost: { title: 'Prohráno', shortTitle: 'Lost', color: 'bg-red-500', bgColor: 'bg-red-500/10' },
  postponed: { title: 'Odloženo', shortTitle: 'Odloženo', color: 'bg-gray-500', bgColor: 'bg-gray-500/10' },
};

// Active stages in a 2x3 grid layout
const ACTIVE_STAGES: LeadStage[] = [
  'new_lead', 
  'meeting_done', 
  'waiting_access', 
  'access_received', 
  'preparing_offer', 
  'offer_sent', 
];

const CLOSED_STAGES: LeadStage[] = ['won', 'lost', 'postponed'];

export function LeadsKanban({ leads, onLeadClick, onStageChange }: LeadsKanbanProps) {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStage | null>(null);
  const [closedOpen, setClosedOpen] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<PendingTransition | null>(null);
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  
  const { confirmTransition, isConfirming } = useLeadTransitions();

  const leadsByStage = useMemo(() => {
    const grouped: Record<LeadStage, Lead[]> = {
      new_lead: [],
      meeting_done: [],
      waiting_access: [],
      access_received: [],
      preparing_offer: [],
      offer_sent: [],
      won: [],
      lost: [],
      postponed: [],
    };
    
    leads.forEach(lead => {
      if (grouped[lead.stage]) {
        grouped[lead.stage].push(lead);
      }
    });
    
    return grouped;
  }, [leads]);

  const getStageStats = (stage: LeadStage) => {
    const stageLeads = leadsByStage[stage];
    const count = stageLeads.length;
    const totalValue = stageLeads.reduce((sum, l) => 
      sum + (l.estimated_price * l.probability_percent / 100), 0);
    return { count, totalValue };
  };

  const closedLeadsCount = CLOSED_STAGES.reduce((sum, stage) => sum + leadsByStage[stage].length, 0);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', leadId);
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stage: LeadStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, stage: LeadStage) => {
    e.preventDefault();
    if (draggedLeadId) {
      const lead = leads.find(l => l.id === draggedLeadId);
      if (lead && lead.stage !== stage) {
        const fromStage = lead.stage;
        
        // 1. Update stage immediately
        onStageChange(draggedLeadId, stage);
        toast.success(`Lead přesunut do "${STAGE_CONFIG[stage].title}"`);
        
        // 2. Show confirmation dialog for analytics
        setPendingTransition({
          leadId: lead.id,
          leadName: lead.company_name,
          fromStage,
          toStage: stage,
          leadValue: lead.estimated_price || 0,
        });
        setShowTransitionDialog(true);
      }
    }
    setDraggedLeadId(null);
    setDragOverStage(null);
  };

  const handleConfirmTransition = () => {
    if (pendingTransition) {
      confirmTransition({
        leadId: pendingTransition.leadId,
        fromStage: pendingTransition.fromStage,
        toStage: pendingTransition.toStage,
        transitionValue: pendingTransition.leadValue,
      });
      toast.success('Přechod byl potvrzen pro analytiku');
    }
    setShowTransitionDialog(false);
    setPendingTransition(null);
  };

  const handleSkipTransition = () => {
    setShowTransitionDialog(false);
    setPendingTransition(null);
  };

  const renderStageColumn = (stage: LeadStage, compact = false) => {
    const config = STAGE_CONFIG[stage];
    const stats = getStageStats(stage);
    const stageLeads = leadsByStage[stage];
    const isDropTarget = dragOverStage === stage && draggedLeadId && 
      leads.find(l => l.id === draggedLeadId)?.stage !== stage;

    return (
      <div
        key={stage}
        onDragOver={(e) => handleDragOver(e, stage)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, stage)}
        className={cn(
          "rounded-lg border transition-all flex flex-col",
          config.bgColor,
          isDropTarget && "ring-2 ring-primary shadow-lg",
          compact ? "min-h-[120px]" : "min-h-[200px]"
        )}
      >
        {/* Column Header */}
        <div className="p-2.5 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", config.color)} />
            <span className="font-medium text-xs truncate">{config.shortTitle}</span>
            <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0">
              {stats.count}
            </Badge>
          </div>
          {stats.totalValue > 0 && (
            <p className="text-[10px] text-muted-foreground mt-1">
              ~{Math.round(stats.totalValue / 1000)}k
            </p>
          )}
        </div>

        {/* Cards */}
        <div className={cn(
          "p-1.5 space-y-1.5 flex-1 overflow-y-auto",
          compact ? "max-h-[150px]" : "max-h-[calc(100vh-500px)]"
        )}>
          {stageLeads.map(lead => (
            <div
              key={lead.id}
              draggable
              onDragStart={(e) => handleDragStart(e, lead.id)}
              onDragEnd={handleDragEnd}
              className={cn(
                "transition-opacity",
                draggedLeadId === lead.id && "opacity-50"
              )}
            >
              <LeadCard
                lead={lead}
                onClick={() => onLeadClick(lead)}
              />
            </div>
          ))}
          {stageLeads.length === 0 && (
            <div className="text-center py-4 text-xs text-muted-foreground">
              —
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-4">
        {/* Active Stages - 2x3 Grid (fits on screen) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ACTIVE_STAGES.map(stage => renderStageColumn(stage))}
        </div>

        {/* Closed Stages - Collapsible Section */}
        <Collapsible open={closedOpen} onOpenChange={setClosedOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 w-full p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors text-left">
              <span className="text-sm font-medium">Uzavřené leady</span>
              <Badge variant="outline" className="text-xs">
                {closedLeadsCount}
              </Badge>
              <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  {leadsByStage.won.length} won
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  {leadsByStage.lost.length} lost
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-500" />
                  {leadsByStage.postponed.length} odloženo
                </span>
                {closedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              {CLOSED_STAGES.map(stage => renderStageColumn(stage, true))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Confirmation Dialog for Funnel Analytics */}
      <ConfirmStageTransitionDialog
        pendingTransition={pendingTransition}
        open={showTransitionDialog}
        onOpenChange={setShowTransitionDialog}
        onConfirm={handleConfirmTransition}
        onSkip={handleSkipTransition}
        isConfirming={isConfirming}
      />
    </>
  );
}
