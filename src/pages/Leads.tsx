import { useState, useMemo } from 'react';
import { Search, Plus, LayoutGrid, List, Calendar, TrendingUp, Target, Trophy } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useCRMData } from '@/hooks/useCRMData';
import { LeadsKanban } from '@/components/leads/LeadsKanban';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { LeadDetailDialog } from '@/components/leads/LeadDetailDialog';
import { AddLeadDialog } from '@/components/leads/AddLeadDialog';
import type { Lead, LeadStage } from '@/types/crm';
import { cn } from '@/lib/utils';
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, subQuarters, isWithinInterval } from 'date-fns';

type KPIPeriod = 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'ytd' | 'year';

const getKPIPeriodRange = (period: KPIPeriod): { start: Date; end: Date } => {
  const now = new Date();
  switch(period) {
    case 'this_month': return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'last_month': return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
    case 'this_quarter': return { start: startOfQuarter(now), end: now };
    case 'last_quarter': return { start: startOfQuarter(subQuarters(now, 1)), end: endOfQuarter(subQuarters(now, 1)) };
    case 'ytd': return { start: startOfYear(now), end: now };
    case 'year': return { start: startOfYear(now), end: endOfYear(now) };
  }
};

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${Math.round(value / 1000)}k`;
  }
  return value.toString();
};

type ViewMode = 'kanban' | 'table';

const STAGE_ORDER: LeadStage[] = ['new_lead', 'meeting_done', 'waiting_access', 'access_received', 'preparing_offer', 'offer_sent', 'won', 'lost', 'postponed'];

export default function Leads() {
  const { leads, updateLeadStage, addNote } = useLeadsData();
  const { colleagues } = useCRMData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<LeadStage | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [kpiPeriod, setKpiPeriod] = useState<KPIPeriod>('this_month');

  // Derive selectedLead from context to always have fresh data
  const selectedLead = selectedLeadId 
    ? leads.find(l => l.id === selectedLeadId) ?? null 
    : null;

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = 
        lead.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.ico.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.summary.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesOwner = ownerFilter === 'all' || lead.owner_id === ownerFilter;
      const matchesStage = stageFilter === 'all' || lead.stage === stageFilter;

      return matchesSearch && matchesOwner && matchesStage;
    });
  }, [leads, searchQuery, ownerFilter, stageFilter]);

  // KPI calculations with time filtering
  const kpis = useMemo(() => {
    const { start, end } = getKPIPeriodRange(kpiPeriod);
    
    // Aktivní leady vytvořené v období
    const periodLeads = leads.filter(l => {
      const createdAt = l.created_at ? new Date(l.created_at) : new Date();
      return isWithinInterval(createdAt, { start, end });
    });
    
    const activeLeads = periodLeads.filter(l => 
      !['won', 'lost', 'postponed'].includes(l.stage)
    );
    
    // Vyhrané leady (converted_at v daném období)
    const wonLeads = leads.filter(l => {
      if (l.stage !== 'won') return false;
      const convertedAt = l.converted_at ? new Date(l.converted_at) : new Date(l.updated_at || l.created_at || new Date());
      return isWithinInterval(convertedAt, { start, end });
    });
    
    // Prohrané leady (stage = lost, updated v období)
    const lostLeads = leads.filter(l => {
      if (l.stage !== 'lost') return false;
      const lostAt = new Date(l.updated_at || l.created_at || new Date());
      return isWithinInterval(lostAt, { start, end });
    });
    
    // Konverzní poměr
    const conversionRate = wonLeads.length + lostLeads.length > 0 
      ? Math.round((wonLeads.length / (wonLeads.length + lostLeads.length)) * 100) 
      : 0;
    
    // Potenciální hodnota aktivních
    const potentialValue = activeLeads.reduce((sum, l) => sum + (l.estimated_price || 0), 0);
    
    // Hodnota vyhraných
    const wonValue = wonLeads.reduce((sum, l) => sum + (l.estimated_price || 0), 0);

    return {
      activeCount: activeLeads.length,
      conversionRate,
      potentialValue,
      wonCount: wonLeads.length,
      wonValue,
    };
  }, [leads, kpiPeriod]);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLeadId(lead.id);
    setIsDetailOpen(true);
  };

  const handleAddNew = () => {
    setIsAddDialogOpen(true);
  };

  const handleStageChange = (leadId: string, newStage: LeadStage) => {
    updateLeadStage(leadId, newStage);
  };

  const owners = useMemo(() => {
    const ownerIds = [...new Set(leads.map(l => l.owner_id))];
    return ownerIds.map(id => colleagues.find(c => c.id === id)).filter(Boolean);
  }, [leads, colleagues]);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader 
        title="🎯 Leady" 
        titleAccent="pipeline"
        description="Správa obchodních příležitostí"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none"
                onClick={() => setViewMode('kanban')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button className="gap-2" onClick={handleAddNew}>
              <Plus className="h-4 w-4" />
              Přidat lead
            </Button>
          </div>
        }
      />

      {/* KPI Period Selector */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">KPI období:</span>
        <Select value={kpiPeriod} onValueChange={(v) => setKpiPeriod(v as KPIPeriod)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this_month">Tento měsíc</SelectItem>
            <SelectItem value="last_month">Minulý měsíc</SelectItem>
            <SelectItem value="this_quarter">Tento kvartál</SelectItem>
            <SelectItem value="last_quarter">Minulý kvartál</SelectItem>
            <SelectItem value="ytd">Year to Date</SelectItem>
            <SelectItem value="year">Celý rok</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          title="Aktivní leady"
          value={kpis.activeCount}
          subtitle="v pipeline"
          icon={Target}
        />
        <KPICard
          title="Lead → Won"
          value={`${kpis.conversionRate}%`}
          subtitle="konverzní poměr"
          icon={TrendingUp}
        />
        <KPICard
          title="Potenciální hodnota"
          value={`${formatCurrency(kpis.potentialValue)} CZK`}
          subtitle="aktivní pipeline"
          icon={Target}
        />
        <KPICard
          title="Vyhrané leady"
          value={kpis.wonCount}
          subtitle={`${formatCurrency(kpis.wonValue)} CZK MRR`}
          icon={Trophy}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Hledat firmu, IČO, kontakt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Odpovědná osoba" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všichni</SelectItem>
            {owners.map(owner => (
              <SelectItem key={owner!.id} value={owner!.id}>
                {owner!.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stageFilter} onValueChange={(v) => setStageFilter(v as LeadStage | 'all')}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Stav" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny stavy</SelectItem>
            <SelectItem value="new_lead">Nový lead</SelectItem>
            <SelectItem value="meeting_done">Schůzka proběhla</SelectItem>
            <SelectItem value="waiting_access">Čekáme na přístupy</SelectItem>
            <SelectItem value="access_received">Přístupy přijaty</SelectItem>
            <SelectItem value="preparing_offer">Příprava nabídky</SelectItem>
            <SelectItem value="offer_sent">Nabídka odeslána</SelectItem>
            <SelectItem value="won">Vyhráno</SelectItem>
            <SelectItem value="lost">Prohráno</SelectItem>
            <SelectItem value="postponed">Odloženo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main content */}
      {viewMode === 'kanban' ? (
        <LeadsKanban 
          leads={filteredLeads} 
          onLeadClick={handleLeadClick}
          onStageChange={handleStageChange}
          onAddLostReason={(leadId, reason, stage) => {
            const prefix = stage === 'lost' ? '❌ Důvod prohry: ' : '⏸️ Důvod odložení: ';
            addNote(leadId, prefix + reason, 'general');
          }}
        />
      ) : (
        <LeadsTable 
          leads={filteredLeads} 
          onLeadClick={handleLeadClick}
        />
      )}

      {/* Detail Dialog */}
      <LeadDetailDialog
        lead={selectedLead}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />

      {/* Add/Edit Dialog */}
      <AddLeadDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
}
