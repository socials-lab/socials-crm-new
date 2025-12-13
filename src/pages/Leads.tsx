import { useState, useMemo } from 'react';
import { Search, Plus, LayoutGrid, List } from 'lucide-react';
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
import { LeadDetailSheet } from '@/components/leads/LeadDetailSheet';
import { AddLeadDialog } from '@/components/leads/AddLeadDialog';
import type { Lead, LeadStage } from '@/types/crm';
import { cn } from '@/lib/utils';

type ViewMode = 'kanban' | 'table';

const STAGE_ORDER: LeadStage[] = ['new_lead', 'meeting_done', 'waiting_access', 'access_received', 'preparing_offer', 'offer_sent', 'won', 'lost', 'postponed'];

export default function Leads() {
  const { leads, updateLeadStage } = useLeadsData();
  const { colleagues } = useCRMData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<LeadStage | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

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

  // KPI calculations
  const kpis = useMemo(() => {
    const activeLeads = leads.filter(l => !['won', 'lost'].includes(l.stage));
    const totalExpectedValue = activeLeads.reduce((sum, l) => 
      sum + (l.estimated_price * l.probability_percent / 100), 0);
    const totalEstimatedValue = activeLeads.reduce((sum, l) => sum + l.estimated_price, 0);
    const wonLeads = leads.filter(l => l.stage === 'won').length;
    const lostLeads = leads.filter(l => l.stage === 'lost').length;
    const conversionRate = wonLeads + lostLeads > 0 
      ? Math.round((wonLeads / (wonLeads + lostLeads)) * 100) 
      : 0;

    return {
      activeCount: activeLeads.length,
      totalExpectedValue,
      totalEstimatedValue,
      conversionRate,
    };
  }, [leads]);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLeadId(lead.id);
    setIsDetailOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setIsAddDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingLead(null);
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

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          title="Aktivní leady"
          value={kpis.activeCount}
          subtitle="v pipeline"
        />
        <KPICard
          title="Očekávaná hodnota"
          value={`${Math.round(kpis.totalExpectedValue / 1000)}k`}
          subtitle="CZK (vážená)"
        />
        <KPICard
          title="Potenciální hodnota"
          value={`${Math.round(kpis.totalEstimatedValue / 1000)}k`}
          subtitle="CZK (celkem)"
        />
        <KPICard
          title="Konverzní poměr"
          value={`${kpis.conversionRate}%`}
          subtitle="vyhráno/prohráno"
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
        />
      ) : (
        <LeadsTable 
          leads={filteredLeads} 
          onLeadClick={handleLeadClick}
        />
      )}

      {/* Detail Sheet */}
      <LeadDetailSheet
        lead={selectedLead}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onEdit={handleEditLead}
      />

      {/* Add/Edit Dialog */}
      <AddLeadDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        lead={editingLead}
      />
    </div>
  );
}
