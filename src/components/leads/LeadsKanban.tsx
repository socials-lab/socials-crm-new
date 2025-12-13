import { useMemo, useState } from 'react';
import { LeadCard } from './LeadCard';
import type { Lead, LeadStage } from '@/types/crm';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface LeadsKanbanProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onStageChange: (leadId: string, newStage: LeadStage) => void;
}

const STAGE_CONFIG: Record<LeadStage, { title: string; color: string; bgColor: string }> = {
  new_lead: { title: '🆕 Nový lead', color: 'bg-slate-500', bgColor: 'bg-slate-500/10' },
  meeting_done: { title: '📅 Schůzka proběhla', color: 'bg-blue-500', bgColor: 'bg-blue-500/10' },
  waiting_access: { title: '⏳ Čekáme na přístupy', color: 'bg-amber-500', bgColor: 'bg-amber-500/10' },
  access_received: { title: '🔑 Přístupy přijaty', color: 'bg-green-500', bgColor: 'bg-green-500/10' },
  preparing_offer: { title: '✏️ Příprava nabídky', color: 'bg-violet-500', bgColor: 'bg-violet-500/10' },
  offer_sent: { title: '📤 Nabídka odeslána', color: 'bg-pink-500', bgColor: 'bg-pink-500/10' },
  won: { title: '✅ Vyhráno', color: 'bg-emerald-500', bgColor: 'bg-emerald-500/10' },
  lost: { title: '❌ Prohráno', color: 'bg-red-500', bgColor: 'bg-red-500/10' },
  postponed: { title: '⏸️ Odloženo', color: 'bg-gray-500', bgColor: 'bg-gray-500/10' },
};

const STAGE_ORDER: LeadStage[] = [
  'new_lead', 
  'meeting_done', 
  'waiting_access', 
  'access_received', 
  'preparing_offer', 
  'offer_sent', 
  'won', 
  'lost', 
  'postponed'
];

export function LeadsKanban({ leads, onLeadClick, onStageChange }: LeadsKanbanProps) {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStage | null>(null);

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
        onStageChange(draggedLeadId, stage);
        toast.success(`Lead přesunut do "${STAGE_CONFIG[stage].title}"`);
      }
    }
    setDraggedLeadId(null);
    setDragOverStage(null);
  };

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-4 min-w-max">
        {STAGE_ORDER.map(stage => {
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
                "flex-shrink-0 w-[300px] rounded-lg border transition-all",
                config.bgColor,
                isDropTarget && "ring-2 ring-primary shadow-lg"
              )}
            >
              {/* Column Header */}
              <div className="p-3 border-b">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", config.color)} />
                  <span className="font-medium text-sm">{config.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                    {stats.count}
                  </span>
                </div>
                {stats.totalValue > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ~{Math.round(stats.totalValue / 1000)}k CZK
                  </p>
                )}
              </div>

              {/* Cards */}
              <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-400px)] overflow-y-auto">
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
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Žádné leady
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
